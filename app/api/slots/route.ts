import { NextResponse } from 'next/server';
import { getSlotInfo } from '@/lib/slots';
import { cachePublic } from '@/lib/cacheHeaders';

export async function GET() {
  const { slots, subscribers } = await getSlotInfo();
  // useSubscriptionGate fetches this on every mount and it runs an exact
  // count, but the number only moves when somebody subscribes.
  return NextResponse.json({ slots, subscribers }, { headers: cachePublic(60) });
}
