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

    // Priority 1 — mapData: clue similarity + optional coordinate filtering
    let bestMapMatch: typeof mapData[0] | null = null;
    let bestMapScore = 0;

    for (const entry of mapData) {
      const clueScore = clueSimilarity(dot.clue, entry.hint);
      if (clueScore < 0.3) continue; // skip weak clue matches entirely

      let finalScore = clueScore;

      // If we have coordinates, boost score for geographically close entries
      // and penalise far ones — this is the key fix
      if (coords && entry.lat && entry.lng) {
        const dist = geoDistance(coords.lat, coords.lon, entry.lat, entry.lng);
        if (dist <= 3) {
          finalScore += 0.4; // strong boost for very close match
        } else if (dist <= 6) {
          finalScore += 0.2; // moderate boost
        } else if (dist > 10) {
          finalScore -= 0.3; // penalise geographically far entries
        }
      }

      if (finalScore > bestMapScore) {
        bestMapScore = finalScore;
        bestMapMatch = entry;
      }
    }

    if (bestMapScore >= 0.4 && bestMapMatch) {
      return {
        number: dot.number,
        clue: dot.clue,
        correctSite: bestMapMatch.answer,
        correctLocation: `${bestMapMatch.answer} (~${bestMapMatch.lat}°N, ${bestMapMatch.lng}°E)`,
        confidence: Math.min(bestMapScore, 1),
        candidates: [],
      };
    }

    // Priority 2 — bookData: clue vs majorAspect + coordinate filtering
    let bestBookMatch: typeof allBookSites[0] | null = null;
    let bestBookScore = 0;

    for (const site of allBookSites) {
      const aspectScore = clueSimilarity(dot.clue, site.majorAspect);
      const nameScore = clueSimilarity(dot.clue, site.name);
      const score = Math.max(aspectScore, nameScore);
      if (score < 0.25) continue;

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
        correctLocation: bestBookMatch.location,
        confidence: bestBookScore,
        candidates: [],
      };
    }

    // Priority 3 — let Groq figure it out from clue + coordinates
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
