import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_DEVICES = 2;
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { firebase_uid, session_id, device_info, user_name, user_email } = await req.json();
  if (!firebase_uid || !session_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { data: sessions } = await supabaseAdmin
    .from('device_sessions')
    .select('id, session_id')
    .eq('firebase_uid', firebase_uid)
    .order('created_at', { ascending: true });

  if (sessions && sessions.length >= MAX_DEVICES) {
    const toDelete = sessions.slice(0, sessions.length - MAX_DEVICES + 1);
    await supabaseAdmin
      .from('device_sessions')
      .delete()
      .in('id', toDelete.map((s: any) => s.id));
  }

  await supabaseAdmin.from('device_sessions').insert({
    firebase_uid,
    session_id,
    device_info: device_info ?? 'Unknown',
    user_name: user_name ?? null,
    user_email: user_email ?? null,
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const firebase_uid = searchParams.get('firebase_uid');
  const session_id = searchParams.get('session_id');
  if (!firebase_uid || !session_id) return NextResponse.json({ valid: false });

  const { data } = await supabaseAdmin
    .from('device_sessions')
    .select('id')
    .eq('firebase_uid', firebase_uid)
    .eq('session_id', session_id)
    .single();

  return NextResponse.json({ valid: !!data });
}
