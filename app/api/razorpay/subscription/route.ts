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

  // Someone already on a mandate must not be able to start a second one and
  // be debited twice a week.
  const { data: existing } = await db
    .from('subscriptions')
    .select('razorpay_subscription_id, auto_renew, expires_at')
    .eq('firebase_uid', user.uid)
    .eq('auto_renew', true)
    .maybeSingle();

  if (existing?.auto_renew) {
    return NextResponse.json(
      { error: 'already_subscribed', expiresAt: existing.expires_at },
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
