import { useState, useEffect, useCallback, useRef } from 'react';

const MARK_CLASS = 'note-search-match';

export function useNoteSearch(containerRef: React.RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const marksRef = useRef<HTMLElement[]>([]);
  const originalHtmlRef = useRef<string | null>(null);

  useEffect(() => {
    if (open && containerRef.current) {
      originalHtmlRef.current = containerRef.current.innerHTML;
    }
  }, [open, containerRef]);

  const restoreHtml = useCallback(() => {
    if (containerRef.current && originalHtmlRef.current !== null) {
      containerRef.current.innerHTML = originalHtmlRef.current;
    }
    marksRef.current = [];
  }, [containerRef]);

  const close = useCallback(() => {
    restoreHtml();
    setOpen(false);
    setQuery('');
    setTotal(0);
    setCurrent(0);
    originalHtmlRef.current = null;
  }, [restoreHtml]);

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

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    const tid = setTimeout(() => {
      if (originalHtmlRef.current !== null) {
        container.innerHTML = originalHtmlRef.current;
      }
      marksRef.current = [];

      if (!query || query.length < 2) {
        setTotal(0);
        setCurrent(0);
        return;
      }

      const q = query.toLowerCase();
      const marks: HTMLElement[] = [];
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
          mark.textContent = text.slice(idx, idx + query.length);
          mark.style.cssText = 'background:rgba(212,168,67,0.25);color:inherit;border-radius:2px;padding:0 2px;outline:1px solid rgba(212,168,67,0.35);transition:background 0.1s;';
          frag.appendChild(mark);
          marks.push(mark as HTMLElement);

          last = idx + query.length;
          idx = lower.indexOf(q, last);
        }

        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        textNode.parentNode?.replaceChild(frag, textNode);
      }

      marksRef.current = marks;
      setTotal(marks.length);

      if (marks.length > 0) {
        setCurrent(1);
        marks[0].style.background = 'rgba(212,168,67,0.82)';
        marks[0].style.color = '#000';
        marks[0].style.outline = '2px solid rgba(212,168,67,1)';
        const rect = marks[0].getBoundingClientRect();
        window.scrollTo({ top: rect.top + window.scrollY - 170, behavior: 'smooth' });
      } else {
        setCurrent(0);
      }
    }, 300);

    return () => clearTimeout(tid);
  }, [query, open, containerRef]);

  const jump = useCallback((dir: 1 | -1) => {
    const marks = marksRef.current;
    if (!marks.length) return;

    const prevIdx = current - 1;
    const nextIdx = (prevIdx + dir + marks.length) % marks.length;

    if (marks[prevIdx]) {
      marks[prevIdx].style.background = 'rgba(212,168,67,0.25)';
      marks[prevIdx].style.color = 'inherit';
      marks[prevIdx].style.outline = '1px solid rgba(212,168,67,0.35)';
    }
    if (marks[nextIdx]) {
      marks[nextIdx].style.background = 'rgba(212,168,67,0.82)';
      marks[nextIdx].style.color = '#000';
      marks[nextIdx].style.outline = '2px solid rgba(212,168,67,1)';
      const rect = marks[nextIdx].getBoundingClientRect();
      window.scrollTo({ top: rect.top + window.scrollY - 170, behavior: 'smooth' });
    }
    setCurrent(nextIdx + 1);
  }, [current]);

  return { open, setOpen, query, setQuery, current, total, jump, close };
}
