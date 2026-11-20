/**
 * How many topper copies the site holds, for the home page's counts.
 *
 * Counted at build time, like the flashcard count, so the numbers stay true
 * as copies are added and a deploy refreshes them. topper_copies has row
 * level security on with no select policy for the public roles, so this reads
 * with the service key: it runs on the server only and returns no content.
 *
 * A copy's section is the section of the topics it carries, worked out the
 * same way /api/topper-copies/all does it: the notes topics of the PYQs it
 * answers, plus its own topic_slug. A copy filed under two topics in one
 * section still counts once there.
 */
import { createClient } from '@supabase/supabase-js';
import { selectAll } from './selectAll';
import { allNotes } from './notes';
import { noteSlugsForPyq } from './notePyqMap';

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  // A build without the keys keeps the last known figures instead of failing.
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function countTopperCopies(): Promise<number | null> {
  const sb = admin();
  if (!sb) return null;
  try {
    const { count, error } = await sb
      .from('topper_copies')
      .select('id', { count: 'exact', head: true });
    if (error) {
      console.error('[topperCount] count failed:', error.message);
      return null;
    }
    return count ?? null;
  } catch (e) {
    console.error('[topperCount] count failed:', (e as Error).message);
    return null;
  }
}

/** Copies per syllabus section, by section name; null when the table cannot be read. */
export async function topperCopiesBySection(): Promise<Record<string, number> | null> {
  const sb = admin();
  if (!sb) return null;
  try {
    const [copies, maps] = await Promise.all([
      selectAll<{ id: string; topic_slug: string | null }>((from, to) => sb
        .from('topper_copies').select('id, topic_slug').order('id').range(from, to)),
      selectAll<{ topper_copy_id: string; pyq_id: number }>((from, to) => sb
        .from('topper_copy_pyq_map').select('topper_copy_id, pyq_id')
        .order('topper_copy_id').order('pyq_id').range(from, to)),
    ]);

    const pyqsByCopy = new Map<string, Set<number>>();
    for (const m of maps) {
      if (!pyqsByCopy.has(m.topper_copy_id)) pyqsByCopy.set(m.topper_copy_id, new Set());
      pyqsByCopy.get(m.topper_copy_id)!.add(m.pyq_id);
    }
    const sectionOf = new Map(allNotes.map((n) => [n.slug, n.section]));

    const out: Record<string, number> = {};
    for (const c of copies) {
      const sections = new Set<string>();
      for (const id of pyqsByCopy.get(c.id) ?? []) {
        for (const slug of noteSlugsForPyq(id)) sections.add(sectionOf.get(slug) ?? '');
      }
      if (c.topic_slug) sections.add(sectionOf.get(c.topic_slug) ?? '');
      for (const s of sections) if (s) out[s] = (out[s] ?? 0) + 1;
    }
    return out;
  } catch (e) {
    console.error('[topperCount] section count failed:', (e as Error).message);
    return null;
  }
}
