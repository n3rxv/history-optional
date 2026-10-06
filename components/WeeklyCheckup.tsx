'use client';
import { useState, useEffect, useRef } from 'react';

const FEATURES = [
  'Answer checking',
  'Reading my handwriting',
  'AI chat',
  'Notes and historiography',
  'PYQs and timeline',
  'Flashcards',
  'Prelims practice',
  'Map quiz',
  'Map answer checking',
];
const MIN_WORDS = 10;

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
  const words = details.trim().split(/\s+/).filter(Boolean).length;
  const canSend = selected.length > 0 && words >= MIN_WORDS && !submitting;

  return (
    <div className="ds ds-overlay wc-overlay">
      <style dangerouslySetInnerHTML={{ __html: WC_CSS }} />
      <div className="ds-modal wc" role="dialog" aria-modal="true" aria-labelledby="wc-title">
        {step === 'ask' && (<>
          <div className="ds-modal-head">
            <div>
              <h2 id="wc-title">Is everything working for you?</h2>
              <p>We ask once a week. It helps us catch problems before they spread.</p>
            </div>
            <button type="button" className="ds-x" onClick={dismiss} aria-label="Ask me later">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="wc-actions">
            <button type="button" className="ds-btn ds-btn-solid" onClick={allGood}>Yes, all good</button>
            <button type="button" className="ds-btn ds-btn-line" onClick={() => setStep('issues')}>Something’s not right</button>
          </div>
          <button type="button" className="wc-later" onClick={dismiss}>Ask me later</button>
        </>)}

        {step === 'issues' && (<>
          <div className="ds-modal-head">
            <div>
              <h2 id="wc-title">What’s not working?</h2>
              <p>Pick the parts that gave you trouble, then tell us what happened.</p>
            </div>
          </div>
          <div className="wc-features" role="group" aria-label="Parts of the site">
            {FEATURES.map(f => (
              <button key={f} type="button" aria-pressed={selected.includes(f)} className={`wc-feature${selected.includes(f) ? ' on' : ''}`} onClick={() => toggle(f)}>{f}</button>
            ))}
          </div>
          <label className="wc-label" htmlFor="wc-details">What happened?</label>
          <textarea id="wc-details" className="wc-text" placeholder="A few lines on what you saw and where." value={details} onChange={e => setDetails(e.target.value)} rows={4} />
          <div className={`wc-count${words >= MIN_WORDS ? ' ok' : ''}`}>{words >= MIN_WORDS ? 'That’s enough to go on' : `${MIN_WORDS - words} more ${MIN_WORDS - words === 1 ? 'word' : 'words'} at least`}</div>
          <div className="wc-actions">
            <button type="button" className="ds-btn ds-btn-ghost" onClick={() => { setStep('ask'); setSelected([]); setDetails(''); }}>Back</button>
            <button type="button" className="ds-btn ds-btn-solid" onClick={submitIssues} disabled={!canSend}>{submitting ? 'Sending…' : 'Send'}</button>
          </div>
        </>)}

        {step === 'done' && (
          <div className="wc-done">
            <span className="wc-mark" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <h2 id="wc-title">Thanks, that helps</h2>
          </div>
        )}
      </div>
    </div>
  );
}

const WC_CSS = `
.wc-overlay { z-index: 9999; }
.wc { max-width: 460px; }
.wc-actions { display: flex; gap: var(--space-2); }
.wc-actions .ds-btn { flex: 1; justify-content: center; }
.wc-actions .ds-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.wc-later { display: block; margin: var(--space-3) auto 0; padding: 6px 4px; background: none; border: none; color: var(--text2); font: inherit; font-size: 0.88rem; cursor: pointer; }
.wc-later:hover { color: var(--accent-text); }
.wc-features { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
.wc-feature { padding: 7px 14px; border: 1.5px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font: inherit; font-size: 0.88rem; font-weight: 600; cursor: pointer; }
.wc-feature:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.wc-feature.on { border-color: var(--accent); background: var(--accent-dim); color: var(--accent-text); }
.wc-label { display: block; margin-bottom: 6px; font-size: 0.9rem; font-weight: 700; }
.wc-text { width: 100%; box-sizing: border-box; padding: var(--space-3); border: 1.5px solid var(--border2); border-radius: var(--radius-lg); background: var(--ds-card); color: var(--text); font: inherit; font-size: 0.95rem; line-height: 1.55; resize: vertical; outline: none; }
.wc-text:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); box-shadow: 0 0 0 3px var(--accent-glow); }
.wc-count { margin: 6px 0 var(--space-4); font-size: 0.82rem; color: var(--text3); text-align: right; }
.wc-count.ok { color: var(--success-text); }
.wc-done { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-4) 0; text-align: center; }
.wc-done h2 { margin: 0; font-size: 1.2rem; font-weight: 800; }
.wc-mark { width: 52px; height: 52px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--success-wash); color: var(--success-text); }
`;
