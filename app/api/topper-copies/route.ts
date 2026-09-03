import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// GET /api/topper-copies?pyq_id=123
// Listing only. drive_file_id is withheld here for the same reason as in
// ./all/route.ts — see the note there.
export async function GET(req: NextRequest) {
  const pyq_id = req.nextUrl.searchParams.get('pyq_id');
  if (!pyq_id) return NextResponse.json({ error: 'pyq_id required' }, { status: 400 });

  const { data: maps, error: mapErr } = await sb
    .from('topper_copy_pyq_map')
    .select('topper_copy_id')
    .eq('pyq_id', parseInt(pyq_id));

  if (mapErr) return NextResponse.json({ error: mapErr.message }, { status: 500 });
  if (!maps?.length) return NextResponse.json({ data: [] });

  const ids = maps.map(m => m.topper_copy_id);

  const { data: copies, error } = await sb
    .from('topper_copies')
    .select('id, question, note, created_at')
    .in('id', ids)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: copies || [] });
}
