import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';
import { cachePublic, noStore } from '@/lib/cacheHeaders';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = createServerClient();
  const isAdmin = await isAdminAuthed(req);

  const query = isAdmin
    ? db.from('posts').select('*').eq('slug', slug).single()
    : db.from('posts').select('*').eq('slug', slug).eq('published', true).single();

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Worse than the listing route: admin and public share the exact same URL
  // and differ only by header, so caching the admin response would publish an
  // unpublished draft at the address readers already use.
  return NextResponse.json({ data }, { headers: isAdmin ? noStore : cachePublic(120) });
}
