'use client';

const STORAGE_KEY = 'ho_answer_history_v1';
const MAX_ENTRIES = 50;

export interface SectionMark {
  awarded: number;
  out_of: number;
  reasoning?: string;
}

export interface AnswerEntry {
  id: string;
  date: string;
  question: string;
  marks: number;
  marksOutOf: number;
  wordCount?: number;
  wordCountRating?: string;
  overallFeedback: string;
  topicSlug?: string;
  topicTitle?: string;
  sectionMarks: {
    introduction: SectionMark;
    body: SectionMark;
    conclusion: SectionMark;
    presentation: SectionMark;
  };
  demandOfQuestion?: string[];
  introduction?: { what_was_written?: string; strengths?: string[]; weaknesses?: string[]; analysis?: string; suggestions?: string[] };
  body?: { strengths?: string[]; weaknesses?: string[]; suggestions?: string[] };
  conclusion?: { what_was_written?: string; strengths?: string[]; weaknesses?: string[]; analysis?: string; suggestions?: string[] };
  historiansToCite?: { name: string; work?: string; argument: string }[];
  modelAnswer?: { introduction: string; body: string | string[]; conclusion: string };
  type?: "single" | "batch" | "map";
  /** Answers marked from one full paper share this, so the paper can be downloaded whole. */
  paperId?: string;
  /** The question's number in its paper, as "Q1(a)". */
  label?: string;
  /** A map question's place-by-place marking, for its download. */
  mapResults?: MapResults;
}

export interface MapPlace {
  number: string;
  clue: string;
  status: 'correct' | 'partial' | 'wrong' | 'blank';
  marks: number;
  maxMarks: number;
  studentSite: string | null;
  studentDescription: string | null;
  correctSite: string | null;
  correctLocation: string | null;
  siteMarks: number;
  descriptionScore: number;
  descriptionFeedback: string;
}
export interface MapResults { results: MapPlace[]; totalMarks: number; maxTotal: number; percentage: number }

export function loadHistory(): AnswerEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: AnswerEntry[] = raw ? JSON.parse(raw) : [];
    // Full papers saved before ids were made unique share one id per paper,
    // so opening one answer opened its neighbour. Told apart once, for good.
    const seen = new Set<string>();
    let changed = false;
    for (const [i, e] of list.entries()) {
      if (seen.has(e.id)) { e.id = `${e.id}-${i}`; changed = true; }
      seen.add(e.id);
    }
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list;
  } catch { return []; }
}

function bumpStreak() {
  try {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('ho_streak_v1');
    let data = stored ? JSON.parse(stored) : { streak: 0, lastDate: '' };
    if (data.lastDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    data.streak = data.lastDate === yesterday ? data.streak + 1 : 1;
    data.lastDate = today;
    localStorage.setItem('ho_streak_v1', JSON.stringify(data));
  } catch {}
}

export function saveToHistory(entry: Omit<AnswerEntry, 'id' | 'date'>) {
  if (typeof window === 'undefined') return;
  try {
    const history = loadHistory();
    // The answers of a full paper are saved in one go, inside the same
    // millisecond, so the time alone gave them all one id.
    const newEntry: AnswerEntry = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date: new Date().toISOString() };
    const updated = [newEntry, ...history].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    bumpStreak();
  } catch {}
}

export function deleteFromHistory(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const history = loadHistory().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {}
}
