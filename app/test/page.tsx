'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { pyqs } from '@/lib/pyqData';
import { mapData, MapEntry } from '@/lib/mapData';

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'Paper I - Ancient India' | 'Paper I - Medieval India' | 'Paper II - Modern India' | 'Paper II - World History';
type DurationSlot = 60 | 120 | 180;
type TestScope = 'sectional' | 'full';
type MapType = 'physical' | 'political';
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
}

interface MapQuestion {
  entries: MapEntry[];
  year: number;
  mapType: MapType;
  userAnswers: Record<number, string>;
  revealed: Record<number, boolean>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  'Paper I - Ancient India',
  'Paper I - Medieval India',
  'Paper II - Modern India',
  'Paper II - World History',
];

const SECTION_LABELS: Record<string, string> = {
  'Paper I - Ancient India': 'Ancient India',
  'Paper I - Medieval India': 'Medieval India',
  'Paper II - Modern India': 'Modern India',
  'Paper II - World History': 'World History',
};

const TIME_PER_MARK: Record<number, number> = { 10: 7, 15: 10, 20: 14 };

function minutesFor(marks: number): number {
  return TIME_PER_MARK[marks] ?? Math.round(marks * 0.72);
}

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

// ─── India Map (static pre-projected SVG paths, no external deps) ─────────────

const W = 560, H = 620;

