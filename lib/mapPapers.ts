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

export type RepeatedPlace = {
  /** The answer as most recently given. */
  name: string;
  /** Newest first. */
  years: number[];
  /** The hint UPSC printed each time, newest first. */
  hints: { year: number; hint: string }[];
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

/** Every place asked more than once, most asked first, then most recently asked. */
export function repeatedPlaces(): RepeatedPlace[] {
  return groups
    .map((members) => [...members].sort((a, b) => b.year - a.year))
    .filter((members) => new Set(members.map((m) => m.year)).size > 1)
    .map((members) => ({
      name: members[0].answer,
      years: [...new Set(members.map((m) => m.year))],
      hints: members.map((m) => ({ year: m.year, hint: m.hint })),
      lat: members[0].lat,
      lng: members[0].lng,
    }))
    .sort((a, b) => b.years.length - a.years.length || b.years[0] - a.years[0] || a.name.localeCompare(b.name));
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
