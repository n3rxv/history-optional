import { useState, useEffect, useCallback, useRef } from 'react';

const MARK_CLASS = 'nsr-mark';
const CLONE_ID = 'nsr-clone';

export function useNoteSearch(containerRef: React.RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const marksRef = useRef<HTMLElement[]>([]);
  const cloneRef = useRef<HTMLElement | null>(null);

  // Remove clone, show original
  const teardown = useCallback(() => {
    const existing = document.getElementById(CLONE_ID);
    if (existing) existing.remove();
    if (containerRef.current) containerRef.current.style.display = '';
    cloneRef.current = null;
    marksRef.current = [];
  }, [containerRef]);

  const close = useCallback(() => {
    teardown();
    setOpen(false);
    setQuery('');
    setTotal(0);
    setCurrent(0);
  }, [teardown]);

  // Cmd+F / Ctrl+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setOpen(o => {
          if (!o) return true;
          return o;
        });
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  // When opened: create clone, hide original
  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    // Remove any stale clone
    document.getElementById(CLONE_ID)?.remove();

    // Clone the node
    const clone = container.cloneNode(true) as HTMLElement;
    clone.id = CLONE_ID;
    clone.style.cssText = container.style.cssText;

    // Insert clone right after original, hide original
    container.parentNode?.insertBefore(clone, container.nextSibling);
    container.style.display = 'none';
    cloneRef.current = clone;

    return () => {
      // cleanup if component unmounts while open
      teardown();
    };
  }, [open]); // eslint-disable-line

  // Debounced search on clone
  useEffect(() => {
    if (!open) return;
    const tid = setTimeout(() => {
      const clone = cloneRef.current;
      if (!clone) return;

      // Clear previous marks by restoring text
      clone.querySelectorAll(`mark.${MARK_CLASS}`).forEach(m => {
        const t = document.createTextNode(m.textContent || '');
        m.parentNode?.replaceChild(t, m);
      });
      // Normalize after clearing
      clone.normalize();
      marksRef.current = [];

      if (!query || query.length < 2) {
        setTotal(0);
        setCurrent(0);
        return;
      }

      const q = query.toLowerCase();
      const marks: HTMLElement[] = [];
      const textNodes: Text[] = [];

      const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, {
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
          mark.style.cssText = 'background:rgba(212,168,67,0.22);color:inherit;border-radius:2px;padding:0 2px;outline:1px solid rgba(212,168,67,0.4);';
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
        marks[0].style.background = 'rgba(212,168,67,0.85)';
        marks[0].style.color = '#000';
        marks[0].style.outline = '2px solid #d4a843';
        const rect = marks[0].getBoundingClientRect();
        window.scrollTo({ top: rect.top + window.scrollY - 170, behavior: 'smooth' });
      } else {
        setCurrent(0);
      }
    }, 280);

    return () => clearTimeout(tid);
  }, [query, open]);

  const jump = useCallback((dir: 1 | -1) => {
    const marks = marksRef.current;
    if (!marks.length) return;
    const prevIdx = current - 1;
    const nextIdx = (prevIdx + dir + marks.length) % marks.length;
    if (marks[prevIdx]) {
      marks[prevIdx].style.background = 'rgba(212,168,67,0.22)';
      marks[prevIdx].style.color = 'inherit';
      marks[prevIdx].style.outline = '1px solid rgba(212,168,67,0.4)';
    }
    if (marks[nextIdx]) {
      marks[nextIdx].style.background = 'rgba(212,168,67,0.85)';
      marks[nextIdx].style.color = '#000';
      marks[nextIdx].style.outline = '2px solid #d4a843';
      const rect = marks[nextIdx].getBoundingClientRect();
      window.scrollTo({ top: rect.top + window.scrollY - 170, behavior: 'smooth' });
    }
    setCurrent(nextIdx + 1);
  }, [current]);

  return { open, setOpen, query, setQuery, current, total, jump, close };
}
