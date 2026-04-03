'use client';

import { useState } from 'react';

export const COUNTRIES = [
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+1',   flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: '+45',  flag: '🇩🇰', name: 'Denmark' },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43',  flag: '🇦🇹', name: 'Austria' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgium' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+36',  flag: '🇭🇺', name: 'Hungary' },
  { code: '+40',  flag: '🇷🇴', name: 'Romania' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: '+95',  flag: '🇲🇲', name: 'Myanmar' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: '+84',  flag: '🇻🇳', name: 'Vietnam' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+852', flag: '🇭🇰', name: 'Hong Kong' },
  { code: '+886', flag: '🇹🇼', name: 'Taiwan' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
];

export function PhoneModal({
  token,
  onDone,
  onCancel,
}: {
  token: string;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [dialCode, setDialCode] = useState('+91');
  const [phone,    setPhone]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');
  const [open,     setOpen]     = useState(false);
  const [search,   setSearch]   = useState('');

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search)
  );
  const selected = COUNTRIES.find(c => c.code === dialCode) ?? COUNTRIES[0];

  const submit = async () => {
    if (!phone.trim()) { setErr('Please enter your phone number.'); return; }
    const full = dialCode + phone.replace(/\D/g, '');
    setLoading(true); setErr('');
    const res  = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-token': token },
      body: JSON.stringify({ phone: full }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? 'Something went wrong.'); setLoading(false); return; }
    onDone();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          background: '#111', border: '1px solid #2a2a2a', borderRadius: 16,
          padding: '2rem', maxWidth: 400, width: '100%',
          boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 12 }}>
          One-time setup
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: '#f0f0f0', marginBottom: 10 }}>
          Add your phone number
        </div>
        <div style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: 24 }}>
          We need your phone number to complete your profile. We don't call or send any messages.
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            {/* Country selector */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setOpen(o => !o)}
                style={{
                  height: '100%', minHeight: 50, padding: '0 12px',
                  background: '#161616', border: `1.5px solid ${err ? '#f87171' : open ? '#3b82f6' : '#2a2a2a'}`,
                  borderRadius: 8, color: '#f0f0f0', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
                  whiteSpace: 'nowrap', transition: 'border-color 0.2s',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{selected.flag}</span>
                <span style={{ color: '#aaa' }}>{selected.code}</span>
                <span style={{ color: '#555', fontSize: '0.65rem', marginLeft: 2 }}>▾</span>
              </button>

              {open && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                  width: 260, maxHeight: 260, overflowY: 'auto',
                  background: '#161616', border: '1.5px solid #2a2a2a',
                  borderRadius: 10, zIndex: 10,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #222', position: 'sticky', top: 0, background: '#161616' }}>
                    <input
                      autoFocus
                      placeholder="Search country…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      style={{
                        width: '100%', padding: '7px 10px',
                        background: '#1a1a1a', border: '1px solid #2a2a2a',
                        borderRadius: 6, color: '#f0f0f0',
                        fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                        outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  {filtered.map(c => (
                    <div
                      key={c.code}
                      onClick={() => { setDialCode(c.code); setOpen(false); setSearch(''); }}
                      style={{
                        padding: '9px 14px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: c.code === dialCode ? 'rgba(59,130,246,0.1)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = c.code === dialCode ? 'rgba(59,130,246,0.1)' : 'transparent')}
                    >
                      <span style={{ fontSize: '1rem' }}>{c.flag}</span>
                      <span style={{ color: '#ccc', fontSize: '0.82rem', fontFamily: 'var(--font-ui)', flex: 1 }}>{c.name}</span>
                      <span style={{ color: '#555', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{c.code}</span>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div style={{ padding: '14px', color: '#555', fontSize: '0.8rem', textAlign: 'center', fontFamily: 'var(--font-ui)' }}>No results</div>
                  )}
                </div>
              )}
            </div>

            {/* Number input */}
            <input
              type="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{
                flex: 1, padding: '13px 16px',
                background: '#161616', border: `1.5px solid ${err ? '#f87171' : '#2a2a2a'}`,
                borderRadius: 8, color: '#f0f0f0',
                fontFamily: 'var(--font-mono)', fontSize: '1rem',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          {err && <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: 8, fontFamily: 'var(--font-ui)' }}>{err}</div>}
        </div>

        <button
          disabled={loading}
          onClick={submit}
          style={{
            width: '100%', padding: '13px', borderRadius: 8, border: 'none',
            background: loading ? '#1e3a8a' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
          }}
        >
          {loading ? 'Saving…' : 'Save & Continue →'}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              width: '100%', marginTop: 10, padding: '10px',
              background: 'transparent', border: '1px solid #222',
              borderRadius: 8, color: '#555', cursor: 'pointer', fontSize: '0.82rem',
            }}
          >
            Cancel
          </button>
        )}

        <div style={{ textAlign: 'center', marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#444', letterSpacing: '0.1em' }}>
          Your number is stored securely and never shared
        </div>
      </div>
    </div>
  );
}
