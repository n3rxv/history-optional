import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  if (!await isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: copies, error } = await sb
    .from('topper_copies')
    .select('*')
    // Break the created_at tie on id, or the list will not hold still.
    //
    // A bulk insert gives every row in one transaction the same created_at,
    // and there are five groups of a hundred such rows here. Ordering on
    // created_at alone leaves the tie to the heap, and an update rewrites the
    // row at the end of it, so editing a card moved it 78 places and shifted
    // 271 rows around it. To the admin that reads as the question vanishing
    // and its PYQ tag not saving. Both complaints were this one bug, and both
    // edits were in the database the whole time.
    .order('created_at', { ascending: false })
    .order('id', { ascending: true });

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
  if (!await isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { question, drive_file_id, note, pyq_ids } = await req.json();

  if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 });
  if (!drive_file_id?.trim()) return NextResponse.json({ error: 'Drive file ID required' }, { status: 400 });

  const { data: copy, error } = await sb
    .from('topper_copies')
    .insert({ question: question.trim(), drive_file_id: drive_file_id.trim(), note: note?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Report a failed mapping. This error used to be dropped on the floor, so
  // when a tag did not stick there was no way to tell that the card had been
  // created and the mapping had not.
  if (pyq_ids?.length) {
    const rows = pyq_ids.map((pid: number) => ({ topper_copy_id: copy.id, pyq_id: pid }));
    const { error: mapErr } = await sb.from('topper_copy_pyq_map').insert(rows);
    if (mapErr) return NextResponse.json({ error: `Card created, PYQ mapping failed: ${mapErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: copy, pyq_count: pyq_ids?.length || 0 });
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  const { error: delErr } = await sb.from('topper_copy_pyq_map').delete().eq('topper_copy_id', id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (pyq_ids?.length) {
    const rows = pyq_ids.map((pid: number) => ({ topper_copy_id: id, pyq_id: pid }));
    const { error: mapErr } = await sb.from('topper_copy_pyq_map').insert(rows);
    if (mapErr) return NextResponse.json({ error: mapErr.message }, { status: 500 });
  }

  // Send the count back so the admin panel can say how many tags were
  // written. A bare '✓ Updated' never showed whether the mapping landed.
  return NextResponse.json({ ok: true, pyq_count: pyq_ids?.length || 0 });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const { error } = await sb.from('topper_copies').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
