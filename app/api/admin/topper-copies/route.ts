import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: copies, error } = await sb
    .from('topper_copies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: maps } = await sb
    .from('topper_copy_pyq_map')
    .select('topper_copy_id, pyq_id');

  const mapByCard: Record<string, number[]> = {};
  (maps || []).forEach(m => {
    if (!mapByCard[m.topper_copy_id]) mapByCard[m.topper_copy_id] = [];
    mapByCard[m.topper_copy_id].push(m.pyq_id);
  });

  const result = (copies || []).map(c => ({
    ...c,
    pyq_ids: mapByCard[c.id] || [],
  }));

  return NextResponse.json({ data: result });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { question, drive_file_id, note, pyq_ids } = await req.json();

  if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 });
  if (!drive_file_id?.trim()) return NextResponse.json({ error: 'Drive file ID required' }, { status: 400 });

  const { data: copy, error } = await sb
    .from('topper_copies')
    .insert({ question: question.trim(), drive_file_id: drive_file_id.trim(), note: note?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (pyq_ids?.length) {
    const rows = pyq_ids.map((pid: number) => ({ topper_copy_id: copy.id, pyq_id: pid }));
    await sb.from('topper_copy_pyq_map').insert(rows);
  }

  return NextResponse.json({ ok: true, data: copy });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, question, drive_file_id, note, pyq_ids } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const { error } = await sb
    .from('topper_copies')
    .update({
      question: question?.trim(),
      drive_file_id: drive_file_id?.trim(),
      note: note?.trim() || null,
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await sb.from('topper_copy_pyq_map').delete().eq('topper_copy_id', id);
  if (pyq_ids?.length) {
    const rows = pyq_ids.map((pid: number) => ({ topper_copy_id: id, pyq_id: pid }));
    await sb.from('topper_copy_pyq_map').insert(rows);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const { error } = await sb.from('topper_copies').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
