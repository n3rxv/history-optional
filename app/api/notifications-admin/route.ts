import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('x-admin-token');
  if (!token) return false;
  const db = createServerClient();
  const { data } = await db.from('admin_tokens').select('token').eq('token', token).single();
  return !!data;
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = createServerClient();
  const { data, error } = await db
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { title, link, type } = await req.json();
  if (!title || !link) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const db = createServerClient();
  const { error } = await db.from('notifications').insert({ title, link, type: type || 'announcement' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const db = createServerClient();
  const { error } = await db.from('notifications').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
