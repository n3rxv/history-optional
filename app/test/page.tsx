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

// ─── India Map (d3-geo + TopoJSON fetched client-side) ───────────────────────

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const INDIA_ID = 356;
const NEIGHBOUR_IDS = new Set([586, 156, 524, 64, 50, 104, 144, 4]);
const W = 560, H = 620;

// Manual Mercator projection matching react-simple-maps' projectionConfig
// { center: [83, 23], scale: 800 }
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

// Convert a ring of [lng,lat] pairs to an SVG path string
function ringToPath(ring: number[][]): string {
  return ring.map(([lng, lat], i) => {
    const [x, y] = mercProject(lng, lat);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + ' Z';
}

// Decode a TopoJSON arc delta-encoded array into absolute [lng,lat] coords
function decodeArc(arc: number[][], transform: { scale: [number,number]; translate: [number,number] }): number[][] {
  const [sx, sy] = transform.scale;
  const [tx, ty] = transform.translate;
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * sx + tx, y * sy + ty];
  });
}

// Resolve TopoJSON arcs (positive = forward, negative = reversed, ~index)
function resolveArcs(
  arcIndices: number[],
  arcs: number[][][],
  transform: { scale: [number,number]; translate: [number,number] }
): number[][] {
  const pts: number[][] = [];
  for (const idx of arcIndices) {
    const raw = idx >= 0 ? arcs[idx] : [...arcs[~idx]].reverse();
    const decoded = decodeArc(raw, transform);
    // Skip first point of each arc after the first (they share endpoints)
    pts.push(...(pts.length === 0 ? decoded : decoded.slice(1)));
  }
  return pts;
}

// Build SVG path string from a TopoJSON geometry
function geomToPath(geom: any, arcs: number[][][], transform: any): string {
  const paths: string[] = [];
  if (geom.type === 'Polygon') {
    for (const ring of geom.arcs) {
      paths.push(ringToPath(resolveArcs(ring, arcs, transform)));
    }
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.arcs) {
      for (const ring of poly) {
        paths.push(ringToPath(resolveArcs(ring, arcs, transform)));
      }
    }
  }
  return paths.join(' ');
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
  const [geos, setGeos] = useState<{ id: number; d: string }[]>([]);

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(topo => {
        const { arcs, transform, objects } = topo;
        const features = objects.countries.geometries as any[];
        const result = features
          .filter((g: any) => {
            const id = Number(g.id);
            return id === INDIA_ID || NEIGHBOUR_IDS.has(id);
          })
          .map((g: any) => ({ id: Number(g.id), d: geomToPath(g, arcs, transform) }));
        setGeos(result);
      });
  }, []);

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
        {geos.map(({ id, d }) => (
          <path
            key={id}
            d={d}
            fill={id === INDIA_ID ? '#ffffff' : '#e8e8e8'}
            stroke={id === INDIA_ID ? '#333' : '#aaa'}
            strokeWidth={id === INDIA_ID ? 1.5 : 0.8}
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
