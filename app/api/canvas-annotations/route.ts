import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const slug   = searchParams.get('slug');
  if (!userId || !slug) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const db = createServerClient();
  const { data, error } = await db
    .from('canvas_annotations')
    .select('strokes')
    .eq('user_id', userId)
    .eq('note_slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') // PGRST116 = no rows, that's fine
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ strokes: data?.strokes ?? [] });
}

export async function POST(req: NextRequest) {
  const { user_id, note_slug, strokes } = await req.json();
  if (!user_id || !note_slug) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const db = createServerClient();
  const { error } = await db
    .from('canvas_annotations')
    .upsert(
      { user_id, note_slug, strokes, updated_at: new Date().toISOString() },
      { onConflict: 'note_slug,user_id' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { user_id, note_slug } = await req.json();
  const db = createServerClient();
  const { error } = await db
    .from('canvas_annotations')
    .delete()
    .eq('user_id', user_id)
    .eq('note_slug', note_slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
