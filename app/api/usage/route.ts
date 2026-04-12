import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getMonthStart(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
  const fp = req.nextUrl.searchParams.get('fp');
  if (!fp) return NextResponse.json({ error: 'No fingerprint' }, { status: 400 });

  const currentWeek = getWeekStart();
  const currentMonth = getMonthStart();

  // Optional subscription check
  const checkSub = req.nextUrl.searchParams.get('checkSub');
  const authToken = req.nextUrl.searchParams.get('token');
  if (checkSub && authToken) {
    const { createServerClient } = await import('@/lib/supabase');
    const db = createServerClient();
    const { data: { user } } = await db.auth.getUser(authToken);
    if (user) {
      const nowISO = new Date().toISOString();
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', nowISO)
        .single();
      if (sub) return NextResponse.json({ isPremium: true });
    }
    return NextResponse.json({ isPremium: false });
  }

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('fingerprint', fp)
    .single();

  if (error || !data) {
    // First visit — create record
    const { data: newData } = await supabase
      .from('usage_tracking')
      .insert({
        fingerprint: fp,
        eval_count: 0,
        chat_count: 0,
        eval_week: currentWeek,
        chat_month: currentMonth,
      })
      .select()
      .single();
    return NextResponse.json(newData);
  }

  // Reset eval count if new week
  let evalCount = data.eval_count ?? 0;
  if (data.eval_week !== currentWeek) {
    evalCount = 0;
    await supabase
      .from('usage_tracking')
      .update({ eval_count: 0, eval_week: currentWeek })
      .eq('fingerprint', fp);
  }

  // Reset chat count if new month
  let chatCount = data.chat_count ?? 0;
  if (data.chat_month !== currentMonth) {
    chatCount = 0;
    await supabase
      .from('usage_tracking')
      .update({ chat_count: 0, chat_month: currentMonth })
      .eq('fingerprint', fp);
  }

  return NextResponse.json({
    ...data,
    eval_count: evalCount,
    chat_count: chatCount,
  });
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
  const { fingerprint, type } = await req.json();
  if (!fingerprint || !type) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const currentWeek = getWeekStart();
  const currentMonth = getMonthStart();
  const field = type === 'eval' ? 'eval_count' : 'chat_count';

  const { data } = await supabase
    .from('usage_tracking')
    .select('eval_count, chat_count, eval_week, chat_month')
    .eq('fingerprint', fingerprint)
    .single();

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Determine current value (reset if period changed)
  let currentVal: number;
  if (type === 'eval') {
    currentVal = data.eval_week !== currentWeek ? 0 : (data.eval_count ?? 0);
  } else {
    currentVal = data.chat_month !== currentMonth ? 0 : (data.chat_count ?? 0);
  }

  await supabase
    .from('usage_tracking')
    .update({
      [field]: currentVal + 1,
      eval_week: currentWeek,
      chat_month: currentMonth,
      updated_at: new Date().toISOString(),
    })
    .eq('fingerprint', fingerprint);

  return NextResponse.json({ success: true });
}
