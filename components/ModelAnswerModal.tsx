'use client';
import { useState, useCallback, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import OwlLoader from '@/components/OwlLoader';
import { toast } from '@/components/ui/Toast';

/**
 * A PYQ's model answer, in a modal: generated on first open, kept in
 * localStorage under `model-answer:<cacheKey>`, with Save PDF and Regenerate.
 * Opened from the PYQ list and from each question's own page.
 */

async function downloadAnswerAsPDF(markdownText: string, questionText?: string) {
  const slug = (questionText ?? markdownText).slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_') || 'response';
  const res = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdownText, questionText }),
  });
  if (!res.ok) throw new Error('PDF generation failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = slug + ' (historyoptional.xyz).pdf';
  a.click();
  URL.revokeObjectURL(url);
}

/** **bold**, *italic* and ***both*** inside a line. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return <>{parts.map((part, j) =>
    /^\*\*\*(.+)\*\*\*$/.test(part) ? <strong key={j}><em>{part.replace(/^\*\*\*|\*\*\*$/g, '')}</em></strong>
      : /^\*\*(.+)\*\*$/.test(part) ? <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
      : /^\*([^*]+)\*$/.test(part) ? <em key={j}>{part.replace(/^\*|\*$/g, '')}</em>
      : part)}</>;
}

/** The answer as written: **Heading** lines, *sub-heading* lines, bullets and paragraphs. */
function AnswerBody({ text }: { text: string }) {
  return (
    <div className="ma-body">
      {text.split('\n').map((raw, i) => {
        const line = raw.trim();
        if (!line) return <div key={i} className="ma-gap" />;
        if (/^\*\*(.+)\*\*$/.test(line)) return <h3 key={i} className="ma-h">{line.replace(/^\*\*|\*\*$/g, '')}</h3>;
        if (/^\*(.+)\*$/.test(line)) return <h4 key={i} className="ma-sub">{line.replace(/^\*|\*$/g, '')}</h4>;
        if (/^[-•]\s+/.test(line)) return <p key={i} className="ma-li"><Inline text={line.replace(/^[-•]\s+/, '')} /></p>;
        return <p key={i} className="ma-p"><Inline text={raw} /></p>;
      })}
    </div>
  );
}

function SavePDFButton({ answer, question }: { answer: string; question: string }) {
  const [saving, setSaving] = useState(false);
  return (
    <button
      type="button"
      className="ds-btn ds-btn-line ds-btn-sm"
      onClick={async () => {
        setSaving(true);
        try { await downloadAnswerAsPDF(answer, question); }
        catch (e) { console.error(e); toast('The PDF could not be made. Try again in a moment.', 'error'); }
        finally { setSaving(false); }
      }}
      disabled={saving}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <polyline points="9 15 12 18 15 15"/>
      </svg>
      {saving ? 'Saving…' : 'Save as PDF'}
    </button>
  );
}

export default function ModelAnswerModal({
  question, marks, cacheKey, onClose,
}: {
  question: string;
  marks: number;
  cacheKey: string;
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState<string | null>(() => {
    try { return localStorage.getItem(`model-answer:${cacheKey}`); } catch { return null; }
  });
  const [loading, setLoading] = useState(!answer);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (forceRegen = false) => {
    if (!forceRegen && answer) return;
    if (forceRegen) { try { localStorage.removeItem(`model-answer:${cacheKey}`); } catch {} }
    setLoading(true);
    setError(null);

    const currentUser = auth.currentUser;
    const token = currentUser ? await currentUser.getIdToken() : null;

    try {
      const res = await fetch('/api/model-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, marks, token }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to generate. Please try again.');
      } else {
        setAnswer(data.answer);
        try { localStorage.setItem(`model-answer:${cacheKey}`, data.answer); } catch {}
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }, [question, marks, cacheKey, answer]);

  // Written on first open; a saved one is shown as it is.
  useEffect(() => {
    if (!answer) void generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="ds ds-overlay ma-overlay" onClick={onClose}>
      <style dangerouslySetInnerHTML={{ __html: MA_CSS }} />
      <div className="ds-modal ma" role="dialog" aria-modal="true" aria-labelledby="ma-title" onClick={e => e.stopPropagation()}>
        <div className="ds-modal-head">
          <div>
            <h2 id="ma-title">Model answer <span className="ma-marks">{marks} marks</span></h2>
            <p>{question.length > 160 ? question.slice(0, 160) + '…' : question}</p>
          </div>
          <button type="button" className="ds-x" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div className="ma-main">
          {loading && (
            <div className="ma-wait"><OwlLoader size="small" caption="Writing a model answer, which takes about a minute" /></div>
          )}
          {error && (
            <div className="ma-error">
              <p>{error}</p>
              <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={() => generate(true)}>Try again</button>
            </div>
          )}
          {answer && !loading && (
            <>
              <AnswerBody text={answer} />
              <div className="ma-actions">
                <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => { setAnswer(null); generate(true); }}>Write it again</button>
                <SavePDFButton answer={answer} question={question} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const MA_CSS = `
.ma-overlay { z-index: 1002; align-items: flex-start; overflow-y: auto; }
.ma { max-width: 760px; max-height: none; overflow: visible; margin: clamp(8px, 4vh, 48px) 0; }
.ma-marks { display: inline-flex; vertical-align: 3px; margin-left: 6px; padding: 2px 10px; border-radius: var(--radius-full); background: var(--accent-dim); color: var(--accent-text); font-size: 0.78rem; font-weight: 700; letter-spacing: 0; }
.ma-main { border-top: 1px solid var(--border); padding-top: var(--space-5); }
.ma-wait { display: flex; justify-content: center; padding: var(--space-10) 0; }
.ma-error { text-align: center; padding: var(--space-8) 0; }
.ma-error p { margin: 0 0 var(--space-4); color: var(--danger-text); }
.ma-body { font-size: 1rem; line-height: 1.75; color: var(--text); }
.ma-gap { height: 0.5rem; }
.ma-h { margin: var(--space-5) 0 var(--space-2); font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; color: var(--text); }
.ma-body > .ma-h:first-child { margin-top: 0; }
.ma-sub { margin: var(--space-4) 0 var(--space-1); font-size: 0.98rem; font-weight: 700; color: var(--text2); }
.ma-p { margin: 0 0 2px; color: var(--text2); }
.ma-li { position: relative; margin: 4px 0; padding-left: 1.2rem; color: var(--text2); }
.ma-li::before { content: ''; position: absolute; left: 4px; top: 0.72em; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.ma-body strong { color: var(--text); }
.ma-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--border); }
@media (max-width: 640px) { .ma { margin: 0; } .ma-body { font-size: 0.96rem; } }
`;
