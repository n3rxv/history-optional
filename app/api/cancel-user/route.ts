import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-user-token');
  console.log('cancel-user: token present:', !!token);
  if (!token) return NextResponse.json({ ok: false, reason: 'no_token' });

  const db = createServerClient();
  const { data: { user }, error } = await db.auth.getUser(token);
  console.log('cancel-user: user:', user?.id, 'error:', error?.message);
  if (!user) return NextResponse.json({ ok: false, reason: 'no_user' });

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

  console.log('cancel-user: has sub:', !!sub);
  if (sub) return NextResponse.json({ ok: false, reason: 'has_subscription' });

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  console.log('cancel-user: delete error:', delErr?.message);
  return NextResponse.json({ ok: !delErr });
}
