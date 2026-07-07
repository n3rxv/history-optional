import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
  const fp = req.nextUrl.searchParams.get('fp');
  if (!fp) return NextResponse.json({ error: 'No fingerprint' }, { status: 400 });

  // Subscription check via Firebase ID token
  const checkSub = req.nextUrl.searchParams.get('checkSub');
  const token = req.nextUrl.searchParams.get('token');
  if (checkSub && token) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      const uid = decoded.uid;
      const nowISO = new Date().toISOString();
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, expires_at, plan')
        .eq('user_id', uid)
        .eq('status', 'active')
        .gt('expires_at', nowISO)
        .single();
      if (sub) return NextResponse.json({ isPremium: true, plan: sub.plan, expires_at: sub.expires_at });
    } catch {
      // invalid token
    }
    return NextResponse.json({ isPremium: false });
  }

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('eval_count, chat_count')
    .eq('fingerprint', fp)
    .single();

  if (error || !data) {
    const { data: newData } = await supabase
      .from('usage_tracking')
      .insert({ fingerprint: fp, eval_count: 0, chat_count: 0 })
      .select()
      .single();
    return NextResponse.json({ ...newData, fingerprint: fp });
  }

  return NextResponse.json({
    ...data,
    fingerprint: fp,
    eval_count: data.eval_count ?? 0,
    chat_count: data.chat_count ?? 0,
  });
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
  const { fingerprint, type } = await req.json();
  if (!fingerprint || !type) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const field = type === 'eval' ? 'eval_count' : 'chat_count';

  const { data } = await supabase
    .from('usage_tracking')
    .select('eval_count, chat_count')
    .eq('fingerprint', fingerprint)
    .single();

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const currentVal = type === 'eval' ? (data.eval_count ?? 0) : (data.chat_count ?? 0);

  await supabase
    .from('usage_tracking')
    .update({ [field]: currentVal + 1, updated_at: new Date().toISOString() })
    .eq('fingerprint', fingerprint);

  return NextResponse.json({ success: true });
}
