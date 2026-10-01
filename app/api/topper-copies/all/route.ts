import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { selectAll } from '@/lib/selectAll';
import { cachePublic } from '@/lib/cacheHeaders';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Browse listing: open, because free users are allowed to see what exists.
// It deliberately does NOT return drive_file_id — that is the R2 object key
// for a paid PDF, and the bucket is public, so handing it out here made the
// entitlement check on the detail page bypassable.
export async function GET() {
  let copies: { id: string; question: string; note: string | null; created_at: string }[];
  try {
    copies = await selectAll((from, to) => sb
      .from('topper_copies')
      .select('id, question, note, created_at')
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // Paged: the link table is past the API's 1,000-row cap (lib/selectAll.ts).
  let maps: { topper_copy_id: string; pyq_id: number }[];
  try {
    maps = await selectAll((from, to) => sb
      .from('topper_copy_pyq_map')
      .select('topper_copy_id, pyq_id')
      .order('topper_copy_id')
      .order('pyq_id')
      .range(from, to));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const mapByCard: Record<string, number[]> = {};
  maps.forEach(m => {
    if (!mapByCard[m.topper_copy_id]) mapByCard[m.topper_copy_id] = [];
    mapByCard[m.topper_copy_id].push(m.pyq_id);
  });

  const result = copies.map(c => ({
    ...c,
    pyq_ids: mapByCard[c.id] || [],
  }));

  // Changes only when an admin adds or edits a copy. Object keys are no
  // longer in this payload, so there is nothing here worth protecting.
  return NextResponse.json({ data: result }, { headers: cachePublic(300) });
}