// Pre-projected SVG paths using Mercator { center: [83,23], scale: 800 }
// Coordinates from Natural Earth 110m (public domain)
const STATIC_GEOS: { name: string; d: string; isIndia: boolean }[] = [
  { name: 'India', isIndia: true, d: 'M166.8,79.3 L180.7,89.1 L184.9,108.8 L207.4,109.5 L222.9,129.4 L220.4,176 L234.2,186.4 L253.6,197.8 L265.9,195.4 L282.4,207 L297.2,219.3 L308.1,222.5 L319.4,229.5 L335.2,233.1 L351.5,234.7 L360.6,239.6 L361.5,246.8 L374.1,252.7 L382.9,250.2 L394.8,251.3 L406.1,250.9 L407.1,241.3 L416.8,243.7 L424.2,252.3 L436.8,247.3 L449.2,255.1 L449.6,264 L464,277.6 L481.1,299.2 L490.6,293.9 L492.9,304.8 L485.8,318.2 L486.5,330.5 L410.8,324.5 L402.9,322.4 L398.1,310.9 L393.9,302.4 L384.7,313.5 L381.9,318.8 L375.9,327.2 L363.8,320.9 L362.2,311.8 L357.2,300.3 L343.4,316.8 L335.6,325.1 L327.8,329.9 L307.9,355 L295.4,369.8 L280,391.9 L268.7,398.9 L268.7,405.6 L254,405.6 L241.7,415.2 L238.1,426.8 L230.4,442 L218.6,457 L210.2,478.5 L203.2,523.8 L200,526.8 L191.2,520.4 L187.8,506.9 L182.3,494.1 L172.5,478.5 L166.3,460.8 L163,442.8 L160.5,433.7 L147.8,413.9 L142,385.6 L137.9,366.7 L134.8,348.8 L126.4,337.6 L128.9,324.5 L81.3,307.7 L73.2,296.9 L62.9,295.5 L62.9,294.3 L72.8,291.1 L81.2,290.8 L91.8,290.6 L100.9,280.5 L105.5,268.9 L113.1,262.3 L106.7,249.1 L100.9,235.1 L91.5,233.9 L89,226.9 L98.5,216.7 L103.8,201 L112.3,184.8 L120,169.9 L130.7,166.3 L137.9,158.9 L146.7,156.2 L155,144.2 L166.8,79.3 Z' },
  { name: 'Pakistan', isIndia: false, d: 'M166.8,79.3 L155,144.2 L146.7,156.2 L137.9,158.9 L130.7,166.3 L120,169.9 L112.3,184.8 L103.8,201 L98.5,216.7 L89,226.9 L91.5,233.9 L100.9,235.1 L106.7,249.1 L113.1,262.3 L105.5,268.9 L100.9,280.5 L91.8,290.6 L81.2,290.8 L72.8,291.1 L62.9,294.3 L-27.2,317.6 L-41.1,332.6 L-20.2,355 L0.7,362.4 L7.7,279.4 L-6.2,248.4 L-2.7,228.7 L-29,203.4 L-5.5,199.4 L8.4,183.2 L28.7,176.3 L49.6,184.5 L56.6,184.5 L68.2,175.2 L84,184.2 L96.8,174.2 L100.9,168.1 L106.7,142.5 L114.5,128.9 L122.4,123.1 L126.4,117.9 L140.4,92.1 L166.8,79.3 Z' },
  { name: 'China', isIndia: false, d: 'M222.9,129.4 L238.1,117.9 L252.1,117.9 L266,109.3 L280,117.9 L294,126.4 L307.9,117.9 L321.9,109.3 L335.9,109.3 L349.8,100.7 L363.8,92.1 L391.7,92.1 L405.7,100.7 L419.6,92.1 L433.6,100.7 L447.6,109.3 L461.5,117.9 L475.5,126.4 L489.4,134.8 L503.4,143.2 L517.4,134.8 L531.3,126.4 L545.3,126.4 L559.3,134.8 L573.2,134.8 L587.2,117.9 L601.1,109.3 L629.1,126.4 L657,151.5 L684.9,168.1 L712.8,200.7 L740.8,232.6 L754.7,279.4 L726.8,310 L698.9,325.1 L657,355 L629.1,369.8 L601.1,384.6 L587.2,377.2 L573.2,355 L559.3,325.1 L545.3,317.6 L531.3,325.1 L517.4,332.6 L503.4,325.1 L489.4,317.6 L486.5,330.5 L485.8,318.2 L492.9,304.8 L490.6,293.9 L481.1,299.2 L464,277.6 L449.6,264 L449.2,255.1 L436.8,247.3 L424.2,252.3 L416.8,243.7 L407.1,241.3 L406.1,250.9 L394.8,251.3 L382.9,250.2 L374.1,252.7 L361.5,246.8 L360.6,239.6 L351.5,234.7 L335.2,233.1 L319.4,229.5 L308.1,222.5 L297.2,219.3 L282.4,207 L265.9,195.4 L253.6,197.8 L234.2,186.4 L220.4,176 L222.9,129.4 Z' },
  { name: 'Nepal', isIndia: false, d: 'M351.5,234.7 L335.2,233.1 L319.4,229.5 L308.1,222.5 L297.2,219.3 L282.4,207 L265.9,195.4 L253.6,197.8 L234.2,186.4 L220.4,176 L238.1,176.3 L252.1,184.5 L266,192.6 L280,200.7 L294,200.7 L307.9,192.6 L321.9,192.6 L335.9,192.6 L349.8,192.6 L351.5,234.7 Z' },
  { name: 'Bhutan', isIndia: false, d: 'M407.1,241.3 L394.8,251.3 L382.9,250.2 L374.1,252.7 L361.5,246.8 L360.6,239.6 L351.5,234.7 L349.8,232.6 L363.8,224.7 L377.7,224.7 L391.7,232.6 L405.7,232.6 L407.1,241.3 Z' },
  { name: 'Bangladesh', isIndia: false, d: 'M402.9,322.4 L398.1,310.9 L393.9,302.4 L384.7,313.5 L381.9,318.8 L375.9,327.2 L363.8,320.9 L362.2,311.8 L357.2,300.3 L343.4,316.8 L349.8,302.4 L356.8,287.1 L363.8,279.4 L370.8,271.7 L377.7,271.7 L384.7,271.7 L391.7,271.7 L398.7,279.4 L394.8,251.3 L406.1,250.9 L407.1,241.3 L412.6,264 L405.7,271.7 L402.9,279.4 L398.7,294.8 L405.7,302.4 L410.8,324.5 L402.9,322.4 Z' },
  { name: 'Myanmar', isIndia: false, d: 'M486.5,330.5 L485.8,318.2 L492.9,304.8 L490.6,293.9 L481.1,299.2 L464,277.6 L449.6,264 L449.2,255.1 L436.8,247.3 L424.2,252.3 L416.8,243.7 L407.1,241.3 L410.8,324.5 L419.6,340.1 L426.6,355 L433.6,369.8 L440.6,384.6 L447.6,399.2 L461.5,413.8 L475.5,406.5 L482.5,391.9 L489.4,377.2 L496.4,362.4 L503.4,355 L510.4,340.1 L517.4,332.6 L503.4,325.1 L489.4,317.6 L486.5,330.5 Z' },
  { name: 'Sri Lanka', isIndia: false, d: 'M263.1,534.8 L252.1,528.1 L238.1,513.9 L233.9,504 L231.1,499.8 L238.1,492.7 L245.1,492.7 L252.1,499.8 L259.1,513.9 L263.1,534.8 Z' },
  { name: 'Afghanistan', isIndia: false, d: 'M166.8,79.3 L140.4,92.1 L126.4,117.9 L122.4,123.1 L114.5,128.9 L106.7,142.5 L100.9,168.1 L96.8,174.2 L84,184.2 L68.2,175.2 L56.6,184.5 L49.6,184.5 L28.7,176.3 L8.4,183.2 L-5.5,199.4 L-29,203.4 L-27.2,184.5 L-20.2,151.5 L-13.2,117.9 L-6.2,100.7 L0.7,83.3 L14.7,74.6 L28.7,74.6 L42.6,83.3 L56.6,83.3 L70.6,65.7 L84.5,56.8 L98.5,65.7 L105.5,74.6 L112.4,83.3 L126.4,83.3 L140.4,74.6 L154.3,74.6 L166.8,79.3 Z' },
];

