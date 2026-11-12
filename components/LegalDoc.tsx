'use client';
import type { ReactNode } from 'react';
import Link from '@/components/Link';
import { useLang } from '@/lib/i18n/LangContext';

const DOCS = [
  { id: 'privacy', label: 'Privacy', labelHi: 'गोपनीयता', href: '/privacy' },
  { id: 'terms', label: 'Terms', labelHi: 'शर्तें', href: '/terms' },
  { id: 'refund', label: 'Refunds', labelHi: 'रिफ़ंड', href: '/refund' },
] as const;

/**
 * The frame for the three policy pages: their own tabs, the title and dates,
 * and one readable style for the text. They used to share a block of global
 * styles with serif titles and yellow section headings.
 *
 * The pages stay on the server and hand over both versions of the text. The
 * server draws the English, which is what search engines read, and in Hindi
 * mode the reader sees the Hindi translation under a note that the English
 * version prevails.
 */
export default function LegalDoc({ current, title, titleHi, updated, updatedHi, children, hi }: {
  current: (typeof DOCS)[number]['id'];
  title: string;
  titleHi: string;
  updated: string;
  updatedHi: string;
  children: ReactNode;
  hi: ReactNode;
}) {
  const { langHi } = useLang();
  return (
    <main className="lgd ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="lgd-inner">
        <nav className="lgd-tabs" aria-label={langHi ? 'नीतियाँ' : 'Policies'}>
          {DOCS.map(d => (
            <Link key={d.id} href={d.href} className={`lgd-tab${d.id === current ? ' on' : ''}`} aria-current={d.id === current ? 'page' : undefined}>{langHi ? d.labelHi : d.label}</Link>
          ))}
        </nav>
        <h1 className="lgd-title">{langHi ? titleHi : title}</h1>
        <p className="lgd-meta">{langHi ? updatedHi : updated}</p>
        {langHi ? (
          <article className="lgd-body" lang="hi">
            <p className="lgd-note">यह हिंदी अनुवाद सुविधा के लिए है। किसी भी अंतर या विवाद की स्थिति में अंग्रेज़ी संस्करण मान्य होगा।</p>
            {hi}
          </article>
        ) : (
          <article className="lgd-body">{children}</article>
        )}
      </div>
    </main>
  );
}

const CSS = `
.lgd { background: var(--bg); min-height: 70vh; padding: clamp(28px, 5vh, 56px) var(--space-4) clamp(48px, 9vh, 96px); }
.lgd-inner { max-width: 760px; margin: 0 auto; }
.lgd-tabs { display: inline-flex; gap: 4px; margin-bottom: var(--space-6); padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.lgd-tab { padding: 7px 16px; border-radius: var(--radius-full); color: var(--text2); font-size: 0.9rem; font-weight: 700; text-decoration: none; transition: background 0.18s, color 0.18s; }
.lgd-tab:hover { color: var(--text); }
.lgd-tab.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.lgd-title { margin: 0 0 var(--space-2); font-size: clamp(2rem, 4.4vw, 2.8rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
.lgd-meta { margin: 0 0 var(--space-6); padding-bottom: var(--space-5); border-bottom: 1px solid var(--border); font-size: 0.9rem; color: var(--text3); }
.lgd-body { font-size: 1rem; line-height: 1.75; color: var(--text2); }
.lgd-body h2 { margin: var(--space-8) 0 var(--space-3); font-size: 1.2rem; font-weight: 800; letter-spacing: -0.01em; color: var(--text); }
.lgd-body h3 { margin: var(--space-5) 0 var(--space-2); font-size: 1rem; font-weight: 700; color: var(--text); }
.lgd-body p { margin: 0 0 var(--space-4); }
.lgd-body ul { margin: 0 0 var(--space-4); padding-left: 1.3rem; list-style: disc; }
.lgd-body li { margin-bottom: 6px; }
.lgd-body li::marker { color: var(--text3); }
.lgd-body strong { color: var(--text); font-weight: 700; }
.lgd-body a { color: var(--accent-text); text-decoration: underline; text-underline-offset: 3px; }
.lgd-body .lgd-note { margin: 0 0 var(--space-6); padding: var(--space-3) var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--ds-soft); font-size: 0.92rem; line-height: 1.6; color: var(--text2); }
@media (max-width: 640px) { .lgd-body { font-size: 0.96rem; } }
`;
