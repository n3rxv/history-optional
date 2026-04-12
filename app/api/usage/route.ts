import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const fp = req.nextUrl.searchParams.get('fp');
  if (!fp) return NextResponse.json({ error: 'No fingerprint' }, { status: 400 });

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('fingerprint', fp)
    .single();

  if (error || !data) {
    // First visit — create record
    const { data: newData } = await supabase
      .from('usage_tracking')
      .insert({ fingerprint: fp, eval_count: 0, chat_count: 0 })
      .select()
      .single();
    return NextResponse.json(newData);
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { fingerprint, type } = await req.json();
  if (!fingerprint || !type) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const field = type === 'eval' ? 'eval_count' : 'chat_count';

  const { data } = await supabase
    .from('usage_tracking')
    .select('eval_count, chat_count')
    .eq('fingerprint', fingerprint)
    .single();

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const currentVal = (data as Record<string, number>)[field] ?? 0;

  await supabase
    .from('usage_tracking')
    .update({ 
      [field]: currentVal + 1,
      updated_at: new Date().toISOString()
    })
    .eq('fingerprint', fingerprint);

  return NextResponse.json({ success: true });
}