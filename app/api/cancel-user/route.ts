import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-user-token');
  if (!token) return NextResponse.json({ ok: false });

  const db = createServerClient();
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return NextResponse.json({ ok: false });

  // Check they don't have an active subscription before deleting
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: sub } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (sub) return NextResponse.json({ ok: false, reason: 'has_subscription' });

  await admin.auth.admin.deleteUser(user.id);
  return NextResponse.json({ ok: true });
}
