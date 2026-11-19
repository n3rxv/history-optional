'use client';
import { useId, useState, type CSSProperties } from 'react';
import { useLang } from '@/lib/i18n/LangContext';
import { TESTIMONIALS, type Testimonial } from '@/lib/testimonials';

/**
 * The home page's quotes from readers. Each card takes its three colours from
 * the testimonial, for a gradient border, a glow, the title and the avatar.
 * On a phone a long quote is cut to a few lines with a button to read the
 * rest; on a wider screen it is shown in full and the button is hidden. The
 * CSS is in the home page's HOME_CSS.
 */

/** Past this many words a quote is cut on a phone. */
const LONG = 90;
const words = (t: Testimonial) => t.text.join(' ').split(/\s+/).length;
const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

function Quote({ t }: { t: Testimonial }) {
  const { langHi } = useLang();
  const [open, setOpen] = useState(false);
  const grad = useId();
  const long = words(t) > LONG;
  const [c1, c2, c3] = t.colors;
  return (
    <li className="ts" style={{ '--c1': c1, '--c2': c2, '--c3': c3 } as CSSProperties}>
      <figure className="ts-fig">
        <svg className="ts-mark" viewBox="0 0 34 26" aria-hidden="true">
          <defs>
            <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: c1 }} />
              <stop offset="1" style={{ stopColor: c3 }} />
            </linearGradient>
          </defs>
          <path fill={`url(#${grad})`} d="M0 26V15.6C0 6.9 4.6 1.7 13.2 0l1.5 3.6C10 5 7.6 7.7 7.3 11.9h6.3V26H0Zm19.3 0V15.6C19.3 6.9 23.9 1.7 32.5 0L34 3.6c-4.7 1.4-7.1 4.1-7.4 8.3h6.3V26H19.3Z" />
        </svg>
        {t.tag && <span className="ts-tag">{langHi && t.tagHi ? t.tagHi : t.tag}</span>}
        <p className="ts-title" lang="en">{t.title}</p>
        <blockquote lang="en" className={`ts-quote${long && !open ? ' cut' : ''}`}>
          {t.text.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
        </blockquote>
        {long && (
          <button type="button" className="ts-more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? (langHi ? 'कम दिखाएँ' : 'Show less') : (langHi ? 'पूरा पढ़ें' : 'Read all')}
          </button>
        )}
        <figcaption className="ts-by">
          <span className="ts-av" aria-hidden="true">{initials(t.name)}</span>
          <span className="ts-who">
            <span className="ts-name">{t.name}</span>
            {t.role && <span className="ts-role">{langHi && t.roleHi ? t.roleHi : t.role}</span>}
          </span>
        </figcaption>
      </figure>
    </li>
  );
}

export default function Testimonials() {
  return (
    <ul className="ts-list">
      {TESTIMONIALS.map((t) => <Quote key={t.name} t={t} />)}
    </ul>
  );
}
