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
}

function clueSimilarity(a: string, b: string): number {
  const wordsA = a.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(w => w.length > 3);
  const wordsB = b.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(w => w.length > 3);
  if (!wordsA.length || !wordsB.length) return 0;
  const matches = wordsA.filter(w => wordsB.includes(w)).length;
  return matches / Math.max(wordsA.length, wordsB.length);
}

// Flatten all bookData sites into a single array
const allBookSites = bookData.flatMap(chapter => chapter.sites);

export function buildAnswerKey(dots: DotFromMap[]): AnswerKeyEntry[] {
  return dots.map(dot => {
    // Priority 1 — mapData: match by clue similarity (has exact UPSC hints + lat/lng)
    let bestMapMatch: typeof mapData[0] | null = null;
    let bestMapScore = 0;
    for (const entry of mapData) {
      const score = clueSimilarity(dot.clue, entry.hint);
      if (score > bestMapScore) {
        bestMapScore = score;
        bestMapMatch = entry;
      }
    }

    if (bestMapScore >= 0.4 && bestMapMatch) {
      return {
        number: dot.number,
        clue: dot.clue,
        correctSite: bestMapMatch.answer,
        // Use precise lat/lng from mapData as location context for Groq
        correctLocation: `${bestMapMatch.answer} (~${bestMapMatch.lat}°N, ${bestMapMatch.lng}°E)`,
        confidence: bestMapScore,
        candidates: [],
      };
    }

    // Priority 2 — bookData: match site name or majorAspect against the clue
    let bestBookMatch: typeof allBookSites[0] | null = null;
    let bestBookScore = 0;
    for (const site of allBookSites) {
      const nameScore = clueSimilarity(dot.clue, site.name);
      const aspectScore = clueSimilarity(dot.clue, site.majorAspect);
      const score = Math.max(nameScore, aspectScore);
      if (score > bestBookScore) {
        bestBookScore = score;
        bestBookMatch = site;
      }
    }

    if (bestBookScore >= 0.3 && bestBookMatch) {
      return {
        number: dot.number,
        clue: dot.clue,
        correctSite: bestBookMatch.name,
        // Use location string from bookData — Groq can reason geographically from this
        correctLocation: bestBookMatch.location,
        confidence: bestBookScore,
        candidates: [],
      };
    }

    // Priority 3 — no match, let Groq figure it out from clue + dot coordinates alone
    return {
      number: dot.number,
      clue: dot.clue,
      correctSite: null,
      correctLocation: dot.region,
      confidence: 0,
      candidates: [],
    };
  });
}
