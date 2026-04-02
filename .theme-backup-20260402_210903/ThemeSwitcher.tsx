'use client';

import { useEffect, useState } from 'react';

type Theme = 'amoled' | 'light';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('amoled');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('theme') as Theme) || 'amoled';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'amoled' ? 'light' : 'amoled';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  if (!mounted) return null;

  const isLight = theme === 'light';

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isLight ? 'AMOLED' : 'light'} theme`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '5px 12px 5px 8px',
        cursor: 'pointer',
        color: 'var(--text2)',
        fontSize: '13px',
        fontFamily: 'var(--font-ui)',
        fontWeight: 500,
        transition: 'all 0.18s ease',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      }}
    >
      {/* Track */}
      <span
        style={{
          position: 'relative',
          width: '32px',
          height: '18px',
          borderRadius: '9px',
          background: isLight ? '#d4a843' : '#1a1a1a',
          border: '1px solid var(--border2)',
          display: 'inline-block',
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
      >
        {/* Thumb */}
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: isLight ? '14px' : '2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: isLight ? '#fff' : '#555',
            transition: 'left 0.2s ease, background 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
          }}
        />
      </span>
      {isLight ? '☀ Light' : '◉ AMOLED'}
    </button>
  );
}
