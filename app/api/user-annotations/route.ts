import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const slug = searchParams.get('slug');

  if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

  const db = createServerClient();
  const query = slug
    ? db.from('annotations').select('note_slug, data').eq('user_id', userId).eq('note_slug', slug)
    : db.from('annotations').select('note_slug, data').eq('user_id', userId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const { user_id, note_slug, data } = await req.json();
  if (!user_id || !note_slug) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const db = createServerClient();
  const { error } = await db.from('annotations').upsert(
    { user_id, note_slug, data, updated_at: new Date().toISOString() },
    { onConflict: 'note_slug,user_id' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { user_id, note_slug } = await req.json();
  const db = createServerClient();
  const { error } = await db
    .from('annotations')
    .delete()
    .eq('user_id', user_id)
    .eq('note_slug', note_slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
