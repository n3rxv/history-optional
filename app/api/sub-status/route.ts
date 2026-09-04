import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';

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

  const { data: sub } = await db
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('firebase_uid', user.uid)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!sub) return NextResponse.json({ isPremium: false });
  return NextResponse.json({ isPremium: true, plan: sub.plan, expires_at: sub.expires_at });
}
