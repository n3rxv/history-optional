'use client';
import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'ho_syllabus_v1';

export type SyllabusProgress = {
  completed: Record<string, boolean>;
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

export function useSyllabusTracker() {
  const [progress, setProgress] = useState<SyllabusProgress>({ completed: {} });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProgress(load());
    setMounted(true);
  }, []);

  const toggle = useCallback((slug: string) => {
    setProgress(prev => {
      const next = {
        completed: { ...prev.completed, [slug]: !prev.completed[slug] },
      };
      if (!next.completed[slug]) delete next.completed[slug];
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
