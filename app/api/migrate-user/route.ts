import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-user-token');
  if (!token) return NextResponse.json({ ok: false });

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const { email, uid } = decoded;
    if (!email) return NextResponse.json({ ok: false });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    // Check if subscription exists with this email but different user_id
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id, status')
      .eq('email', email)
      .single();

    if (sub && sub.user_id !== uid) {
      // Update user_id to Firebase UID
      await supabase
        .from('subscriptions')
        .update({ user_id: uid })
        .eq('email', email);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
