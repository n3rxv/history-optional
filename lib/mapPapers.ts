import { mapData, type MapEntry } from '@/lib/mapData';
import type { MapSite } from '@/lib/mapBook';

/**
 * UPSC's map question, paper by paper.
 *
 * Paper I opens with a map: twenty places marked on it, each with a one-line
 * hint printed seriatim. The paper never names the places. The names here are
 * the generally accepted answers. This module groups the same place across
 * years, so a reader can see what UPSC repeats, and matches each answer to
 * the map book's entry for its location and notes.
 */

export type PaperPlace = MapEntry & {
  /** Every year this place was asked, newest first. */
  askedIn: number[];
};

export type AskedPlace = {
  /** The answer as most recently given. */
  name: string;
  /** Every name it was given, for checking a typed answer. */
  answers: string[];
  /** Newest first. */
  years: number[];
  /** The hint UPSC printed each time, newest first, with any note on the answer. */
  hints: { year: number; hint: string; note?: string }[];
  lat: number;
  lng: number;
};

export const norm = (s: string) => s.normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
/** "Sisupalgarh (Tosali)", "Karur/Uraiyur": each name it goes by. */
export const nameVariants = (name: string) =>
  name.split(/[/,()]|\salso known as\s|\sor\s/i).map((s) => s.trim()).filter((s) => s.length > 2);
const keys = (name: string) => nameVariants(name).map(norm).filter((k) => k.length > 2);
const near = (a: { lat: number; lng: number }, b: { lat: number; lng: number }, deg: number) => Math.hypot(a.lat - b.lat, a.lng - b.lng) < deg;

/**
 * Two answers name the same place when they share a name ("Sisupalgarh",
 * "Sisupalgarh (Tosali)"), or lie close together with one name inside the
 * other ("Bagh", "Bagh caves") or nearly the same spelling ("Hunsgi",
 * "Hunsagi"). Nearness alone is not enough: Bhaja and Bedse are 2 km apart.
 */
function samePlace(a: { answer: string; lat: number; lng: number }, b: { answer: string; lat: number; lng: number }) {
  const ka = keys(a.answer), kb = keys(b.answer);
  if (ka.some((k) => kb.includes(k))) return true;
  if (!near(a, b, 0.12)) return false;
  return ka.some((x) => kb.some((y) => (x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x))) || close(x, y)));
}

/** Spellings within two letters of each other, for names of five letters or more. */
export function close(a: string, b: string) {
  if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 2) return false;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length] <= 2;
}

// Group the same place across years, once, when the module loads.
const groupOf = new Map<MapEntry, number>();
const groups: MapEntry[][] = [];
for (const e of mapData) {
  const g = groups.findIndex((members) => members.some((m) => samePlace(m, e)));
  if (g >= 0) { groups[g].push(e); groupOf.set(e, g); }
  else { groupOf.set(e, groups.length); groups.push([e]); }
}
const yearsOf = (g: number) => [...new Set(groups[g].map((m) => m.year))].sort((a, b) => b - a);

/** The papers with a map question, newest first. */
export const paperYears: number[] = [...new Set(mapData.map((e) => e.year))].sort((a, b) => b - a);

/** One paper's twenty places, in the paper's order. */
export function paper(year: number): PaperPlace[] {
  return mapData.filter((e) => e.year === year).sort((a, b) => a.number - b.number).map((e) => ({ ...e, askedIn: yearsOf(groupOf.get(e)!) }));
}

/** How many of a paper's places UPSC had asked before. */
export const repeatsIn = (year: number) => paper(year).filter((p) => p.askedIn.some((y) => y < year)).length;

/** Every place UPSC has asked, once each, with the years and hints. */
const asked: AskedPlace[] = groups.map((g) => {
  const members = [...g].sort((a, b) => b.year - a.year || a.number - b.number);
  return {
    name: members[0].answer,
    answers: [...new Set(members.map((m) => m.answer))],
    years: [...new Set(members.map((m) => m.year))],
    hints: members.map((m) => ({ year: m.year, hint: m.hint, ...(m.note ? { note: m.note } : {}) })),
    lat: members[0].lat,
    lng: members[0].lng,
  };
});

/** Every place asked more than once, most asked first, then most recently asked. */
export function repeatedPlaces(): AskedPlace[] {
  return asked
    .filter((p) => p.years.length > 1)
    .sort((a, b) => b.years.length - a.years.length || b.years[0] - a.years[0] || a.name.localeCompare(b.name));
}

/**
 * Answers the map book doesn't have, placed in its chapters by hand.
 * Mandi (2016, "A capital city") is in none: the book's Mandi is another place.
 */
const BY_HAND: Record<string, string[]> = {
  'Hire Benakal': ['Megalithic Sites'],
  'Tala (Devrani-Jethani temples)': ['Temples'],
  Kodumbalur: ['Temples'],
  Araria: ['Water Structures'],
};

/**
 * The places UPSC has asked from each chapter of the map book, newest first:
 * those the chapter has a site for, within a degree and under the same name
 * or one spelt within two letters ("Hunsgi", "Hunsagi"). A degree, because
 * the same name can be another place: the book's Mandi is not 2016's.
 */
export function askedByChapter(book: Record<string, MapSite[]>, chapters: { key: string; topic: string }[]): Record<string, AskedPlace[]> {
  const out: Record<string, AskedPlace[]> = {};
  const same = (p: AskedPlace, s: MapSite) => {
    if (Math.hypot(p.lat - s.lat, p.lng - s.lng) >= 1) return false;
    const ks = keys(s.name);
    return p.answers.some((a) => samePlace({ answer: a, lat: p.lat, lng: p.lng }, { answer: s.name, lat: s.lat, lng: s.lng })
      || keys(a).some((k) => ks.some((x) => close(k, x))));
  };
  for (const { key, topic } of chapters) {
    const sites = book[key] ?? [];
    out[key] = asked
      .filter((p) => sites.some((s) => same(p, s)) || p.answers.some((a) => BY_HAND[a]?.includes(topic)))
      .sort((a, b) => b.years[0] - a.years[0] || a.name.localeCompare(b.name));
  }
  return out;
}

/**
 * The map book's entry for an answer, for its location, notes and Hindi name.
 * The same rule as grouping the years: a shared name, or a near place with a
 * nearly matching name. None is better than the wrong one.
 */
export function bookEntry(p: { answer: string; lat: number; lng: number }, all: MapSite[]): MapSite | undefined {
  const pk = keys(p.answer);
  const exact = all.filter((s) => keys(s.name).some((k) => pk.includes(k)));
  if (exact.length) return exact.sort((a, b) => Math.hypot(a.lat - p.lat, a.lng - p.lng) - Math.hypot(b.lat - p.lat, b.lng - p.lng))[0];
  return all.find((s) => samePlace(p, { answer: s.name, lat: s.lat, lng: s.lng }));
}
