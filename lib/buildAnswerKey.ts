import { mapData } from "./mapData";

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

export function buildAnswerKey(dots: DotFromMap[]): AnswerKeyEntry[] {
  return dots.map(dot => {
    // Find best match in mapData by clue similarity
    let bestMatch: typeof mapData[0] | null = null;
    let bestScore = 0;

    for (const entry of mapData) {
      const score = clueSimilarity(dot.clue, entry.hint);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    const correctSite = bestScore >= 0.4 && bestMatch ? bestMatch.answer : null;

    return {
      number: dot.number,
      clue: dot.clue,
      correctSite,
      correctLocation: dot.region,
      confidence: bestScore >= 0.4 ? bestScore : 0,
      candidates: [],
    };
  });
}
