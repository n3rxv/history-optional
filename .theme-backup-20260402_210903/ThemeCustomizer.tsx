'use client';

import { useEffect, useState, useRef } from 'react';

interface ThemeTokens {
  bg: string;
  bg2: string;
  bg3: string;
  bg4: string;
  text: string;
  text2: string;
  text3: string;
  border: string;
  border2: string;
  accent: string;
  yellow: string;
  green: string;
  red: string;
}

interface Preset {
  name: string;
  emoji: string;
  tokens: ThemeTokens;
}

const PRESETS: Preset[] = [
  {
    name: 'AMOLED',
    emoji: '◉',
    tokens: {
      bg: '#000000', bg2: '#0a0a0a', bg3: '#111111', bg4: '#181818',
      text: '#f0f0f0', text2: '#aaaaaa', text3: '#777777',
      border: '#2a2a2a', border2: '#383838',
      accent: '#3b82f6', yellow: '#eab308', green: '#22c55e', red: '#ef4444',
    },
  },
  {
    name: 'Light',
    emoji: '☀',
    tokens: {
      bg: '#ffffff', bg2: '#f5f5f5', bg3: '#eeeeee', bg4: '#e5e5e5',
      text: '#111111', text2: '#444444', text3: '#777777',
      border: '#dddddd', border2: '#cccccc',
      accent: '#2563eb', yellow: '#b45309', green: '#16a34a', red: '#dc2626',
    },
  },
  {
    name: 'Sepia',
    emoji: '📜',
    tokens: {
      bg: '#f5f0e8', bg2: '#ede8df', bg3: '#e2dbd0', bg4: '#d8d0c4',
      text: '#2c2416', text2: '#5c4e38', text3: '#8c7a60',
      border: '#c8bfaa', border2: '#b8ae98',
      accent: '#9a6f2e', yellow: '#8a5c10', green: '#3a6e3a', red: '#8b2a2a',
    },
  },
  {
    name: 'Slate',
    emoji: '🌫',
    tokens: {
      bg: '#0f172a', bg2: '#1e293b', bg3: '#334155', bg4: '#475569',
      text: '#f1f5f9', text2: '#94a3b8', text3: '#64748b',
      border: '#334155', border2: '#475569',
      accent: '#38bdf8', yellow: '#fbbf24', green: '#4ade80', red: '#f87171',
    },
  },
  {
    name: 'Forest',
    emoji: '🌿',
    tokens: {
      bg: '#0d1f0f', bg2: '#142617', bg3: '#1a2e1c', bg4: '#223824',
      text: '#e8f5e9', text2: '#a5d6a7', text3: '#66bb6a',
      border: '#2e4a30', border2: '#3d6040',
      accent: '#69f0ae', yellow: '#ffee58', green: '#b9f6ca', red: '#ff8a80',
    },
  },
  {
    name: 'Rose',
    emoji: '🌸',
    tokens: {
      bg: '#1a0a0e', bg2: '#24101a', bg3: '#2d1522', bg4: '#3a1b2e',
      text: '#fce4ec', text2: '#f48fb1', text3: '#e91e63',
      border: '#4a1530', border2: '#5c1f3e',
      accent: '#f48fb1', yellow: '#ffcc80', green: '#a5d6a7', red: '#ff8a80',
    },
  },
  {
    name: 'Nord',
    emoji: '❄',
    tokens: {
      bg: '#2e3440', bg2: '#3b4252', bg3: '#434c5e', bg4: '#4c566a',
      text: '#eceff4', text2: '#d8dee9', text3: '#b0bec5',
      border: '#4c566a', border2: '#5e6c7e',
      accent: '#88c0d0', yellow: '#ebcb8b', green: '#a3be8c', red: '#bf616a',
    },
  },
  {
    name: 'Custom',
    emoji: '🎨',
    tokens: {
      bg: '#000000', bg2: '#0a0a0a', bg3: '#111111', bg4: '#181818',
      text: '#f0f0f0', text2: '#aaaaaa', text3: '#777777',
      border: '#2a2a2a', border2: '#383838',
      accent: '#3b82f6', yellow: '#eab308', green: '#22c55e', red: '#ef4444',
    },
  },
];

