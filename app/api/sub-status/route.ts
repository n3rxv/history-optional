import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ isPremium: false });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ isPremium: false });

  const { data: sub } = await db
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!sub) return NextResponse.json({ isPremium: false });
  return NextResponse.json({ isPremium: true, plan: sub.plan, expires_at: sub.expires_at });
}
