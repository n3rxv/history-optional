import type { SectionKey } from '@/components/notes/sections';

/**
 * The PYQ book's six sections. The notes split the syllabus four ways, so
 * Early Medieval sits under Medieval and India since Independence under
 * Modern: `key` is the part of the syllabus each belongs to, which gives it
 * its colour and its tab on the PYQ list.
 */
export type PyqSectionMeta = {
  /** As stored on each question, e.g. "Paper I - Ancient India". */
  value: string;
  name: string;
  /** For tight spots: a tab, a chip. */
  short: string;
  slug: string;
  key: SectionKey;
  paper: 1 | 2;
};

export const PYQ_SECTIONS: PyqSectionMeta[] = [
  { value: 'Paper I - Ancient India', name: 'Ancient India', short: 'Ancient', slug: 'ancient-india', key: 'ancient', paper: 1 },
  { value: 'Paper I - Early Medieval', name: 'Early Medieval India', short: 'Early Medieval', slug: 'early-medieval', key: 'medieval', paper: 1 },
  { value: 'Paper I - Medieval India', name: 'Medieval India', short: 'Medieval', slug: 'medieval-india', key: 'medieval', paper: 1 },
  { value: 'Paper II - Modern India', name: 'Modern India', short: 'Modern', slug: 'modern-india', key: 'modern', paper: 2 },
  { value: 'Paper II - India Since Independence', name: 'India since Independence', short: 'Since 1947', slug: 'india-since-independence', key: 'modern', paper: 2 },
  { value: 'Paper II - World History', name: 'World History', short: 'World', slug: 'world-history', key: 'world', paper: 2 },
];

export const pyqSection = (value: string): PyqSectionMeta | undefined => PYQ_SECTIONS.find((s) => s.value === value);

/** "05. Mughal Empire" without its number: the number orders, the name reads. */
export const topicName = (topic: string) => topic.replace(/^\d+\.\s*/, '');

/** The section's colour, as the --t and --w the design system tints with. */
export const tintFor = (key: SectionKey | undefined) =>
  key
    ? { ['--t' as string]: `var(--tint-${key})`, ['--w' as string]: `var(--wash-${key})` }
    : { ['--t' as string]: 'var(--accent-text)', ['--w' as string]: 'var(--accent-wash)' };

/** What the list needs of a question: everything but the syllabus, which goes once per topic. */
export type ListPyq = {
  id: number; section: string; topic: string; subtopic: string;
  year: number; marks: number; source: string; question: string;
};
