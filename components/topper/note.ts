/**
 * A topper copy's note, "Vikram Grewal, AIR-51, 2018", and the parts the
 * pages show of it. Shared by the list, the viewer and the compare page.
 */
export function parseNote(note: string | null) {
  const parts = (note ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    name: parts[0] || 'Topper copy',
    rank: parts.find((p) => /^AIR/i.test(p))?.replace(/^AIR[\s-]*/i, 'AIR '),
    year: parts.find((p) => /^\d{4}$/.test(p)),
  };
}

/** "Vikram Grewal" from "Vikram Grewal, AIR-51, 2018". */
export const topperOf = (note: string | null) => (note ?? '').split(',')[0].trim();

/** 51 from "Vikram Grewal, AIR-51, 2018"; unranked notes sort last. */
export const rankOf = (note: string) => Number(note.match(/AIR[\s-]*(\d+)/i)?.[1] ?? Infinity);

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/*
 * Whether a topper copy answers a PYQ word for word, or near it. A copy is
 * linked to the PYQs it serves, but most toppers answered a test-series
 * question on the same theme, worded quite differently: putting the linked
 * PYQ's Hindi in place of the copy's own question would name a question the
 * scanned answer does not answer. Hindi mode shows the PYQ's Hindi only when
 * the two are the same question, which these measure.
 */

/** Words that say nothing about which question it is. */
const STOP = new Set(('the and for with from that this these those which what how why who whom was were been are its into upon about over under between during after before within without not but than then there their his her they them you your our has have had also more most such any all some own same very would could should may might can will shall did does '
  + 'critically examine discuss comment analyse analyze explain evaluate assess write short essay note notes extent far').split(' '));

/** A question's telling words, each cut to five letters so "reforms" meets "reform". */
const words = (text: string) => [...new Set(text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/)
  .filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.slice(0, 5)))];

/** How much two questions' telling words overlap, 0 to 1. */
export function overlap(a: string, b: string): number {
  const A = new Set(words(a));
  const B = words(b);
  const shared = B.filter((w) => A.has(w)).length;
  return shared / (A.size + B.length - shared || 1);
}

/** The same question, perhaps worded a little differently. */
export const sameQuestion = (a: string, b: string) => overlap(a, b) >= 0.4;

const bit = (w: string) => { let x = 2166136261; for (let i = 0; i < w.length; i++) { x ^= w.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0) % 64; };
function mask(text: string): [number, number] {
  let lo = 0; let hi = 0;
  for (const w of words(text)) { const b = bit(w); if (b < 32) lo |= 1 << b; else hi |= 1 << (b - 32); }
  return [lo >>> 0, hi >>> 0];
}
const ones = (x: number) => { let n = 0; for (; x; n++) x &= x - 1; return n; };

/**
 * A question's telling words folded into 64 bits, as "lo.hi" in base 36: a
 * dozen characters, small enough to send for the whole question bank where
 * the page cannot send the questions themselves.
 */
export function questionSig(text: string): string {
  const [lo, hi] = mask(text);
  return `${lo.toString(36)}.${hi.toString(36)}`;
}

/** sameQuestion, against a PYQ known only by its questionSig. */
export function sameAsSig(sig: string | undefined, text: string): boolean {
  if (!sig) return false;
  const [a0, a1] = sig.split('.').map((s) => parseInt(s, 36));
  const [b0, b1] = mask(text);
  const union = ones((a0 | b0) >>> 0) + ones((a1 | b1) >>> 0);
  return union > 0 && (ones((a0 & b0) >>> 0) + ones((a1 & b1) >>> 0)) / union >= 0.45;
}

/** A copy's question as the key of its Hindi in lib/topperQuestionsHi.ts. */
export const questionKey = (question: string) => question.replace(/\s+/g, ' ').trim();
