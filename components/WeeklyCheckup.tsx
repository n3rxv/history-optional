'use client';
import { useState, useEffect } from 'react';

const FEATURES = [
  'AI Answer Evaluation',
  'Handwriting Transcription',
  'AI Chat Assistant',
  'Notes & Historiography',
  'PYQs & Timeline',
];

export default function WeeklyCheckup() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'ask'|'issues'|'done'>('ask');
  const [selected, setSelected] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const last = localStorage.getItem('weekly_checkup_last');
    const dismissed = localStorage.getItem('weekly_checkup_dismissed');
    const now = Date.now();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    if (!last || now - parseInt(last) > ONE_WEEK) {
      if (!dismissed || now - parseInt(dismissed) > ONE_WEEK) {
        const timer = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('weekly_checkup_dismissed', Date.now().toString());
    setVisible(false);
  };

  const allGood = async () => {
    localStorage.setItem('weekly_checkup_last', Date.now().toString());
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'weekly_checkup', message: 'All features working fine.', name: 'User', email: 'checkup@system' }),
    });
    setStep('done');
    setTimeout(() => setVisible(false), 2000);
  };

  const submitIssues = async () => {
    setSubmitting(true);
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'weekly_checkup',
        name: 'User',
        email: 'checkup@system',
        message: `Issues reported:\nFeatures: ${selected.join(', ')}\nDetails: ${details}`,
      }),
    });
    localStorage.setItem('weekly_checkup_last', Date.now().toString());
    setSubmitting(false);
    setStep('done');
    setTimeout(() => setVisible(false), 2000);
  };

  const toggle = (f: string) => setSelected(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  if (!visible) return null;

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
    }}>
      <div style={{
        background:'#111', border:'1px solid #222', borderRadius:12, padding:'32px',
        maxWidth:480, width:'100%', position:'relative',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#3b82f6', boxShadow:'0 0 8px #3b82f6' }} />
          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.2em', color:'#3b82f6', textTransform:'uppercase' }}>Weekly Web-Checkup</span>
        </div>

        {step === 'ask' && (<>
          <p style={{ fontSize:'1rem', color:'#e2e8f0', fontFamily:'var(--font-body)', lineHeight:1.7, marginBottom:28 }}>
            Is everything working fine for you this week?
          </p>
          <div style={{ display:'flex', gap:12 }}>
            <button onClick={allGood} style={{
              flex:1, padding:'12px', borderRadius:8, border:'1px solid rgba(74,222,128,0.3)',
              background:'rgba(74,222,128,0.08)', color:'#4ade80', cursor:'pointer',
              fontFamily:'var(--font-mono)', fontSize:'0.65rem', letterSpacing:'0.1em',
            }}>Yes, all good ✓</button>
            <button onClick={() => setStep('issues')} style={{
              flex:1, padding:'12px', borderRadius:8, border:'1px solid rgba(248,113,113,0.3)',
              background:'rgba(248,113,113,0.08)', color:'#f87171', cursor:'pointer',
              fontFamily:'var(--font-mono)', fontSize:'0.65rem', letterSpacing:'0.1em',
            }}>Something's off</button>
          </div>
          <button onClick={dismiss} style={{
            marginTop:16, width:'100%', padding:'8px', background:'none', border:'none',
            color:'#444', cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:'0.55rem',
            letterSpacing:'0.1em',
          }}>remind me later</button>
        </>)}

        {step === 'issues' && (<>
          <p style={{ fontSize:'0.88rem', color:'#aaa', fontFamily:'var(--font-body)', marginBottom:16 }}>
            Which features have issues?
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
            {FEATURES.map(f => (
              <button key={f} onClick={() => toggle(f)} style={{
                padding:'10px 14px', borderRadius:6, cursor:'pointer', textAlign:'left',
                fontFamily:'var(--font-body)', fontSize:'0.88rem',
                border: selected.includes(f) ? '1px solid rgba(59,130,246,0.5)' : '1px solid #222',
                background: selected.includes(f) ? 'rgba(59,130,246,0.08)' : 'transparent',
                color: selected.includes(f) ? '#93c5fd' : '#888',
              }}>{f}</button>
            ))}
          </div>
          <textarea
            placeholder="Describe the issue (optional)..."
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={3}
            style={{
              width:'100%', background:'#161616', border:'1px solid #333', borderRadius:6,
              color:'#e2e8f0', padding:'12px', fontFamily:'var(--font-body)', fontSize:'0.88rem',
              lineHeight:1.6, resize:'vertical', outline:'none', marginBottom:16,
              boxSizing:'border-box',
            }}
          />
          <button onClick={submitIssues} disabled={submitting || selected.length === 0} style={{
            width:'100%', padding:'12px', borderRadius:8, cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
            border:'1px solid rgba(59,130,246,0.3)', background:'rgba(59,130,246,0.1)',
            color: selected.length === 0 ? '#444' : '#93c5fd',
            fontFamily:'var(--font-mono)', fontSize:'0.65rem', letterSpacing:'0.1em',
          }}>{submitting ? 'Sending...' : 'Submit feedback'}</button>
        </>)}

        {step === 'done' && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:'2rem', marginBottom:12 }}>✓</div>
            <p style={{ color:'#4ade80', fontFamily:'var(--font-mono)', fontSize:'0.7rem', letterSpacing:'0.15em' }}>
              THANKS FOR THE CHECKUP
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
