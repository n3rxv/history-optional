'use client';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Per-route watermark config
const WATERMARKS: Record<string, { text: string; sub?: string }> = {
  '/':              { text: 'MMXXV',      sub: 'History Optional' },
  '/paper1':        { text: '',           sub: '' },
  '/paper2':        { text: '',           sub: '' },
  '/notes':         { text: 'Taxila',     sub: 'Knowledge Centre' },
  '/pyqs':          { text: 'MCMLXXIX',   sub: 'Past Year Questions' },
  '/chat':          { text: 'Nalanda',    sub: 'AI Assistant' },
  '/evaluate':      { text: 'Pataliputra',sub: 'Answer Evaluation' },
  '/resources':     { text: 'MMXXVI',     sub: 'Reading List' },
  '/mapping':       { text: 'Hampi',      sub: 'Map Practice' },
  '/prelims':       { text: 'MDCCCLVII',  sub: 'Prelims Practice' },
  '/flashcards':    { text: 'Mohenjo',    sub: 'Flashcards' },
  '/historiography':{ text: 'Kashi',      sub: 'Historiography' },
  '/timeline':      { text: 'MCCVI',      sub: 'Historical Timeline' },
  '/dashboard':     { text: 'Dilli',      sub: 'Your Dashboard' },
  '/admin':         { text: 'MCCVI',      sub: 'Admin' },
};

function getWatermark(pathname: string) {
  // exact match first
  if (WATERMARKS[pathname]) return WATERMARKS[pathname];
  // prefix match (e.g. /notes/ancient-india → notes)
  for (const key of Object.keys(WATERMARKS)) {
    if (key !== '/' && pathname.startsWith(key)) return WATERMARKS[key];
  }
  return { text: 'MMXXV', sub: 'History Optional' };
}

export default function LightBg() {
  const [isLight, setIsLight] = useState(false);
  const pathname = usePathname();
  const wm = getWatermark(pathname);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const check = () => {
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light');
    };
    check();

    // Watch for theme toggle
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { observer.disconnect(); cancelAnimationFrame(rafRef.current); };
  }, []);

  if (!isLight) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: '#fafaf8',
      }}
    >
      {/* Subtle 64px grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          repeating-linear-gradient(0deg,  rgba(0,0,0,0.045) 0, rgba(0,0,0,0.045) 1px, transparent 0, transparent 64px),
          repeating-linear-gradient(90deg, rgba(0,0,0,0.045) 0, rgba(0,0,0,0.045) 1px, transparent 0, transparent 64px)
        `,
        backgroundSize: '64px 64px',
      }} />

      {/* Diagonal accent lines — very faint */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          transparent 0px,
          transparent 120px,
          rgba(0,0,0,0.012) 120px,
          rgba(0,0,0,0.012) 121px
        )`,
      }} />

      {/* Watermark text — bottom right */}
      {wm.text && <div style={{
        position: 'absolute',
        right: '-0.5rem',
        bottom: '12vh',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 'clamp(5rem, 13vw, 10rem)',
        fontWeight: 700,
        color: 'rgba(0,0,0,0.028)',
        letterSpacing: '-0.04em',
        lineHeight: 1,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        textAlign: 'right',
      }}>
        {wm.text}
      </div>}

      {/* Sub label */}
      {wm.sub && (
        <div style={{
          position: 'absolute',
          right: '0.5rem',
          bottom: 'calc(12vh - 1.5rem)',
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(0.7rem, 1.5vw, 1rem)',
          fontWeight: 400,
          color: 'rgba(0,0,0,0.022)',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}>
          {wm.sub}
        </div>
      )}

      {/* Top left accent dot cluster */}
      <div style={{
        position: 'absolute',
        top: '8vh',
        left: '3vw',
        width: 200,
        height: 200,
        backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px)`,
        backgroundSize: '18px 18px',
        opacity: 0.5,
        borderRadius: '50%',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      }} />

      {/* Bottom left accent dot cluster */}
      <div style={{
        position: 'absolute',
        bottom: '6vh',
        left: '5vw',
        width: 140,
        height: 140,
        backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.05) 1.5px, transparent 1.5px)`,
        backgroundSize: '16px 16px',
        opacity: 0.4,
        borderRadius: '50%',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      }} />

      {/* Horizontal rule accent near top */}
      <div style={{
        position: 'absolute',
        top: '22vh',
        left: 0,
        right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.04) 20%, rgba(0,0,0,0.04) 80%, transparent 100%)',
      }} />
    </div>
  );
}
