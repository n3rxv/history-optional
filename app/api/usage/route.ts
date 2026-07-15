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
  const token = req.nextUrl.searchParams.get('token');

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
    .single();

  if (sub) {
    // Upsert usage_tracking row so premium users are also tracked
    if (fp) {
      await supabase
        .from('usage_tracking')
        .upsert(
          { firebase_uid: uid, fingerprint: fp, eval_count: 0, chat_count: 0 },
          { onConflict: 'firebase_uid', ignoreDuplicates: true }
        );
    }
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
      .single();

    if (subByEmail) {
      await supabase
        .from('subscriptions')
        .update({ firebase_uid: uid })
        .eq('id', subByEmail.id);

      // Upsert usage_tracking row for this migrated premium user too
      if (fp) {
        await supabase
          .from('usage_tracking')
          .upsert(
            { firebase_uid: uid, fingerprint: fp, eval_count: 0, chat_count: 0 },
            { onConflict: 'firebase_uid', ignoreDuplicates: true }
          );
      }

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
    .single();

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
        .single();
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
    .single();

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

export async function POST(req: NextRequest) {
  const supabase = makeSupabase();
  const { fingerprint, firebase_uid, type } = await req.json();

  if (!type || (!fingerprint && !firebase_uid)) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  }

  const field = type === 'eval' ? 'eval_count' : 'chat_count';

  // UID se prefer karo, fallback FP
  const query = firebase_uid
    ? supabase.from('usage_tracking').select('eval_count, chat_count').eq('firebase_uid', firebase_uid).single()
    : supabase.from('usage_tracking').select('eval_count, chat_count').eq('fingerprint', fingerprint).single();

  const { data } = await query;
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const currentVal = type === 'eval' ? (data.eval_count ?? 0) : (data.chat_count ?? 0);

  const updateQuery = firebase_uid
    ? supabase.from('usage_tracking').update({ [field]: currentVal + 1, updated_at: new Date().toISOString() }).eq('firebase_uid', firebase_uid)
    : supabase.from('usage_tracking').update({ [field]: currentVal + 1, updated_at: new Date().toISOString() }).eq('fingerprint', fingerprint);

  await updateQuery;
  return NextResponse.json({ success: true });
}
