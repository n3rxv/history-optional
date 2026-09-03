import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Browse listing: open, because free users are allowed to see what exists.
// It deliberately does NOT return drive_file_id — that is the R2 object key
// for a paid PDF, and the bucket is public, so handing it out here made the
// entitlement check on the detail page bypassable.
export async function GET() {
  const { data: copies, error } = await sb
    .from('topper_copies')
    .select('id, question, note, created_at')
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
