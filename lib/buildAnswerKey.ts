import { bookData } from "./bookData";
import { fuzzyMatch } from "./fuzzyMatch";

export interface DotFromMap {
  number: string;   // "i", "ii", ...
  clue: string;     // "Neolithic site", "IVC port town"
  region: string;   // "Kashmir", "Gujarat"
}

export interface AnswerKeyEntry {
  number: string;
  correctSite: string | null;
  correctState: string | null;
  confidence: number;   // 0–3, how many clue words matched
  candidates: string[]; // top 3 alternatives if confidence is low
}

export function buildAnswerKey(dots: DotFromMap[]): AnswerKeyEntry[] {
  return dots.map(dot => {
    // Step 1 — filter by region
    const regionCandidates = bookData.filter(
      site => fuzzyMatch(site.state, dot.region) > 60
    );

    // Step 2 — score by clue word overlap against all text fields
    const clueWords = dot.clue.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    const scored = (regionCandidates.length > 0 ? regionCandidates : bookData).map(site => {
      const haystack = [
        site.name,
        site.state,
        site.period,
        site.type,
        site.majorAspect,
        ...(site.subSites?.map((s: any) => s.name) ?? []),
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
      correctState: best?.site.state ?? null,
      confidence: best?.matchCount ?? 0,
      candidates: topCandidates,
    };
  });
}
