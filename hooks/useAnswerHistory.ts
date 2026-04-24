'use client';
import { useCallback } from 'react';

const STORAGE_KEY = 'ho_answer_history_v1';
const MAX_ENTRIES = 50;

export interface AnswerEntry {
  id: string;
  question: string;
  marks: number;
  marksOutOf: number;
  overallFeedback: string;
  sectionMarks: {
    introduction: { awarded: number; out_of: number };
    body: { awarded: number; out_of: number };
    conclusion: { awarded: number; out_of: number };
    presentation: { awarded: number; out_of: number };
  };
  date: string; // ISO string
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
    const newEntry: AnswerEntry = {
      ...entry,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
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
