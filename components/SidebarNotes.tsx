'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Scratch notes for one note page, kept in this browser only.
 *
 * Deliberately localStorage rather than the database: these are a reader's
 * own margin scribbles, they are worth nothing to anyone else, and storing
 * them server-side would mean an account, a table and a sync story for
 * something that is useful the moment it is typed. The trade is that they do
 * not follow the reader to another device, which is stated in the UI rather
 * than left to be discovered.
 *
 * Keyed by slug, so each note page has its own set.
 */
export type ScratchNote = {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
};

const keyFor = (slug: string) => `ho_scratch_notes_${slug}`;

function load(slug: string): ScratchNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(keyFor(slug)) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (n): n is ScratchNote =>
        n && typeof n.id === 'string' && typeof n.body === 'string',
    );
  } catch {
    return [];
  }
}

function save(slug: string, notes: ScratchNote[]) {
  try {
    localStorage.setItem(keyFor(slug), JSON.stringify(notes));
  } catch {
    // Private browsing, or the quota is full. The notes stay usable for this
    // session; there is nothing honest to promise beyond that.
  }
}

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function SidebarNotes({ slug, langHi = false }: { slug: string; langHi?: boolean }) {
  const [notes, setNotes] = useState<ScratchNote[]>([]);
  const [mounted, setMounted] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const justAdded = useRef<string | null>(null);

  // localStorage is not available during the server render, so the list is
  // empty on the first paint and fills in here. Without the mounted flag the
  // markup would differ between server and client and hydration would warn.
  useEffect(() => {
    setNotes(load(slug));
    setMounted(true);
  }, [slug]);

  const commit = useCallback(
    (next: ScratchNote[]) => {
      setNotes(next);
      save(slug, next);
    },
    [slug],
  );

  const add = () => {
    const note: ScratchNote = { id: newId(), title: '', body: '', updatedAt: Date.now() };
    justAdded.current = note.id;
    commit([note, ...notes]);
  };

  const update = (id: string, patch: Partial<ScratchNote>) =>
    commit(notes.map(n => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));

  const remove = (id: string) => {
    setConfirmingId(null);
    commit(notes.filter(n => n.id !== id));
  };

  if (!mounted) return null;

  return (
    <>
      <div className="sb-section-label">
        {langHi ? 'मेरे नोट्स' : 'My notes'}{notes.length > 0 ? ` (${notes.length})` : ''}
      </div>

      <button type="button" onClick={add} className="sb-note-add">
        + {langHi ? 'नोट जोड़ें' : 'Add a note'}
      </button>

      {notes.map(n => (
        <div key={n.id} className="sb-note">
          <input
            className="sb-note-title"
            value={n.title}
            placeholder={langHi ? 'शीर्षक (वैकल्पिक)' : 'Title (optional)'}
            onChange={e => update(n.id, { title: e.target.value })}
            aria-label={langHi ? 'नोट शीर्षक' : 'Note title'}
            // A note added by the button should be ready to type into.
            autoFocus={justAdded.current === n.id}
          />
          <textarea
            className="sb-note-body"
            value={n.body}
            rows={3}
            placeholder={langHi ? 'यहाँ लिखें…' : 'Write here…'}
            onChange={e => update(n.id, { body: e.target.value })}
            aria-label={langHi ? 'नोट' : 'Note'}
          />
          <div className="sb-note-foot">
            <span>{new Date(n.updatedAt).toLocaleDateString(langHi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}</span>
            {confirmingId === n.id ? (
              <span className="sb-note-confirm">
                <button type="button" onClick={() => remove(n.id)}>{langHi ? 'हटाएँ' : 'Delete'}</button>
                <button type="button" onClick={() => setConfirmingId(null)}>{langHi ? 'रद्द' : 'Cancel'}</button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingId(n.id)}
                aria-label={langHi ? 'नोट हटाएँ' : 'Delete note'}
              >
                {langHi ? 'हटाएँ' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      ))}

      {notes.length > 0 && (
        <p className="sb-note-scope">
          {langHi ? 'सहेजा गया' : 'Saved'}
        </p>
      )}
    </>
  );
}
