'use client';
import Link from 'next/link';
import { paper1Notes, paper1Sections } from '@/lib/notes';
import { useSyllabusTracker } from '@/hooks/useSyllabusTracker';

function ProgressRing({ completed, total, size = 52 }: { completed: number; total: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : completed / total;
  const dash = pct * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={pct === 1 ? 'var(--green)' : 'var(--accent)'}
        strokeWidth={4} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}
        fill={pct === 1 ? 'var(--green)' : 'var(--text2)'}
        fontSize="10px" fontFamily="var(--font-ui)" fontWeight="600">
        {completed}/{total}
      </text>
    </svg>
  );
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : (completed / total) * 100;
  return (
    <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)', borderRadius: 4, transition: 'width 0.4s ease' }} />
    </div>
  );
}

export default function Paper1() {
  const { toggle, isCompleted, countCompleted, mounted } = useSyllabusTracker();
  const allSlugs = paper1Notes.map(n => n.slug);
  const totalCompleted = mounted ? countCompleted(allSlugs) : 0;
  const total = paper1Notes.length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>UPSC History Optional</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>Paper I — Ancient & Medieval India</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.95rem', maxWidth: 600, marginBottom: '1.5rem' }}>
          {total} topics covering Sources, Pre-history through the 18th century. Click any topic to open the full notes. Check off topics as you study.
        </p>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <ProgressRing completed={totalCompleted} total={total} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600 }}>Paper I Progress</span>
              <span style={{ color: totalCompleted === total ? 'var(--green)' : 'var(--text3)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                {mounted ? `${totalCompleted} / ${total} topics` : `— / ${total} topics`}
              </span>
            </div>
            <ProgressBar completed={totalCompleted} total={total} />
            {mounted && totalCompleted === total && <div style={{ color: 'var(--green)', fontSize: '0.75rem', marginTop: '0.4rem' }}>✓ Paper I complete!</div>}
          </div>
        </div>
      </div>

      {paper1Sections.map(section => {
        const sectionNotes = paper1Notes.filter(n => n.section === section);
        const sectionCompleted = mounted ? countCompleted(sectionNotes.map(n => n.slug)) : 0;
        return (
          <div key={section} style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--accent)', fontWeight: 600 }}>{section}</h2>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ color: mounted && sectionCompleted === sectionNotes.length ? 'var(--green)' : 'var(--text3)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                {mounted ? sectionCompleted : '—'}/{sectionNotes.length}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
              {sectionNotes.map(note => {
                const done = mounted && isCompleted(note.slug);
                return (
                  <div key={note.slug} style={{ position: 'relative' }}>
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(note.slug); }}
                      title={done ? 'Mark as not studied' : 'Mark as studied'}
                      style={{
                        position: 'absolute', top: 10, right: 10, zIndex: 2,
                        width: 20, height: 20, borderRadius: 4,
                        border: `1.5px solid ${done ? 'var(--green)' : 'var(--border2)'}`,
                        background: done ? 'var(--green-dim)' : 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0, transition: 'all 0.15s',
                      }}
                    >
                      {done && (
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M2 5.5L4.5 8L9 3" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <Link href={`/notes/${note.slug}`} style={{ textDecoration: 'none' }}>
                      <div
                        style={{
                          background: done ? 'var(--bg3)' : 'var(--bg2)',
                          border: `1px solid ${done ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
                          borderRadius: 8, padding: '1.1rem 2.5rem 1.1rem 1.25rem',
                          transition: 'all 0.15s', cursor: 'pointer',
                          display: 'flex', gap: '1rem', alignItems: 'flex-start',
                        }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = done ? 'rgba(34,197,94,0.5)' : 'var(--accent2)'; el.style.background = 'var(--bg3)'; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = done ? 'rgba(34,197,94,0.25)' : 'var(--border)'; el.style.background = done ? 'var(--bg3)' : 'var(--bg2)'; }}
                      >
                        <span style={{
                          minWidth: 28, height: 28,
                          background: done ? 'var(--green-dim)' : 'var(--accent-dim)',
                          border: `1px solid ${done ? 'rgba(34,197,94,0.4)' : 'var(--accent2)'}`,
                          borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                          color: done ? 'var(--green)' : 'var(--accent)', fontWeight: 600, flexShrink: 0,
                        }}>{note.topic}</span>
                        <div>
                          <div style={{ color: done ? 'var(--text2)' : 'var(--text)', fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem', lineHeight: 1.3, textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'var(--text3)' }}>
                            {note.title}
                          </div>
                          <div style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{note.description}</div>
                          {note.subtopics && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                              {note.subtopics.slice(0,3).map(s => (
                                <span key={s} style={{ fontSize: '0.68rem', color: 'var(--text3)', background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 3 }}>{s}</span>
                              ))}
                              {note.subtopics.length > 3 && <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>+{note.subtopics.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
