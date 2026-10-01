'use client';
import { useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import OwlLoader from '@/components/OwlLoader';

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

function AnswerBody({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text)' }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: '0.6rem' }} />;
        if (/^\*\*(.+)\*\*$/.test(line.trim())) {
          const heading = line.trim().replace(/^\*\*|\*\*$/g, '');
          return (
            <div key={i} style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem',
              letterSpacing: '0.05em', color: 'var(--accent)', textTransform: 'uppercase',
              marginTop: '1.2rem', marginBottom: '0.4rem',
            }}>{heading}</div>
          );
        }
        if (/^\*(.+)\*$/.test(line.trim())) {
          const sub = line.trim().replace(/^\*|\*$/g, '');
          return (
            <div key={i} style={{
              fontWeight: 600, fontStyle: 'italic',
              color: 'var(--text2)', marginTop: '0.8rem', marginBottom: '0.2rem',
            }}>{sub}</div>
          );
        }
        if (/^[-•]\s+/.test(line.trim())) {
          const content = line.trim().replace(/^[-•]\s+/, '');
          const parts = content.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);
          return (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', margin: '0.25rem 0 0.25rem 0.5rem' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0, marginTop: '0.1rem' }}>•</span>
              <p style={{ margin: 0 }}>
                {parts.map((part, j) =>
                  /^\*\*\*(.+)\*\*\*$/.test(part)
                    ? <strong key={j}><em>{part.replace(/^\*\*\*|\*\*\*$/g, '')}</em></strong>
                    : /^\*\*(.+)\*\*$/.test(part)
                    ? <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
                    : /^\*([^*]+)\*$/.test(part)
                    ? <em key={j}>{part.replace(/^\*|\*$/g, '')}</em>
                    : part
                )}
              </p>
            </div>
          );
        }
        const parts = line.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
          <p key={i} style={{ margin: '0 0 0.1rem' }}>
            {parts.map((part, j) =>
              /^\*\*\*(.+)\*\*\*$/.test(part)
                ? <strong key={j}><em>{part.replace(/^\*\*\*|\*\*\*$/g, '')}</em></strong>
                : /^\*\*(.+)\*\*$/.test(part)
                ? <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
                : /^\*([^*]+)\*$/.test(part)
                ? <em key={j}>{part.replace(/^\*|\*$/g, '')}</em>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}


function SavePDFButton({ answer, question }: { answer: string; question: string }) {
  const [saving, setSaving] = useState(false);
  return (
    <button
      onClick={async () => {
        setSaving(true);
        try { await downloadAnswerAsPDF(answer, question); }
        catch (e) { console.error(e); alert('PDF generation failed.'); }
        finally { setSaving(false); }
      }}
      disabled={saving}
      style={{
        background: 'none', border: '1px solid var(--accent)',
        color: 'var(--accent)', cursor: saving ? 'wait' : 'pointer',
        padding: '0.4rem 1rem', borderRadius: 6, fontSize: '0.78rem',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        opacity: saving ? 0.6 : 1,
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <polyline points="9 15 12 18 15 15"/>
      </svg>
      {saving ? 'Saving…' : 'Save PDF'}
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

  useState(() => { if (!answer) generate(); });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1002,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '2rem 1rem', overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 12, width: '100%', maxWidth: 720,
          padding: '2rem', position: 'relative',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)', marginBottom: '2rem',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem' }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--accent)', marginBottom: '0.4rem',
            }}>Model Answer · {marks}M</div>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              {question.length > 120 ? question.slice(0, 120) + '…' : question}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text3)', cursor: 'pointer',
            padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', flexShrink: 0,
          }}>✕</button>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 0' }}>
              <OwlLoader size="small" caption="Writing a model answer, which takes about a minute" />
              <style>{`
                .shimmer-btn::before{content:"";position:absolute;top:0;left:-75%;width:50%;height:100%;background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,0.13) 50%,transparent 100%);transform:skewX(-20deg);opacity:0;pointer-events:none;z-index:1;}
                .shimmer-btn:hover::before{opacity:1;animation:glass-shine 0.55s ease forwards;}
                @keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
              `}</style>
            </div>
          )}
          {error && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ color: 'var(--danger-text)', fontSize: '0.88rem', marginBottom: '1rem' }}>{error}</div>
              <button onClick={() => generate(true)} style={{
                background: 'var(--accent)', color: 'var(--on-fill)', border: 'none',
                padding: '0.5rem 1.25rem', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
              }}>Try Again</button>
            </div>
          )}
          {answer && !loading && (
            <>
              <AnswerBody text={answer} />
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <SavePDFButton answer={answer} question={question} />
                <button onClick={() => { setAnswer(null); generate(true); }} style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text3)', cursor: 'pointer',
                  padding: '0.4rem 1rem', borderRadius: 6, fontSize: '0.78rem',
                }}>Regenerate</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
