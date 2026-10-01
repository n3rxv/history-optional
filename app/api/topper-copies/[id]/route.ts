import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { signedPdfUrl } from '@/lib/r2';
import { consumeUsage, releaseUsage } from '@/lib/usageQuota';

/**
 * The only endpoint that hands out a URL for a topper copy PDF, and it hands
 * out a signed one that expires in five minutes rather than the object key.
 *
 * The list endpoints used to return it too, which meant the entitlement check
 * on /pyqs/topper/[id] was decoration: two unauthenticated GETs against
 * /api/topper-copies/all handed out every key in the library, and the R2
 * bucket serves them without any check of its own.
 *
 * Access mirrors /api/topper-access: owner, active subscription, separate
 * topper subscription, or one of the five free previews.
 *
 * This is also where a free preview is counted, once per copy opened, and
 * nowhere else. The count used to be bumped by the pages: the PYQ page
 * bumped it before opening the viewer and the viewer bumped it again, so a
 * copy cost two previews, and because the viewer bumped it before asking
 * here, the fifth preview always came back refused. Counting at the one
 * place that hands out the PDF makes a copy cost exactly one, wherever it
 * is opened from: the viewer, or one pane of the Compare page.
 */

const FREE_CLICK_LIMIT = 5;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}

type Grant = { ok: false } | { ok: true; free: null } | { ok: true; free: { uid: string; fp: string | null } };

/** Whether this caller may open a copy, claiming a free preview if that is how. */
async function claimView(token: string | null, fp: string | null): Promise<Grant> {
  if (!token) return { ok: false };
  const user = await verifyFirebaseToken(token);
  if (!user) return { ok: false };
  if (user.email && user.email === process.env.OWNER_EMAIL) return { ok: true, free: null };

  const sb = db();
  const nowISO = new Date().toISOString();

  const [{ data: sub }, { data: topperSub }] = await Promise.all([
    sb.from('subscriptions')
      .select('status')
      .eq('firebase_uid', user.uid)
      .eq('status', 'active')
      .gt('expires_at', nowISO)
      .maybeSingle(),
    sb.from('topper_subscriptions')
      .select('expires_at')
      .eq('firebase_uid', user.uid)
      .maybeSingle(),
  ]);

  if (sub) return { ok: true, free: null };
  if (topperSub?.expires_at && new Date(topperSub.expires_at) > new Date()) return { ok: true, free: null };

  // Check and increment in one statement, so parallel opens cannot all slip
  // under the limit.
  const { allowed } = await consumeUsage(user.uid, fp, 'topper_clicks', FREE_CLICK_LIMIT);
  return allowed ? { ok: true, free: { uid: user.uid, fp } } : { ok: false };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const grant = await claimView(req.headers.get('x-user-token'), req.headers.get('x-fingerprint'));
  if (!grant.ok) {
    return NextResponse.json({ error: 'access_denied' }, { status: 403 });
  }
  // A preview spent on a copy that never arrives is given back.
  const refund = () => (grant.free ? releaseUsage(grant.free.uid, grant.free.fp, 'topper_clicks') : Promise.resolve());

  const { data, error } = await db()
    .from('topper_copies')
    .select('id, question, drive_file_id, note, created_at, start_page')
    .eq('id', id)
    .maybeSingle();

  if (error) { await refund(); return NextResponse.json({ error: error.message }, { status: 500 }); }
  if (!data) { await refund(); return NextResponse.json({ error: 'not_found' }, { status: 404 }); }

  // The raw object key never leaves the server. The client gets a URL that
  // stops working in five minutes, so a copied link is not a permanent grant.
  const { drive_file_id, ...rest } = data;
  let pdf_url: string;
  try {
    pdf_url = await signedPdfUrl(drive_file_id);
  } catch (e) {
    await refund();
    throw e;
  }

  return NextResponse.json(
    { data: { ...rest, pdf_url } },
    // Signed URLs are per-viewer and short-lived; caching one would hand it to
    // the next reader and outlive its own expiry.
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
