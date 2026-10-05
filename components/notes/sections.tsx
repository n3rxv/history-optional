/**
 * The four parts of the syllabus, as the notes split them: their names,
 * colours (--tint-* in the design system), a line on what each covers, the
 * page that lists them, and an icon. Shared by the home page and the notes
 * pages so the two cannot drift apart.
 *
 * `pyq` lists the PYQ bank's sections that belong to each: the bank keeps
 * Early Medieval and India Since Independence apart, the notes do not.
 */

export type SectionKey = 'ancient' | 'medieval' | 'modern' | 'world';

export type SectionMeta = {
  key: SectionKey;
  name: string;
  paper: 1 | 2;
  sub: string;
  href: string;
  pyq: string[];
};

export const SECTIONS: SectionMeta[] = [
  { key: 'ancient', name: 'Ancient India', paper: 1, sub: 'Harappa to the Guptas and after', href: '/notes/ancient-india', pyq: ['Paper I - Ancient India'] },
  { key: 'medieval', name: 'Medieval India', paper: 1, sub: 'The Cholas to the end of the Mughals', href: '/notes/medieval-india', pyq: ['Paper I - Early Medieval', 'Paper I - Medieval India'] },
  { key: 'modern', name: 'Modern India', paper: 2, sub: 'Plassey to independence, and after', href: '/notes/modern-india', pyq: ['Paper II - Modern India', 'Paper II - India Since Independence'] },
  { key: 'world', name: 'World History', paper: 2, sub: 'The Enlightenment to the Cold War', href: '/notes/world-history', pyq: ['Paper II - World History'] },
];

export function sectionByName(name: string): SectionMeta | undefined {
  return SECTIONS.find((s) => s.name === name);
}

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/** A stupa, a dome and arch, a flag, a globe. */
export function SectionIcon({ id, size = 22 }: { id: SectionKey | 'notes'; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', ...s, 'aria-hidden': true };
  switch (id) {
    case 'ancient': return <svg {...p}><path d="M4 20h16M6 20v-3h12v3M7 17a5 5 0 0 1 10 0M12 7v5M10 7h4M12 4v3" /></svg>;
    case 'medieval': return <svg {...p}><path d="M4 20h16M6 20V11a6 6 0 0 1 12 0v9M10 20v-5a2 2 0 0 1 4 0v5M12 3v2" /></svg>;
    case 'modern': return <svg {...p}><path d="M6 21V4M6 5h11l-2 3.5L17 12H6" /></svg>;
    case 'world': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
    default: return <svg {...p}><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6.5A2.5 2.5 0 0 0 4 21.5" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19M9 7h6M9 11h6" /></svg>;
  }
}
