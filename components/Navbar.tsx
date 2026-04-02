'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeCustomizer from './ThemeCustomizer';

const links = [
  { href: '/',          label: 'Home' },
  { href: '/paper1',    label: 'Paper I' },
  { href: '/paper2',    label: 'Paper II' },
  { href: '/pyqs',      label: 'PYQs' },
  { href: '/timeline',  label: 'Timeline' },
  { href: '/chat',      label: 'AI Chat' },
  { href: '/pad',       label: 'Pad' },
  { href: '/evaluate',  label: 'Evaluate' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #1f1f1f',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem', fontWeight: 700,
            color: '#ffffff', letterSpacing: '-0.01em',
          }}>
            History <span style={{ color: 'var(--accent)' }}>Optional</span>
          </span>
          <span style={{
            fontSize: '0.6rem',
            background: 'rgba(59,130,246,0.1)',
            color: 'var(--accent)',
            border: '1px solid rgba(59,130,246,0.3)',
            padding: '1px 6px', borderRadius: 3,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
          }}>UPSC</span>
        </Link>

        <div style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }} className="desktop-nav">
          {links.map(l => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} style={{
                padding: '0.4rem 0.9rem',
                borderRadius: 5,
                fontSize: '0.85rem',
                fontFamily: 'var(--font-ui)',
                textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text2)',
                background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                border: active ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) (e.target as HTMLElement).style.color = '#ffffff'; }}
              onMouseLeave={e => { if (!active) (e.target as HTMLElement).style.color = 'var(--text2)'; }}
              >
                {l.label}
              </Link>
            );
          })}
          <ThemeCustomizer />
        </div>

        <button onClick={() => setOpen(!open)} style={{
          display: 'none', background: 'none', border: 'none',
          color: 'var(--text)', cursor: 'pointer', fontSize: '1.4rem',
        }} className="mobile-menu-btn">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '0.75rem 1.5rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
          background: 'var(--bg)',
        }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
              padding: '0.65rem 0.75rem', borderRadius: 5,
              fontSize: '0.9rem', textDecoration: 'none',
              color: pathname === l.href ? 'var(--accent)' : 'var(--text2)',
            }}>{l.label}</Link>
          ))}
          <div style={{ marginTop: '0.5rem' }}>
            <ThemeCustomizer />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
