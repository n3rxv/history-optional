'use client';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { paper1Notes, paper2Notes, paper1Sections, paper2Sections } from '@/lib/notes';
import { useSyllabusTracker } from '@/hooks/useSyllabusTracker';
import { loadHistory, AnswerEntry } from '@/hooks/useAnswerHistory';

const ALL_NOTES = [...paper1Notes, ...paper2Notes];
const TOTAL = ALL_NOTES.length;

function Ring({ pct, size = 80, stroke = 6, color = 'var(--accent)' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
}

function StatCard({ label, value, sub, color = 'var(--text)' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem 1.25rem' }}>
      <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ color, fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: '0.35rem' }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ pct, color = 'var(--accent)' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 3, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function entryScore(e: AnswerEntry): number {
  const sm = e.sectionMarks;
  if (!sm) return 0;
  const total = (sm.introduction?.out_of || 0) + (sm.body?.out_of || 0) + (sm.conclusion?.out_of || 0) + (sm.presentation?.out_of || 0);
  const awarded = (sm.introduction?.awarded || 0) + (sm.body?.awarded || 0) + (sm.conclusion?.awarded || 0) + (sm.presentation?.awarded || 0);
  return total > 0 ? Math.round((awarded / total) * 100) : Math.round((e.marks / e.marksOutOf) * 100);
}

function sectionPct(e: AnswerEntry, sec: 'introduction' | 'body' | 'conclusion' | 'presentation'): number {
  const s = e.sectionMarks?.[sec];
  if (!s || s.out_of === 0) return 0;
  return s.awarded / s.out_of;
}

function Sparkline({ values, color = '#3b82f6' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const w = 120, h = 32, pad = 3;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const lastPt = pts.split(' ').at(-1)!.split(',');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r={2.5} fill={color} />
    </svg>
  );
}

function Heatmap({ activityMap }: { activityMap: Record<string, number> }) {
  const days = 84;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: { dateStr: string; count: number; dayOfWeek: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    cells.push({ dateStr, count: activityMap[dateStr] || 0, dayOfWeek: d.getDay() });
  }
  const firstDay = cells[0].dayOfWeek;
  const padded: ({ dateStr: string; count: number } | null)[] = [...Array(firstDay).fill(null), ...cells];
  const weeks: ({ dateStr: string; count: number } | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
  const color = (count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.05)';
    if (count === 1) return 'rgba(59,130,246,0.3)';
    if (count === 2) return 'rgba(59,130,246,0.55)';
    if (count === 3) return 'rgba(59,130,246,0.75)';
    return '#3b82f6';
  };
  const totalActive = Object.keys(activityMap).length;
  return (
    <div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {week.map((cell, di) =>
              cell === null ? (
                <div key={di} style={{ width: 10, height: 10 }} />
              ) : (
                <div key={di} title={`${cell.dateStr}: ${cell.count} action${cell.count !== 1 ? 's' : ''}`}
                  style={{ width: 10, height: 10, borderRadius: 2, background: color(cell.count) }} />
              )
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{totalActive} active days in last 12 weeks</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--text3)' }}>less</span>
          {[0, 1, 2, 3, 4].map(n => <div key={n} style={{ width: 8, height: 8, borderRadius: 1, background: color(n) }} />)}
          <span style={{ fontSize: '0.6rem', color: 'var(--text3)' }}>more</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { countCompleted, mounted, progress } = useSyllabusTracker();
  const [streak, setStreak] = useState(0);
  const [evalHistory, setEvalHistory] = useState<AnswerEntry[]>([]);

  useEffect(() => {
    if (!mounted) return;
    setEvalHistory(loadHistory());
    const stored = localStorage.getItem('ho_streak_v1');
    const data = stored ? JSON.parse(stored) : { streak: 0, lastDate: '' };
    setStreak(data.streak);
  }, [mounted]);

  const p1Slugs = paper1Notes.map(n => n.slug);
  const p2Slugs = paper2Notes.map(n => n.slug);
  const p1Done = mounted ? countCompleted(p1Slugs) : 0;
  const p2Done = mounted ? countCompleted(p2Slugs) : 0;
  const totalDone = p1Done + p2Done;
  const overallPct = TOTAL === 0 ? 0 : totalDone / TOTAL;

  const sections = [
    ...paper1Sections.map(s => ({ label: s, notes: paper1Notes.filter(n => n.section === s) })),
    ...paper2Sections.map(s => ({ label: s, notes: paper2Notes.filter(n => n.section === s) })),
  ];

  const notStarted = mounted ? ALL_NOTES.filter(n => !progress.completed[n.slug]).slice(0, 5) : [];
  const pct = (n: number, d: number) => d === 0 ? 0 : n / d;

  const evalStats = useMemo(() => {
    if (!evalHistory.length) return null;
    const scores = evalHistory.map(entryScore);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const best = Math.max(...scores);
    const recent5 = [...scores].slice(0, 5).reverse();
    const secKeys = ['introduction', 'body', 'conclusion', 'presentation'] as const;
    const sectionAvgs = secKeys.map(sec => {
      const vals = evalHistory.map(e => sectionPct(e, sec)).filter(v => v > 0);
      return { sec, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
    });
    const weakest = [...sectionAvgs].sort((a, b) => a.avg - b.avg)[0];
    const strongest = [...sectionAvgs].sort((a, b) => b.avg - a.avg)[0];
    // Per-topic breakdown
    const topicMap: Record<string, { title: string; scores: number[]; slug: string }> = {};
    for (const e of evalHistory) {
      if (!e.topicSlug || !e.topicTitle) continue;
      if (!topicMap[e.topicSlug]) topicMap[e.topicSlug] = { title: e.topicTitle, scores: [], slug: e.topicSlug };
      topicMap[e.topicSlug].scores.push(entryScore(e));
    }
    const topicStats = Object.values(topicMap)
      .map(t => ({ ...t, avg: Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length), count: t.scores.length }))
      .sort((a, b) => a.avg - b.avg);

    return { avg, best, recent5, sectionAvgs, weakest, strongest, total: evalHistory.length, topicStats };
  }, [evalHistory]);

  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!mounted) return map;
    evalHistory.forEach(e => { const d = e.date.slice(0, 10); map[d] = (map[d] || 0) + 1; });
    try {
      const raw = localStorage.getItem('ho_syllabus_v1');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.completionDates) {
          Object.values(data.completionDates as Record<string, string>).forEach(dateStr => {
            const d = dateStr.slice(0, 10);
            map[d] = (map[d] || 0) + 1;
          });
        }
      }
    } catch {}
    return map;
  }, [mounted, evalHistory, progress]);

  const needsRevision = useMemo(() => {
    if (!mounted) return [];
    try {
      const raw = localStorage.getItem('ho_syllabus_v1');
      if (!raw) return [];
      const data = JSON.parse(raw);
      const dates: Record<string, string> = data.completionDates || {};
      const thirtyDaysAgo = Date.now() - 30 * 86400000;
      return ALL_NOTES.filter(n => {
        if (!progress.completed[n.slug]) return false;
        if (!dates[n.slug]) return false;
        return new Date(dates[n.slug]).getTime() < thirtyDaysAgo;
      }).slice(0, 6);
    } catch { return []; }
  }, [mounted, progress]);

  const scoreColor = (s: number) => s >= 70 ? '#4ade80' : s >= 50 ? '#f59e0b' : '#f87171';
  const capLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Your Study Dashboard</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>Progress Overview</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Tracking your syllabus completion across all 51 topics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ring pct={overallPct} size={100} stroke={7} color={overallPct === 1 ? '#4ade80' : 'var(--accent)'} />
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: overallPct === 1 ? '#4ade80' : 'var(--text)', lineHeight: 1 }}>
              {mounted ? Math.round(overallPct * 100) : '—'}%
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' }}>
            {mounted ? `${totalDone} of ${TOTAL} topics completed` : `— of ${TOTAL} topics`}
          </div>
          <div style={{ color: 'var(--text3)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            {mounted && totalDone === 0 && 'Start checking off topics on the Paper I & II pages.'}
            {mounted && totalDone > 0 && totalDone < TOTAL && `${TOTAL - totalDone} topics remaining. Keep going!`}
            {mounted && totalDone === TOTAL && "🎉 Full syllabus complete! You're ready to ace it."}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/paper1" style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', background: 'var(--accent-dim)', border: '1px solid rgba(59,130,246,0.2)', padding: '4px 10px', borderRadius: 5 }}>Paper I →</Link>
            <Link href="/paper2" style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', background: 'var(--accent-dim)', border: '1px solid rgba(59,130,246,0.2)', padding: '4px 10px', borderRadius: 5 }}>Paper II →</Link>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <StatCard label="Paper I" value={`${p1Done}/${paper1Notes.length}`} sub={`${Math.round(pct(p1Done, paper1Notes.length) * 100)}% done`} color="var(--accent)" />
        <StatCard label="Paper II" value={`${p2Done}/${paper2Notes.length}`} sub={`${Math.round(pct(p2Done, paper2Notes.length) * 100)}% done`} color="var(--accent)" />
        <StatCard label="Day Streak" value={mounted ? streak : '—'} sub={streak >= 3 ? '🔥 On a roll!' : 'Complete topics to build streak'} color={streak >= 3 ? '#f59e0b' : 'var(--text)'} />
        <StatCard label="Answers Evaluated" value={mounted ? evalHistory.length : '—'} sub={evalStats ? `avg ${evalStats.avg}%` : 'No evaluations yet'} color={evalStats ? scoreColor(evalStats.avg) : 'var(--text)'} />
      </div>

      {mounted && evalStats && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Evaluation Performance</div>
            <Link href="/evaluate" style={{ fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none' }}>Evaluate →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Avg Score', value: `${evalStats.avg}%`, color: scoreColor(evalStats.avg) },
              { label: 'Best Score', value: `${evalStats.best}%`, color: scoreColor(evalStats.best) },
              { label: 'Total Evals', value: evalStats.total, color: 'var(--text)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>Section Averages</div>
              {evalStats.sectionAvgs.map(({ sec, avg }) => (
                <div key={sec} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{capLabel(sec)}</span>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: scoreColor(Math.round(avg * 100)) }}>{Math.round(avg * 100)}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${avg * 100}%`, background: scoreColor(Math.round(avg * 100)), borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
            {evalStats.recent5.length >= 2 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Score trend</div>
                <Sparkline values={evalStats.recent5} color={scoreColor(evalStats.avg)} />
                <div style={{ fontSize: '0.62rem', color: 'var(--text3)', marginTop: 4 }}>last {evalStats.recent5.length} evals</div>
              </div>
            )}
          </div>
        </div>
      )}

      {mounted && !evalStats && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text3)', marginBottom: '0.5rem' }}>No evaluations yet</div>
          <Link href="/evaluate" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>Submit your first answer →</Link>
        </div>
      )}

      {mounted && evalStats && evalStats.weakest && evalStats.weakest.avg < 0.65 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>⚠</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Weak Area Detected</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: '0.75rem' }}>
                Your <span style={{ color: '#f87171', fontWeight: 600 }}>{capLabel(evalStats.weakest.sec)}</span> averages <span style={{ color: '#f87171', fontWeight: 600 }}>{Math.round(evalStats.weakest.avg * 100)}%</span> across your evaluations.{' '}
                {evalStats.weakest.sec === 'body' && 'Focus on using historians, addressing demand, and developing each argument fully.'}
                {evalStats.weakest.sec === 'introduction' && 'Focus on contextualising the question and previewing your argument clearly.'}
                {evalStats.weakest.sec === 'conclusion' && 'Focus on answering the question directly and synthesising your key arguments.'}
                {evalStats.weakest.sec === 'presentation' && 'Focus on structure, word count and legibility.'}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href="/evaluate" style={{ fontSize: '0.75rem', color: '#f87171', textDecoration: 'none', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', padding: '4px 10px', borderRadius: 5 }}>Practice now →</Link>
                {evalStats.strongest && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                    ✓ Strongest: <span style={{ color: '#4ade80' }}>{capLabel(evalStats.strongest.sec)} ({Math.round(evalStats.strongest.avg * 100)}%)</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {mounted && evalStats && evalStats.topicStats.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Performance by Topic</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{evalStats.topicStats.length} topic{evalStats.topicStats.length !== 1 ? 's' : ''} practised</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {evalStats.topicStats.map(t => (
              <div key={t.slug}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 500 }}>{t.title}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{t.count} answer{t.count !== 1 ? 's' : ''}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: scoreColor(t.avg), fontWeight: 600 }}>{t.avg}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${t.avg}%`, background: scoreColor(t.avg), borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
          {evalStats.topicStats.length > 0 && evalStats.topicStats[0].avg < 60 && (
            <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: '#f87171', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 6, padding: '8px 12px' }}>
              Weakest topic: <span style={{ fontWeight: 600 }}>{evalStats.topicStats[0].title}</span> — focus here next.
            </div>
          )}
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>Study Activity — Last 12 Weeks</div>
        {mounted
          ? <Heatmap activityMap={activityMap} />
          : <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '0.8rem' }}>Loading…</div>
        }
      </div>

      {mounted && needsRevision.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Due for Revision</div>
            <span style={{ fontSize: '0.65rem', color: '#f59e0b', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', padding: '2px 7px', borderRadius: 10 }}>Completed 30+ days ago</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {needsRevision.map(note => (
              <Link key={note.slug} href={`/notes/${note.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(234,179,8,0.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#f59e0b', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', padding: '2px 6px', borderRadius: 3, flexShrink: 0 }}>
                    P{note.paper}·{note.topic}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.83rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{note.section}</div>
                  </div>
                  <span style={{ color: 'var(--text3)', fontSize: '0.8rem', flexShrink: 0 }}>Revise →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>Section Breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {sections.map(sec => {
            const done = mounted ? countCompleted(sec.notes.map(n => n.slug)) : 0;
            const p = pct(done, sec.notes.length);
            const isComplete = done === sec.notes.length;
            return (
              <div key={sec.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: isComplete ? '#4ade80' : 'var(--text2)', fontWeight: 500 }}>
                    {isComplete ? '✓ ' : ''}{sec.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: isComplete ? '#4ade80' : 'var(--text3)' }}>
                    {mounted ? done : '—'}/{sec.notes.length}
                  </span>
                </div>
                <MiniBar pct={p} color={isComplete ? '#4ade80' : 'var(--accent)'} />
              </div>
            );
          })}
        </div>
      </div>

      {mounted && notStarted.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.85rem' }}>Up Next — Continue Studying</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notStarted.map(note => (
              <Link key={note.slug} href={`/notes/${note.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent2)'; el.style.background = 'var(--bg4)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.background = 'var(--bg3)'; }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(59,130,246,0.2)', padding: '2px 6px', borderRadius: 3, flexShrink: 0 }}>
                    P{note.paper}·{note.topic}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.83rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{note.section}</div>
                  </div>
                  <span style={{ color: 'var(--text3)', fontSize: '0.8rem', flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
          {TOTAL - totalDone > 5 && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text3)', textAlign: 'center' }}>+{TOTAL - totalDone - 5} more topics remaining</div>
          )}
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: '0.75rem' }}>Study Tools</div>
        <Link href="/flashcards" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', textDecoration: 'none' }}>
          <div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 500, marginBottom: '0.2rem' }}>Analytical Flashcards</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>55 cards — historian arguments, comparisons, cause-effect chains</div>
          </div>
          <span style={{ color: 'var(--text3)', fontSize: '0.85rem', marginLeft: '1rem' }}>→</span>
        </Link>
      </div>

      {mounted && totalDone === TOTAL && (
        <div style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 14, padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#4ade80', fontWeight: 700, marginBottom: '0.4rem' }}>Full Syllabus Complete!</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>You have covered all 51 topics. Time to practice answers and revise.</div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <Link href="/evaluate" style={{ fontSize: '0.82rem', color: '#4ade80', textDecoration: 'none', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', padding: '6px 14px', borderRadius: 6 }}>Practice Answers →</Link>
            <Link href="/pyqs" style={{ fontSize: '0.82rem', color: 'var(--text2)', textDecoration: 'none', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 6 }}>Browse PYQs →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
