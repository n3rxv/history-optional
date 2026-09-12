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
    // created_at ke baad id se tie todna zaroori hai.
    //
    // Bulk insert me ek hi transaction ki saari rows ka created_at bilkul same
    // hota hai, aur yahan aise 100-100 ke paanch group hain. Sirf created_at se
    // order karne par tie ka kram Postgres ki heap par chhod diya jata hai, aur
    // update row ko heap ke ant me likh deta hai. Nateeja: jis row ko edit kiya
    // wo list me 78 jagah khisak gayi aur 271 rows ka kram badal gaya, matlab
    // admin ko lagta hai question gayab ho gaya aur uska PYQ tag bhi nahi laga.
    // Dono shikayatein ek hi wajah se thi, aur DB me dono cheezein bach gayi thi.
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

  // Mapping ki error bhi batani hai. Pehle ise chup-chap gira diya jata tha,
  // to tag na lagne par admin ke paas jaanne ka koi zariya nahi tha ki card
  // bana aur mapping reh gayi.
  if (pyq_ids?.length) {
    const rows = pyq_ids.map((pid: number) => ({ topper_copy_id: copy.id, pyq_id: pid }));
    const { error: mapErr } = await sb.from('topper_copy_pyq_map').insert(rows);
    if (mapErr) return NextResponse.json({ error: `card bana, PYQ mapping nahi: ${mapErr.message}` }, { status: 500 });
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

  // Count wapas bhejo, taaki admin panel bata sake kitne tag lage. Purane
  // '✓ Updated' se ye pata hi nahi chalta tha ki mapping gayi ya nahi.
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
