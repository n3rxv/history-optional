import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET is public — anyone can read note overrides (students need cloud content too)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  const db = createServerClient();
  const query = slug
    ? db.from('note_overrides').select('slug, content, updated_at').eq('slug', slug)
    : db.from('note_overrides').select('slug, content, updated_at');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST and DELETE require admin password
export async function POST(req: NextRequest) {
  const adminPassword = req.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug, content } = await req.json();
  if (!slug || content === undefined) {
    return NextResponse.json({ error: 'Missing slug or content' }, { status: 400 });
  }
  const db = createServerClient();
  const { error } = await db
    .from('note_overrides')
    .upsert({ slug, content, updated_at: new Date().toISOString() }, { onConflict: 'slug' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const adminPassword = req.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug } = await req.json();
  const db = createServerClient();
  const { error } = await db.from('note_overrides').delete().eq('slug', slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
