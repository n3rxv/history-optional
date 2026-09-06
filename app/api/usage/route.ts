import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { adminAuth } from '@/lib/firebaseAdmin';

function makeSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = makeSupabase();
  const fp    = req.nextUrl.searchParams.get('fp');
  // Header first. The query-string form is still read so clients cached from
  // before this change keep working, but it should not be used: a token in a
  // URL is recorded by every log and proxy on the path.
  const token = req.headers.get('x-user-token') ?? req.nextUrl.searchParams.get('token');

  // ── 1. Token verify karo ──────────────────────────────────────────
  if (!token) {
    return NextResponse.json({ allowed: false, reason: 'unauthenticated' });
  }

  let uid: string;
  let email: string | null = null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email ?? null;
  } catch {
    return NextResponse.json({ allowed: false, reason: 'unauthenticated' });
  }

  // ── 2. Premium check ──────────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, expires_at, plan')
    .eq('firebase_uid', uid)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (sub) {
    // Upsert usage_tracking row so premium users are also tracked
    // effectiveFp: real FP if valid, else fallback to uid_ prefix (handles Brave/privacy browsers)
    const effectiveFp = (fp && fp.length > 10) ? fp : `uid_${uid}`;
    const { data: fpRow } = await supabase
      .from('usage_tracking')
      .select('firebase_uid')
      .eq('fingerprint', effectiveFp)
      .maybeSingle();
    const safeFp = (fpRow && fpRow.firebase_uid && fpRow.firebase_uid !== uid)
      ? `${effectiveFp}_${uid.slice(0, 8)}`  // synthetic FP to avoid UNIQUE conflict
      : effectiveFp;
    await supabase
      .from('usage_tracking')
      .upsert(
        { firebase_uid: uid, fingerprint: safeFp, eval_count: 0, chat_count: 0 },
        { onConflict: 'firebase_uid', ignoreDuplicates: true }
      );
    return NextResponse.json({
      allowed: true,
      subscribed: true,
      limit: Infinity,
      used: 0,
      plan: sub.plan,
    });
  }

  // ── 2b. Email se existing subscription dhundo (purane users migration) ──
  if (email) {
    const { data: subByEmail } = await supabase
      .from('subscriptions')
      .select('id, status, expires_at, plan')
      .eq('email', email)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .is('firebase_uid', null)
      .maybeSingle();

    if (subByEmail) {
      await supabase
        .from('subscriptions')
        .update({ firebase_uid: uid })
        .eq('id', subByEmail.id);

      const effectiveFp2 = (fp && fp.length > 10) ? fp : `uid_${uid}`;
      const { data: fpRow2 } = await supabase
        .from('usage_tracking')
        .select('firebase_uid')
        .eq('fingerprint', effectiveFp2)
        .maybeSingle();
      const safeFp2 = (fpRow2 && fpRow2.firebase_uid && fpRow2.firebase_uid !== uid)
        ? `${effectiveFp2}_${uid.slice(0, 8)}`
        : effectiveFp2;
      await supabase
        .from('usage_tracking')
        .upsert(
          { firebase_uid: uid, fingerprint: safeFp2, eval_count: 0, chat_count: 0 },
          { onConflict: 'firebase_uid', ignoreDuplicates: true }
        );

      return NextResponse.json({
        allowed: true,
        subscribed: true,
        limit: Infinity,
        used: 0,
        plan: subByEmail.plan,
      });
    }
  }

  // ── 3. Fingerprint required ───────────────────────────────────────
  if (!fp) {
    return NextResponse.json({ allowed: false, reason: 'no_fp' });
  }

  // ── 4. UID se row dhundo ──────────────────────────────────────────
  const { data: byUid } = await supabase
    .from('usage_tracking')
    .select('eval_count, chat_count, fingerprint')
    .eq('firebase_uid', uid)
    .maybeSingle();

  if (byUid) {
    // Also check FP row — take max so multi-account abuse shows correct count in UI
    let fpEval = byUid.eval_count ?? 0;
    let fpChat = byUid.chat_count ?? 0;
    if (fp) {
      const { data: byFpAlso } = await supabase
        .from('usage_tracking')
        .select('eval_count, chat_count')
        .eq('fingerprint', fp)
        .neq('firebase_uid', uid)
        .maybeSingle();
      if (byFpAlso) {
        fpEval = Math.max(fpEval, byFpAlso.eval_count ?? 0);
        fpChat = Math.max(fpChat, byFpAlso.chat_count ?? 0);
      }
    }
    return NextResponse.json({
      allowed: true,
      subscribed: false,
      eval_count:  fpEval,
      chat_count:  fpChat,
      fingerprint: byUid.fingerprint,
    });
  }

  // ── 5. FP se row dhundo ───────────────────────────────────────────
  const { data: byFp } = await supabase
    .from('usage_tracking')
    .select('eval_count, chat_count, firebase_uid')
    .eq('fingerprint', fp)
    .maybeSingle();

  if (byFp) {
    // Agar FP row mein koi aur UID linked hai → same device, naya account → block
    if (byFp.firebase_uid && byFp.firebase_uid !== uid) {
      return NextResponse.json({
        allowed: false,
        reason: 'device_limit',
        eval_count:  byFp.eval_count  ?? 0,
        chat_count:  byFp.chat_count  ?? 0,
      });
    }

    // FP row mili, UID link karo
    await supabase
      .from('usage_tracking')
      .update({ firebase_uid: uid })
      .eq('fingerprint', fp);

    return NextResponse.json({
      allowed: true,
      subscribed: false,
      eval_count:  byFp.eval_count  ?? 0,
      chat_count:  byFp.chat_count  ?? 0,
      fingerprint: fp,
    });
  }

  // ── 6. Bilkul naya user ───────────────────────────────────────────
  const { data: newRow } = await supabase
    .from('usage_tracking')
    .insert({ fingerprint: fp, firebase_uid: uid, eval_count: 0, chat_count: 0 })
    .select()
    .single();

  return NextResponse.json({
    allowed: true,
    subscribed: false,
    eval_count:  0,
    chat_count:  0,
    fingerprint: fp,
  });
}

/**
 * Retired.
 *
 * This took firebase_uid and fingerprint from the request body and incremented
 * whichever it was given — so any caller could inflate someone else's counter
 * by naming them, and the read-modify-write meant parallel calls all wrote the
 * same value anyway.
 *
 * Metering now happens server-side inside the routes that spend the money
 * (/api/evaluate, /api/chat, /api/topper-click) via lib/usageQuota, which is
 * the only place that can know whether the work was actually done. The client
 * hook no longer calls this.
 */
export async function POST() {
  return NextResponse.json({ error: 'gone' }, { status: 410 });
}
