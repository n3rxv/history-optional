'use client';
import { useState, useEffect, useRef } from 'react';

const FEATURES = [
  'AI Answer Evaluation',
  'Handwriting Transcription',
  'AI Chat Assistant',
  'Notes & Historiography',
  'PYQs & Timeline',
  'Flashcards',
  'Prelims Practice',
  'Mapping Quiz',
  'Map Evaluator',
];

export default function WeeklyCheckup() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'ask'|'issues'|'done'>('ask');
  const [selected, setSelected] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  /**
   * Re-entry guard. State cannot do this job on its own: two clicks landing in
   * the same React batch both read the old value and both pass the check, so
   * the flag has to be one a second call sees immediately.
   */
  const sent = useRef(false);

  useEffect(() => {
    const last = localStorage.getItem('weekly_checkup_last');
    const dismissed = localStorage.getItem('weekly_checkup_dismissed');
    const now = Date.now();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    if (!last || now - parseInt(last) > ONE_WEEK) {
      if (!dismissed || now - parseInt(dismissed) > ONE_WEEK) {
        const timer = setTimeout(() => setVisible(true), 15 * 60 * 1000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('weekly_checkup_dismissed', Date.now().toString());
    setVisible(false);
  };

  /**
   * Answering "all good" used to await the POST before changing anything on
   * screen, so for the whole round trip the dialog still asked the question
   * and the button was still live. People tapped again, and a quarter of the
   * rows this ever wrote were duplicates -- 65 of 262 answers arrived two,
   * three or five times, 0.1 to 1.3 seconds apart. The sibling button never
   * duplicated once, because it was disabled while in flight.
   *
   * So: refuse a second call, acknowledge immediately, and send in the
   * background. This is one bit of telemetry, and it is not worth making
   * somebody watch a spinner for.
   */
  const allGood = () => {
    if (sent.current) return;
    sent.current = true;

    localStorage.setItem('weekly_checkup_last', Date.now().toString());
    setStep('done');
    setTimeout(() => setVisible(false), 2000);

    void fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'weekly_checkup', message: 'All features working fine.', name: 'User', email: 'checkup@system' }),
      keepalive: true,
    }).catch(() => {
      // Nothing to tell the reader: they answered, and the answer is a health
      // check. Losing one is cheaper than putting an error in their way.
    });
  };

  const submitIssues = async () => {
    // The disabled attribute already covers this, but it is one render behind
    // a fast second click and the report is worth more than the checkup.
    if (sent.current || submitting) return;
    sent.current = true;
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
        background:'var(--bg3)', border:'1px solid #222', borderRadius:12, padding:'32px',
        maxWidth:480, width:'100%', position:'relative',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 8px var(--accent)' }} />
          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.2em', color:'var(--accent)', textTransform:'uppercase' }}>Weekly Web-Checkup</span>
        </div>

        {step === 'ask' && (<>
          <p style={{ fontSize:'1rem', color:'var(--text)', fontFamily:'var(--font-body)', lineHeight:1.7, marginBottom:28 }}>
            Is everything working fine for you this week?
          </p>
          <div style={{ display:'flex', gap:12 }}>
            <button onClick={allGood} style={{
              flex:1, padding:'12px', borderRadius:8, border:'1px solid color-mix(in srgb, var(--success-text) 30%, transparent)',
              background:'var(--success-wash)', color:'var(--success-text)', cursor:'pointer',
              fontFamily:'var(--font-mono)', fontSize:'0.65rem', letterSpacing:'0.1em',
            }}>Yes, all good ✓</button>
            <button onClick={() => setStep('issues')} style={{
              flex:1, padding:'12px', borderRadius:8, border:'1px solid color-mix(in srgb, var(--danger-text) 30%, transparent)',
              background:'var(--danger-wash)', color:'var(--danger-text)', cursor:'pointer',
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
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <button onClick={() => { setStep('ask'); setSelected([]); setDetails(''); }} style={{
              background:'none', border:'none', color:'#555', cursor:'pointer',
              fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', padding:0,
            }}>← back</button>
            <p style={{ fontSize:'0.88rem', color:'#aaa', fontFamily:'var(--font-body)', margin:0 }}>
              Which features have issues?
            </p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
            {FEATURES.map(f => (
              <button key={f} onClick={() => toggle(f)} style={{
                padding:'10px 14px', borderRadius:6, cursor:'pointer', textAlign:'left',
                fontFamily:'var(--font-body)', fontSize:'0.88rem',
                border: selected.includes(f) ? '1px solid color-mix(in srgb, var(--accent) 50%, transparent)' : '1px solid #222',
                background: selected.includes(f) ? 'var(--accent-dim)' : 'transparent',
                color: selected.includes(f) ? 'var(--accent)' : '#888',
              }}>{f}</button>
            ))}
          </div>
          <textarea
            placeholder="Describe the issue (required, min 10 words)..."
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={3}
            style={{
              width:'100%', background:'var(--bg3)', border:'1px solid #333', borderRadius:6,
              color:'var(--text)', padding:'12px', fontFamily:'var(--font-body)', fontSize:'0.88rem',
              lineHeight:1.6, resize:'vertical', outline:'none', marginBottom:16,
              boxSizing:'border-box',
            }}
          />
          <div style={{ fontSize:'0.65rem', fontFamily:'var(--font-mono)', color: details.trim().split(/\s+/).filter(Boolean).length >= 10 ? 'var(--success-text)' : '#555', marginTop:-10, marginBottom:12, textAlign:'right' }}>
            {details.trim().split(/\s+/).filter(Boolean).length}/10 words minimum
          </div>
          <button onClick={submitIssues} disabled={submitting || selected.length === 0 || details.trim().split(/\s+/).filter(Boolean).length < 10} style={{
            width:'100%', padding:'12px', borderRadius:8, cursor: (selected.length === 0 || details.trim().split(/\s+/).filter(Boolean).length < 10) ? 'not-allowed' : 'pointer',
            border:'1px solid color-mix(in srgb, var(--accent) 30%, transparent)', background:'var(--accent-dim)',
            color: (selected.length === 0 || details.trim().split(/\s+/).filter(Boolean).length < 10) ? '#444' : 'var(--accent)',
            fontFamily:'var(--font-mono)', fontSize:'0.65rem', letterSpacing:'0.1em',
          }}>{submitting ? 'Sending...' : 'Submit feedback'}</button>
        </>)}

        {step === 'done' && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:'2rem', marginBottom:12 }}>✓</div>
            <p style={{ color:'var(--success-text)', fontFamily:'var(--font-mono)', fontSize:'0.7rem', letterSpacing:'0.15em' }}>
              THANKS FOR THE CHECKUP
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
