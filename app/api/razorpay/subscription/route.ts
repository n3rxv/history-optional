import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { createAutopaySubscription } from '@/lib/autopay';
import { supabaseAdminClient } from '@/lib/subscriptionGrant';
import { checkRateLimit, clientIp, tooManyRequests } from '@/lib/rateLimit';

/**
 * Starts a weekly autopay mandate.
 *
 * Returns a subscription id for Razorpay Checkout. No access is granted here:
 * a mandate can be authorised and still fail to debit, so the grant happens
 * when the `subscription.charged` webhook confirms money actually moved.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-user-token');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Creating mandates is cheap for us and expensive to clean up, so it is
  // rate limited per account rather than per IP.
  const { allowed } = await checkRateLimit(`autopay:${user.uid}`, { limit: 5, windowSeconds: 60 * 60 });
  if (!allowed) return tooManyRequests();

  const db = supabaseAdminClient();

  // Anyone with access already must not be sold a mandate.
  //
  // This used to filter on auto_renew, which only caught people already on a
  // weekly. Someone holding a one-time plan has auto_renew false, so they went
  // straight through and were put on Rs 99 a week on top of a year they had
  // already paid for — and because each charge extends expires_at by seven
  // days from whatever is later, they would have been paying weekly to add a
  // week to a subscription that already ran into 2027.
  const { data: existing } = await db
    .from('subscriptions')
    .select('auto_renew, expires_at, plan')
    .eq('firebase_uid', user.uid)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: 'already_subscribed',
        expiresAt: existing.expires_at,
        plan: existing.plan,
        autoRenew: existing.auto_renew === true,
      },
      { status: 409 }
    );
  }

  try {
    const { subscriptionId } = await createAutopaySubscription({
      uid: user.uid,
      email: user.email ?? null,
    });
    return NextResponse.json({ subscriptionId, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID });
  } catch (e) {
    console.error('[razorpay/subscription] create failed:', (e as Error).message);
    return NextResponse.json({ error: 'Could not start the subscription' }, { status: 502 });
  }
}
