import { bookData, BookChapter, BookSite } from "./bookData";
import { fuzzyMatch } from "./fuzzyMatch";

export interface DotFromMap {
  number: string;   // "i", "ii", ...
  clue: string;     // "Neolithic site", "IVC port town"
  region: string;   // "Kashmir", "Gujarat"
}

export interface AnswerKeyEntry {
  number: string;
  correctSite: string | null;
  correctLocation: string | null;
  confidence: number;   // 0–3, how many clue words matched
  candidates: string[]; // top 3 alternatives if confidence is low
}

interface FlatSite extends BookSite {
  chapterTopic: string;
}

// Flatten bookData: chapters → sites
function getAllSites(): FlatSite[] {
  const result: FlatSite[] = [];
  for (const chapter of bookData) {
    for (const site of chapter.sites) {
      result.push({ ...site, chapterTopic: chapter.topic });
    }
  }
  return result;
}

export function buildAnswerKey(dots: DotFromMap[]): AnswerKeyEntry[] {
  const allSites = getAllSites();

  return dots.map(dot => {
    // Step 1 — filter by region (match against location field)
    const regionCandidates = allSites.filter(
      site => fuzzyMatch(site.location, dot.region) > 60
    );

    // Step 2 — score by clue word overlap
    const clueWords = dot.clue.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const pool = regionCandidates.length > 0 ? regionCandidates : allSites;

    const scored = pool.map(site => {
      const haystack = [
        site.name,
        site.location,
        site.majorAspect,
        site.chapterTopic,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchCount = clueWords.filter(w => haystack.includes(w)).length;
      return { site, matchCount };
    });

    scored.sort((a, b) => b.matchCount - a.matchCount);

    const best = scored[0];
    const topCandidates = scored.slice(0, 3).map(s => s.site.name);

    return {
      number: dot.number,
      correctSite: best?.site.name ?? null,
      correctLocation: best?.site.location ?? null,
      confidence: best?.matchCount ?? 0,
      candidates: topCandidates,
    };
  });
}
