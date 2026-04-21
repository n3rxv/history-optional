'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { pyqs } from '@/lib/pyqData';
import { mapData, MapEntry } from '@/lib/mapData';
import dynamic from 'next/dynamic';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'Paper I - Ancient India' | 'Paper I - Medieval India' | 'Paper II - Modern India' | 'Paper II - World History';
type MapType = 'physical' | 'political';

// Test mode mirrors real paper types
type TestMode =
  | 'sectional'        // 1 topic, 105 min, 150 marks — 4 Qs (Q1 compulsory + 2 of 3)
  | 'flt_sectional'    // 1 topic full-length, 3hr, 250 marks — 8 Qs, 2 sections
  | 'flt_combined';    // Paper I or II (2 topics), 3hr, 250 marks — 8 Qs, 2 sections

type Phase = 'config' | 'test' | 'results';

interface TestQuestion {
  id: number;
  section: string;
  topic: string;
  year: number;
  marks: number;
  source: string;
  question: string;
  answer: string;
  selfScore: number | null;
  // rubric
  rubric?: { intro: number; body: number; conc: number; pres: number };
}

interface MapQuestion {
  entries: MapEntry[];
  year: number;
  mapType: MapType;
  userAnswers: Record<number, string>;
  revealed: Record<number, boolean>;
}

interface AIMentorResult {
  loading: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  'Paper I - Ancient India',
  'Paper I - Medieval India',
  'Paper II - Modern India',
  'Paper II - World History',
];

const SECTION_SHORT: Record<string, string> = {
  'Paper I - Ancient India': 'Ancient India',
  'Paper I - Medieval India': 'Medieval India',
  'Paper II - Modern India': 'Modern India',
  'Paper II - World History': 'World History',
};

const SECTION_COLOR: Record<string, string> = {
  'Paper I - Ancient India':   '#f59e0b',
  'Paper I - Medieval India':  '#a78bfa',
  'Paper II - Modern India':   '#34d399',
  'Paper II - World History':  '#60a5fa',
};

const TIME_PER_MARK: Record<number, number> = { 10: 7, 15: 10, 20: 14, 60: 40 };
function minutesFor(marks: number): number {
  return TIME_PER_MARK[marks] ?? Math.round(marks * 0.72);
}

// ─── Rubric helpers ───────────────────────────────────────────────────────────

function rubricOutOf(marks: number) {
  if (marks === 10) return { intro: 1.5, body: 5.5, conc: 1.5, pres: 1.5 };
  if (marks === 15) return { intro: 2,   body: 8,   conc: 2,   pres: 3   };
  return              { intro: 3,   body: 11,  conc: 3,   pres: 3   };
}

function rubricTotal(r: { intro: number; body: number; conc: number; pres: number }) {
  return r.intro + r.body + r.conc + r.pres;
}

// ─── Question generation ──────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function makeQ(q: (typeof pyqs)[0]): TestQuestion {
  return { ...q, answer: '', selfScore: null };
}

/**
 * Sectional test: 4 Qs total
 * Q1 = map (50M) OR 5×10M short answers
 * Q2, Q3, Q4 = one 20M + two 15M  (attempt 2 of 3)
 */
function generateSectional(sections: Section[]): TestQuestion[] {
  const pool = pyqs.filter(q => sections.some(s => q.section === s));
  const tens   = pick(pool.filter(q => q.marks === 10), 5); // Q1
  const twens  = pick(pool.filter(q => q.marks === 20 && !tens.find(t => t.id === q.id)), 3);
  const fifths = pick(pool.filter(q => q.marks === 15 && !tens.find(t => t.id === q.id) && !twens.find(t => t.id === q.id)), 6);
  // Q2/Q3/Q4: each has one 20M + two 15M
  const result: TestQuestion[] = [];
  for (let i = 0; i < 3; i++) {
    if (twens[i])    result.push(makeQ(twens[i]));
    if (fifths[i*2]) result.push(makeQ(fifths[i*2]));
    if (fifths[i*2+1]) result.push(makeQ(fifths[i*2+1]));
  }
  return result;
}

/**
 * Full-length sectional/combined: 8 Qs, 2 sections
 * Section A: Q1 (map/short 50M) + Q2/Q3/Q4 (20+20+10 each)
 * Section B: Q5 (map/short 50M) + Q6/Q7/Q8 (20+20+10 each)
 */
function generateFLT(sectionsA: Section[], sectionsB: Section[]): TestQuestion[] {
  const poolA = pyqs.filter(q => sectionsA.some(s => q.section === s));
  const poolB = pyqs.filter(q => sectionsB.some(s => q.section === s));

  function pickSection(pool: typeof pyqs) {
    const twens = pick(pool.filter(q => q.marks === 20), 6);
    const tens  = pick(pool.filter(q => q.marks === 10 && !twens.find(t => t.id === q.id)), 3);
    const result: TestQuestion[] = [];
    // Q2/Q3/Q4: each = 20M + 20M + 10M
    for (let i = 0; i < 3; i++) {
      if (twens[i*2])   result.push(makeQ(twens[i*2]));
      if (twens[i*2+1]) result.push(makeQ(twens[i*2+1]));
      if (tens[i])      result.push(makeQ(tens[i]));
    }
    return result;
  }

  return [...pickSection(poolA), ...pickSection(poolB)];
}

