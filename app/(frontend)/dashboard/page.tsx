'use client';
import { useLang } from '@/lib/i18n/LangContext';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { paper1Notes, paper2Notes, paper1Sections, paper2Sections } from '@/lib/notes';
import { useSyllabusTracker } from '@/hooks/useSyllabusTracker';
import { loadHistory, AnswerEntry } from '@/hooks/useAnswerHistory';
// Ranges, not the questions themselves: lib/pyqData.ts is 608 KB of question
// text and this page needs to know which section an id falls in, nothing more.
import { PYQ_SECTION_TOTALS, PYQ_TOTAL, sectionForPyq } from '@/lib/pyqSectionRanges';

const ALL_NOTES = [...paper1Notes, ...paper2Notes];
const TOTAL = ALL_NOTES.length;

function Ring({ pct, size = 80, stroke = 6, color = 'var(--accent)' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
}

/**
 * The flashcard review state, read from where the study page keeps it.
 *
 * Same store, same shape -- app/(frontend)/flashcards/page.tsx owns the
 * writing, this only reads. Duplicated rather than imported because that page
 * is a heavy client component and the dashboard needs four numbers from it,
 * not its bundle.
 */
type FlashSR = { nextDue: string; reps: number; lastGrade?: 1 | 2 | 3 | 4 };

type FlashStats = {
  /** Distinct cards this reader has graded at least once. */
  reviewed: number;
  /** Of those, how many have come round again. */
  due: number;
  /** Cards whose most recent grade was Good or Easy, as a percentage. */
  recall: number | null;
  /** Cards in the last session, for a nudge back into it. */
  lastSession: number;
};

function loadFlashStats(): FlashStats {
  const empty: FlashStats = { reviewed: 0, due: 0, recall: null, lastSession: 0 };
  if (typeof window === 'undefined') return empty;

  let sr: Record<string, FlashSR> = {};
  try { sr = JSON.parse(localStorage.getItem('ho_flashcards_v1') ?? '{}'); } catch { return empty; }

  const entries = Object.values(sr);
  if (!entries.length) return empty;

  const now = new Date().toISOString();
  // Cards carrying a grade. Entries saved before lastGrade existed have none,
  // so they are left out of the percentage rather than counted as failures.
  const graded = entries.filter((e) => e.lastGrade != null);
  const recalled = graded.filter((e) => (e.lastGrade ?? 0) >= 3).length;

  let lastSession = 0;
  try {
    const v = JSON.parse(localStorage.getItem('ho_flashcards_last_session_v1') ?? '[]');
    if (Array.isArray(v)) lastSession = v.length;
  } catch { /* the count is a nicety; its absence is not an error */ }

  return {
    reviewed: entries.length,
    due: entries.filter((e) => e.nextDue <= now).length,
    recall: graded.length ? Math.round((recalled / graded.length) * 100) : null,
    lastSession,
  };
}

/**
 * How much of the PYQ set the reader has attempted, by section.
 *
 * The ticks live in ho_pyq_attempted_v1 as id -> date, which says nothing
 * about which paper a question belongs to, so ids are bucketed through the
 * generated range table.
 */
type PyqCoverage = {
  attempted: number;
  total: number;
  sections: { section: string; attempted: number; total: number }[];
};

function loadPyqCoverage(): PyqCoverage {
  const sections = Object.entries(PYQ_SECTION_TOTALS).map(([section, total]) => ({
    section, attempted: 0, total,
  }));
  const empty: PyqCoverage = { attempted: 0, total: PYQ_TOTAL, sections };
  if (typeof window === 'undefined') return empty;

  let raw: unknown;
  try { raw = JSON.parse(localStorage.getItem('ho_pyq_attempted_v1') ?? '{}'); } catch { return empty; }

  // The hook accepts an older array shape as well as the current map, so this
  // reader has to take both or a long-standing reader reads as zero.
  const ids = Array.isArray(raw)
    ? raw.filter((v): v is number => typeof v === 'number')
    : raw && typeof raw === 'object'
    ? Object.keys(raw).map(Number).filter((n) => Number.isFinite(n))
    : [];

  const perSection = new Map(sections.map((s) => [s.section, 0]));
  let attempted = 0;
  for (const id of ids) {
    const sec = sectionForPyq(id);
    // An id from a question that no longer exists is not counted, so a stale
    // tick cannot push a section above its own total.
    if (sec === null || !perSection.has(sec)) continue;
    perSection.set(sec, (perSection.get(sec) ?? 0) + 1);
    attempted += 1;
  }

  return {
    attempted,
    total: PYQ_TOTAL,
    sections: sections.map((s) => ({ ...s, attempted: perSection.get(s.section) ?? 0 })),
  };
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

function Sparkline({ values, color = 'var(--accent)' }: { values: number[]; color?: string }) {
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
    if (count === 0) return 'rgba(0,0,0,0.05)';
    if (count === 1) return 'color-mix(in srgb, var(--accent) 30%, transparent)';
    if (count === 2) return 'color-mix(in srgb, var(--accent) 55%, transparent)';
    if (count === 3) return 'color-mix(in srgb, var(--accent) 75%, transparent)';
    return 'var(--accent)';
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
  const [flash, setFlash] = useState<FlashStats | null>(null);
  const [pyq, setPyq] = useState<PyqCoverage | null>(null);
  const { langHi } = useLang();
  const [streak, setStreak] = useState(0);
  const [evalHistory, setEvalHistory] = useState<AnswerEntry[]>([]);

  useEffect(() => {
    if (!mounted) return;
    setEvalHistory(loadHistory());
    setFlash(loadFlashStats());
    setPyq(loadPyqCoverage());
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

  const scoreColor = (s: number) => s >= 70 ? 'var(--success-text)' : s >= 50 ? 'var(--warning-text)' : 'var(--danger-text)';
  const capLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  /**
   * What is worth doing right now.
   *
   * Everything below this block reports state; a reader still has to decide
   * what to open. These are the same numbers, turned into at most three
   * things to click, in the order a day's study would take them: what has
   * come round again, then what is going badly, then what has gone cold.
   *
   * Only real items appear. Padding the list out with generic advice when
   * nothing is due would teach readers to stop reading it.
   */
  const todo = useMemo(() => {
    if (!mounted) return [];
    const items: { key: string; text: string; href: string; tone: string }[] = [];

    if (flash && flash.due > 0) {
      items.push({
        key: 'cards',
        text: langHi ? `${flash.due} फ्लैशकार्ड दोहराने हैं` : `${flash.due} flashcards due for review`,
        href: '/flashcards',
        tone: 'var(--warning-text)',
      });
    }

    // A weakest section only means something once there are enough evaluations
    // for the ranking not to be noise, and only worth flagging below par.
    if (evalStats && evalStats.total >= 3 && evalStats.weakest && evalStats.weakest.avg < 0.6) {
      const pctv = Math.round(evalStats.weakest.avg * 100);
      items.push({
        key: 'weak',
        text: langHi
          ? `${capLabel(evalStats.weakest.sec)} सबसे कमज़ोर है — ${pctv}%`
          : `${capLabel(evalStats.weakest.sec)} is your weakest section — ${pctv}%`,
        href: '/evaluate',
        tone: 'var(--danger-text)',
      });
    }

    if (needsRevision.length > 0) {
      items.push({
        key: 'revise',
        text: langHi
          ? `${needsRevision.length} नोट्स 30+ दिन से नहीं दोहराए`
          : `${needsRevision.length} notes not revised in 30+ days`,
        href: `/notes/${needsRevision[0].slug}`,
        tone: 'var(--warning-text)',
      });
    }

    if (pyq) {
      const untouched = pyq.sections.filter(x => x.attempted === 0);
      if (untouched.length > 0) {
        items.push({
          key: 'pyq',
          text: langHi
            ? `${untouched[0].section} के PYQ अभी शुरू नहीं किए`
            : `No PYQs attempted yet in ${untouched[0].section}`,
          href: '/pyqs',
          tone: 'var(--text2)',
        });
      }
    }

    if (totalDone < TOTAL && items.length === 0) {
      items.push({
        key: 'syllabus',
        text: langHi
          ? `${TOTAL - totalDone} विषय बाकी हैं`
          : `${TOTAL - totalDone} syllabus topics still to cover`,
        href: '/paper1',
        tone: 'var(--text2)',
      });
    }

    return items.slice(0, 3);
  }, [mounted, flash, evalStats, needsRevision, pyq, totalDone, langHi]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{langHi ? 'आपका अध्ययन डैशबोर्ड' : 'Your Study Dashboard'}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>{langHi ? 'प्रगति अवलोकन' : 'Progress Overview'}</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>{langHi ? 'सभी 51 विषयों में आपकी पाठ्यक्रम प्रगति ट्रैक हो रही है।' : 'Tracking your syllabus completion across all 51 topics.'}</p>
      </div>

      {/* Today. Placed above the progress ring on purpose: a reader arriving
          here wants to know what to open, and the ring answers a different
          question. Hidden entirely when there is nothing real to show. */}
      {mounted && todo.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-3)' }}>
            {langHi ? 'आज' : 'Today'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {todo.map(item => (
              <Link key={item.key} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg3)',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.tone, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', color: 'var(--text)' }}>{item.text}</span>
                  <span style={{ color: 'var(--text3)', fontSize: '0.8rem', flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ring pct={overallPct} size={100} stroke={7} color={overallPct === 1 ? 'var(--success-text)' : 'var(--accent)'} />
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: overallPct === 1 ? 'var(--success-text)' : 'var(--text)', lineHeight: 1 }}>
              {mounted ? Math.round(overallPct * 100) : '—'}%
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' }}>
            {mounted ? `${totalDone} of ${TOTAL} topics completed` : `— of ${TOTAL} topics`}
          </div>
          {/* One line, chosen by how far along the reader is. Written as three
              guarded expressions it read `a && b && langHi ? hi : en`, which
              groups as `(a && b && langHi) ? hi : en` -- so an English reader
              always fell to the else of every line and saw "Start checking off
              topics" stacked on top of "31 topics remaining", whatever their
              actual progress. Hindi readers saw it correctly, which is how it
              survived. */}
          <div style={{ color: 'var(--text3)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            {!mounted
              ? ''
              : totalDone === 0
              ? (langHi
                  ? 'Paper I और II पृष्ठों पर विषय चिह्नित करना शुरू करें।'
                  : 'Start checking off topics on the Paper I & II pages.')
              : totalDone < TOTAL
              ? (langHi
                  ? `${TOTAL - totalDone} विषय शेष हैं। जारी रखें!`
                  : `${TOTAL - totalDone} topics remaining. Keep going!`)
              : (langHi
                  ? '🎉 पूरा पाठ्यक्रम पूर्ण! अब तैयारी पक्की है।'
                  : "🎉 Full syllabus complete! You're ready to ace it.")}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/paper1" style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', background: 'var(--accent-dim)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', padding: '4px 10px', borderRadius: 5 }}>{langHi ? 'पेपर I →' : 'Paper I →'}</Link>
            <Link href="/paper2" style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', background: 'var(--accent-dim)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', padding: '4px 10px', borderRadius: 5 }}>{langHi ? 'पेपर II →' : 'Paper II →'}</Link>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <StatCard label={langHi ? "पेपर I" : "Paper I"} value={`${p1Done}/${paper1Notes.length}`} sub={`${Math.round(pct(p1Done, paper1Notes.length) * 100)}% done`} color="var(--accent)" />
        <StatCard label={langHi ? "पेपर II" : "Paper II"} value={`${p2Done}/${paper2Notes.length}`} sub={`${Math.round(pct(p2Done, paper2Notes.length) * 100)}% done`} color="var(--accent)" />
        <StatCard label={langHi ? "दिन की लकीर" : "Day Streak"} value={mounted ? streak : '—'} sub={streak >= 3 ? '🔥 जोरदार चल रहे हो!' : langHi ? 'लकीर बनाने के लिए विषय पूरे करें' : 'Complete topics to build streak'} color={streak >= 3 ? 'var(--warning-text)' : 'var(--text)'} />
        <StatCard label={langHi ? "मूल्यांकित उत्तर" : "Answers Evaluated"} value={mounted ? evalHistory.length : '—'} sub={evalStats ? `avg ${evalStats.avg}%` : langHi ? 'अभी तक कोई मूल्यांकन नहीं' : 'No evaluations yet'} color={evalStats ? scoreColor(evalStats.avg) : 'var(--text)'} />
      </div>

      {mounted && evalStats && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{langHi ? 'मूल्यांकन प्रदर्शन' : 'Evaluation Performance'}</div>
            <Link href="/evaluate" style={{ fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none' }}>{langHi ? 'मूल्यांकन करें →' : 'Evaluate →'}</Link>
          </div>
          <div className="dash-eval-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
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
          <div className="dash-section-trend-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>{langHi ? 'अनुभाग औसत' : 'Section Averages'}</div>
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
                <div style={{ fontSize: '0.65rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{langHi ? 'स्कोर प्रवृत्ति' : 'Score trend'}</div>
                <Sparkline values={evalStats.recent5} color={scoreColor(evalStats.avg)} />
                <div style={{ fontSize: '0.62rem', color: 'var(--text3)', marginTop: 4 }}>last {evalStats.recent5.length} evals</div>
              </div>
            )}
          </div>
        </div>
      )}

      {mounted && !evalStats && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text3)', marginBottom: '0.5rem' }}>{langHi ? 'अभी तक कोई मूल्यांकन नहीं' : 'No evaluations yet'}</div>
          <Link href="/evaluate" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>{langHi ? 'अपना पहला उत्तर जमा करें →' : 'Submit your first answer →'}</Link>
        </div>
      )}

      {mounted && evalStats && evalStats.weakest && evalStats.weakest.avg < 0.65 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid color-mix(in srgb, var(--danger-text) 20%, transparent)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--danger-wash)', border: '1px solid color-mix(in srgb, var(--danger-text) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>⚠</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{langHi ? 'कमज़ोर क्षेत्र मिला' : 'Weak Area Detected'}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: '0.75rem' }}>
                Your <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>{capLabel(evalStats.weakest.sec)}</span> averages <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>{Math.round(evalStats.weakest.avg * 100)}%</span> across your evaluations.{' '}
                {evalStats.weakest.sec === 'body' && 'Focus on using historians, addressing demand, and developing each argument fully.'}
                {evalStats.weakest.sec === 'introduction' && 'Focus on contextualising the question and previewing your argument clearly.'}
                {evalStats.weakest.sec === 'conclusion' && 'Focus on answering the question directly and synthesising your key arguments.'}
                {evalStats.weakest.sec === 'presentation' && 'Focus on structure, word count and legibility.'}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href="/evaluate" style={{ fontSize: '0.75rem', color: 'var(--danger-text)', textDecoration: 'none', background: 'var(--danger-wash)', border: '1px solid color-mix(in srgb, var(--danger-text) 20%, transparent)', padding: '4px 10px', borderRadius: 5 }}>{langHi ? 'अभी अभ्यास करें →' : 'Practice now →'}</Link>
                {evalStats.strongest && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                    ✓ Strongest: <span style={{ color: 'var(--success-text)' }}>{capLabel(evalStats.strongest.sec)} ({Math.round(evalStats.strongest.avg * 100)}%)</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {mounted && evalStats && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{langHi ? 'विषयानुसार प्रदर्शन' : 'Performance by Topic'}</div>
            {evalStats.topicStats.length > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{evalStats.topicStats.length} topic{evalStats.topicStats.length !== 1 ? 's' : ''} practised</span>
            )}
          </div>
          {evalStats.topicStats.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <span style={{ fontSize: '0.85rem' }}>📊</span>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: 2 }}>{langHi ? 'अगले मूल्यांकन से विषय ट्रैकिंग शुरू होगी' : 'Topic tracking starts with your next evaluation'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{langHi ? 'नए मूल्यांकन स्वतः टैग होंगे — जैसे मौर्य साम्राज्य, फ्रांसीसी क्रांति।' : 'New evaluations will be tagged automatically — e.g. Mauryan Empire, French Revolution.'}</div>
              </div>
            </div>
          ) : (
            <>
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
              {evalStats.topicStats[0].avg < 60 && (
                <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: 'var(--danger-text)', background: 'var(--danger-wash)', border: '1px solid color-mix(in srgb, var(--danger-text) 15%, transparent)', borderRadius: 6, padding: '8px 12px' }}>
                  Weakest topic: <span style={{ fontWeight: 600 }}>{evalStats.topicStats[0].title}</span> — focus here next.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* PYQ coverage. For an optional, which past questions you have actually
          worked through is the measure that predicts the exam; the ticks
          existed already and nothing reported them. */}
      {mounted && pyq && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{langHi ? 'PYQ कवरेज' : 'PYQ Coverage'}</div>
            <Link href="/pyqs" style={{ fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none' }}>{langHi ? 'PYQ देखें →' : 'Browse PYQs →'}</Link>
          </div>

          {pyq.attempted === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
                {langHi ? 'अभी तक कोई PYQ चिह्नित नहीं।' : 'No PYQs marked as attempted yet.'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                {langHi
                  ? `${PYQ_TOTAL} प्रश्न उपलब्ध हैं — हल करने पर उन्हें चिह्नित करें, प्रगति यहाँ दिखेगी।`
                  : `${PYQ_TOTAL} questions are indexed — tick them as you work through them and coverage shows up here.`}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)', lineHeight: 1 }}>
                  {pyq.attempted}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
                  {langHi ? `/ ${pyq.total} प्रश्न हल किए` : `of ${pyq.total} questions attempted`}
                </span>
              </div>
              <div>
                {pyq.sections.map(({ section, attempted, total }) => {
                  const p = total ? attempted / total : 0;
                  return (
                    <div key={section} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{section}</span>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: attempted === 0 ? 'var(--text3)' : 'var(--text2)' }}>
                          {attempted}/{total}
                        </span>
                      </div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${p * 100}%`, background: p === 0 ? 'var(--border)' : 'var(--accent)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* A section with nothing done is worth naming: it is the gap a
                  percentage across the whole set hides. */}
              {pyq.sections.some(x => x.attempted === 0) && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 'var(--space-3)' }}>
                  {langHi ? 'अछूता: ' : 'Untouched: '}
                  {pyq.sections.filter(x => x.attempted === 0).map(x => x.section).join(' · ')}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Flashcards. The deck is the one part of the site with a schedule of
          its own, so the dashboard's job here is to say what has come round
          again -- a number nobody will find by opening the page and counting. */}
      {mounted && flash && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{langHi ? 'फ्लैशकार्ड पुनरावृत्ति' : 'Flashcard Revision'}</div>
            <Link href="/flashcards" style={{ fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none' }}>
              {flash.due > 0 ? (langHi ? 'अभी दोहराएँ →' : 'Review now →') : (langHi ? 'फ्लैशकार्ड →' : 'Flashcards →')}
            </Link>
          </div>

          {flash.reviewed === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
                {langHi ? 'अभी तक कोई कार्ड नहीं दोहराया।' : 'No cards reviewed yet.'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                {langHi
                  ? 'डेक में 1,200 विश्लेषणात्मक कार्ड हैं — इतिहासकार बहसें, कारण-प्रभाव, तुलनाएँ।'
                  : '1,200 analytical cards are waiting — historian debates, cause and effect, comparisons.'}
              </div>
            </div>
          ) : (
            <>
              <div className="dash-eval-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
                {[
                  {
                    label: langHi ? 'दोहराने हेतु' : 'Due for review',
                    value: flash.due,
                    color: flash.due > 0 ? 'var(--warning-text)' : 'var(--success-text)',
                  },
                  {
                    label: langHi ? 'कार्ड दोहराए' : 'Cards reviewed',
                    value: flash.reviewed,
                    color: 'var(--text)',
                  },
                  {
                    // Last grade only, not every review the card has ever had,
                    // so this is "how many cards do I currently know" rather
                    // than a lifetime accuracy figure.
                    label: langHi ? 'याद रहे' : 'Recall rate',
                    value: flash.recall === null ? '—' : `${flash.recall}%`,
                    color: flash.recall === null ? 'var(--text3)' : scoreColor(flash.recall),
                  },
                ].map(st => (
                  <div key={st.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{st.label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: st.color, lineHeight: 1 }}>{st.value}</div>
                  </div>
                ))}
              </div>
              {flash.due === 0 && flash.lastSession > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 'var(--space-3)' }}>
                  {langHi
                    ? `पिछले सत्र में ${flash.lastSession} कार्ड — फिलहाल कुछ बाकी नहीं।`
                    : `${flash.lastSession} cards in your last session — nothing due right now.`}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>{langHi ? 'अध्ययन गतिविधि — पिछले 12 सप्ताह' : 'Study Activity — Last 12 Weeks'}</div>
        {mounted
          ? <Heatmap activityMap={activityMap} />
          : <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '0.8rem' }}>{langHi ? 'लोड हो रहा है…' : 'Loading…'}</div>
        }
      </div>

      {mounted && needsRevision.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid color-mix(in srgb, var(--warning-text) 20%, transparent)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{langHi ? 'पुनरावृत्ति हेतु' : 'Due for Revision'}</div>
            <span style={{ fontSize: '0.65rem', color: 'var(--warning-text)', background: 'var(--warning-wash)', border: '1px solid color-mix(in srgb, var(--warning-text) 20%, transparent)', padding: '2px 7px', borderRadius: 10 }}>{langHi ? '30+ दिन पहले पूर्ण' : 'Completed 30+ days ago'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {needsRevision.map(note => (
              <Link key={note.slug} href={`/notes/${note.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--warning-text) 30%, transparent)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--warning-text)', background: 'var(--warning-wash)', border: '1px solid color-mix(in srgb, var(--warning-text) 20%, transparent)', padding: '2px 6px', borderRadius: 3, flexShrink: 0 }}>
                    P{note.paper}·{note.topic}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.83rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{note.section}</div>
                  </div>
                  <span style={{ color: 'var(--text3)', fontSize: '0.8rem', flexShrink: 0 }}>{langHi ? 'दोहराएँ →' : 'Revise →'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>{langHi ? 'अनुभाग विश्लेषण' : 'Section Breakdown'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {sections.map(sec => {
            const done = mounted ? countCompleted(sec.notes.map(n => n.slug)) : 0;
            const p = pct(done, sec.notes.length);
            const isComplete = done === sec.notes.length;
            return (
              <div key={sec.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: isComplete ? 'var(--success-text)' : 'var(--text2)', fontWeight: 500 }}>
                    {isComplete ? '✓ ' : ''}{sec.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: isComplete ? 'var(--success-text)' : 'var(--text3)' }}>
                    {mounted ? done : '—'}/{sec.notes.length}
                  </span>
                </div>
                <MiniBar pct={p} color={isComplete ? 'var(--success-text)' : 'var(--accent)'} />
              </div>
            );
          })}
        </div>
      </div>

      {mounted && notStarted.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.85rem' }}>{langHi ? 'अगला — अध्ययन जारी रखें' : 'Up Next — Continue Studying'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notStarted.map(note => (
              <Link key={note.slug} href={`/notes/${note.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent2)'; el.style.background = 'var(--bg4)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.background = 'var(--bg3)'; }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', padding: '2px 6px', borderRadius: 3, flexShrink: 0 }}>
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
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: '0.75rem' }}>{langHi ? 'अध्ययन उपकरण' : 'Study Tools'}</div>
        <Link href="/flashcards" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', textDecoration: 'none' }}>
          <div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 500, marginBottom: '0.2rem' }}>{langHi ? 'विश्लेषणात्मक फ्लैशकार्ड' : 'Analytical Flashcards'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>55 cards — historian arguments, comparisons, cause-effect chains</div>
          </div>
          <span style={{ color: 'var(--text3)', fontSize: '0.85rem', marginLeft: '1rem' }}>→</span>
        </Link>
      </div>

      {mounted && totalDone === TOTAL && (
        <div style={{ background: 'var(--success-wash)', border: '1px solid color-mix(in srgb, var(--success-text) 20%, transparent)', borderRadius: 14, padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--success-text)', fontWeight: 700, marginBottom: '0.4rem' }}>{langHi ? 'पूरा पाठ्यक्रम पूर्ण!' : 'Full Syllabus Complete!'}</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{langHi ? 'आपने सभी 51 विषय पूरे कर लिए हैं। अब उत्तर अभ्यास और पुनरावृत्ति का समय है।' : 'You have covered all 51 topics. Time to practice answers and revise.'}</div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <Link href="/evaluate" style={{ fontSize: '0.82rem', color: 'var(--success-text)', textDecoration: 'none', background: 'var(--success-wash)', border: '1px solid color-mix(in srgb, var(--success-text) 20%, transparent)', padding: '6px 14px', borderRadius: 6 }}>{langHi ? 'उत्तर अभ्यास →' : 'Practice Answers →'}</Link>
            <Link href="/pyqs" style={{ fontSize: '0.82rem', color: 'var(--text2)', textDecoration: 'none', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 6 }}>{langHi ? 'PYQ देखें →' : 'Browse PYQs →'}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
