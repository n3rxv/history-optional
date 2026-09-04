import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { signedPdfUrl } from '@/lib/r2';

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
 */

const FREE_CLICK_LIMIT = 5;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}

async function hasTopperAccess(token: string | null): Promise<boolean> {
  if (!token) return false;
  const user = await verifyFirebaseToken(token);
  if (!user) return false;
  if (user.email && user.email === process.env.OWNER_EMAIL) return true;

  const sb = db();
  const nowISO = new Date().toISOString();

  const [{ data: sub }, { data: topperSub }, { data: tracking }] = await Promise.all([
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
    sb.from('usage_tracking')
      .select('topper_clicks')
      .eq('firebase_uid', user.uid)
      .maybeSingle(),
  ]);

  if (sub) return true;
  if (topperSub?.expires_at && new Date(topperSub.expires_at) > new Date()) return true;

  // Free preview allowance. /api/topper-click is what increments this.
  return (tracking?.topper_clicks ?? 0) < FREE_CLICK_LIMIT;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!(await hasTopperAccess(req.headers.get('x-user-token')))) {
    return NextResponse.json({ error: 'access_denied' }, { status: 403 });
  }

  const { data, error } = await db()
    .from('topper_copies')
    .select('id, question, drive_file_id, note, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // The raw object key never leaves the server. The client gets a URL that
  // stops working in five minutes, so a copied link is not a permanent grant.
  const { drive_file_id, ...rest } = data;
  const pdf_url = await signedPdfUrl(drive_file_id);

  return NextResponse.json(
    { data: { ...rest, pdf_url } },
    // Signed URLs are per-viewer and short-lived; caching one would hand it to
    // the next reader and outlive its own expiry.
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
