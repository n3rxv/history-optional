'use client';
import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { readLastNote, type LastNote } from '@/lib/lastNote';

/**
 * The hero's two buttons, which change with who is reading: a newcomer is
 * asked to start, and a reader who has opened a note before is offered the
 * way back to it. The page is static; the last note is read on arrival
 * through useSyncExternalStore, so the server render and the first client
 * render agree.
 */

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

let cached: { raw: string | null; value: LastNote | null } = { raw: null, value: null };
function snapshot(): LastNote | null {
  let raw: string | null = null;
  try { raw = localStorage.getItem('ho_last_note'); } catch {}
  if (raw !== cached.raw) cached = { raw, value: raw ? readLastNote() : null };
  return cached.value;
}
const subscribe = (cb: () => void) => { window.addEventListener('storage', cb); return () => window.removeEventListener('storage', cb); };

export function HeroActions() {
  const last = useSyncExternalStore(subscribe, snapshot, () => null);
  if (last) {
    return (
      <div className="hm-actions">
        <Link href={`/notes/${last.slug}`} className="ds-btn ds-btn-solid ds-btn-lg hm-continue">
          <span>Continue: {last.title}</span><Arrow />
        </Link>
        <Link href="/dashboard" className="ds-btn ds-btn-ghost">Your dashboard</Link>
      </div>
    );
  }
  return (
    <div className="hm-actions">
      <Link href="/paper1" className="ds-btn ds-btn-solid ds-btn-lg">Start studying, it&rsquo;s free<Arrow /></Link>
      <Link href="/evaluate" className="ds-btn ds-btn-ghost">Check an answer</Link>
    </div>
  );
}
