import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cachePublic } from '@/lib/cacheHeaders';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: slotData, error: slotError } = await supabase
    .from('subscription_slots')
    .select('max_slots')
    .eq('id', 1)
    .single();

  if (slotError || !slotData) return NextResponse.json({ slots: 45 });

  const { count, error: countError } = await supabase
    .from('subscriptions')
    .select('user_id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString());

  if (countError) return NextResponse.json({ slots: 45 });

  const activeCount = count ?? 0;
  const remaining = Math.max(0, slotData.max_slots - activeCount);
  // useSubscriptionGate fetches this on every mount, and it runs an exact
  // count over subscriptions each time. The number only moves when somebody
  // subscribes, so a minute of staleness costs nothing.
  return NextResponse.json(
    { slots: remaining, subscribers: activeCount },
    { headers: cachePublic(60) }
  );
}
