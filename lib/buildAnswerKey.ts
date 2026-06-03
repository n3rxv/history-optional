import { mapData } from "./mapData";
import { bookData } from "./bookData";

export interface DotFromMap {
  number: string;
  clue: string;
  region: string;
}

export interface AnswerKeyEntry {
  number: string;
  clue: string;
  correctSite: string | null;
  correctLocation: string | null;
  confidence: number;
  candidates: string[];
  approxCoords: { lat: number; lon: number } | null;
}

// Geographic distance in degrees (approx)
function geoDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
}

const allBookSites = bookData.flatMap(chapter => chapter.sites);

export function buildAnswerKey(
  dots: DotFromMap[],
  coordMap?: Record<string, { lat: number; lon: number }>
): AnswerKeyEntry[] {
  return dots.map(dot => {
    const coords = coordMap?.[dot.number] ?? null;

    // ── Strategy: coords are ALWAYS the primary signal ──────────────────────
    // If we have coordinates, find the nearest site in bookData + mapData
    // that also loosely matches the clue. Coords alone break ties.

    if (coords) {
      // Step 1 — find all mapData entries within 4° radius
      const mapCandidates = mapData
        .map(entry => ({
          entry,
          dist: geoDistance(coords.lat, coords.lon, entry.lat, entry.lng),
        }))
        .filter(c => c.dist <= 4)
        .sort((a, b) => a.dist - b.dist);

      if (mapCandidates.length > 0) {
        // Pick closest mapData match — coords are primary, clue is just a label
        const best = mapCandidates[0];
        return {
          number: dot.number,
          clue: dot.clue,
          correctSite: best.entry.answer,
          correctLocation: `${best.entry.answer} (~${best.entry.lat}°N, ${best.entry.lng}°E)`,
          confidence: Math.max(0.85 - best.dist * 0.1, 0.5),
          candidates: mapCandidates.slice(1, 4).map(c => c.entry.answer),
          approxCoords: coords,
        };
      }

      // Step 2 — fall back to bookData within 4° radius
      const bookCandidates = allBookSites
        .filter(site => site.lat != null && site.lng != null)
        .map(site => ({
          site,
          dist: geoDistance(coords.lat, coords.lon, site.lat!, site.lng!),
        }))
        .filter(c => c.dist <= 4)
        .sort((a, b) => a.dist - b.dist);

      if (bookCandidates.length > 0) {
        const best = bookCandidates[0];
        return {
          number: dot.number,
          clue: dot.clue,
          correctSite: best.site.name,
          correctLocation: best.site.location,
          confidence: Math.max(0.75 - best.dist * 0.1, 0.4),
          candidates: bookCandidates.slice(1, 4).map(c => c.site.name),
          approxCoords: coords,
        };
      }
    }

    // ── No coords OR nothing found within 4° — pass everything to Groq ──────
    // Groq will use clue + coords + candidates to identify the site.
    // We still pass nearby candidates from a wider 8° search as hints.

    const widenedCandidates: string[] = [];

    if (coords) {
      const wider = allBookSites
        .filter(s => s.lat != null && s.lng != null)
        .map(s => ({ name: s.name, dist: geoDistance(coords.lat, coords.lon, s.lat!, s.lng!) }))
        .filter(c => c.dist <= 8)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 6)
        .map(c => c.name);
      widenedCandidates.push(...wider);
    }

    return {
      number: dot.number,
      clue: dot.clue,
      correctSite: null,
      correctLocation: dot.region,
      confidence: 0,
      candidates: widenedCandidates,
      approxCoords: coords,
    };
  });
}
