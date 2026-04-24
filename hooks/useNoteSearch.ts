import { useState, useEffect, useCallback, useRef } from 'react';

const MARK_CLASS = 'note-search-match';
const MARK_ACTIVE = 'note-search-match-active';

function clearMarks(container: HTMLElement) {
  container.querySelectorAll(`mark.${MARK_CLASS}`).forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
    parent.normalize();
  });
}

function applyMarks(container: HTMLElement, query: string): HTMLElement[] {
  clearMarks(container);
  if (!query || query.length < 2) return [];

  const marks: HTMLElement[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName?.toLowerCase();
      if (['script', 'style', 'mark'].includes(tag)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text)) nodes.push(node);

  const q = query.toLowerCase();

  for (const textNode of nodes) {
    const text = textNode.textContent || '';
    const lower = text.toLowerCase();
    let idx = lower.indexOf(q);
    if (idx === -1) continue;

    const frag = document.createDocumentFragment();
    let last = 0;
    while (idx !== -1) {
      if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
      const mark = document.createElement('mark');
      mark.className = MARK_CLASS;
      mark.textContent = text.slice(idx, idx + query.length);
      mark.style.cssText = 'background:rgba(212,168,67,0.35);color:inherit;border-radius:2px;padding:0 1px;';
      frag.appendChild(mark);
      marks.push(mark);
      last = idx + query.length;
      idx = lower.indexOf(q, last);
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode?.replaceChild(frag, textNode);
  }

  return marks;
}

export function useNoteSearch(containerRef: React.RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const marksRef = useRef<HTMLElement[]>([]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setTotal(0);
    setCurrent(0);
    if (containerRef.current) clearMarks(containerRef.current);
    marksRef.current = [];
  }, [containerRef]);

  // Intercept Cmd+F / Ctrl+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  // Apply marks whenever query changes
  useEffect(() => {
    if (!containerRef.current || !open) return;
    if (!query || query.length < 2) {
      clearMarks(containerRef.current);
      marksRef.current = [];
      setTotal(0);
      setCurrent(0);
      return;
    }
    const marks = applyMarks(containerRef.current, query);
    marksRef.current = marks;
    setTotal(marks.length);
    setCurrent(marks.length > 0 ? 1 : 0);
    marks.forEach((m, i) => {
      m.style.background = i === 0 ? 'rgba(212,168,67,0.75)' : 'rgba(212,168,67,0.3)';
      m.classList.toggle(MARK_ACTIVE, i === 0);
    });
    if (marks[0]) {
      const rect = marks[0].getBoundingClientRect();
      const offset = rect.top + window.scrollY - 160;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, [query, open, containerRef]);

  const jump = useCallback((dir: 1 | -1) => {
    const marks = marksRef.current;
    if (!marks.length) return;
    const next = (current - 1 + dir + marks.length) % marks.length;
    marks.forEach((m, i) => {
      m.style.background = i === next ? 'rgba(212,168,67,0.75)' : 'rgba(212,168,67,0.3)';
      m.classList.toggle(MARK_ACTIVE, i === next);
    });
    const el = marks[next];
    const rect = el.getBoundingClientRect();
    const offset = rect.top + window.scrollY - 160; // 160px clears sticky navbar
    window.scrollTo({ top: offset, behavior: 'smooth' });
    setCurrent(next + 1);
  }, [current]);

  return { open, setOpen, query, setQuery, current, total, jump, close };
}
