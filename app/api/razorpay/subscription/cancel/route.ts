import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { cancelAutopaySubscription } from '@/lib/autopay';

/**
 * Stops future weekly debits.
 *
 * Access already paid for is kept: `expires_at` is not touched, so someone
 * who cancels on day two of a week keeps the remaining five days. Anything
 * else would be charging for time and then taking it back.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-user-token');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await cancelAutopaySubscription(user.uid);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true, expiresAt: result.expiresAt });
}
