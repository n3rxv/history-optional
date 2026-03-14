import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function isAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === 'true';
  const db = createServerClient();

  const query = all && isAdmin(req)
    ? db.from('posts').select('*').order('published_at', { ascending: false })
    : db.from('posts').select('*').eq('published', true).order('published_at', { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const post = await req.json();
  const db = createServerClient();
  const { error } = await db
    .from('posts')
    .upsert({ ...post, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const db = createServerClient();
  const { error } = await db.from('posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