// Short answer questions (Q1/Q5 for Medieval/Modern/World): 5×10M
function generateShortAnswers(sections: Section[]): TestQuestion[] {
  const pool = pyqs.filter(q => sections.some(s => q.section === s) && q.marks === 10);
  return pick(pool, 5).map(makeQ);
}

// ─── Timer ────────────────────────────────────────────────────────────────────

function useTimer(totalSeconds: number, running: boolean, onEnd: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(ref.current!); onEnd(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [running]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  return { remaining, display: fmt(remaining) };
}

// ─── Rubric Self-Score Component ──────────────────────────────────────────────

function RubricScorer({
  marks,
  value,
  onChange,
}: {
  marks: number;
  value: { intro: number; body: number; conc: number; pres: number } | undefined;
  onChange: (r: { intro: number; body: number; conc: number; pres: number }) => void;
}) {
  const out = rubricOutOf(marks);
  const current = value ?? { intro: 0, body: 0, conc: 0, pres: 0 };

  const criteria = [
    { key: 'intro' as const, label: 'Introduction', desc: 'Historiographical framing, named historian', max: out.intro },
    { key: 'body'  as const, label: 'Body',          desc: 'Arguments, evidence, historians cited',     max: out.body  },
    { key: 'conc'  as const, label: 'Conclusion',     desc: 'Synthesis, clear position',                max: out.conc  },
    { key: 'pres'  as const, label: 'Presentation',   desc: 'Structure, word count, legibility',        max: out.pres  },
  ];

  const total = rubricTotal(current);
  const pct = Math.round((total / marks) * 100);

  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '1rem', marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)' }}>Self Evaluation</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700,
          color: pct >= 70 ? '#34d399' : pct >= 50 ? '#f59e0b' : '#f87171',
        }}>{total.toFixed(1)} / {marks}</span>
      </div>

      {criteria.map(c => (
        <div key={c.key} style={{ marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 500 }}>{c.label}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text3)', marginLeft: '0.4rem' }}>{c.desc}</span>
            </div>
            <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>
              {current[c.key].toFixed(1)} / {c.max}
            </span>
          </div>
          <div style={{ position: 'relative', height: 6, background: 'var(--bg4)', borderRadius: 3 }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 3,
              width: `${(current[c.key] / c.max) * 100}%`,
              background: 'var(--accent)',
              transition: 'width 0.2s',
            }} />
            <input
              type="range" min={0} max={c.max} step={0.5}
              value={current[c.key]}
              onChange={e => onChange({ ...current, [c.key]: parseFloat(e.target.value) })}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                opacity: 0, cursor: 'pointer', margin: 0,
              }}
            />
          </div>
        </div>
      ))}

      {/* Overall bar */}
      <div style={{ marginTop: '0.75rem', height: 3, background: 'var(--bg4)', borderRadius: 2 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${pct}%`,
          background: pct >= 70 ? '#34d399' : pct >= 50 ? '#f59e0b' : '#f87171',
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );
}

// ─── AI Mentor Panel ──────────────────────────────────────────────────────────

function AIMentorPanel({
  question,
  marks,
  answer,
  isPremium,
  onPaywall,
}: {
  question: string;
  marks: number;
  answer: string;
  isPremium: boolean;
  onPaywall: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<AIMentorResult>({ loading: false, data: null, error: null });

  async function evaluate() {
    if (!isPremium) { onPaywall(); return; }
    if (result.data) { setOpen(true); return; }
    setOpen(true);
    setResult({ loading: true, data: null, error: null });
    try {
      const fd = new FormData();
      fd.append('question', question);
      fd.append('marks', String(marks));
      fd.append('extractedText', answer);
      const token = (await import('@/lib/supabase')).supabase.auth.getSession().then(s => s.data.session?.access_token ?? '');
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'x-user-token': await token },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setResult({ loading: false, data: null, error: data.error || 'Evaluation failed. Please try again.' });
      } else {
        setResult({ loading: false, data, error: null });
      }
    } catch (e) {
      setResult({ loading: false, data: null, error: 'Network error. Please try again.' });
    }
  }

  const d = result.data as any;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button
        onClick={() => {
          if (!open) evaluate();
          else setOpen(o => !o);
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: isPremium ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: 6, padding: '0.45rem 0.9rem',
          color: '#818cf8', fontSize: '0.82rem', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <span>✦</span>
        <span>AI Mentor {isPremium ? '' : '· Premium'}</span>
        {!isPremium && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>🔒</span>}
      </button>

      {open && (
        <div style={{
          marginTop: '0.75rem', background: 'rgba(99,102,241,0.05)',
          border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '1.25rem',
        }}>
          {result.loading && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ color: '#818cf8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>✦ AI Mentor is evaluating your answer…</div>
              <div style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>Running multi-pass evaluation · This takes ~30 seconds</div>
            </div>
          )}

          {result.error && (
            <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{result.error}</div>
          )}

          {d && !result.loading && (
            <div style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
              {/* Score */}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg3)', borderRadius: 6 }}>
                <div>
                  <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Score</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: '#818cf8' }}>
                    {d.marks} <span style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>/ {d.marks_out_of}</span>
                  </div>
                </div>
                {d.section_marks && Object.entries(d.section_marks).map(([k, v]: [string, any]) => (
                  <div key={k}>
                    <div style={{ color: 'var(--text3)', fontSize: '0.65rem', textTransform: 'capitalize', letterSpacing: '0.06em' }}>{k}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text)' }}>{v.awarded}/{v.out_of}</div>
                  </div>
                ))}
                {d.word_count && (
                  <div>
                    <div style={{ color: 'var(--text3)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Words</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: d.word_count_rating === 'GOOD' ? '#34d399' : '#f59e0b' }}>
                      {d.word_count} <span style={{ fontSize: '0.7rem' }}>({d.word_count_rating})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Overall feedback */}
              {d.overall_feedback && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: '#818cf8', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Mentor Feedback</div>
                  <p style={{ color: 'var(--text2)', margin: 0 }}>{d.overall_feedback}</p>
                </div>
              )}

              {/* Body strengths/weaknesses */}
              {d.body && (
                <div style={{ marginBottom: '1rem' }}>
                  {d.body.strengths?.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ color: '#34d399', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Strengths</div>
                      {d.body.strengths.map((s: string, i: number) => (
                        <div key={i} style={{ color: 'var(--text2)', paddingLeft: '0.75rem', borderLeft: '2px solid #34d39940', marginBottom: '0.25rem' }}>✓ {s}</div>
                      ))}
                    </div>
                  )}
                  {d.body.weaknesses?.length > 0 && (
                    <div>
                      <div style={{ color: '#f87171', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Areas to Improve</div>
                      {d.body.weaknesses.map((w: string, i: number) => (
                        <div key={i} style={{ color: 'var(--text2)', paddingLeft: '0.75rem', borderLeft: '2px solid #f8717140', marginBottom: '0.25rem' }}>{w}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Historians to cite */}
              {d.historians_to_cite?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: '#f59e0b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Historians to Cite</div>
                  {d.historians_to_cite.map((h: any, i: number) => (
                    <div key={i} style={{ padding: '0.4rem 0.6rem', background: 'rgba(245,158,11,0.06)', borderRadius: 4, marginBottom: '0.3rem', borderLeft: '2px solid #f59e0b60' }}>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>{h.name}</span>
                      {h.work && <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}> · {h.work}</span>}
                      <div style={{ color: 'var(--text2)', marginTop: '0.15rem' }}>{h.argument}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Model answer */}
              {d.model_answer && (
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{ color: '#818cf8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    View Model Answer
                  </summary>
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg3)', borderRadius: 6 }}>
                    {d.model_answer.introduction && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Introduction</div>
                        <p style={{ color: 'var(--text2)', margin: 0 }}>{d.model_answer.introduction}</p>
                      </div>
                    )}
                    {Array.isArray(d.model_answer.body) && d.model_answer.body.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Body Points</div>
                        {d.model_answer.body.map((b: string, i: number) => (
                          <div key={i} style={{ paddingLeft: '0.75rem', borderLeft: '2px solid var(--border)', marginBottom: '0.5rem', color: 'var(--text2)' }}>
                            {b}
                          </div>
                        ))}
                      </div>
                    )}
                    {d.model_answer.conclusion && (
                      <div>
                        <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Conclusion</div>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TestPage() {
  // Config
  const [phase,    setPhase]    = useState<Phase>('config');
  const [mode,     setMode]     = useState<TestMode>('sectional');
  const [sections, setSections] = useState<Section[]>([]);
  const [paper,    setPaper]    = useState<'I' | 'II'>('I');

  // Derived test structure
  const [questions,    setQuestions]    = useState<TestQuestion[]>([]);
  const [shortQ1,      setShortQ1]      = useState<TestQuestion[]>([]); // Q1 short answers (non-Ancient)
  const [shortQ5,      setShortQ5]      = useState<TestQuestion[]>([]); // Q5 short answers (FLT only)
  const [mapQ,         setMapQ]         = useState<MapQuestion | null>(null);
  const [mapQ5,        setMapQ5]        = useState<MapQuestion | null>(null); // Section B map (Ancient FLT)
  const [answers,      setAnswers]      = useState<Record<number, string>>({});
  const [rubrics,      setRubrics]      = useState<Record<number, { intro: number; body: number; conc: number; pres: number }>>({});
  const [mapAnswers,   setMapAnswers]   = useState<Record<number, string>>({});
  const [mapRevealed,  setMapRevealed]  = useState<Record<number, boolean>>({});
  const [mapAnswers5,  setMapAnswers5]  = useState<Record<number, string>>({});
  const [mapRevealed5, setMapRevealed5] = useState<Record<number, boolean>>({});
  const [selectedDot,  setSelectedDot]  = useState<number | null>(null);
  const [selectedDot5, setSelectedDot5] = useState<number | null>(null);
  const [timerOn,      setTimerOn]      = useState(false);
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
  const [shortAnswers5,setShortAnswers5]= useState<Record<number, string>>({});

  // Subscription gate
  const { usage, GateModals, showChatLimitModal, slots } = useSubscriptionGate(() => {});
  const isPremium = usage?.isPremium ?? false;

  const totalMinutes = mode === 'sectional' ? 105 : 180;
  const totalSeconds = totalMinutes * 60;
  const { remaining, display } = useTimer(totalSeconds, timerOn, () => handleSubmit());
  const urgency = remaining < 300;

  // Config helpers
  function isAncientSection(s: Section[]) {
    return s.some(x => x.includes('Ancient'));
  }

  function toggleSection(s: Section) {
    setSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function pickMap(): MapQuestion {
    const years = [...new Set(mapData.map(e => e.year))];
    const yr = years[Math.floor(Math.random() * years.length)];
    const entries = mapData.filter(e => e.year === yr);
    const mt: MapType = Math.random() > 0.5 ? 'political' : 'physical';
    return { entries, year: yr, mapType: mt, userAnswers: {}, revealed: {} };
  }

  function startTest() {
    let qs: TestQuestion[] = [];
    let q1short: TestQuestion[] = [];
    let q5short: TestQuestion[] = [];
    let mq: MapQuestion | null = null;
    let mq5: MapQuestion | null = null;

    if (mode === 'sectional') {
      qs = generateSectional(sections);
      if (isAncientSection(sections)) {
        mq = pickMap();
      } else {
        q1short = generateShortAnswers(sections);
      }
    } else if (mode === 'flt_sectional') {
      const secA = sections.slice(0, 1);
      const secB = sections.length > 1 ? sections.slice(1) : sections;
      qs = generateFLT(secA, secB);
      if (isAncientSection(secA)) { mq = pickMap(); } else { q1short = generateShortAnswers(secA); }
      if (isAncientSection(secB)) { mq5 = pickMap(); } else { q5short = generateShortAnswers(secB); }
    } else {
      // flt_combined: Paper I = Ancient+Medieval, Paper II = Modern+World
      const sectA: Section[] = paper === 'I'
        ? ['Paper I - Ancient India', 'Paper I - Medieval India']
        : ['Paper II - Modern India', 'Paper II - World History'];
      const sectB: Section[] = paper === 'I'
        ? ['Paper I - Medieval India', 'Paper I - Ancient India']
        : ['Paper II - World History', 'Paper II - Modern India'];
      qs = generateFLT(sectA, sectB);
      if (paper === 'I') { mq = pickMap(); q5short = generateShortAnswers(['Paper I - Medieval India']); }
      else { q1short = generateShortAnswers(['Paper II - Modern India']); q5short = generateShortAnswers(['Paper II - World History']); }
    }

    setQuestions(qs);
    setShortQ1(q1short);
    setShortQ5(q5short);
    setMapQ(mq);
    setMapQ5(mq5);
    setAnswers({});
    setRubrics({});
    setMapAnswers({});
    setMapRevealed({});
    setMapAnswers5({});
    setMapRevealed5({});
    setSelectedDot(null);
    setSelectedDot5(null);
    setShortAnswers({});
    setShortAnswers5({});
    setPhase('test');
    setTimerOn(true);
  }

  function handleSubmit() {
    setTimerOn(false);
    setPhase('results');
  }

  const maxMarks = mode === 'sectional' ? 150 : 250;
  const mapScore = Object.values(mapRevealed).filter(Boolean).length * 2.5
                 + Object.values(mapRevealed5 ?? {}).filter(Boolean).length * 2.5;
  const writtenScore = Object.entries(rubrics).reduce((sum, [id, r]) => {
    return sum + rubricTotal(r);
  }, 0);
  const totalScore = mapScore + writtenScore;

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  if (phase === 'config') {
    const canStart = mode === 'flt_combined'
      ? true
      : sections.length > 0;

    const modeInfo = {
      sectional: {
        title: 'Sectional Test',
        subtitle: '105 min · 150 marks · 4 questions',
        desc: 'Deep practice on one or two topics. Q1 compulsory, attempt 2 of 3 remaining.',
      },
      flt_sectional: {
        title: 'Full-Length Sectional',
        subtitle: '3 hours · 250 marks · 8 questions',
        desc: '8 questions split across 2 sections. Mirrors real UPSC question structure.',
      },
      flt_combined: {
        title: 'Full-Length Test',
        subtitle: '3 hours · 250 marks · Paper I or II',
        desc: 'Complete paper — Paper I (Ancient+Medieval) or Paper II (Modern+World).',
      },
    };

    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '2.5rem 1.5rem 6rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
          History Optional · Practice
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem', lineHeight: 1.2 }}>
          Start a Test
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
          Questions are drawn from the full PYQ bank (1979–2025). Configure your paper below.
        </p>

        {/* Test Mode */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Test Format</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(['sectional', 'flt_sectional', 'flt_combined'] as TestMode[]).map(m => {
              const info = modeInfo[m];
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.9rem 1.1rem', borderRadius: 8, textAlign: 'left',
                    border: active ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: active ? 'rgba(59,130,246,0.08)' : 'var(--bg2)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    border: active ? '2px solid var(--accent)' : '2px solid var(--border)',
                    background: active ? 'var(--accent)' : 'transparent',
                  }} />
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : 'var(--text2)' }}>
                      {info.title}
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 400 }}>{info.subtitle}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: '0.1rem' }}>{info.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic / Paper selection */}
        {mode === 'flt_combined' ? (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Select Paper</div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(['I', 'II'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPaper(p)}
                  style={{
                    flex: 1, padding: '0.85rem 1rem', borderRadius: 8,
                    border: paper === p ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: paper === p ? 'rgba(59,130,246,0.08)' : 'var(--bg2)',
                    color: paper === p ? 'var(--text)' : 'var(--text2)',
                    fontWeight: paper === p ? 600 : 400, cursor: 'pointer',
                    fontSize: '0.9rem', textAlign: 'left' as const,
                  }}
                >
                  <div>Paper {p}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 400, marginTop: 2 }}>
                    {p === 'I' ? 'Ancient India + Medieval India' : 'Modern India + World History'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Select Topics</div>
            <p style={{ color: 'var(--text3)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
              {mode === 'flt_sectional' ? 'Select 2 topics — first will be Section A, second Section B.' : 'Select one or more topics for your test.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SECTIONS.map(s => {
                const active = sections.includes(s);
                const color = SECTION_COLOR[s];
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (mode === 'flt_sectional') {
                        // Max 2 sections for FLT sectional
                        if (active) setSections(prev => prev.filter(x => x !== s));
                        else if (sections.length < 2) setSections(prev => [...prev, s]);
                      } else {
                        toggleSection(s);
                      }
                    }}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: 20,
                      border: active ? `1.5px solid ${color}` : '1px solid var(--border)',
                      background: active ? `${color}18` : 'var(--bg2)',
                      color: active ? color : 'var(--text2)',
                      fontSize: '0.82rem', fontWeight: active ? 600 : 400,
                      cursor: mode === 'flt_sectional' && sections.length >= 2 && !active ? 'not-allowed' : 'pointer',
                      opacity: mode === 'flt_sectional' && sections.length >= 2 && !active ? 0.4 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {SECTION_SHORT[s]}
                  </button>
                );
              })}
            </div>
            {mode === 'flt_sectional' && sections.length === 2 && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text3)' }}>
                Section A: <span style={{ color: SECTION_COLOR[sections[0]] }}>{SECTION_SHORT[sections[0]]}</span>
                {' · '}
                Section B: <span style={{ color: SECTION_COLOR[sections[1]] }}>{SECTION_SHORT[sections[1]]}</span>
              </div>
            )}
          </div>
        )}

        {/* Map note */}
        <div style={{
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.75rem',
          color: 'var(--text2)', fontSize: '0.82rem', display: 'flex', gap: '0.5rem',
        }}>
          <span>🗺️</span>
          <span>Ancient India papers include a <strong>Map Question (50 marks)</strong> drawn from UPSC PYQ maps 2013–2025. Other sections get 5 short-answer questions instead.</span>
        </div>

        <button
          onClick={startTest}
          disabled={!canStart}
          style={{
            background: canStart ? 'var(--accent)' : 'var(--bg3)',
            color: canStart ? '#fff' : 'var(--text3)',
            border: 'none', borderRadius: 8, padding: '0.85rem 2.5rem',
            fontSize: '0.95rem', fontWeight: 600,
            cursor: canStart ? 'pointer' : 'not-allowed',
          }}
        >
          Begin Test →
        </button>
      </div>
    );
  }

  // ── TEST ──────────────────────────────────────────────────────────────────────

  // Decide Q1/Q5 type
  const q1IsMap = !!mapQ;
  const q5IsMap = !!mapQ5;

  // Split questions into Section A (first half) and Section B (second half) for FLT
  const isMultiSection = mode !== 'sectional';
  const halfLen = Math.ceil(questions.length / 2);
  const sectionAQs = isMultiSection ? questions.slice(0, halfLen) : questions;
  const sectionBQs = isMultiSection ? questions.slice(halfLen) : [];

  if (phase === 'test') {
    const usedMinutes = Math.floor((totalSeconds - remaining) / 60);
    const progressPct = ((totalSeconds - remaining) / totalSeconds) * 100;

    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 6rem' }}>

        {/* Sticky timer bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          padding: '0.6rem 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {mode === 'sectional' ? 'Sectional' : mode === 'flt_sectional' ? 'FLT Sectional' : `FLT Paper ${paper}`}
              </span>
              <span style={{ color: 'var(--text3)', fontSize: '0.72rem' }}>·</span>
              <span style={{ color: 'var(--text3)', fontSize: '0.72rem' }}>{maxMarks} marks</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700,
                color: urgency ? '#f87171' : 'var(--text)',
                transition: 'color 0.3s',
              }}>{display}</div>
              <button
                onClick={handleSubmit}
                style={{
                  background: '#e05c2a', color: '#fff', border: 'none',
                  borderRadius: 6, padding: '0.4rem 1rem',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                }}
              >Submit</button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 2, background: 'var(--border)', marginTop: '0.5rem', borderRadius: 1 }}>
            <div style={{
              height: '100%', borderRadius: 1,
              width: `${progressPct}%`,
              background: urgency ? '#f87171' : 'var(--accent)',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
        </div>

        {/* SECTION A */}
        {isMultiSection && (
          <div style={{ marginTop: '2rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Section A</span>
          </div>
        )}
        {!isMultiSection && <div style={{ height: '1.5rem' }} />}

        {/* Q1 — Map or Short Answers */}
        <QuestionBlock
          qNum={1}
          marks={50}
          isMap={q1IsMap}
          mapQ={q1IsMap ? mapQ! : null}
          shortQs={!q1IsMap ? shortQ1 : []}
          selectedDot={selectedDot}
          onDotClick={setSelectedDot}
          mapAnswers={mapAnswers}
          setMapAnswers={setMapAnswers}
          mapRevealed={mapRevealed}
          setMapRevealed={setMapRevealed}
          shortAnswers={shortAnswers}
          setShortAnswers={setShortAnswers}
          isResults={false}
        />

        {/* Section A written questions */}
        {sectionAQs.map((q, i) => (
          <WrittenQuestion
            key={q.id}
            q={q}
            qNum={i + 2}
            answer={answers[q.id] ?? ''}
            onAnswer={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}
            isResults={false}
          />
        ))}

        {/* SECTION B (FLT only) */}
        {isMultiSection && (
          <>
            <div style={{ marginTop: '2.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Section B</span>
            </div>

            <QuestionBlock
              qNum={5}
              marks={50}
              isMap={q5IsMap}
              mapQ={q5IsMap ? mapQ5! : null}
              shortQs={!q5IsMap ? shortQ5 : []}
              selectedDot={selectedDot5}
              onDotClick={setSelectedDot5}
              mapAnswers={mapAnswers5}
              setMapAnswers={setMapAnswers5}
              mapRevealed={mapRevealed5}
              setMapRevealed={setMapRevealed5}
              shortAnswers={shortAnswers5}
              setShortAnswers={setShortAnswers5}
              isResults={false}
            />

            {sectionBQs.map((q, i) => (
              <WrittenQuestion
                key={q.id}
                q={q}
                qNum={i + 6}
                answer={answers[q.id] ?? ''}
                onAnswer={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}
                isResults={false}
              />
            ))}
          </>
        )}
      </div>
    );
  }

  // ── RESULTS ─────────────────────────────────────────────────────────────────

  if (phase === 'results') {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
            Test Results
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>
            Self-evaluate each written answer using the rubric. Use AI Mentor for detailed feedback.
          </p>
        </div>

        {/* Score summary */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '1.5rem', marginBottom: '2rem',
          display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Self Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{totalScore.toFixed(1)}</span>
              <span style={{ color: 'var(--text3)', fontSize: '0.88rem' }}>/ {maxMarks}</span>
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Questions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{questions.length + 1 + (isMultiSection ? 1 : 0)}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Time Used</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{Math.floor((totalSeconds - remaining) / 60)}m</div>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4 }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${Math.min((totalScore / maxMarks) * 100, 100)}%`,
                background: totalScore / maxMarks >= 0.6 ? '#34d399' : totalScore / maxMarks >= 0.4 ? '#f59e0b' : '#f87171',
                transition: 'width 1s',
              }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>
              {Math.round((totalScore / maxMarks) * 100)}% of total marks
            </div>
          </div>
        </div>

        {/* Section A results */}
        {isMultiSection && (
          <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            Section A
          </div>
        )}

        <QuestionBlock
          qNum={1}
          marks={50}
          isMap={q1IsMap}
          mapQ={q1IsMap ? mapQ! : null}
          shortQs={!q1IsMap ? shortQ1 : []}
          selectedDot={null}
          onDotClick={() => {}}
          mapAnswers={mapAnswers}
          setMapAnswers={setMapAnswers}
          mapRevealed={mapRevealed}
          setMapRevealed={setMapRevealed}
          shortAnswers={shortAnswers}
          setShortAnswers={setShortAnswers}
          isResults={true}
        />

        {sectionAQs.map((q, i) => (
          <WrittenQuestion
            key={q.id}
            q={q}
            qNum={i + 2}
            answer={answers[q.id] ?? ''}
            onAnswer={() => {}}
            isResults={true}
            rubric={rubrics[q.id]}
            onRubric={r => setRubrics(prev => ({ ...prev, [q.id]: r }))}
            isPremium={isPremium}
            onPaywall={showChatLimitModal}
          />
        ))}

        {/* Section B results */}
        {isMultiSection && (
          <>
            <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '2.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              Section B
            </div>

            <QuestionBlock
              qNum={5}
              marks={50}
              isMap={q5IsMap}
              mapQ={q5IsMap ? mapQ5! : null}
              shortQs={!q5IsMap ? shortQ5 : []}
              selectedDot={null}
              onDotClick={() => {}}
              mapAnswers={mapAnswers5}
              setMapAnswers={setMapAnswers5}
              mapRevealed={mapRevealed5}
              setMapRevealed={setMapRevealed5}
              shortAnswers={shortAnswers5}
              setShortAnswers={setShortAnswers5}
              isResults={true}
            />

            {sectionBQs.map((q, i) => (
              <WrittenQuestion
                key={q.id}
                q={q}
                qNum={i + 6}
                answer={answers[q.id] ?? ''}
                onAnswer={() => {}}
                isResults={true}
                rubric={rubrics[q.id]}
                onRubric={r => setRubrics(prev => ({ ...prev, [q.id]: r }))}
                isPremium={isPremium}
                onPaywall={showChatLimitModal}
              />
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

// ─── QuestionBlock (Q1 / Q5) ──────────────────────────────────────────────────

function QuestionBlock({
  qNum, marks, isMap,
  mapQ, shortQs,
  selectedDot, onDotClick,
  mapAnswers, setMapAnswers,
  mapRevealed, setMapRevealed,
  shortAnswers, setShortAnswers,
  isResults,
}: {
  qNum: number; marks: number; isMap: boolean;
  mapQ: MapQuestion | null; shortQs: TestQuestion[];
  selectedDot: number | null; onDotClick: (n: number) => void;
  mapAnswers: Record<number, string>; setMapAnswers: (fn: (p: Record<number, string>) => Record<number, string>) => void;
  mapRevealed: Record<number, boolean>; setMapRevealed: (fn: (p: Record<number, boolean>) => Record<number, boolean>) => void;
  shortAnswers: Record<number, string>; setShortAnswers: (fn: (p: Record<number, string>) => Record<number, string>) => void;
  isResults: boolean;
}) {
  if (isMap && mapQ) {
    return (
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 8, padding: '1.5rem', marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{
              background: 'rgba(59,130,246,0.12)', color: 'var(--accent)',
              fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
              padding: '2px 8px', borderRadius: 3, border: '1px solid rgba(59,130,246,0.3)',
            }}>Q{qNum} · COMPULSORY</span>
            <span style={{
              background: 'var(--bg3)', color: 'var(--text3)',
              fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
              padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border)',
            }}>50M · Map · {mapQ.year}</span>
          </div>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Identify the {mapQ.entries.length} places marked on the map. For each numbered dot, write the place name based on the hint given. Each answer carries <strong>2.5 marks</strong>.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', minWidth: 280 }}>
            <LeafletMap
              entries={mapQ.entries}
              selectedDot={isResults ? null : selectedDot}
              onDotClick={isResults ? () => {} : onDotClick}
              answered={mapAnswers}
              revealed={mapRevealed}
            />
          </div>
          <div style={{ flex: '1 1 240px', minWidth: 220 }}>
            {!isResults && selectedDot !== null && (
              <div style={{
                background: 'var(--bg)', border: '1px solid var(--accent)',
                borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '0.35rem', fontSize: '0.88rem' }}>Dot #{selectedDot}</div>
                <div style={{ color: 'var(--text2)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                  {mapQ.entries.find(e => e.number === selectedDot)?.hint}
                </div>
                <input
                  value={mapAnswers[selectedDot] ?? ''}
                  onChange={e => setMapAnswers(prev => ({ ...prev, [selectedDot]: e.target.value }))}
                  placeholder="Type place name..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '0.45rem 0.7rem',
                    color: 'var(--text)', fontSize: '0.85rem', outline: 'none',
                  }}
                />
              </div>
            )}
            {!isResults && selectedDot === null && (
              <div style={{
                background: 'var(--bg3)', borderRadius: 8, padding: '0.85rem',
                marginBottom: '0.75rem', color: 'var(--text3)', fontSize: '0.82rem', textAlign: 'center',
              }}>← Click a dot on the map to answer</div>
            )}
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {mapQ.entries.map(e => (
                <div key={e.number}>
                  <div
                    onClick={() => !isResults && onDotClick(e.number)}
                    style={{
                      display: 'flex', gap: '0.5rem', alignItems: 'center',
                      padding: '0.35rem 0.5rem', borderRadius: 5, marginBottom: 2,
                      background: !isResults && selectedDot === e.number ? 'rgba(59,130,246,0.1)' : 'transparent',
                      cursor: isResults ? 'default' : 'pointer',
                    }}
                  >
                    <span style={{
                      minWidth: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: mapRevealed[e.number] ? '#22a85a' : mapAnswers[e.number] ? 'var(--accent)' : 'var(--bg3)',
                      color: (mapRevealed[e.number] || mapAnswers[e.number]) ? '#fff' : 'var(--text3)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: 700,
                    }}>{e.number}</span>
                    <span style={{ color: 'var(--text2)', fontSize: '0.78rem', flex: 1 }}>{e.hint}</span>
                    {isResults && !mapRevealed[e.number] && (
                      <button
                        onClick={() => setMapRevealed(prev => ({ ...prev, [e.number]: true }))}
                        style={{
                          background: 'none', border: '1px solid var(--border)',
                          color: 'var(--text3)', borderRadius: 3,
                          padding: '1px 6px', fontSize: '0.68rem', cursor: 'pointer',
                        }}
                      >Reveal</button>
                    )}
                  </div>
                  {isResults && mapAnswers[e.number] && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)', paddingLeft: 28, marginBottom: 2 }}>
                      Your answer: <em style={{ color: 'var(--text)' }}>{mapAnswers[e.number]}</em>
                    </div>
                  )}
                  {isResults && mapRevealed[e.number] && (
                    <div style={{ fontSize: '0.75rem', color: '#22a85a', paddingLeft: 28, marginBottom: 4 }}>
                      ✓ {e.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Short answers (Q1/Q5 for non-Ancient)
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderLeft: '3px solid var(--accent)',
      borderRadius: 8, padding: '1.5rem', marginBottom: '1.25rem',
    }}>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{
          background: 'rgba(59,130,246,0.12)', color: 'var(--accent)',
          fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
          padding: '2px 8px', borderRadius: 3, border: '1px solid rgba(59,130,246,0.3)',
        }}>Q{qNum} · COMPULSORY</span>
        <span style={{
          background: 'var(--bg3)', color: 'var(--text3)',
          fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
          padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border)',
        }}>50M · 5 × 10M · ~150 words each</span>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Answer all five parts in about 150 words each. Each part carries <strong>10 marks</strong>.
      </p>
      {shortQs.map((q, i) => (
        <div key={q.id} style={{
          borderTop: i > 0 ? '1px solid var(--border)' : 'none',
          paddingTop: i > 0 ? '1rem' : 0,
          marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{
              background: `${SECTION_COLOR[q.section]}18`,
              color: SECTION_COLOR[q.section],
              fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
              padding: '1px 6px', borderRadius: 3,
              border: `1px solid ${SECTION_COLOR[q.section]}40`,
            }}>({String.fromCharCode(96 + i + 1)})</span>
            <span style={{ color: 'var(--text3)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>{q.year} · {q.marks}M</span>
          </div>
          <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: isResults ? 0 : '0.5rem' }}>
            {q.question}
          </p>
          {!isResults && (
            <textarea
              value={shortAnswers[q.id] ?? ''}
              onChange={e => setShortAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Write your answer here... (~150 words)"
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '0.6rem 0.75rem',
                color: 'var(--text)', fontSize: '0.85rem', resize: 'vertical',
                outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
              }}
            />
          )}
          {isResults && shortAnswers[q.id] && (
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '0.6rem 0.75rem',
              color: 'var(--text2)', fontSize: '0.85rem', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', marginTop: '0.5rem',
            }}>{shortAnswers[q.id]}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── WrittenQuestion ──────────────────────────────────────────────────────────

function WrittenQuestion({
  q, qNum, answer, onAnswer, isResults,
  rubric, onRubric, isPremium, onPaywall,
}: {
  q: TestQuestion;
  qNum: number;
  answer: string;
  onAnswer: (v: string) => void;
  isResults: boolean;
  rubric?: { intro: number; body: number; conc: number; pres: number };
  onRubric?: (r: { intro: number; body: number; conc: number; pres: number }) => void;
  isPremium?: boolean;
  onPaywall?: () => void;
}) {
  const color = SECTION_COLOR[q.section] ?? 'var(--accent)';
  const isP1 = q.section.startsWith('Paper I');

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderLeft: `3px solid ${color}`,
      borderRadius: 8, padding: '1.5rem', marginBottom: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            background: `${color}18`, color,
            border: `1px solid ${color}40`,
            fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
            padding: '2px 8px', borderRadius: 3,
          }}>Q{qNum}</span>
          <span style={{
            background: `${color}18`, color,
            border: `1px solid ${color}40`,
            fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
            padding: '2px 8px', borderRadius: 3,
          }}>{q.section.replace('Paper I - ', '').replace('Paper II - ', '')}</span>
          <span style={{
            background: 'var(--bg3)', color: 'var(--text3)',
            fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
            padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border)',
          }}>{q.marks}M · {minutesFor(q.marks)} min</span>
        </div>
        <span style={{ color: 'var(--text3)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>{q.year}</span>
      </div>

      <p style={{ color: 'var(--text)', fontSize: '0.93rem', lineHeight: 1.7, marginBottom: isResults ? '0.75rem' : '0.75rem' }}>
        {q.question}
      </p>

      {!isResults && (
        <textarea
          value={answer}
          onChange={e => onAnswer(e.target.value)}
          placeholder={`Write your answer here... (~${q.marks === 10 ? '150-200' : q.marks === 15 ? '200-250' : '250-300'} words)`}
          rows={q.marks === 10 ? 5 : q.marks === 15 ? 7 : 9}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '0.6rem 0.75rem',
            color: 'var(--text)', fontSize: '0.88rem', resize: 'vertical',
            outline: 'none', fontFamily: 'inherit', lineHeight: 1.65,
          }}
        />
      )}

      {isResults && (
        <>
          {answer ? (
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '0.75rem 1rem',
              color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', marginBottom: '0.75rem',
            }}>{answer}</div>
          ) : (
            <div style={{ color: 'var(--text3)', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
              No answer written.
            </div>
          )}

          {onRubric && (
            <RubricScorer marks={q.marks} value={rubric} onChange={onRubric} />
          )}

          {answer && onPaywall && isPremium !== undefined && (
            <AIMentorPanel
              question={q.question}
              marks={q.marks}
              answer={answer}
              isPremium={isPremium}
              onPaywall={onPaywall}
            />
          )}
        </>
      )}
    </div>
  );
}
