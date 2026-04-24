import { useState, useEffect, useCallback, useRef } from 'react';

const MARK_CLASS = 'note-search-match';

function clearMarks(container: HTMLElement) {
  // Walk backwards to avoid live NodeList issues
  const marks = Array.from(container.querySelectorAll(`mark.${MARK_CLASS}`));
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    // Replace mark with its text content
    const text = document.createTextNode(mark.textContent || '');
    parent.replaceChild(text, mark);
    parent.normalize();
  }
}

function applyMarks(container: HTMLElement, query: string): HTMLElement[] {
  clearMarks(container);
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase();
  const marks: HTMLElement[] = [];

  // Collect all text nodes first (snapshot — avoids live DOM mutation issues)
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName?.toLowerCase() ?? '';
      if (['script', 'style', 'mark', 'textarea', 'input'].includes(tag)) return NodeFilter.FILTER_REJECT;
      if (!node.textContent?.toLowerCase().includes(q)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let n: Text | null;
  while ((n = walker.nextNode() as Text | null)) textNodes.push(n);

  // Now mutate
  for (const textNode of textNodes) {
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
      mark.setAttribute('data-match-idx', String(marks.length));
      mark.textContent = text.slice(idx, idx + query.length);
      mark.style.cssText = [
        'background: rgba(212,168,67,0.28)',
        'color: inherit',
        'border-radius: 2px',
        'padding: 0 2px',
        'outline: 1px solid rgba(212,168,67,0.4)',
        'outline-offset: 0',
        'transition: background 0.15s',
      ].join(';');
      frag.appendChild(mark);
      marks.push(mark as HTMLElement);

      last = idx + query.length;
      idx = lower.indexOf(q, last);
    }

    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode?.replaceChild(frag, textNode);
  }

  return marks;
}

function activateMark(mark: HTMLElement) {
  mark.style.background = 'rgba(212,168,67,0.75)';
  mark.style.outline = '2px solid rgba(212,168,67,0.9)';
  mark.style.color = '#000';
  mark.style.borderRadius = '3px';
}

function deactivateMark(mark: HTMLElement) {
  mark.style.background = 'rgba(212,168,67,0.28)';
  mark.style.outline = '1px solid rgba(212,168,67,0.4)';
  mark.style.color = 'inherit';
  mark.style.borderRadius = '2px';
}

function scrollToMark(mark: HTMLElement) {
  const rect = mark.getBoundingClientRect();
  const navbarHeight = 170; // clears sticky navbar + toolbar
  const targetY = rect.top + window.scrollY - navbarHeight;
  window.scrollTo({ top: targetY, behavior: 'smooth' });
}

export function useNoteSearch(containerRef: React.RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState(0); // 1-based, 0 = none
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

  // Cmd+F / Ctrl+F intercept
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

  // Apply marks on query change — wait a tick for React to finish rendering
  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    // Defer so dangerouslySetInnerHTML has fully painted
    const tid = setTimeout(() => {
      if (!query || query.length < 2) {
        clearMarks(container);
        marksRef.current = [];
        setTotal(0);
        setCurrent(0);
        return;
      }

      const marks = applyMarks(container, query);
      marksRef.current = marks;
      setTotal(marks.length);

      if (marks.length > 0) {
        setCurrent(1);
        activateMark(marks[0]);
        scrollToMark(marks[0]);
      } else {
        setCurrent(0);
      }
    }, 50);

    return () => clearTimeout(tid);
  }, [query, open, containerRef]);

  const jump = useCallback((dir: 1 | -1) => {
    const marks = marksRef.current;
    if (!marks.length) return;

    const prevIdx = current - 1;
    const nextIdx = (prevIdx + dir + marks.length) % marks.length;

    if (marks[prevIdx]) deactivateMark(marks[prevIdx]);
    if (marks[nextIdx]) {
      activateMark(marks[nextIdx]);
      scrollToMark(marks[nextIdx]);
    }
    setCurrent(nextIdx + 1);
  }, [current]);

  return { open, setOpen, query, setQuery, current, total, jump, close };
}