const TOKEN_LABELS: { key: keyof ThemeTokens; label: string; group: string }[] = [
  { key: 'bg',      label: 'Background',       group: 'Backgrounds' },
  { key: 'bg2',     label: 'Surface',           group: 'Backgrounds' },
  { key: 'bg3',     label: 'Elevated',          group: 'Backgrounds' },
  { key: 'bg4',     label: 'Highest',           group: 'Backgrounds' },
  { key: 'text',    label: 'Primary Text',      group: 'Text' },
  { key: 'text2',   label: 'Secondary Text',    group: 'Text' },
  { key: 'text3',   label: 'Muted Text',        group: 'Text' },
  { key: 'border',  label: 'Border',            group: 'Borders' },
  { key: 'border2', label: 'Border Strong',     group: 'Borders' },
  { key: 'accent',  label: 'Accent / Links',    group: 'Accents' },
  { key: 'yellow',  label: 'Gold / Highlight',  group: 'Accents' },
  { key: 'green',   label: 'Success',           group: 'Accents' },
  { key: 'red',     label: 'Danger',            group: 'Accents' },
];

function applyTheme(tokens: ThemeTokens) {
  const r = document.documentElement.style;
  r.setProperty('--bg',      tokens.bg);
  r.setProperty('--bg2',     tokens.bg2);
  r.setProperty('--bg3',     tokens.bg3);
  r.setProperty('--bg4',     tokens.bg4);
  r.setProperty('--text',    tokens.text);
  r.setProperty('--text2',   tokens.text2);
  r.setProperty('--text3',   tokens.text3);
  r.setProperty('--border',  tokens.border);
  r.setProperty('--border2', tokens.border2);
  r.setProperty('--accent',  tokens.accent);
  r.setProperty('--accent2', tokens.accent);
  r.setProperty('--yellow',  tokens.yellow);
  r.setProperty('--yellow2', tokens.yellow);
  r.setProperty('--yellow-dim', tokens.yellow + '22');
  r.setProperty('--accent-dim',  tokens.accent + '1a');
  r.setProperty('--accent-glow', tokens.accent + '33');
  r.setProperty('--green',   tokens.green);
  r.setProperty('--green-dim', tokens.green + '1a');
  r.setProperty('--red',     tokens.red);
  r.setProperty('--red2',    tokens.red);
  r.setProperty('--red-dim', tokens.red + '1a');
  // Also update note-content strong color to match text
  r.setProperty('--strong-color', tokens.text);
  // Fix navbar hardcoded rgba
  document.documentElement.setAttribute('data-theme', 'custom');
}

function saveTheme(name: string, tokens: ThemeTokens) {
  localStorage.setItem('theme-preset', name);
  localStorage.setItem('theme-tokens', JSON.stringify(tokens));
}

function loadSavedTheme(): { name: string; tokens: ThemeTokens } | null {
  try {
    const name = localStorage.getItem('theme-preset');
    const raw = localStorage.getItem('theme-tokens');
    if (name && raw) return { name, tokens: JSON.parse(raw) };
  } catch {}
  return null;
}

