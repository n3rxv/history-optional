'use client';
import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'ho_syllabus_v1';

export type SyllabusProgress = {
  completed: Record<string, boolean>;
  completionDates?: Record<string, string>;
};

function load(): SyllabusProgress {
  if (typeof window === 'undefined') return { completed: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completed: {} };
}

function save(data: SyllabusProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function bumpStreak() {
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

export function useSyllabusTracker() {
  const [progress, setProgress] = useState<SyllabusProgress>({ completed: {} });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProgress(load());
    setMounted(true);
  }, []);

  const toggle = useCallback((slug: string) => {
    setProgress(prev => {
      const isCompleting = !prev.completed[slug];
      const next: SyllabusProgress = {
        completed: { ...prev.completed, [slug]: isCompleting },
        completionDates: { ...(prev.completionDates || {}) },
      };
      if (!isCompleting) {
        delete next.completed[slug];
        delete next.completionDates![slug];
      } else {
        next.completionDates![slug] = new Date().toISOString();
        bumpStreak();
      }
      save(next);
      return next;
    });
  }, []);

  const isCompleted = useCallback((slug: string) => {
    return !!progress.completed[slug];
  }, [progress]);

  const countCompleted = useCallback((slugs: string[]) => {
    return slugs.filter(s => !!progress.completed[s]).length;
  }, [progress]);

  return { progress, toggle, isCompleted, countCompleted, mounted };
}
