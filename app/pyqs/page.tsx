'use client';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { pyqs, pyqYears, type PYQ } from '@/lib/pyqData';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { auth } from '@/lib/firebase';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import Script from 'next/script';

const TABS = [
  { label: 'All',      value: 'all' },
  { label: 'Ancient',  value: 'Paper I - Ancient India' },
  { label: 'Medieval', value: 'Paper I - Medieval India' },
  { label: 'Modern',   value: 'Paper II - Modern India' },
  { label: 'World',    value: 'Paper II - World History' },
];


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

function ModelAnswerModal({
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
              <div style={{ display: 'flex', gap: 6 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <span style={{ color: 'var(--text3)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                Generating model answer… (~1 min)
              </span>
              <style>{`
                .shimmer-btn::before{content:"";position:absolute;top:0;left:-75%;width:50%;height:100%;background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,0.13) 50%,transparent 100%);transform:skewX(-20deg);opacity:0;pointer-events:none;z-index:1;}
                .shimmer-btn:hover::before{opacity:1;animation:glass-shine 0.55s ease forwards;}
                @keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
              `}</style>
            </div>
          )}
          {error && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ color: '#f87171', fontSize: '0.88rem', marginBottom: '1rem' }}>{error}</div>
              <button onClick={() => generate(true)} style={{
                background: 'var(--accent)', color: 'var(--text)', border: 'none',
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

export default function PYQsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab]       = useState<string>('all');
  const [filterYear, setFilterYear]     = useState<number | 'all'>('all');
  const [filterMarks, setFilterMarks]   = useState<number | 'all'>('all');
  const [search, setSearch]             = useState('');
  const [modelAnswerQ, setModelAnswerQ] = useState<PYQ | null>(null);
  const [showTopperCopies, setShowTopperCopies] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('topper') === '1') setShowTopperCopies(true);
    }
  }, []);
  const [topperCopies, setTopperCopies] = useState<{ id: string; question: string; drive_file_id: string; note: string | null; pyq_ids: number[] }[]>([]);
  const [topperLoading, setTopperLoading] = useState(false);
  const [topperSearch, setTopperSearch] = useState('');
  const [topperAccess, setTopperAccess] = useState<{ access: boolean; clicks: number; isPremium?: boolean; hasTopperAccess?: boolean } | null>(null);
  const [showTopperPaywall, setShowTopperPaywall] = useState(false);

  // Fetch topper access status on mount
  useEffect(() => {
    const checkAccess = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) { setTopperAccess({ access: false, clicks: 0 }); return; }
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/topper-access', { headers: { 'x-user-token': token } });
      const data = await res.json();
      setTopperAccess(data);
    };
    checkAccess();
  }, []);

  useEffect(() => {
    if (!showTopperCopies || topperCopies.length > 0) return;
    setTopperLoading(true);
    fetch('/api/topper-copies/all')
      .then(r => r.json())
      .then(d => setTopperCopies(d.data || []))
      .catch(() => {})
      .finally(() => setTopperLoading(false));
  }, [showTopperCopies]);

  const { GateModals, usage, slots, showChatLimitModal } = useSubscriptionGate(() => {});
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();

  const handleModelAnswer = (e: React.MouseEvent, q: PYQ) => {
    e.stopPropagation();
    if (!usage.subscribed) { showChatLimitModal(); return; }
    setModelAnswerQ(q);
  };

  const filtered = pyqs.filter((q: PYQ) => {
    if (activeTab !== 'all' && q.section !== activeTab) return false;
    if (filterYear !== 'all' && q.year !== filterYear) return false;
    if (filterMarks !== 'all' && q.marks !== filterMarks) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!q.question.toLowerCase().includes(s) && !q.topic.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const isP1 = (section: string) => section.startsWith('Paper I');
  const markOptions = [10, 15, 20, 25, 30, 60];
  const clearAll = () => { setActiveTab('all'); setFilterYear('all'); setFilterMarks('all'); setSearch(''); };
  const hasFilters = activeTab !== 'all' || filterYear !== 'all' || filterMarks !== 'all' || search;

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '0.5rem 0.75rem',
    color: 'var(--text)', fontSize: '0.875rem', cursor: 'pointer',
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <style>{`
        .shimmer-btn::before{content:"";position:absolute;top:0;left:-75%;width:50%;height:100%;background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,0.13) 50%,transparent 100%);transform:skewX(-20deg);opacity:0;pointer-events:none;z-index:1;}
        .shimmer-btn:hover::before{opacity:1;animation:glass-shine 0.55s ease forwards;}
        @keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
        .pyq-card{cursor:pointer;transition:background 0.15s;}
        .pyq-card:hover{background:var(--bg3)!important;}
      `}</style>

      {/* SEO Topic Links */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          { label: 'Ancient India', href: '/pyqs/ancient-india' },
          { label: 'Early Medieval', href: '/pyqs/early-medieval' },
          { label: 'Medieval India', href: '/pyqs/medieval-india' },
          { label: 'Modern India', href: '/pyqs/modern-india' },
          { label: 'World History', href: '/pyqs/world-history' },
        ].map(({ label, href }) => (
          <a key={href} href={href} style={{
            padding: '0.35rem 0.9rem', borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--bg2)',
            color: 'var(--text2)', fontSize: '0.8rem', textDecoration: 'none',
            fontFamily: 'var(--font-ui)',
          }}>{label} PYQs →</a>
        ))}
      </div>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          History Optional
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
              Previous Year Questions
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
              UPSC Mains 1979–2026 · {pyqs.length} questions · Click any question to view & submit answers
            </p>
          </div>
          <Link href="/test" style={{
            background: 'var(--accent)', color: '#fff',
            padding: '0.55rem 1.25rem', borderRadius: 6,
            fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            flexShrink: 0, marginTop: '0.25rem',
            position: 'relative', overflow: 'hidden',
          }} className="shimmer-btn">Start Test →</Link>
        </div>
      </div>

      {/* Tabs + Topper Copies toggle */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const count = tab.value === 'all' ? pyqs.length : pyqs.filter((q: PYQ) => q.section === tab.value).length;
          const active = activeTab === tab.value;
          return (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)} style={{
              padding: '0.45rem 1rem', borderRadius: 6,
              border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: active ? 'rgba(59,130,246,0.1)' : 'var(--bg2)',
              color: active ? 'var(--accent)' : 'var(--text2)',
              fontFamily: 'var(--font-ui)', fontSize: '0.85rem',
              fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              {tab.label}
              <span style={{
                fontSize: '0.68rem',
                background: active ? 'rgba(59,130,246,0.2)' : 'var(--bg3)',
                color: active ? 'var(--accent)' : 'var(--text3)',
                padding: '1px 6px', borderRadius: 10, fontFamily: 'var(--font-mono)',
              }}>{count}</span>
            </button>
          );
        })}
      </div>
      <button onClick={() => setShowTopperCopies(p => !p)} style={{
        background: showTopperCopies ? 'var(--bg3)' : 'var(--accent)',
        color: showTopperCopies ? 'var(--text2)' : '#fff',
        border: `1px solid ${showTopperCopies ? 'var(--border)' : 'var(--accent)'}`,
        padding: '0.45rem 1rem', borderRadius: 6,
        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.15s',
      }}>{showTopperCopies ? 'Browse PYQs' : 'Browse Topper Copies'}</button>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.25rem',
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          value={showTopperCopies ? topperSearch : search}
          onChange={e => showTopperCopies ? setTopperSearch(e.target.value) : setSearch(e.target.value)}
          placeholder={showTopperCopies ? 'Search topper copies…' : 'Search questions or topics...'}
          style={{
            flex: 1, minWidth: 200, background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '0.5rem 0.85rem',
            color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none',
          }}
        />
        {!showTopperCopies && <>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : +e.target.value)} style={selectStyle}>
          <option value="all">All Years</option>
          {pyqYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMarks} onChange={e => setFilterMarks(e.target.value === 'all' ? 'all' : +e.target.value)} style={selectStyle}>
          <option value="all">All Marks</option>
          {markOptions.map(m => <option key={m} value={m}>{m} marks</option>)}
        </select>
        </>}
        {hasFilters && (
          <button onClick={clearAll} style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text3)', cursor: 'pointer',
            padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.8rem',
          }}>Clear ✕</button>
        )}
      </div>

      {showTopperCopies ? (
        <div style={{ marginTop: '0.5rem' }}>
          {topperLoading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)', fontSize: '0.85rem' }}>
              Loading copies&#8230;
            </div>
          )}
          {!topperLoading && topperCopies.length === 0 && (
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '3rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📚</div>
              <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>No topper copies yet</div>
              <div style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: '0.4rem' }}>Check back soon.</div>
            </div>
          )}
          {!topperLoading && topperCopies.length > 0 && (() => {
            const filtered = topperCopies.filter(c => {
              if (!topperSearch.trim()) return true;
              const s = topperSearch.toLowerCase();
              return c.question.toLowerCase().includes(s) || (c.note?.toLowerCase().includes(s) ?? false);
            });
            return (
              <div>
                <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {filtered.length} of {topperCopies.length} copies
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filtered.map(c => (
                    <div key={c.id} style={{
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '1.1rem 1.4rem',
                      borderLeft: '3px solid rgba(167,139,250,0.5)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: 'var(--text)', fontSize: '0.93rem', lineHeight: 1.6, marginBottom: c.note ? '0.5rem' : '0.75rem' }}>
                            {c.question}
                          </p>
                          {c.note && (
                            <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>
                              &#128221; {c.note}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {c.pyq_ids.map((pid: number) => (
                              <a
                                key={pid}
                                href={`/pyqs/${pid}`}
                                style={{
                                  fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                                  color: 'rgba(167,139,250,0.8)',
                                  background: 'rgba(167,139,250,0.08)',
                                  border: '1px solid rgba(167,139,250,0.2)',
                                  padding: '2px 8px', borderRadius: 3,
                                  textDecoration: 'none', cursor: 'pointer',
                                }}
                              >
                                &#128279; View PYQ &#8599;
                              </a>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const currentUser = auth.currentUser;
                            if (!currentUser) { requireLogin('Login to view topper copies'); return; }
                            // If already confirmed access, navigate directly
                            if (topperAccess?.access) {
                              window.location.href = `/pyqs/topper/${c.id}`;
                              return;
                            }
                            const token = await currentUser.getIdToken();
                            const res = await fetch('/api/topper-click', {
                              method: 'POST',
                              headers: { 'x-user-token': token },
                            });
                            const data = await res.json();
                            if (data.allowed) {
                              setTopperAccess(prev => ({ ...prev!, clicks: data.clicks }));
                              window.location.href = `/pyqs/topper/${c.id}`;
                            } else {
                              setShowTopperPaywall(true);
                            }
                          }}
                          style={{
                            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            background: 'rgba(167,139,250,0.1)',
                            border: '1px solid rgba(167,139,250,0.3)',
                            color: '#a78bfa', borderRadius: 6,
                            padding: '0.45rem 1rem', fontSize: '0.8rem',
                            cursor: 'pointer', fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          View Copy &#8594;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
      <div>
      {/* Count */}
      <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginBottom: '1rem' }}>
        Showing {filtered.length} of {pyqs.length} questions
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {(() => {
          const topicCounts: Record<string, number> = {};
          filtered.forEach((q: PYQ) => { topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1; });
          const seenTopics = new Set<string>();
          return filtered.map((q: PYQ, idx: number) => {
            const isFirst = !seenTopics.has(q.topic);
            if (isFirst) seenTopics.add(q.topic);
            const count = topicCounts[q.topic];
            const badgeColor = count >= 8 ? '#ef4444' : count >= 5 ? '#f97316' : count >= 3 ? '#eab308' : 'var(--text3)';
            const badgeBg    = count >= 8 ? 'rgba(239,68,68,0.08)' : count >= 5 ? 'rgba(249,115,22,0.08)' : count >= 3 ? 'rgba(234,179,8,0.08)' : 'rgba(0,0,0,0.04)';
            const badgeBorder= count >= 8 ? 'rgba(239,68,68,0.3)' : count >= 5 ? 'rgba(249,115,22,0.3)' : count >= 3 ? 'rgba(234,179,8,0.3)' : 'var(--border)';
            return (
              <div key={q.id}>
                {isFirst && count >= 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: `${idx > 0 ? '1.25rem' : '0'} 0 0.5rem` }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <span style={{ fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: badgeColor, background: badgeBg, border: `1px solid ${badgeBorder}`, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      {q.topic} · asked {count}×
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  </div>
                )}
                <div
                  className="pyq-card"
                  onClick={() => { if (requireLogin('Sign in free to view PYQs and AI-generated model answers.')) router.push(`/pyqs/${q.id}`); }}
                  style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '1.25rem 1.5rem',
                    borderLeft: `3px solid ${isP1(q.section) ? 'var(--accent)' : 'var(--blue, #4c8bc9)'}`,
                  }}
                >
                  {/* Badges + year */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: isP1(q.section) ? 'rgba(59,130,246,0.1)' : 'rgba(76,139,201,0.12)',
                        color: isP1(q.section) ? 'var(--accent)' : 'var(--blue, #4c8bc9)',
                        border: `1px solid ${isP1(q.section) ? 'rgba(59,130,246,0.3)' : 'rgba(76,139,201,0.3)'}`,
                        fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                        padding: '2px 8px', borderRadius: 3, letterSpacing: '0.04em',
                      }}>
                        {q.section.replace('Paper I - ', 'P1 · ').replace('Paper II - ', 'P2 · ')}
                      </span>
                      <span style={{
                        background: 'var(--bg3)', color: 'var(--text3)',
                        fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                        padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border)',
                      }}>{q.marks}M</span>
                      {q.source !== 'UPSC' && (
                        <span style={{
                          background: 'rgba(100,180,100,0.1)', color: '#6ab46a',
                          fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                          padding: '2px 8px', borderRadius: 3, border: '1px solid rgba(100,180,100,0.25)',
                        }}>{q.source}</span>
                      )}
                    </div>
                    <span style={{ color: 'var(--text3)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{q.year}</span>
                  </div>

                  {/* Question */}
                  <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '0.75rem' }}>
                    {q.question}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text3)', fontSize: '0.73rem' }}>{q.topic}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={e => handleModelAnswer(e, q)}
                        className="shimmer-btn"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          color: usage.subscribed ? 'var(--accent)' : 'var(--text3)',
                          fontSize: '0.78rem', cursor: 'pointer',
                          background: usage.subscribed ? 'rgba(59,130,246,0.08)' : 'var(--bg3)',
                          border: usage.subscribed ? '1px solid rgba(59,130,246,0.25)' : '1px solid var(--border)',
                          padding: '3px 10px', borderRadius: 4,
                          position: 'relative', overflow: 'hidden',
                        }}
                      >
                        {!usage.subscribed && (
                          <span style={{
                            fontSize: '0.58rem', fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.08em', color: '#f59e0b',
                            background: 'rgba(245,158,11,0.12)',
                            border: '1px solid rgba(245,158,11,0.3)',
                            padding: '1px 5px', borderRadius: 3,
                          }}>PRO</span>
                        )}
                        Model Answer
                      </button>
                      <Link
                        href={`/chat?q=${encodeURIComponent(q.question)}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          color: 'var(--accent)', fontSize: '0.78rem', textDecoration: 'none',
                          background: 'rgba(59,130,246,0.08)',
                          border: '1px solid rgba(59,130,246,0.25)',
                          padding: '3px 10px', borderRadius: 4,
                          position: 'relative', overflow: 'hidden',
                        }}
                        className="shimmer-btn"
                      >Ask AI →</Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          });
        })()}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
            No questions match your filters.
          </div>
        )}
      </div>
      </div>
      )}
      <GateModals slots={slots} />
      {showTopperPaywall && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={() => setShowTopperPaywall(false)}>
          <div style={{
            background: 'var(--bg)',
            border: '1px solid rgba(167,139,250,0.25)',
            borderRadius: 16, padding: '2.5rem 2rem', maxWidth: 420, width: '100%',
            textAlign: 'center',
            boxShadow: '0 0 0 1px rgba(167,139,250,0.1), 0 24px 60px rgba(0,0,0,0.5)',
          }} onClick={e => e.stopPropagation()}>
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', margin: '0 auto 1.25rem',
            }}>📋</div>
            <h3 style={{
              color: 'var(--text)', fontFamily: 'var(--font-display)',
              fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem',
            }}>
              5 free previews used
            </h3>
            <p style={{ color: 'var(--text3)', fontSize: '0.875rem', marginBottom: '0.75rem', lineHeight: 1.65 }}>
              Get unlimited access to all topper copies
            </p>
            <div style={{
              background: 'rgba(167,139,250,0.08)',
              border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: 10, padding: '0.85rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              <span style={{ color: '#a78bfa', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹365</span>
              <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>/year · one-time unlock</span>
            </div>
            <button
              onClick={async () => {
                const currentUser = auth.currentUser;
                if (!currentUser) return;
                if (!(window as any).Razorpay) {
                  alert('Payment SDK not loaded. Please refresh and try again.');
                  return;
                }
                const token = await currentUser.getIdToken();
                const res = await fetch('/api/razorpay/topper-order', {
                  method: 'POST',
                  headers: { 'x-user-token': token },
                });
                const order = await res.json();
                if (!res.ok) {
                  alert('Order creation failed: ' + (order.error || 'Unknown error'));
                  return;
                }
                const rzp = new (window as any).Razorpay({
                  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                  amount: order.amount,
                  currency: order.currency,
                  order_id: order.orderId,
                  name: 'History Optional',
                  description: 'Topper Copies Access — 1 Year',
                  handler: async (response: any) => {
                    const verifyRes = await fetch('/api/razorpay/topper-verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-user-token': token },
                      body: JSON.stringify(response),
                    });
                    const v = await verifyRes.json();
                    if (v.ok) {
                      setTopperAccess({ access: true, clicks: 0, hasTopperAccess: true });
                      setShowTopperPaywall(false);
                    }
                  },
                });
                rzp.open();
              }}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                border: 'none',
                color: '#fff', borderRadius: 10, padding: '0.85rem 2rem',
                fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-mono)', width: '100%',
                boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                transition: 'opacity 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseOut={e => (e.currentTarget.style.opacity = '1')}
            >
              🔓 Unlock for ₹365/year
            </button>
            <button
              onClick={() => setShowTopperPaywall(false)}
              style={{
                marginTop: '0.6rem', background: 'none', border: 'none',
                color: 'var(--text3)', fontSize: '0.78rem', cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />

      {modelAnswerQ && (
        <ModelAnswerModal
          question={modelAnswerQ.question}
          marks={modelAnswerQ.marks}
          cacheKey={String(modelAnswerQ.id)}
          onClose={() => setModelAnswerQ(null)}
        />
      )}
    </div>
    </>
  );
}