export default function ThemeCustomizer() {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState('AMOLED');
  const [tokens, setTokens] = useState<ThemeTokens>(PRESETS[0].tokens);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = loadSavedTheme();
    if (saved) {
      setActivePreset(saved.name);
      setTokens(saved.tokens);
      applyTheme(saved.tokens);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectPreset = (preset: Preset) => {
    setActivePreset(preset.name);
    setTokens(preset.tokens);
    applyTheme(preset.tokens);
    saveTheme(preset.name, preset.tokens);
  };

  const updateToken = (key: keyof ThemeTokens, value: string) => {
    const next = { ...tokens, [key]: value };
    setTokens(next);
    applyTheme(next);
    setActivePreset('Custom');
    saveTheme('Custom', next);
  };

  const groups = Array.from(new Set(TOKEN_LABELS.map(t => t.group)));

  if (!mounted) return null;

  const currentPreset = PRESETS.find(p => p.name === activePreset) ?? PRESETS[PRESETS.length - 1];

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Customize theme"
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '5px 12px 5px 8px',
          cursor: 'pointer', color: 'var(--text2)',
          fontSize: 13, fontFamily: 'var(--font-ui)',
          fontWeight: 500, transition: 'all 0.18s',
          whiteSpace: 'nowrap', letterSpacing: '0.01em',
        }}
      >
        {/* Color swatch dots */}
        <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {[tokens.accent, tokens.yellow, tokens.green].map((c, i) => (
            <span key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: c, display: 'inline-block',
              border: '1px solid rgba(255,255,255,0.1)',
            }} />
          ))}
        </span>
        <span style={{ fontSize: '0.75rem' }}>{currentPreset.emoji} {activePreset}</span>
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed',
          top: 68, right: 16,
          width: 340,
          maxHeight: 'calc(100vh - 90px)',
          overflowY: 'auto',
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          zIndex: 999,
          padding: '1rem',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>
                Theme Studio
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                Customize every color
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: 'none', border: 'none', color: 'var(--text3)',
              cursor: 'pointer', fontSize: '1rem', padding: 4,
            }}>✕</button>
          </div>

          {/* Presets */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>
              Presets
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => selectPreset(p)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: activePreset === p.name
                      ? '2px solid var(--accent)'
                      : '1px solid var(--border)',
                    background: activePreset === p.name
                      ? 'var(--accent-dim)'
                      : p.tokens.bg,
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4,
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Mini preview */}
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[p.tokens.accent, p.tokens.yellow, p.tokens.green].map((c, i) => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
                    ))}
                  </div>
                  <span style={{
                    fontSize: '0.62rem',
                    fontFamily: 'var(--font-mono)',
                    color: activePreset === p.name ? 'var(--accent)' : p.tokens.text2,
                    whiteSpace: 'nowrap',
                  }}>
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live preview bar */}
          <div style={{
            borderRadius: 8, overflow: 'hidden',
            border: '1px solid var(--border)',
            marginBottom: '1.25rem',
          }}>
            <div style={{ background: tokens.bg, padding: '10px 12px' }}>
              <div style={{ background: tokens.bg2, borderRadius: 6, padding: '8px 10px', border: `1px solid ${tokens.border}` }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: tokens.text, fontWeight: 700, marginBottom: 4 }}>
                  History <span style={{ color: tokens.accent }}>Optional</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: tokens.text2, marginBottom: 6 }}>
                  Preview of your theme
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[tokens.accent, tokens.yellow, tokens.green, tokens.red].map((c, i) => (
                    <span key={i} style={{
                      fontSize: '0.55rem', padding: '2px 6px',
                      borderRadius: 3, background: c + '22',
                      color: c, border: `1px solid ${c}44`,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {['Link', 'Gold', 'OK', 'Alert'][i]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Color pickers grouped */}
          {groups.map(group => (
            <div key={group} style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--text3)', marginBottom: 6,
              }}>
                {group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {TOKEN_LABELS.filter(t => t.group === group).map(({ key, label }) => (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    borderRadius: 6, padding: '6px 10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4,
                        background: tokens[key],
                        border: '1px solid var(--border2)',
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text2)', fontFamily: 'var(--font-ui)' }}>
                        {label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: '0.65rem', color: 'var(--text3)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {tokens[key]}
                      </span>
                      <input
                        type="color"
                        value={tokens[key]}
                        onChange={e => updateToken(key, e.target.value)}
                        style={{
                          width: 28, height: 28,
                          borderRadius: 4, cursor: 'pointer',
                          border: '1px solid var(--border2)',
                          padding: 2, background: 'var(--bg2)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Reset */}
          <button
            onClick={() => selectPreset(PRESETS[0])}
            style={{
              width: '100%', marginTop: 4,
              padding: '9px', borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text3)', cursor: 'pointer',
              fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em', transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            ↩ Reset to AMOLED
          </button>
        </div>
      )}
    </div>
  );
}
