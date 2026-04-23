'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { paper1Notes, paper2Notes, paper1Sections, paper2Sections } from '@/lib/notes';
import { useSyllabusTracker } from '@/hooks/useSyllabusTracker';

const ALL_NOTES = [...paper1Notes, ...paper2Notes];
const TOTAL = ALL_NOTES.length;

function Ring({ pct, size = 80, stroke = 6, color = 'var(--accent)' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }} />
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

export default function Dashboard() {
  const { countCompleted, mounted, progress } = useSyllabusTracker();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    const today = new Date().toDateString();
    const stored = localStorage.getItem('ho_streak_v1');
    let data = stored ? JSON.parse(stored) : { streak: 0, lastDate: '' };
    if (data.lastDate === today) {
      setStreak(data.streak);
    } else {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = data.lastDate === yesterday ? data.streak + 1 : 1;
      data = { streak: newStreak, lastDate: today };
      localStorage.setItem('ho_streak_v1', JSON.stringify(data));
      setStreak(newStreak);
    }
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

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Your Study Dashboard</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>Progress Overview</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Tracking your syllabus completion across all 51 topics. Data lives in your browser — no account needed.</p>
      </div>

      {/* Hero ring */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ring pct={overallPct} size={100} stroke={7} color={overallPct === 1 ? 'var(--green)' : 'var(--accent)'} />
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: overallPct === 1 ? 'var(--green)' : 'var(--text)', lineHeight: 1 }}>
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

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <StatCard label="Paper I" value={`${p1Done}/${paper1Notes.length}`} sub={`${Math.round(pct(p1Done, paper1Notes.length) * 100)}% done`} color="var(--accent)" />
        <StatCard label="Paper II" value={`${p2Done}/${paper2Notes.length}`} sub={`${Math.round(pct(p2Done, paper2Notes.length) * 100)}% done`} color="var(--accent)" />
        <StatCard label="Day Streak" value={mounted ? streak : '—'} sub={streak >= 3 ? '🔥 On a roll!' : 'Visit daily to build streak'} color={streak >= 3 ? 'var(--yellow)' : 'var(--text)'} />
        <StatCard label="Remaining" value={mounted ? TOTAL - totalDone : '—'} sub="topics left" color={mounted && TOTAL - totalDone === 0 ? 'var(--green)' : 'var(--text)'} />
      </div>

      {/* Section breakdown */}
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
                  <span style={{ fontSize: '0.8rem', color: isComplete ? 'var(--green)' : 'var(--text2)', fontWeight: 500 }}>
                    {isComplete ? '✓ ' : ''}{sec.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: isComplete ? 'var(--green)' : 'var(--text3)' }}>
                    {mounted ? done : '—'}/{sec.notes.length}
                  </span>
                </div>
                <MiniBar pct={p} color={isComplete ? 'var(--green)' : 'var(--accent)'} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Up next */}
      {mounted && notStarted.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
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

      {/* All done */}
      {mounted && totalDone === TOTAL && (
        <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 14, padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--green)', fontWeight: 700, marginBottom: '0.4rem' }}>Full Syllabus Complete!</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>You have covered all 51 topics. Time to practice answers and revise.</div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <Link href="/evaluate" style={{ fontSize: '0.82rem', color: 'var(--green)', textDecoration: 'none', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '6px 14px', borderRadius: 6 }}>Practice Answers →</Link>
            <Link href="/pyqs" style={{ fontSize: '0.82rem', color: 'var(--text2)', textDecoration: 'none', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 6 }}>Browse PYQs →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