// Mercator projection matching original projectionConfig { center:[83,23], scale:800 }
const RAD = Math.PI / 180;
function mercProject(lng: number, lat: number): [number, number] {
  const x = W / 2 + 800 * (lng - 83) * RAD;
  const sinLat = Math.sin(lat * RAD);
  const sinCtr = Math.sin(23 * RAD);
  const y = H / 2 - 800 * (
    Math.log((1 + sinLat) / (1 - sinLat)) / 2 -
    Math.log((1 + sinCtr) / (1 - sinCtr)) / 2
  );
  return [x, y];
}

function IndiaMap({
  mapType,
  entries,
  selectedDot,
  onDotClick,
  answered,
  revealed,
}: {
  mapType: MapType;
  entries: MapEntry[];
  selectedDot: number | null;
  onDotClick: (num: number) => void;
  answered: Record<number, string>;
  revealed: Record<number, boolean>;
}) {

  return (
    <div style={{
      width: '100%', maxWidth: 560,
      background: '#d6eaf8',
      border: '1.5px solid #999',
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {STATIC_GEOS.map(({ name, d, isIndia }) => (
          <path
            key={name}
            d={d}
            fill={isIndia ? '#ffffff' : '#e8e8e8'}
            stroke={isIndia ? '#333' : '#aaa'}
            strokeWidth={isIndia ? 1.5 : 0.8}
          />
        ))}

        {entries.map(entry => {
          const isSelected = selectedDot === entry.number;
          const isAnswered = !!answered[entry.number];
          const isRevealed = !!revealed[entry.number];
          let fill = '#1a1a2e';
          if (isRevealed) fill = '#22a85a';
          else if (isAnswered) fill = '#b48c3c';
          else if (isSelected) fill = '#e05c2a';

          const [cx, cy] = mercProject(entry.lng, entry.lat);
          const r = isSelected ? 10 : 7;

          return (
            <g key={entry.number} onClick={() => onDotClick(entry.number)} style={{ cursor: 'pointer' }}>
              <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#fff" strokeWidth={1.5} opacity={0.92} />
              <text
                x={cx} y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize={8}
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {entry.number}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Generate Test ─────────────────────────────────────────────────────────────

function generateTest(
  duration: DurationSlot,
  scope: TestScope,
  selectedSections: Section[],
  paper: 'I' | 'II' | null,
): TestQuestion[] {
  const pool = pyqs.filter(q => {
    if (scope === 'full') {
      const p = paper === 'I' ? 'Paper I' : 'Paper II';
      return q.section.startsWith(p);
    }
    return selectedSections.some(s => q.section === s);
  });

  if (duration === 180 && scope === 'full') {
    // Mirror UPSC: Q5 (5×10m) + 1 Section A (15+15+20) + 2 Section B (15+15+20 each)
    const tens   = pick(pool.filter(q => q.marks === 10), 5);
    const fifths = pick(pool.filter(q => q.marks === 15), 4); // 2 sets × 2
    const twens  = pick(pool.filter(q => q.marks === 20), 3); // 3 sets
    return [...tens, ...fifths, ...twens].map(q => ({ ...q, answer: '', selfScore: null }));
  }

  // Fill time budget greedily
  let budget = duration;
  const result: TestQuestion[] = [];
  const used = new Set<number>();

  // Priority: 10s first for short tests, mix for longer
  const markOrder = duration === 60 ? [10, 15] : [10, 15, 20];

  for (const m of markOrder) {
    const t = minutesFor(m);
    const candidates = shuffle(pool.filter(q => q.marks === m && !used.has(q.id)));
    for (const q of candidates) {
      if (budget - t < 0) break;
      result.push({ ...q, answer: '', selfScore: null });
      used.add(q.id);
      budget -= t;
    }
  }

  return result;
}

// ─── Timer ────────────────────────────────────────────────────────────────────

function useTimer(totalSeconds: number, running: boolean, onEnd: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TestPage() {
  // Config state
  const [phase,            setPhase]            = useState<Phase>('config');
  const [duration,         setDuration]         = useState<DurationSlot>(60);
  const [scope,            setScope]            = useState<TestScope>('sectional');
  const [selectedSections, setSelectedSections] = useState<Section[]>([]);
  const [paper,            setPaper]            = useState<'I' | 'II'>('I');

  // Test state
  const [questions,   setQuestions]   = useState<TestQuestion[]>([]);
  const [mapQ,        setMapQ]        = useState<MapQuestion | null>(null);
  const [answers,     setAnswers]     = useState<Record<number, string>>({});
  const [selfScores,  setSelfScores]  = useState<Record<number, number>>({});
  const [mapAnswers,  setMapAnswers]  = useState<Record<number, string>>({});
  const [mapRevealed, setMapRevealed] = useState<Record<number, boolean>>({});
  const [selectedDot, setSelectedDot] = useState<number | null>(null);
  const [timerOn,     setTimerOn]     = useState(false);
  const [submitted,   setSubmitted]   = useState(false);

  const totalSeconds = duration * 60;
  const { remaining, display } = useTimer(totalSeconds, timerOn, () => handleSubmit());

  const urgency = remaining < 300; // last 5 min

  function toggleSection(s: Section) {
    setSelectedSections(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  function startTest() {
    const qs = generateTest(duration, scope, selectedSections, scope === 'full' ? paper : null);
    // Pick random year map question
    const years = [...new Set(mapData.map(e => e.year))];
    const yr = years[Math.floor(Math.random() * years.length)];
    const entries = mapData.filter(e => e.year === yr);
    const mt: MapType = Math.random() > 0.5 ? 'political' : 'physical';
    setQuestions(qs);
    setMapQ({ entries, year: yr, mapType: mt, userAnswers: {}, revealed: {} });
    setAnswers({});
    setSelfScores({});
    setMapAnswers({});
    setMapRevealed({});
    setSelectedDot(null);
    setSubmitted(false);
    setPhase('test');
    setTimerOn(true);
  }

  function handleSubmit() {
    setTimerOn(false);
    setSubmitted(true);
    setPhase('results');
  }

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0) + 50; // +50 map
  const earnedMarks = Object.values(selfScores).reduce((s, v) => s + v, 0)
    + Object.values(mapRevealed).filter(Boolean).length * 2.5; // 50/20

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  if (phase === 'config') {
    const canStart = scope === 'full' || selectedSections.length > 0;
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          History Optional
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
          Start a Test
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Configure your test below. Questions are pulled from the full PYQ bank.
        </p>

        {/* Duration */}
        <Section2 title="Duration">
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {([60, 120, 180] as DurationSlot[]).map(d => (
              <OptionBtn key={d} active={duration === d} onClick={() => setDuration(d)}>
                {d === 60 ? '1 Hour' : d === 120 ? '2 Hours' : '3 Hours'}
                <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>
                  {d === 60 ? '~5–6 Qs' : d === 120 ? '~9–10 Qs' : 'Full paper'}
                </span>
              </OptionBtn>
            ))}
          </div>
        </Section2>

        {/* Scope */}
        <Section2 title="Test Type">
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <OptionBtn active={scope === 'sectional'} onClick={() => setScope('sectional')}>
              Sectional
              <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>Pick topics/sections</span>
            </OptionBtn>
            <OptionBtn active={scope === 'full'} onClick={() => setScope('full')}>
              Full Length
              <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>Mirrors UPSC pattern</span>
            </OptionBtn>
          </div>
        </Section2>

        {/* Full length — paper selection */}
        {scope === 'full' && (
          <Section2 title="Select Paper">
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(['I', 'II'] as const).map(p => (
                <OptionBtn key={p} active={paper === p} onClick={() => setPaper(p)}>
                  Paper {p}
                  <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>
                    {p === 'I' ? 'Ancient + Medieval' : 'Modern + World'}
                  </span>
                </OptionBtn>
              ))}
            </div>
          </Section2>
        )}

        {/* Sectional — section selection */}
        {scope === 'sectional' && (
          <Section2 title="Select Topics / Sections">
            <p style={{ color: 'var(--text3)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Select one or more — any combination works.
            </p>
            {/* By topic */}
            <div style={{ marginBottom: '0.5rem', color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>By Topic</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {SECTIONS.map(s => (
                <OptionBtn key={s} active={selectedSections.includes(s)} onClick={() => toggleSection(s)} small>
                  {SECTION_LABELS[s]}
                </OptionBtn>
              ))}
            </div>
            {/* By Paper shortcuts */}
            <div style={{ marginBottom: '0.5rem', color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>By Paper</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <OptionBtn
                small
                active={selectedSections.includes('Paper I - Ancient India') && selectedSections.includes('Paper I - Medieval India')}
                onClick={() => {
                  const p1: Section[] = ['Paper I - Ancient India', 'Paper I - Medieval India'];
                  const allIn = p1.every(s => selectedSections.includes(s));
                  setSelectedSections(prev => allIn ? prev.filter(s => !p1.includes(s)) : [...new Set([...prev, ...p1])]);
                }}
              >Paper I (Ancient + Medieval)</OptionBtn>
              <OptionBtn
                small
                active={selectedSections.includes('Paper II - Modern India') && selectedSections.includes('Paper II - World History')}
                onClick={() => {
                  const p2: Section[] = ['Paper II - Modern India', 'Paper II - World History'];
                  const allIn = p2.every(s => selectedSections.includes(s));
                  setSelectedSections(prev => allIn ? prev.filter(s => !p2.includes(s)) : [...new Set([...prev, ...p2])]);
                }}
              >Paper II (Modern + World)</OptionBtn>
            </div>
          </Section2>
        )}

        {/* Map note */}
        <div style={{
          background: 'rgba(180,140,60,0.08)', border: '1px solid rgba(180,140,60,0.25)',
          borderRadius: 8, padding: '0.85rem 1.1rem', marginBottom: '1.5rem',
          color: 'var(--text2)', fontSize: '0.85rem',
        }}>
          🗺️ Every test includes a <strong>Map Question (Q1 · 50 marks)</strong> — randomly drawn from UPSC PYQ maps 2013–2025.
        </div>

        <button
          onClick={startTest}
          disabled={!canStart}
          style={{
            background: canStart ? 'var(--accent)' : 'var(--bg3)',
            color: canStart ? '#fff' : 'var(--text3)',
            border: 'none', borderRadius: 8, padding: '0.85rem 2.5rem',
            fontSize: '1rem', fontWeight: 600, cursor: canStart ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-ui)',
          }}
        >
          Start Test →
        </button>
      </div>
    );
  }

  // ── TEST ─────────────────────────────────────────────────────────────────────
  if (phase === 'test' && mapQ) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1.5rem 6rem' }}>

        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          padding: '0.75rem 0', marginBottom: '1.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <div>
            <span style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>History Optional · Test</span>
            <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>
              {questions.length + 1} questions · {questions.reduce((s,q) => s + q.marks, 0) + 50} marks
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '1.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
              color: urgency ? '#e05c2a' : 'var(--accent)',
              transition: 'color 0.5s',
            }}>{display}</div>
            <div style={{ color: 'var(--text3)', fontSize: '0.72rem' }}>remaining</div>
          </div>
          <button
            onClick={handleSubmit}
            style={{
              background: '#e05c2a', color: '#fff', border: 'none',
              borderRadius: 6, padding: '0.6rem 1.25rem',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            }}
          >Submit Test</button>
        </div>

        {/* Q1 — Map Question */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderLeft: '3px solid var(--accent)', borderRadius: 8,
          padding: '1.5rem', marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{
                background: 'rgba(180,140,60,0.12)', color: 'var(--accent)',
                border: '1px solid rgba(180,140,60,0.3)',
                fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                padding: '2px 8px', borderRadius: 3, marginRight: 8,
              }}>Q1 · MAP</span>
              <span style={{
                background: 'var(--bg3)', color: 'var(--text3)',
                fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border)',
                marginRight: 8,
              }}>50M</span>
              <span style={{
                background: 'var(--bg3)', color: 'var(--text3)',
                fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border)',
              }}>{mapQ.mapType === 'political' ? 'Political Map' : 'Physical Map'} · {mapQ.year}</span>
            </div>
          </div>

          <p style={{ color: 'var(--text)', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.6 }}>
            On the map below, {mapQ.entries.length} places are marked as numbered dots. For each numbered dot, identify the place based on the hint given.
            Click a dot to select it, type your answer, then click the next dot.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Map */}
            <div style={{ flex: '1 1 300px', minWidth: 280 }}>
              <IndiaMap
                mapType={mapQ.mapType}
                entries={mapQ.entries}
                selectedDot={selectedDot}
                onDotClick={n => setSelectedDot(selectedDot === n ? null : n)}
                answered={mapAnswers}
                revealed={mapRevealed}
              />
              <p style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: '0.5rem' }}>
                🟤 answered · 🟢 revealed · 🔴 selected
              </p>
            </div>

            {/* Answer panel */}
            <div style={{ flex: '1 1 260px', minWidth: 240 }}>
              {selectedDot !== null ? (
                <div style={{
                  background: 'var(--bg)', border: '1px solid var(--accent)',
                  borderRadius: 8, padding: '1rem', marginBottom: '1rem',
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '0.5rem' }}>
                    Dot #{selectedDot}
                  </div>
                  <div style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    {mapQ.entries.find(e => e.number === selectedDot)?.hint}
                  </div>
                  <input
                    value={mapAnswers[selectedDot] ?? ''}
                    onChange={e => setMapAnswers(prev => ({ ...prev, [selectedDot]: e.target.value }))}
                    placeholder="Type place name..."
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '0.5rem 0.75rem',
                      color: 'var(--text)', fontSize: '0.88rem', outline: 'none',
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '1rem', marginBottom: '1rem',
                  color: 'var(--text3)', fontSize: '0.85rem', textAlign: 'center',
                }}>
                  ← Click a dot on the map to answer
                </div>
              )}

              {/* Hints list */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {mapQ.entries.map(e => (
                  <div
                    key={e.number}
                    onClick={() => setSelectedDot(selectedDot === e.number ? null : e.number)}
                    style={{
                      display: 'flex', gap: '0.5rem', alignItems: 'center',
                      padding: '0.4rem 0.6rem', borderRadius: 5, marginBottom: 3,
                      background: selectedDot === e.number ? 'rgba(180,140,60,0.12)' : 'transparent',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                  >
                    <span style={{
                      minWidth: 22, height: 22, borderRadius: '50%',
                      background: mapAnswers[e.number] ? 'var(--accent)' : 'var(--bg3)',
                      color: mapAnswers[e.number] ? '#fff' : 'var(--text3)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700,
                    }}>{e.number}</span>
                    <span style={{ color: 'var(--text2)', fontSize: '0.8rem', flex: 1 }}>{e.hint}</span>
                    {mapAnswers[e.number] && (
                      <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Written Questions */}
        {questions.map((q, i) => (
          <div key={q.id} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderLeft: `3px solid ${q.section.startsWith('Paper I') ? 'var(--accent)' : 'var(--blue, #4c8bc9)'}`,
            borderRadius: 8, padding: '1.5rem', marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{
                  background: q.section.startsWith('Paper I') ? 'rgba(180,140,60,0.12)' : 'rgba(76,139,201,0.12)',
                  color: q.section.startsWith('Paper I') ? 'var(--accent)' : 'var(--blue,#4c8bc9)',
                  border: `1px solid ${q.section.startsWith('Paper I') ? 'rgba(180,140,60,0.3)' : 'rgba(76,139,201,0.3)'}`,
                  fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                  padding: '2px 8px', borderRadius: 3,
                }}>Q{i + 2} · {q.section.replace('Paper I - ', 'P1 · ').replace('Paper II - ', 'P2 · ')}</span>
                <span style={{
                  background: 'var(--bg3)', color: 'var(--text3)',
                  fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                  padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border)',
                }}>{q.marks}M · {minutesFor(q.marks)} min</span>
              </div>
              <span style={{ color: 'var(--text3)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{q.year}</span>
            </div>

            <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1rem' }}>
              {q.question}
            </p>

            <textarea
              value={answers[q.id] ?? ''}
              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Write your answer here..."
              rows={6}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '0.75rem 1rem',
                color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                lineHeight: 1.6, resize: 'vertical', outline: 'none',
              }}
            />
          </div>
        ))}

        {/* Bottom submit */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={handleSubmit}
            style={{
              background: '#e05c2a', color: '#fff', border: 'none',
              borderRadius: 8, padding: '0.85rem 3rem',
              fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            }}
          >Submit & See Results</button>
        </div>
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (phase === 'results' && mapQ) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
            Test Results
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            Self-evaluate each answer and mark your score. Map answers are auto-revealed for comparison.
          </p>
        </div>

        {/* Score card */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '1.5rem', marginBottom: '2rem',
          display: 'flex', gap: '2rem', flexWrap: 'wrap',
        }}>
          <ScoreStat label="Self Score" value={`${Math.round(earnedMarks)}`} sub={`/ ${totalMarks}`} accent />
          <ScoreStat label="Questions" value={`${questions.length + 1}`} sub="incl. map" />
          <ScoreStat label="Time Taken" value={display !== '00:00' ? `${Math.floor((totalSeconds - remaining) / 60)}m` : `${duration}m`} sub="used" />
          <ScoreStat label="Map Score" value={`${Object.values(mapRevealed).filter(Boolean).length * 2.5}`} sub="/ 50" />
        </div>

        {/* Map Results */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderLeft: '3px solid var(--accent)', borderRadius: 8,
          padding: '1.5rem', marginBottom: '1.25rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.4rem' }}>
            Q1 · Map Question · 50 marks · {mapQ.year}
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
            Click "Reveal" next to each dot to see the correct answer and self-evaluate.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 280px' }}>
              <IndiaMap
                mapType={mapQ.mapType}
                entries={mapQ.entries}
                selectedDot={null}
                onDotClick={() => {}}
                answered={mapAnswers}
                revealed={mapRevealed}
              />
            </div>
            <div style={{ flex: '1 1 260px', maxHeight: 400, overflowY: 'auto' }}>
              {mapQ.entries.map(e => (
                <div key={e.number} style={{
                  borderBottom: '1px solid var(--border)', paddingBottom: '0.6rem', marginBottom: '0.6rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{
                      minWidth: 22, height: 22, borderRadius: '50%',
                      background: mapRevealed[e.number] ? '#22a85a' : 'var(--bg3)',
                      color: mapRevealed[e.number] ? '#fff' : 'var(--text3)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700,
                    }}>{e.number}</span>
                    <span style={{ color: 'var(--text2)', fontSize: '0.8rem', flex: 1 }}>{e.hint}</span>
                    {!mapRevealed[e.number] && (
                      <button
                        onClick={() => setMapRevealed(prev => ({ ...prev, [e.number]: true }))}
                        style={{
                          background: 'none', border: '1px solid var(--border)',
                          color: 'var(--text3)', borderRadius: 4,
                          padding: '2px 8px', fontSize: '0.72rem', cursor: 'pointer',
                        }}
                      >Reveal</button>
                    )}
                  </div>
                  {mapAnswers[e.number] && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text3)', paddingLeft: 28 }}>
                      Your answer: <em style={{ color: 'var(--text)' }}>{mapAnswers[e.number]}</em>
                    </div>
                  )}
                  {mapRevealed[e.number] && (
                    <div style={{ fontSize: '0.78rem', color: '#22a85a', paddingLeft: 28 }}>
                      ✓ {e.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Written Q Results */}
        {questions.map((q, i) => (
          <div key={q.id} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderLeft: `3px solid ${q.section.startsWith('Paper I') ? 'var(--accent)' : 'var(--blue,#4c8bc9)'}`,
            borderRadius: 8, padding: '1.5rem', marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  background: q.section.startsWith('Paper I') ? 'rgba(180,140,60,0.12)' : 'rgba(76,139,201,0.12)',
                  color: q.section.startsWith('Paper I') ? 'var(--accent)' : 'var(--blue,#4c8bc9)',
                  border: `1px solid ${q.section.startsWith('Paper I') ? 'rgba(180,140,60,0.3)' : 'rgba(76,139,201,0.3)'}`,
                  fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                  padding: '2px 8px', borderRadius: 3,
                }}>Q{i + 2}</span>
                <span style={{
                  background: 'var(--bg3)', color: 'var(--text3)',
                  fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                  padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border)',
                }}>{q.marks}M</span>
                <span style={{ color: 'var(--text3)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{q.year}</span>
              </div>
              {/* Self-score selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>Self score:</span>
                <select
                  value={selfScores[q.id] ?? ''}
                  onChange={e => setSelfScores(prev => ({ ...prev, [q.id]: Number(e.target.value) }))}
                  style={{
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 4, padding: '3px 8px', color: 'var(--text)', fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">—</option>
                  {Array.from({ length: q.marks + 1 }, (_, n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>/ {q.marks}</span>
              </div>
            </div>

            <p style={{ color: 'var(--text)', fontSize: '0.92rem', lineHeight: 1.65, marginBottom: '0.75rem' }}>
              {q.question}
            </p>

            {answers[q.id] ? (
              <div style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '0.75rem 1rem',
                color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {answers[q.id]}
              </div>
            ) : (
              <div style={{ color: 'var(--text3)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No answer written.
              </div>
            )}
          </div>
        ))}

        {/* Start again */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setPhase('config')} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '0.85rem 2rem',
            fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
          }}>Start Another Test</button>
          <button onClick={() => window.location.href = '/pyqs'} style={{
            background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.85rem 2rem',
            fontSize: '0.95rem', cursor: 'pointer',
          }}>Back to PYQs</button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Helper UI Components ─────────────────────────────────────────────────────

function Section2({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div style={{
        color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase',
        letterSpacing: '0.1em', marginBottom: '0.75rem',
      }}>{title}</div>
      {children}
    </div>
  );
}

function OptionBtn({
  active, onClick, children, small,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? '0.45rem 1rem' : '0.65rem 1.25rem',
        borderRadius: 8,
        border: active ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'rgba(180,140,60,0.1)' : 'var(--bg2)',
        color: active ? 'var(--accent)' : 'var(--text)',
        fontFamily: 'var(--font-ui)',
        fontSize: small ? '0.85rem' : '0.9rem',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
        textAlign: 'left' as const,
      }}
    >{children}</button>
  );
}

function ScoreStat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
        <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: accent ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
        <span style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>{sub}</span>
      </div>
    </div>
  );
}
