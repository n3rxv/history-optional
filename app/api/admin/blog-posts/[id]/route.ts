import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServerClient();
  const isAdmin = isAdminAuthed(req);

  const query = isAdmin
    ? db.from('posts').select('*').eq('id', id).single()
    : db.from('posts').select('*').eq('id', id).eq('published', true).single();

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}
