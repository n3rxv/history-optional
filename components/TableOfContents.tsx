'use client';
import { useEffect, useState } from 'react';

type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
};

export default function TableOfContents({ contentHtml }: { contentHtml: string }) {
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    const toc: TocEntry[] = [];
    headings.forEach((h, i) => {
      const text = h.textContent?.trim() || '';
      const id = `toc-${i}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
      h.id = id;
      toc.push({ id, text, level: h.tagName === 'H2' ? 2 : 3 });
    });
    setEntries(toc);
  }, [contentHtml]);

  useEffect(() => {
    if (entries.length === 0) return;
    const observer = new IntersectionObserver(
      (obs) => {
        const visible = obs.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-60px 0px -60% 0px', threshold: 0 }
    );
    entries.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '1rem 1.25rem',
      marginBottom: '2rem',
      maxWidth: 760,
    }}>
      <div style={{
        fontSize: '0.68rem',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--text3)',
        marginBottom: '0.75rem',
        fontFamily: 'var(--font-ui)',
        fontWeight: 600,
      }}>
        Table of Contents
      </div>
      <nav>
        {entries.map((entry, i) => (
          <a
            key={entry.id}
            href={`#${entry.id}`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(entry.id);
              if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 120;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            style={{
              display: 'block',
              padding: entry.level === 2 ? '0.28rem 0' : '0.22rem 0 0.22rem 1rem',
              fontSize: entry.level === 2 ? '0.82rem' : '0.76rem',
              color: activeId === entry.id ? 'var(--accent)' : entry.level === 2 ? 'var(--text2)' : 'var(--text3)',
              textDecoration: 'none',
              borderLeft: entry.level === 3 ? '2px solid var(--border2)' : 'none',
              marginLeft: entry.level === 3 ? '0.5rem' : 0,
              paddingLeft: entry.level === 3 ? '0.75rem' : 0,
              transition: 'color 0.15s',
              fontFamily: 'var(--font-ui)',
              fontWeight: entry.level === 2 ? 500 : 400,
              lineHeight: 1.5,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color =
                activeId === entry.id ? 'var(--accent)' :
                entry.level === 2 ? 'var(--text2)' : 'var(--text3)';
            }}
          >
            {entry.level === 2 ? `${i + 1 - entries.slice(0, i).filter(e => e.level === 3).length}. ` : '– '}
            {entry.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
