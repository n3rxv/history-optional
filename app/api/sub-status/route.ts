import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { referralBalance } from '@/lib/referralServer';

export async function GET(req: NextRequest) {
  // Header first. As a query parameter the token is written into Vercel
  // access logs, browser history and any proxy on the path; the query form is
  // still read so clients cached from before this change keep working.
  const token = req.headers.get('x-user-token') ?? req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ isPremium: false });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ isPremium: false });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // The navbar asks with ?with=balance for its invite chip, so the balance
  // rides on a call it already makes; other callers do no extra work.
  const withBalance = req.nextUrl.searchParams.get('with') === 'balance';
  const [{ data: sub }, inviteBalancePaise] = await Promise.all([
    db
      .from('subscriptions')
      .select('plan, expires_at')
      .eq('firebase_uid', user.uid)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle(),
    withBalance ? referralBalance(db, user.uid).then((b) => Math.max(0, b)) : Promise.resolve(undefined),
  ]);

  if (!sub) return NextResponse.json({ isPremium: false, inviteBalancePaise });
  return NextResponse.json({
    isPremium: true,
    plan: sub.plan,
    expires_at: sub.expires_at,
    inviteBalancePaise,
  });
}
