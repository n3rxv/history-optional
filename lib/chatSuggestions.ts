/**
 * The questions the chat input suggests as its placeholder. Esc (or the key
 * hint beside it) puts the suggestion into the input, and a new one is drawn
 * each time the input starts empty again, so the placeholder doubles as a
 * stream of things worth asking.
 *
 * Each is a real Mains-style line of inquiry, spread across all four sections.
 */
const EN = [
  'Why did the Mughals decline after Aurangzeb?',
  'Was the Revolt of 1857 a war of independence?',
  "How did Ashoka's Dhamma differ from Buddhism?",
  'What made the Harappan cities so well planned?',
  "Did the Permanent Settlement ruin Bengal's peasants?",
  'Why did the Delhi Sultanate rely on the iqta system?',
  'How did Gandhi turn the Congress into a mass movement?',
  'What did Kautilya mean by the Mandala theory?',
  'Was there such a thing as Indian feudalism?',
  'Why did the Cholas build such a strong navy?',
  'How did the drain of wealth work, according to Naoroji?',
  'Why was Bengal partitioned in 1905?',
  'How did the Bhakti movement challenge caste?',
  'Why did the French Revolution turn radical?',
  "What made Bismarck's unification of Germany work?",
  'How did the Cold War shape decolonisation?',
  'Why did the Soviet Union collapse in 1991?',
  'What did the Enlightenment owe to Rousseau?',
  "How did Akbar's mansabdari system work?",
  'Was Sher Shah a forerunner of Akbar?',
  'Why did Vijayanagara fall after Talikota?',
  'How did the Guptas govern so large an empire?',
  'What drove the scramble for Africa?',
  'How did the Montagu-Chelmsford reforms bring in dyarchy?',
];

const HI = [
  'औरंगज़ेब के बाद मुग़ल क्यों बिखरे?',
  'क्या 1857 का विद्रोह स्वतंत्रता संग्राम था?',
  'अशोक का धम्म बौद्ध धर्म से कैसे अलग था?',
  'हड़प्पा के नगर इतने सुनियोजित क्यों थे?',
  'क्या स्थायी बंदोबस्त ने बंगाल के किसानों को बर्बाद किया?',
  'गांधी ने कांग्रेस को जन आंदोलन कैसे बनाया?',
  'कौटिल्य के मंडल सिद्धांत का क्या अर्थ है?',
  'भक्ति आंदोलन ने जाति व्यवस्था को कैसे चुनौती दी?',
  'फ्रांसीसी क्रांति उग्र क्यों हो गई?',
  'सोवियत संघ 1991 में क्यों टूटा?',
  'अकबर की मनसबदारी व्यवस्था कैसे काम करती थी?',
  'चोलों ने इतनी मज़बूत नौसेना क्यों बनाई?',
];

export function suggestions(langHi: boolean): string[] {
  return langHi ? HI : EN;
}

/** A random index other than `prev`, so the suggestion always changes. */
export function nextSuggestion(prev: number, count: number): number {
  if (count <= 1) return 0;
  const n = Math.floor(Math.random() * (count - 1));
  return n >= prev ? n + 1 : n;
}

/**
 * A suggestion split into what a reader sees as characters, so the typing
 * effect never shows half a Devanagari cluster (a consonant waiting for its
 * vowel sign). Falls back to code points where Intl.Segmenter is missing.
 */
export function graphemes(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) return Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(text), (g) => g.segment);
  return Array.from(text);
}

/**
 * Tidies a model's follow-up question into one line the input can show, or
 * returns null when what came back is not a usable question. Models add
 * numbering, quotes and "Question:" labels however firmly they are told not
 * to, and a suggestion that is not a question is worse than none.
 */
export function cleanSuggestion(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const line = raw.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  const q = line
    .replace(/^(?:\d+[.)]|[-*•])\s*/, '')
    .replace(/^(?:follow[- ]?up|next|suggested)?\s*question\s*[:\-–—]\s*/i, '')
    .replace(/^["'“‘]+|["'”’]+$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (q.length < 10 || q.length > 140) return null;
  if (!/[?？]$/.test(q)) return null;
  return q;
}
