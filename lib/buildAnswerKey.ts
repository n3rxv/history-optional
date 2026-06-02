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

// Pass clue+region through directly — scoring is done by Groq in the route
export function buildAnswerKey(dots: DotFromMap[]): AnswerKeyEntry[] {
  return dots.map(dot => ({
    number: dot.number,
    clue: dot.clue,
    correctSite: null,       // will be filled by Groq scoring
    correctLocation: dot.region,
    confidence: 1,           // always trust Groq-extracted dots
    candidates: [],
  }));
}
