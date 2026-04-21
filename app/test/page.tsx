'use client';
import { useState, useEffect, useRef } from 'react';
import { pyqs } from '@/lib/pyqData';
import { mapData, MapEntry } from '@/lib/mapData';
import dynamic from 'next/dynamic';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'Paper I - Ancient India' | 'Paper I - Medieval India' | 'Paper II - Modern India' | 'Paper II - World History';
type MapType = 'physical' | 'political';
type TestMode = 'sectional' | 'flt_sectional' | 'flt_combined';
type Phase = 'config' | 'test' | 'results';

interface TQ {
  id: number; section: string; topic: string;
  year: number; marks: number; source: string; question: string;
}

interface QGroup {
  qNum: number;
  section: 'A' | 'B';
  parts: TQ[];
}

interface MapQuestion {
  entries: MapEntry[];
  year: number;
  mapType: MapType;
}


// ─── Constants ────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  'Paper I - Ancient India',
  'Paper I - Medieval India',
  'Paper II - Modern India',
  'Paper II - World History',
];

const SECTION_SHORT: Record<string, string> = {
  'Paper I - Ancient India':  'Ancient India',
  'Paper I - Medieval India': 'Medieval India',
  'Paper II - Modern India':  'Modern India',
  'Paper II - World History': 'World History',
};

const SECTION_COLOR: Record<string, string> = {
  'Paper I - Ancient India':   '#f59e0b',
  'Paper I - Medieval India':  '#a78bfa',
  'Paper II - Modern India':   '#34d399',
  'Paper II - World History':  '#60a5fa',
};

const TIME_PER_MARK: Record<number, number> = { 10: 7, 15: 10, 20: 14 };
function minsFor(marks: number) { return TIME_PER_MARK[marks] ?? Math.round(marks * 0.72); }

