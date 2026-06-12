import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_DEVICES = 2;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { user_id, session_id, device_info, user_name, user_email } = await req.json();
  if (!user_id || !session_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Get existing sessions oldest first
  const { data: sessions } = await supabaseAdmin
    .from('device_sessions')
    .select('id, session_id')
    .eq('user_id', user_id)
    .order('created_at', { ascending: true });

  if (sessions && sessions.length >= MAX_DEVICES) {
    // Delete oldest to make room
    const toDelete = sessions.slice(0, sessions.length - MAX_DEVICES + 1);
    await supabaseAdmin
      .from('device_sessions')
      .delete()
      .in('id', toDelete.map((s: any) => s.id));
  }

  // Register new session
  await supabaseAdmin.from('device_sessions').insert({
    user_id,
    session_id,
    device_info: device_info ?? 'Unknown',
    user_name: user_name ?? null,
    user_email: user_email ?? null,
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  const session_id = searchParams.get('session_id');
  if (!user_id || !session_id) return NextResponse.json({ valid: false });

  const { data } = await supabaseAdmin
    .from('device_sessions')
    .select('id')
    .eq('user_id', user_id)
    .eq('session_id', session_id)
    .single();

  return NextResponse.json({ valid: !!data });
}
