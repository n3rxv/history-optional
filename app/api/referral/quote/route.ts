import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { createServerClient } from '@/lib/supabase';
import { friendDiscountFor, referralBalance } from '@/lib/referralServer';

/**
 * What a yearly order would take off for this reader, so the checkout can
 * show it before Razorpay opens: the friend's discount for the code they came
 * with, and their own balance. The order route works both out again itself.
 *
 *   GET /api/referral/quote?ref=ABC234
 */
export async function GET(req: NextRequest) {
  const user = await verifyFirebaseToken(req.headers.get('x-user-token'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerClient();
  const [friend, balancePaise] = await Promise.all([
    friendDiscountFor(db, user.uid, req.nextUrl.searchParams.get('ref')),
    referralBalance(db, user.uid),
  ]);
  return NextResponse.json(
    { friendDiscountPaise: friend?.paise ?? 0, balancePaise: Math.max(0, balancePaise) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
