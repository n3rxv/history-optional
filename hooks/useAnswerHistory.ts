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
  sectionMarks: {
    introduction: SectionMark;
    body: SectionMark;
    conclusion: SectionMark;
    presentation: SectionMark;
  };
  demandOfQuestion?: string[];
  introduction?: { what_was_written?: string; strengths?: string[]; analysis?: string; suggestions?: string[] };
  body?: { strengths?: string[]; weaknesses?: string[]; suggestions?: string[] };
  conclusion?: { what_was_written?: string; strengths?: string[]; analysis?: string; suggestions?: string[] };
  historiansToCite?: { name: string; work?: string; argument: string }[];
  modelAnswer?: { introduction: string; body: string | string[]; conclusion: string };
}

export function loadHistory(): AnswerEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveToHistory(entry: Omit<AnswerEntry, 'id' | 'date'>) {
  if (typeof window === 'undefined') return;
  try {
    const history = loadHistory();
    const newEntry: AnswerEntry = { ...entry, id: Date.now().toString(), date: new Date().toISOString() };
    const updated = [newEntry, ...history].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function deleteFromHistory(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const history = loadHistory().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {}
}
