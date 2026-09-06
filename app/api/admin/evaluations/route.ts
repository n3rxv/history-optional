import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';
import { noStore } from '@/lib/cacheHeaders';

/**
 * Reads what students submitted for evaluation.
 *
 * The list deliberately does NOT select `answer_text` or `evaluation`: a
 * hundred answers is a few megabytes of prose nobody is reading yet. Opening
 * one row fetches those two columns for that row alone.
 */

const PAGE_SIZE = 30;

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const db = createServerClient();

  // One row, in full — what the reader wrote and how it was marked.
  const id = params.get('id');
  if (id) {
    const { data, error } = await db
      .from('answer_evaluations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data }, { headers: noStore });
  }

  const page = Math.max(0, Number.parseInt(params.get('page') ?? '0', 10) || 0);
  const search = (params.get('q') ?? '').trim();

  let query = db
    .from('answer_evaluations')
    .select('id, email, firebase_uid, question, marks_out_of, marks_awarded, pages, lang, duration_ms, created_at',
            { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  // Email or question text — the two things you actually remember when you go
  // looking for a particular submission.
  if (search) {
    const safe = search.replace(/[%,()]/g, '');
    query = query.or(`email.ilike.%${safe}%,question.ilike.%${safe}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { data, count: count ?? 0, page, pageSize: PAGE_SIZE },
    { headers: noStore }
  );
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await req.json().catch(() => ({ id: null }));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await createServerClient().from('answer_evaluations').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
