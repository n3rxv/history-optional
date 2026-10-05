/**
 * The note a reader last opened, so the home page can offer to take them
 * back to it. Kept in this browser only; nothing is sent anywhere.
 */
export type LastNote = { slug: string; title: string; section: string; at: number };

const KEY = 'ho_last_note';

export function rememberNote(note: Omit<LastNote, 'at'>): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...note, at: Date.now() })); } catch {}
}

export function readLastNote(): LastNote | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<LastNote>;
    if (typeof v.slug !== 'string' || typeof v.title !== 'string') return null;
    return { slug: v.slug, title: v.title, section: typeof v.section === 'string' ? v.section : '', at: Number(v.at) || 0 };
  } catch {
    return null;
  }
}
