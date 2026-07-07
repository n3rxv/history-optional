import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-user-token');
  if (!token) return NextResponse.json({ ok: false, reason: 'no_token' });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ ok: false, reason: 'no_user' });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: sub } = await admin
    .from('subscriptions')
    .select('status')
    .eq('firebase_uid', user.uid)
    .eq('status', 'active')
    .single();

  if (sub) return NextResponse.json({ ok: false, reason: 'has_subscription' });

  try {
    await adminAuth.deleteUser(user.uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: 'delete_failed' });
  }
}