function rubricOutOf(marks: number) {
  if (marks === 10) return { intro: 1.5, body: 5.5, conc: 1.5, pres: 1.5 };
  if (marks === 15) return { intro: 2,   body: 8,   conc: 2,   pres: 3   };
  return              { intro: 3,   body: 11,  conc: 3,   pres: 3   };
}
function rubricTotal(r: { intro: number; body: number; conc: number; pres: number }) {
  return r.intro + r.body + r.conc + r.pres;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick<T>(arr: T[], n: number): T[] { return shuffle(arr).slice(0, n); }

// ─── Question generation ──────────────────────────────────────────────────────

function buildGroups(pool: TQ[], startQ: number, isFLT: boolean, sec: 'A' | 'B'): QGroup[] {
  const used = new Set<number>();
  function pickU(marks: number, n: number) {
    const c = shuffle(pool.filter(q => q.marks === marks && !used.has(q.id))).slice(0, n);
    c.forEach(q => used.add(q.id));
    return c;
  }
  const groups: QGroup[] = [];
  if (isFLT) {
    const twenties = pickU(20, 6);
    const tens     = pickU(10, 3);
    for (let i = 0; i < 3; i++) {
      const parts = [twenties[i*2], twenties[i*2+1], tens[i]].filter(Boolean) as TQ[];
      if (parts.length) groups.push({ qNum: startQ + i, section: sec, parts });
    }
  } else {
    const twenties = pickU(20, 3);
    const fifteens = pickU(15, 6);
    for (let i = 0; i < 3; i++) {
      const parts = [twenties[i], fifteens[i*2], fifteens[i*2+1]].filter(Boolean) as TQ[];
      if (parts.length) groups.push({ qNum: startQ + i, section: sec, parts });
    }
  }
  return groups;
}

function pickMap(): MapQuestion {
  const years = [...new Set(mapData.map(e => e.year))];
  const yr = years[Math.floor(Math.random() * years.length)];
  return { entries: mapData.filter(e => e.year === yr), year: yr, mapType: Math.random() > 0.5 ? 'political' : 'physical' };
}

function pickShortAnswers(sections: Section[]): TQ[] {
  return pick(pyqs.filter(q => sections.some(s => q.section === s) && q.marks === 10), 5);
}

function isAncient(sections: Section[]) { return sections.some(s => s.includes('Ancient')); }

// ─── Timer ────────────────────────────────────────────────────────────────────

function useTimer(totalSec: number, running: boolean, onEnd: () => void) {
  const [rem, setRem] = useState(totalSec);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => { setRem(totalSec); }, [totalSec]);
  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setRem(p => { if (p <= 1) { clearInterval(ref.current!); onEnd(); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [running]);
  const fmt = (s: number) => {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };
  return { rem, display: fmt(rem) };
}

// ─── Rubric Scorer ────────────────────────────────────────────────────────────

function RubricScorer({ marks, value, onChange }: {
  marks: number;
  value?: { intro: number; body: number; conc: number; pres: number };
  onChange: (r: { intro: number; body: number; conc: number; pres: number }) => void;
}) {
  const out = rubricOutOf(marks);
  const cur = value ?? { intro: 0, body: 0, conc: 0, pres: 0 };
  const total = rubricTotal(cur);
  const pct = Math.round((total / marks) * 100);
  const criteria = [
    { key: 'intro' as const, label: 'Introduction', desc: 'Historiographical framing, named historian', max: out.intro },
    { key: 'body'  as const, label: 'Body',          desc: 'Arguments, evidence, historians cited',     max: out.body  },
    { key: 'conc'  as const, label: 'Conclusion',    desc: 'Synthesis, clear position',                 max: out.conc  },
    { key: 'pres'  as const, label: 'Presentation',  desc: 'Structure, word count, legibility',         max: out.pres  },
  ];
  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '1rem', marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)' }}>Self Evaluation</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700,
          color: pct >= 70 ? '#34d399' : pct >= 50 ? '#f59e0b' : '#f87171' }}>{total.toFixed(1)} / {marks}</span>
      </div>
      {criteria.map(c => (
        <div key={c.key} style={{ marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 500 }}>{c.label}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text3)', marginLeft: '0.4rem' }}>{c.desc}</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>{cur[c.key].toFixed(1)}/{c.max}</span>
          </div>
          <div style={{ position: 'relative', height: 5, background: 'var(--bg4)', borderRadius: 3 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 3,
              width: `${(cur[c.key]/c.max)*100}%`, background: 'var(--accent)', transition: 'width 0.2s' }} />
            <input type="range" min={0} max={c.max} step={0.5} value={cur[c.key]}
              onChange={e => onChange({ ...cur, [c.key]: parseFloat(e.target.value) })}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
          </div>
        </div>
      ))}
      <div style={{ marginTop: '0.6rem', height: 3, background: 'var(--bg4)', borderRadius: 2 }}>
        <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`,
          background: pct >= 70 ? '#34d399' : pct >= 50 ? '#f59e0b' : '#f87171', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// ─── OCR helpers (Tesseract.js via CDN, loaded lazily) ───────────────────────

type OcrStep = 'idle' | 'uploading' | 'ocr' | 'transcript' | 'evaluating' | 'done' | 'error';

async function loadTesseract(): Promise<any> {
  if ((window as any).Tesseract) return (window as any).Tesseract;
  await new Promise<void>((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = () => res();
    s.onerror = rej;
    document.head.appendChild(s);
  });
  return (window as any).Tesseract;
}

async function ocrImages(files: File[], onProgress: (msg: string) => void): Promise<string> {
  const T = await loadTesseract();
  const worker = await T.createWorker('eng', 1, {
    logger: (m: any) => {
      if (m.status === 'recognizing text') {
        onProgress(`Reading page… ${Math.round((m.progress ?? 0) * 100)}%`);
      }
    },
  });
  let full = '';
  for (let i = 0; i < files.length; i++) {
    onProgress(`Reading page ${i + 1} of ${files.length}…`);
    const url = URL.createObjectURL(files[i]);
    const { data } = await worker.recognize(url);
    URL.revokeObjectURL(url);
    full += (i > 0 ? '\n\n--- PAGE BREAK ---\n\n' : '') + data.text;
  }
  await worker.terminate();
  return full.trim();
}

// ─── AI Mentor Panel ──────────────────────────────────────────────────────────

function AIMentorPanel({ question, marks, isPremium, onPaywall }: {
  question: string; marks: number; isPremium: boolean; onPaywall: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep]           = useState<OcrStep>('idle');
  const [ocrMsg, setOcrMsg]       = useState('');
  const [images, setImages]       = useState<File[]>([]);
  const [previews, setPreviews]   = useState<string[]>([]);
  const [transcript, setTranscript] = useState('');
  const [evalData, setEvalData]   = useState<any>(null);
  const [error, setError]         = useState('');
  const [panelOpen, setPanelOpen] = useState(false);

  function handleUploadClick() {
    if (!isPremium) { onPaywall(); return; }
    fileRef.current?.click();
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setImages(arr);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
    setPanelOpen(true);
    setStep('ocr');
    setError('');
    setTranscript('');
    setEvalData(null);
    try {
      const text = await ocrImages(arr, (msg) => { setStep('ocr'); setOcrMsg(msg); });
      setTranscript(text);
      setStep('transcript');
    } catch (e) {
      setError('OCR failed. Please try a clearer image or type your answer manually.');
      setStep('error');
    }
  }

  async function runEval() {
    if (!transcript.trim()) return;
    setStep('evaluating');
    setError('');
    try {
      const fd = new FormData();
      images.forEach(f => fd.append('files', f));
      fd.append('question', question);
      fd.append('marks', String(marks));
      fd.append('extractedText', transcript);
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'x-user-token': session?.access_token ?? '' },
        body: fd,
      });
      const data = await r.json();
      if (!r.ok || data.error) { setError(data.error || 'Evaluation failed.'); setStep('error'); return; }
      setEvalData(data);
      setStep('done');
    } catch { setError('Network error. Please try again.'); setStep('error'); }
  }

  const d = evalData;

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)} />

      {/* Upload button */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleUploadClick} style={{
          display: 'flex', alignItems: 'center', gap: '0.45rem',
          background: isPremium ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.35)', borderRadius: 6,
          padding: '0.45rem 0.9rem', color: '#818cf8',
          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
        }}>
          <span>✦</span>
          <span>AI Mentor{!isPremium ? ' · Premium 🔒' : ''}</span>
        </button>
        {(step === 'done' || step === 'transcript' || step === 'error') && panelOpen && (
          <button onClick={() => setPanelOpen(o => !o)} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 6,
            padding: '0.35rem 0.65rem', color: 'var(--text3)', fontSize: '0.75rem', cursor: 'pointer',
          }}>{panelOpen ? 'Hide ↑' : 'Show ↓'}</button>
        )}
        {step !== 'idle' && step !== 'ocr' && step !== 'evaluating' && (
          <button onClick={() => { setStep('idle'); setImages([]); setPreviews([]); setTranscript(''); setEvalData(null); setError(''); setPanelOpen(false); if (fileRef.current) fileRef.current.value = ''; }} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 6,
            padding: '0.35rem 0.65rem', color: 'var(--text3)', fontSize: '0.75rem', cursor: 'pointer',
          }}>↺ Re-upload</button>
        )}
      </div>

      {/* Panel */}
      {panelOpen && (
        <div style={{ marginTop: '0.85rem', background: 'rgba(99,102,241,0.04)',
          border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '1.25rem' }}>

          {/* OCR in progress */}
          {step === 'ocr' && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
              <div style={{ color: '#818cf8', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Reading your handwriting…</div>
              <div style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>{ocrMsg}</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Evaluating */}
          {step === 'evaluating' && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
              <div style={{ color: '#818cf8', fontSize: '0.85rem', marginBottom: '0.3rem' }}>✦ Evaluating your answer…</div>
              <div style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>Multi-pass AI evaluation · ~30 seconds</div>
            </div>
          )}

          {/* Transcript editor */}
          {step === 'transcript' && (
            <div>
              {/* Image thumbnails */}
              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                  {previews.map((src, i) => (
                    <img key={i} src={src} alt={`Page ${i+1}`} style={{
                      height: 64, width: 'auto', borderRadius: 4, border: '1px solid var(--border)',
                      objectFit: 'cover', cursor: 'pointer',
                    }} onClick={() => window.open(src, '_blank')} />
                  ))}
                </div>
              )}

              <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--text)', fontSize: '0.82rem', fontWeight: 600 }}>OCR Transcript</div>
                  <div style={{ color: 'var(--text3)', fontSize: '0.72rem' }}>Review and fix any errors before evaluating</div>
                </div>
                <span style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)',
                  borderRadius: 4, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 600 }}>✓ OCR Done</span>
              </div>

              <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
                rows={10}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg3)',
                  border: '1px solid var(--border)', borderRadius: 6, padding: '0.65rem 0.8rem',
                  color: 'var(--text)', fontSize: '0.84rem', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit', lineHeight: 1.65 }} />

              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={runEval} style={{
                  background: 'rgba(99,102,241,0.85)', color: '#fff',
                  border: 'none', borderRadius: 6, padding: '0.5rem 1.25rem',
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                }}>✦ Looks good, Evaluate →</button>
              </div>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div>
              <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</div>
              {transcript && (
                <div>
                  <div style={{ color: 'var(--text3)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>You can still edit the transcript and try again:</div>
                  <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={8}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg3)',
                      border: '1px solid var(--border)', borderRadius: 6, padding: '0.6rem 0.75rem',
                      color: 'var(--text)', fontSize: '0.84rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
                  <button onClick={runEval} style={{ marginTop: '0.5rem', background: 'rgba(99,102,241,0.85)', color: '#fff',
                    border: 'none', borderRadius: 6, padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    ✦ Evaluate →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {step === 'done' && d && (
            <div style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
              {/* Score strip */}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem',
                padding: '0.75rem', background: 'var(--bg3)', borderRadius: 6 }}>
                <div>
                  <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Score</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: '#818cf8' }}>
                    {d.marks} <span style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>/ {d.marks_out_of}</span>
                  </div>
                </div>
                {d.section_marks && Object.entries(d.section_marks).map(([k, v]: [string, any]) => (
                  <div key={k}>
                    <div style={{ color: 'var(--text3)', fontSize: '0.65rem', textTransform: 'capitalize' }}>{k}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{v.awarded}/{v.out_of}</div>
                  </div>
                ))}
                {d.word_count && (
                  <div>
                    <div style={{ color: 'var(--text3)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Words</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
                      color: d.word_count_rating === 'GOOD' ? '#34d399' : '#f59e0b' }}>
                      {d.word_count} ({d.word_count_rating})
                    </div>
                  </div>
                )}
              </div>

              {/* Transcript toggle */}
              <details style={{ marginBottom: '0.75rem' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--text3)', fontSize: '0.75rem', userSelect: 'none' }}>View OCR Transcript</summary>
                <div style={{ marginTop: '0.5rem', background: 'var(--bg3)', borderRadius: 6, padding: '0.65rem 0.8rem',
                  fontSize: '0.8rem', color: 'var(--text2)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{transcript}</div>
              </details>

              {d.overall_feedback && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: '#818cf8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Mentor Feedback</div>
                  <p style={{ color: 'var(--text2)', margin: 0 }}>{d.overall_feedback}</p>
                </div>
              )}
              {d.body && (
                <div style={{ marginBottom: '1rem' }}>
                  {d.body.strengths?.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ color: '#34d399', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Strengths</div>
                      {d.body.strengths.map((s: string, i: number) => (
                        <div key={i} style={{ color: 'var(--text2)', paddingLeft: '0.75rem', borderLeft: '2px solid #34d39940', marginBottom: '0.2rem' }}>✓ {s}</div>
                      ))}
                    </div>
                  )}
                  {d.body.weaknesses?.length > 0 && (
                    <div>
                      <div style={{ color: '#f87171', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Areas to Improve</div>
                      {d.body.weaknesses.map((w: string, i: number) => (
                        <div key={i} style={{ color: 'var(--text2)', paddingLeft: '0.75rem', borderLeft: '2px solid #f8717140', marginBottom: '0.2rem' }}>{w}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {d.historians_to_cite?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: '#f59e0b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Historians to Cite</div>
                  {d.historians_to_cite.map((h: any, i: number) => (
                    <div key={i} style={{ padding: '0.4rem 0.6rem', background: 'rgba(245,158,11,0.06)',
                      borderRadius: 4, marginBottom: '0.25rem', borderLeft: '2px solid #f59e0b60' }}>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>{h.name}</span>
                      {h.work && <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}> · {h.work}</span>}
                      <div style={{ color: 'var(--text2)', marginTop: '0.1rem' }}>{h.argument}</div>
                    </div>
                  ))}
                </div>
              )}
              {d.model_answer && (
                <details>
                  <summary style={{ color: '#818cf8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>View Model Answer</summary>
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg3)', borderRadius: 6 }}>
                    {d.model_answer.introduction && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Introduction</div>
                        <p style={{ color: 'var(--text2)', margin: 0 }}>{d.model_answer.introduction}</p>
                      </div>
                    )}
                    {Array.isArray(d.model_answer.body) && d.model_answer.body.map((b: string, i: number) => (
                      <div key={i} style={{ paddingLeft: '0.75rem', borderLeft: '2px solid var(--border)', marginBottom: '0.5rem', color: 'var(--text2)' }}>{b}</div>
                    ))}
                    {d.model_answer.conclusion && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Conclusion</div>
                        <p style={{ color: 'var(--text2)', margin: 0 }}>{d.model_answer.conclusion}</p>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Instructions Header ──────────────────────────────────────────────────────

function InstructionsHeader({ mode, paper, sections, maxMarks, totalMins }: {
  mode: TestMode; paper: 'I' | 'II'; sections: Section[]; maxMarks: number; totalMins: number;
}) {
  const title = mode === 'sectional'
    ? `Sectional Test — ${sections.map(s => SECTION_SHORT[s]).join(' & ')}`
    : mode === 'flt_sectional'
    ? `Full-Length Sectional — ${sections.map(s => SECTION_SHORT[s]).join(' & ')}`
    : `Paper ${paper} — ${paper === 'I' ? 'Ancient India & Medieval India' : 'Modern India & World History'}`;
  const isFLT = mode !== 'sectional';
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const timeStr = hrs > 0 ? `${hrs} Hour${hrs > 1 ? 's' : ''}${mins > 0 ? ` ${mins} Minutes` : ''}` : `${totalMins} Minutes`;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '1.5rem', marginBottom: '2rem', background: 'var(--bg2)' }}>
      <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text3)', marginBottom: '0.3rem' }}>
          History Optional · Practice Test Series
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>{title}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
            <span style={{ color: 'var(--text3)' }}>Time Allowed: </span><strong>{timeStr}</strong>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
            <span style={{ color: 'var(--text3)' }}>Maximum Marks: </span><strong>{maxMarks}</strong>
          </div>
        </div>
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 2 }}>
        {isFLT ? (
          <>
            <div>There are <strong>EIGHT questions</strong> divided in <strong>TWO SECTIONS</strong>.</div>
            <div>Candidate has to attempt <strong>FIVE questions in all.</strong></div>
            <div>Question Nos. <strong>1 and 5 are compulsory</strong> and out of the remaining, <strong>THREE are to be attempted choosing at least ONE question from each Section.</strong></div>
          </>
        ) : (
          <>
            <div>There are <strong>FOUR questions</strong> in this paper.</div>
            <div>Candidate has to attempt <strong>THREE questions in all.</strong></div>
            <div>Question No. <strong>1 is compulsory</strong> and out of the remaining, <strong>TWO are to be attempted.</strong></div>
          </>
        )}
        <div>The number of marks carried by a question/part is indicated against it.</div>
        <div>Word limit in questions, wherever specified, should be adhered to.</div>
        <div style={{ color: 'var(--text3)', fontSize: '0.76rem', marginTop: '0.25rem' }}>
          Attempts of questions shall be counted in sequential order. Unless struck off, attempt of a question shall be counted even if attempted partly. Any page or portion of the page left blank in the Answer Booklet must be clearly struck off.
        </div>
      </div>
    </div>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', margin: '2.5rem 0 1.75rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border)' }} />
      <span style={{ position: 'relative', background: 'var(--bg)', padding: '0 1.25rem',
        fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.15em' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Q1 / Q5 Block ───────────────────────────────────────────────────────────

function Q1Block({ qNum, isMap, mapQ, shortQs, selectedDot, onDotClick,
  mapAnswers, setMapAnswers, mapRevealed, setMapRevealed,
  shortAnswers, setShortAnswers, isResults }: {
  qNum: number; isMap: boolean;
  mapQ: MapQuestion | null; shortQs: TQ[];
  selectedDot: number | null; onDotClick: (n: number) => void;
  mapAnswers: Record<number, string>;
  setMapAnswers: (fn: (p: Record<number, string>) => Record<number, string>) => void;
  mapRevealed: Record<number, boolean>;
  setMapRevealed: (fn: (p: Record<number, boolean>) => Record<number, boolean>) => void;
  shortAnswers: Record<number, string>;
  setShortAnswers: (fn: (p: Record<number, string>) => Record<number, string>) => void;
  isResults: boolean;
}) {
  if (isMap && mapQ) {
    const answered = Object.keys(mapAnswers).length;
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: '1.25rem', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>Q.{qNum}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'rgba(59,130,246,0.1)',
              padding: '1px 6px', borderRadius: 3, border: '1px solid rgba(59,130,246,0.25)' }}>COMPULSORY</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              Map · {mapQ.year} · {mapQ.mapType === 'political' ? 'Political' : 'Physical'}
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text3)' }}>
            {isResults ? `${Object.values(mapRevealed).filter(Boolean).length * 2.5} / 50 Marks` : `${answered}/${mapQ.entries.length} answered · 50 Marks`}
          </span>
        </div>
        <div style={{ padding: '1.25rem' }}>
          <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            Identify the following places marked on the map and write a short note of about <strong>30 words</strong> on each of them in your Answer Booklet.
            Locational hints for each of the places marked on the map are given below seriatim:{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '0.85rem' }}>
              (2.5×{mapQ.entries.length} = {mapQ.entries.length * 2.5} Marks)
            </span>
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', minWidth: 280 }}>
              <LeafletMap entries={mapQ.entries} selectedDot={isResults ? null : selectedDot}
                onDotClick={isResults ? () => {} : onDotClick}
                answered={mapAnswers} revealed={mapRevealed} />
            </div>
            <div style={{ flex: '1 1 240px', minWidth: 220 }}>
              {!isResults && selectedDot !== null && (
                <div style={{ background: 'var(--bg)', border: '1px solid var(--accent)', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Dot #{selectedDot}</div>
                  <div style={{ color: 'var(--text2)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    {mapQ.entries.find(e => e.number === selectedDot)?.hint}
                  </div>
                  <input value={mapAnswers[selectedDot] ?? ''}
                    onChange={e => setMapAnswers(prev => ({ ...prev, [selectedDot]: e.target.value }))}
                    placeholder="Type place name..."
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg3)',
                      border: '1px solid var(--border)', borderRadius: 6, padding: '0.4rem 0.65rem',
                      color: 'var(--text)', fontSize: '0.85rem', outline: 'none' }} />
                </div>
              )}
              {!isResults && selectedDot === null && (
                <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem',
                  color: 'var(--text3)', fontSize: '0.82rem', textAlign: 'center' }}>← Click a dot on the map</div>
              )}
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {mapQ.entries.map(e => (
                  <div key={e.number}>
                    <div onClick={() => !isResults && onDotClick(e.number)} style={{
                      display: 'flex', gap: '0.4rem', alignItems: 'center',
                      padding: '0.3rem 0.45rem', borderRadius: 4, marginBottom: 2,
                      background: !isResults && selectedDot === e.number ? 'rgba(59,130,246,0.1)' : 'transparent',
                      cursor: isResults ? 'default' : 'pointer',
                    }}>
                      <span style={{ minWidth: 19, height: 19, borderRadius: '50%', flexShrink: 0,
                        background: mapRevealed[e.number] ? '#22a85a' : mapAnswers[e.number] ? 'var(--accent)' : 'var(--bg3)',
                        color: (mapRevealed[e.number] || mapAnswers[e.number]) ? '#fff' : 'var(--text3)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.58rem', fontWeight: 700 }}>{e.number}</span>
                      <span style={{ color: 'var(--text2)', fontSize: '0.76rem', flex: 1 }}>
                        ({String.fromCharCode(96 + e.number)}) {e.hint}
                      </span>
                      {isResults && !mapRevealed[e.number] && (
                        <button onClick={() => setMapRevealed(prev => ({ ...prev, [e.number]: true }))}
                          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)',
                            borderRadius: 3, padding: '1px 5px', fontSize: '0.65rem', cursor: 'pointer' }}>Reveal</button>
                      )}
                    </div>
                    {isResults && mapAnswers[e.number] && (
                      <div style={{ fontSize: '0.73rem', color: 'var(--text3)', paddingLeft: 26, marginBottom: 1 }}>
                        Your: <em style={{ color: 'var(--text)' }}>{mapAnswers[e.number]}</em>
                      </div>
                    )}
                    {isResults && mapRevealed[e.number] && (
                      <div style={{ fontSize: '0.73rem', color: '#22a85a', paddingLeft: 26, marginBottom: 3 }}>✓ {e.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Short answers
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: '1.25rem', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>Q.{qNum}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'rgba(59,130,246,0.1)',
            padding: '1px 6px', borderRadius: 3, border: '1px solid rgba(59,130,246,0.25)' }}>COMPULSORY</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text3)' }}>10×5 = 50 Marks</span>
      </div>
      <div style={{ padding: '1.25rem' }}>
        <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
          Answer the following in about <strong>150 words</strong> each:{' '}
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '0.85rem' }}>10×5=50</span>
        </p>
        {shortQs.map((q, i) => {
          const label = String.fromCharCode(97 + i);
          const color = SECTION_COLOR[q.section] ?? 'var(--accent)';
          return (
            <div key={q.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              paddingTop: i > 0 ? '1rem' : 0, marginBottom: i < shortQs.length - 1 ? '1rem' : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.88rem' }}>({label})</span>
                  <span style={{ background: `${color}18`, color, border: `1px solid ${color}40`,
                    fontSize: '0.65rem', fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 3 }}>
                    {SECTION_SHORT[q.section]}
                  </span>
                  <span style={{ color: 'var(--text3)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{q.year}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text3)', whiteSpace: 'nowrap' }}>[10 Marks]</span>
              </div>
              <p style={{ color: 'var(--text)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '0.5rem' }}>{q.question}</p>
              {!isResults && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--bg3)', border: '1px dashed var(--border)', borderRadius: 6,
                  padding: '0.5rem 0.8rem', color: 'var(--text3)', fontSize: '0.78rem' }}>
                  <span>✏️</span><span>~150 words on paper</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Question Group Block (Q2, Q3, Q4 etc.) ──────────────────────────────────

function QGroupBlock({ group, answers, onAnswer, rubrics, onRubric, isResults, isPremium, onPaywall }: {
  group: QGroup;
  answers: Record<number, string>;
  onAnswer: (id: number, v: string) => void;
  rubrics: Record<number, { intro: number; body: number; conc: number; pres: number }>;
  onRubric: (id: number, r: { intro: number; body: number; conc: number; pres: number }) => void;
  isResults: boolean;
  isPremium?: boolean;
  onPaywall?: () => void;
}) {
  const totalM = group.parts.reduce((s, p) => s + p.marks, 0);
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: '1.25rem', overflow: 'hidden' }}>
      {/* Q header */}
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg3)' }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>Q.{group.qNum}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text3)' }}>{totalM} Marks</span>
      </div>

      {/* Sub-parts (a), (b), (c) */}
      {group.parts.map((q, i) => {
        const label = String.fromCharCode(97 + i);
        const color = SECTION_COLOR[q.section] ?? 'var(--accent)';
        return (
          <div key={q.id} style={{
            padding: '1.25rem',
            borderBottom: i < group.parts.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              marginBottom: '0.6rem', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', minWidth: '1.4rem' }}>({label})</span>
                <span style={{ background: `${color}18`, color, border: `1px solid ${color}40`,
                  fontSize: '0.65rem', fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 3 }}>
                  {SECTION_SHORT[q.section]}
                </span>
                <span style={{ color: 'var(--text3)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{q.year}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                [{q.marks} Marks]
              </span>
            </div>

            <p style={{ color: 'var(--text)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>{q.question}</p>

            {!isResults && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--bg3)', border: '1px dashed var(--border)', borderRadius: 6,
                padding: '0.6rem 0.9rem', color: 'var(--text3)', fontSize: '0.8rem' }}>
                <span>✏️</span>
                <span>Write your answer on paper · ~{q.marks === 10 ? '150' : q.marks === 15 ? '200' : '250'} words</span>
              </div>
            )}

            {isResults && (
              <>
                <RubricScorer marks={q.marks} value={rubrics[q.id]} onChange={r => onRubric(q.id, r)} />
                {isPremium !== undefined && onPaywall && (
                  <AIMentorPanel question={q.question} marks={q.marks}
                    isPremium={isPremium} onPaywall={onPaywall} />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TestPage() {
  const [phase,   setPhase]   = useState<Phase>('config');
  const [mode,    setMode]    = useState<TestMode>('sectional');
  const [sections,setSections]= useState<Section[]>([]);
  const [paper,   setPaper]   = useState<'I' | 'II'>('I');

  const [groupsA,   setGroupsA]   = useState<QGroup[]>([]);
  const [groupsB,   setGroupsB]   = useState<QGroup[]>([]);
  const [mapQ1,     setMapQ1]     = useState<MapQuestion | null>(null);
  const [mapQ5,     setMapQ5]     = useState<MapQuestion | null>(null);
  const [shortQ1,   setShortQ1]   = useState<TQ[]>([]);
  const [shortQ5,   setShortQ5]   = useState<TQ[]>([]);
  const [answers,   setAnswers]   = useState<Record<number, string>>({});
  const [rubrics,   setRubrics]   = useState<Record<number, {intro:number;body:number;conc:number;pres:number}>>({});
  const [mapAns1,   setMapAns1]   = useState<Record<number, string>>({});
  const [mapRev1,   setMapRev1]   = useState<Record<number, boolean>>({});
  const [mapAns5,   setMapAns5]   = useState<Record<number, string>>({});
  const [mapRev5,   setMapRev5]   = useState<Record<number, boolean>>({});
  const [dot1,      setDot1]      = useState<number | null>(null);
  const [dot5,      setDot5]      = useState<number | null>(null);
  const [sAns1,     setSAns1]     = useState<Record<number, string>>({});
  const [sAns5,     setSAns5]     = useState<Record<number, string>>({});
  const [timerOn,   setTimerOn]   = useState(false);

  const { usage, GateModals, showChatLimitModal, slots } = useSubscriptionGate(() => {});
  const isPremium = usage?.isPremium ?? false;

  const totalMins = mode === 'sectional' ? 105 : 180;
  const maxMarks  = mode === 'sectional' ? 150 : 250;
  const { rem, display } = useTimer(totalMins * 60, timerOn, handleSubmit);
  const urgency = rem < 300;

  function handleSubmit() { setTimerOn(false); setPhase('results'); }

  function getEffectiveSections(): { secA: Section[]; secB: Section[] } {
    if (mode === 'sectional') return { secA: sections, secB: [] };
    if (mode === 'flt_sectional') return { secA: [sections[0]], secB: sections.length > 1 ? [sections[1]] : [sections[0]] };
    return paper === 'I'
      ? { secA: ['Paper I - Ancient India'], secB: ['Paper I - Medieval India'] }
      : { secA: ['Paper II - Modern India'], secB: ['Paper II - World History'] };
  }

  function startTest() {
    const { secA, secB } = getEffectiveSections();
    const isFLT = mode !== 'sectional';
    const poolA = pyqs.filter(q => secA.some(s => q.section === s));
    const poolB = pyqs.filter(q => secB.some(s => q.section === s));

    setGroupsA(buildGroups(poolA, 2, isFLT, 'A'));
    setGroupsB(isFLT ? buildGroups(poolB, 6, true, 'B') : []);
    setMapQ1(isAncient(secA) ? pickMap() : null);
    setShortQ1(!isAncient(secA) ? pickShortAnswers(secA) : []);
    setMapQ5(isFLT && isAncient(secB) ? pickMap() : null);
    setShortQ5(isFLT && !isAncient(secB) ? pickShortAnswers(secB) : []);
    setAnswers({}); setRubrics({});
    setMapAns1({}); setMapRev1({}); setMapAns5({}); setMapRev5({});
    setDot1(null); setDot5(null); setSAns1({}); setSAns5({});
    setTimerOn(true);
    setPhase('test');
  }

  const isFLT = mode !== 'sectional';
  const { secA: effSecA } = getEffectiveSections();

  // ── CONFIG ──────────────────────────────────────────────────────────────────

  if (phase === 'config') {
    const canStart = mode === 'flt_combined' ? true
      : mode === 'flt_sectional' ? sections.length === 2
      : sections.length > 0;

    return (
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem 6rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>History Optional · Practice</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem', lineHeight: 1.2 }}>Start a Test</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>Questions drawn from the full PYQ bank (1979–2025). Papers follow the exact UPSC format.</p>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Test Format</div>
          {([
            { id: 'sectional',     title: 'Sectional Test',        sub: '105 min · 150 marks · 4 questions', desc: 'Q1 compulsory + attempt 2 of 3 remaining. Deep practice on chosen topics.' },
            { id: 'flt_sectional', title: 'Full-Length Sectional', sub: '3 hours · 250 marks · 8 questions',  desc: 'Q1 & Q5 compulsory + 3 more (min 1 per section). Select 2 topics.' },
            { id: 'flt_combined',  title: 'Full-Length Paper',     sub: '3 hours · 250 marks · Paper I or II', desc: 'Complete paper — Paper I (Ancient+Medieval) or Paper II (Modern+World).' },
          ] as { id: TestMode; title: string; sub: string; desc: string }[]).map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: '1rem', width: '100%',
              padding: '0.85rem 1.1rem', borderRadius: 8, textAlign: 'left',
              border: mode === m.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
              background: mode === m.id ? 'rgba(59,130,246,0.08)' : 'var(--bg2)',
              cursor: 'pointer', marginBottom: '0.5rem', transition: 'all 0.15s',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                border: mode === m.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                background: mode === m.id ? 'var(--accent)' : 'transparent' }} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: mode === m.id ? 600 : 400, color: mode === m.id ? 'var(--text)' : 'var(--text2)' }}>
                  {m.title}<span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 400 }}>{m.sub}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '0.1rem' }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {mode === 'flt_combined' ? (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Select Paper</div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(['I', 'II'] as const).map(p => (
                <button key={p} onClick={() => setPaper(p)} style={{
                  flex: 1, padding: '0.85rem 1rem', borderRadius: 8,
                  border: paper === p ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  background: paper === p ? 'rgba(59,130,246,0.08)' : 'var(--bg2)',
                  color: paper === p ? 'var(--text)' : 'var(--text2)',
                  fontWeight: paper === p ? 600 : 400, cursor: 'pointer', fontSize: '0.88rem', textAlign: 'left' as const,
                }}>
                  <div>Paper {p}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 400, marginTop: 2 }}>
                    {p === 'I' ? 'Ancient India + Medieval India' : 'Modern India + World History'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Select Topics</div>
            <p style={{ color: 'var(--text3)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
              {mode === 'flt_sectional' ? 'Select exactly 2 — first = Section A, second = Section B.' : 'Select one or more topics.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SECTIONS.map(s => {
                const active = sections.includes(s);
                const c = SECTION_COLOR[s];
                const disabled = mode === 'flt_sectional' && sections.length >= 2 && !active;
                return (
                  <button key={s} onClick={() => {
                    if (disabled) return;
                    if (mode === 'flt_sectional') {
                      setSections(prev => active ? prev.filter(x => x !== s) : [...prev, s]);
                    } else {
                      setSections(prev => active ? prev.filter(x => x !== s) : [...prev, s]);
                    }
                  }} style={{
                    padding: '0.45rem 0.9rem', borderRadius: 20,
                    border: active ? `1.5px solid ${c}` : '1px solid var(--border)',
                    background: active ? `${c}18` : 'var(--bg2)',
                    color: active ? c : 'var(--text2)',
                    fontSize: '0.82rem', fontWeight: active ? 600 : 400,
                    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
                  }}>{SECTION_SHORT[s]}</button>
                );
              })}
            </div>
            {mode === 'flt_sectional' && sections.length === 2 && (
              <div style={{ marginTop: '0.65rem', fontSize: '0.75rem', color: 'var(--text3)' }}>
                Section A: <span style={{ color: SECTION_COLOR[sections[0]] }}>{SECTION_SHORT[sections[0]]}</span>
                {' · '}Section B: <span style={{ color: SECTION_COLOR[sections[1]] }}>{SECTION_SHORT[sections[1]]}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1.75rem',
          color: 'var(--text2)', fontSize: '0.8rem', display: 'flex', gap: '0.5rem' }}>
          <span>🗺️</span>
          <span>Ancient India sections include an interactive <strong>Map Question (50M)</strong>. Other sections get 5 short-answer questions (10M each) instead.</span>
        </div>

        <button onClick={startTest} disabled={!canStart} style={{
          background: canStart ? 'var(--accent)' : 'var(--bg3)',
          color: canStart ? '#fff' : 'var(--text3)',
          border: 'none', borderRadius: 8, padding: '0.85rem 2.5rem',
          fontSize: '0.95rem', fontWeight: 600, cursor: canStart ? 'pointer' : 'not-allowed',
        }}>Begin Test →</button>
      </div>
    );
  }

  // ── TEST ─────────────────────────────────────────────────────────────────────

  if (phase === 'test') {
    const progressPct = ((totalMins * 60 - rem) / (totalMins * 60)) * 100;
    const allSections = mode === 'flt_combined'
      ? (paper === 'I' ? ['Paper I - Ancient India', 'Paper I - Medieval India'] : ['Paper II - Modern India', 'Paper II - World History']) as Section[]
      : sections;

    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 6rem' }}>
        {/* Sticky timer bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100,
          background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '0.6rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {mode === 'sectional' ? 'Sectional' : mode === 'flt_sectional' ? 'FLT Sectional' : `Paper ${paper}`}
              </span>
              <span style={{ color: 'var(--text3)', fontSize: '0.72rem' }}>· {maxMarks} Marks</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700,
                color: urgency ? '#f87171' : 'var(--text)' }}>{display}</span>
              <button onClick={handleSubmit} style={{ background: '#e05c2a', color: '#fff', border: 'none',
                borderRadius: 6, padding: '0.4rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Submit</button>
            </div>
          </div>
          <div style={{ height: 2, background: 'var(--border)', marginTop: '0.5rem', borderRadius: 1 }}>
            <div style={{ height: '100%', borderRadius: 1, width: `${progressPct}%`,
              background: urgency ? '#f87171' : 'var(--accent)', transition: 'width 1s linear, background 0.3s' }} />
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <InstructionsHeader mode={mode} paper={paper} sections={allSections} maxMarks={maxMarks} totalMins={totalMins} />
        </div>

        {isFLT && <SectionDivider label="SECTION A" />}

        <Q1Block qNum={1} isMap={!!mapQ1} mapQ={mapQ1} shortQs={shortQ1}
          selectedDot={dot1} onDotClick={setDot1}
          mapAnswers={mapAns1} setMapAnswers={setMapAns1}
          mapRevealed={mapRev1} setMapRevealed={setMapRev1}
          shortAnswers={sAns1} setShortAnswers={setSAns1} isResults={false} />

        {groupsA.map(g => (
          <QGroupBlock key={g.qNum} group={g} answers={answers}
            onAnswer={(id, v) => setAnswers(p => ({ ...p, [id]: v }))}
            rubrics={rubrics} onRubric={() => {}} isResults={false} />
        ))}

        {isFLT && (
          <>
            <SectionDivider label="SECTION B" />
            <Q1Block qNum={5} isMap={!!mapQ5} mapQ={mapQ5} shortQs={shortQ5}
              selectedDot={dot5} onDotClick={setDot5}
              mapAnswers={mapAns5} setMapAnswers={setMapAns5}
              mapRevealed={mapRev5} setMapRevealed={setMapRev5}
              shortAnswers={sAns5} setShortAnswers={setSAns5} isResults={false} />
            {groupsB.map(g => (
              <QGroupBlock key={g.qNum} group={g} answers={answers}
                onAnswer={(id, v) => setAnswers(p => ({ ...p, [id]: v }))}
                rubrics={rubrics} onRubric={() => {}} isResults={false} />
            ))}
          </>
        )}
      </div>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────────

  if (phase === 'results') {
    const mapScore = Object.values(mapRev1).filter(Boolean).length * 2.5
                   + Object.values(mapRev5).filter(Boolean).length * 2.5;
    const writtenScore = [...groupsA, ...groupsB].flatMap(g => g.parts).reduce((s, q) => {
      const r = rubrics[q.id]; return s + (r ? rubricTotal(r) : 0);
    }, 0);
    const totalScore = mapScore + writtenScore;
    const pct = Math.round((totalScore / maxMarks) * 100);
    const allSections = mode === 'flt_combined'
      ? (paper === 'I' ? ['Paper I - Ancient India', 'Paper I - Medieval India'] : ['Paper II - Modern India', 'Paper II - World History']) as Section[]
      : sections;

    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>Test Results</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: '2rem' }}>
          Use the rubric sliders to self-evaluate. Premium users can upload answer images for AI Mentor evaluation.
        </p>

        {/* Score card */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
          padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Self Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{totalScore.toFixed(1)}</span>
              <span style={{ color: 'var(--text3)', fontSize: '0.88rem' }}>/ {maxMarks}</span>
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Time Used</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{Math.floor((totalMins * 60 - rem) / 60)}m</div>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4 }}>
              <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(pct, 100)}%`,
                background: pct >= 60 ? '#34d399' : pct >= 40 ? '#f59e0b' : '#f87171', transition: 'width 1s' }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>{pct}% of total marks</div>
          </div>
        </div>

        {isFLT && <SectionDivider label="SECTION A" />}

        <Q1Block qNum={1} isMap={!!mapQ1} mapQ={mapQ1} shortQs={shortQ1}
          selectedDot={null} onDotClick={() => {}}
          mapAnswers={mapAns1} setMapAnswers={setMapAns1}
          mapRevealed={mapRev1} setMapRevealed={setMapRev1}
          shortAnswers={sAns1} setShortAnswers={setSAns1} isResults={true} />

        {groupsA.map(g => (
          <QGroupBlock key={g.qNum} group={g} answers={answers} onAnswer={() => {}}
            rubrics={rubrics} onRubric={(id, r) => setRubrics(p => ({ ...p, [id]: r }))}
            isResults={true} isPremium={isPremium} onPaywall={showChatLimitModal} />
        ))}

        {isFLT && (
          <>
            <SectionDivider label="SECTION B" />
            <Q1Block qNum={5} isMap={!!mapQ5} mapQ={mapQ5} shortQs={shortQ5}
              selectedDot={null} onDotClick={() => {}}
              mapAnswers={mapAns5} setMapAnswers={setMapAns5}
              mapRevealed={mapRev5} setMapRevealed={setMapRev5}
              shortAnswers={sAns5} setShortAnswers={setSAns5} isResults={true} />
            {groupsB.map(g => (
              <QGroupBlock key={g.qNum} group={g} answers={answers} onAnswer={() => {}}
                rubrics={rubrics} onRubric={(id, r) => setRubrics(p => ({ ...p, [id]: r }))}
                isResults={true} isPremium={isPremium} onPaywall={showChatLimitModal} />
            ))}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setPhase('config')} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '0.85rem 2rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
          }}>Start Another Test</button>
          <button onClick={() => window.location.href = '/pyqs'} style={{
            background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.85rem 2rem', fontSize: '0.95rem', cursor: 'pointer',
          }}>Browse PYQs</button>
        </div>

        <GateModals slots={slots} />
      </div>
    );
  }

  return null;
}
