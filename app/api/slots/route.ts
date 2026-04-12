import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
  const { data, error } = await supabase
    .from('subscription_slots')
    .select('subscribers, max_slots')
    .eq('id', 1)
    .single();

  if (error || !data) return NextResponse.json({ slots: 45 });

  const remaining = Math.max(0, data.max_slots - data.subscribers);
  return NextResponse.json({ slots: remaining, subscribers: data.subscribers });
}

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
  const { data, error } = await supabase
    .from('subscription_slots')
    .select('subscribers, max_slots')
    .eq('id', 1)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed' }, { status: 500 });

  await supabase
    .from('subscription_slots')
    .update({ subscribers: data.subscribers + 1 })
    .eq('id', 1);

  const remaining = Math.max(0, data.max_slots - (data.subscribers + 1));
  return NextResponse.json({ slots: remaining });
}
