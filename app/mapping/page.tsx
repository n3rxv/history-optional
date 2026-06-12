'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { bookData, BookChapter, BookSite } from '@/lib/bookData';

const MappingMap = dynamic(() => import('@/components/MappingMap'), { ssr: false });
const QuizMap   = dynamic(() => import('@/components/QuizMap'),    { ssr: false });

const PART_ORDER = [
  'Reference',
  'Pre-Historic Era',
  'Proto-Historic Era',
  'Historic Era',
  'Theme-Based Sites',
];

const ACCENT = '#a78bfa';

// ── Helpers ──────────────────────────────────────────────────────────────────

const _allRaw = bookData.flatMap(ch => ch.sites).filter(s => s.lat != null && s.lng != null);
const allSitesWithCoords: BookSite[] = Array.from(new Map(_allRaw.map(s => [s.name, s])).values());

const siteToChapter = new Map<string, string>(
  bookData.flatMap(ch => ch.sites.map(s => [s.name, ch.topic] as [string, string]))
);

function geoDistance(a: BookSite, b: BookSite) {
  const dlat = (a.lat as number) - (b.lat as number);
  const dlng = (a.lng as number) - (b.lng as number);
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

function getDistractors(correct: BookSite, count = 3): BookSite[] {
  return [...allSitesWithCoords]
    .filter(s => s.name !== correct.name)
    .sort((a, b) => geoDistance(correct, a) - geoDistance(correct, b))
    .slice(0, count);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(sites: BookSite[]): BookSite {
  return sites[Math.floor(Math.random() * sites.length)];
}

// ── ChapterSection (normal browse mode) ──────────────────────────────────────

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu','Kashmir','Ladakh','Puducherry','Andaman','Lakshadweep','Chandigarh','Harappa','Pakistan','Afghanistan','Bangladesh','Nepal','Sri Lanka','Myanmar','Iran','Uzbekistan'];

function extractState(location: string): string {
  if (!location) return 'Other';
  const loc = location.toLowerCase();
  for (const s of INDIAN_STATES) {
    if (loc.includes(s.toLowerCase())) return s;
  }
  const parts = location.split(',');
  return parts[parts.length - 1].trim() || 'Other';
}

function ChapterSection({ chapter, isOpen, onToggle, selectedSite, onSiteClick, pyqOnly, onTogglePYQOnly, noLabels }: {
  chapter: BookChapter;
  isOpen: boolean;
  onToggle: () => void;
  selectedSite: string | null;
  onSiteClick: (name: string) => void;
  pyqOnly: boolean;
  onTogglePYQOnly: () => void;
  noLabels: boolean;
}) {
  const [stateFilter, setStateFilter] = useState<string>('All');
  const baseSites = pyqOnly
    ? chapter.sites.filter(s => s.pyqYears && s.pyqYears.length > 0)
    : chapter.sites;

  const stateOptions = useMemo(() => {
    const states = new Set(baseSites.map(s => extractState(s.location)));
    return ['All', ...Array.from(states).sort()];
  }, [baseSites]);

  const visibleSites = stateFilter === 'All'
    ? baseSites
    : baseSites.filter(s => extractState(s.location) === stateFilter);
  const sitesWithCoords = visibleSites.filter(s => s.lat != null && s.lng != null);
  const chapterHasPYQ = chapter.sites.some(s => s.pyqYears && s.pyqYears.length > 0);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 12, overflow: 'hidden', background: 'var(--bg3)' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left', padding: '14px 18px',
          background: isOpen ? 'rgba(167,139,250,0.08)' : 'var(--bg3)',
          border: 'none', borderBottom: isOpen ? `1px solid ${ACCENT}33` : 'none',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', color: 'var(--text)', fontFamily: 'var(--font-ui)',
        }}
      >
        <span>
          <span style={{ color: ACCENT, fontWeight: 600, marginRight: 10 }}>Ch {chapter.chapter}</span>
          <span style={{ fontWeight: 600 }}>{chapter.topic}</span>
          {!(chapter.chapter === 0 && chapter.topic === 'Introduction & How to Use') && (
            <span style={{ color: 'var(--text3)', marginLeft: 10, fontSize: 13 }}>({chapter.sites.length} sites)</span>
          )}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {chapterHasPYQ && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onTogglePYQOnly(); }}
              style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
                fontFamily: 'var(--font-ui)', cursor: 'pointer',
                color: pyqOnly ? '#000' : '#eab308',
                background: pyqOnly ? '#eab308' : 'rgba(234,179,8,0.1)',
                border: '1px solid #eab308', whiteSpace: 'nowrap',
              }}
            >{pyqOnly ? 'PYQ Only' : 'All'}</span>
          )}
          {isOpen && stateOptions.length > 2 && (
            <select
              value={stateFilter}
              onClick={e => e.stopPropagation()}
              onChange={e => { e.stopPropagation(); setStateFilter(e.target.value); }}
              style={{
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                fontFamily: 'var(--font-ui)', cursor: 'pointer',
                background: stateFilter !== 'All' ? `${ACCENT}22` : 'var(--bg4)',
                color: stateFilter !== 'All' ? ACCENT : 'var(--text3)',
                border: `1px solid ${stateFilter !== 'All' ? ACCENT : 'var(--border)'}`,
                outline: 'none', maxWidth: 140,
              }}
            >
              {stateOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          <span style={{ color: ACCENT, fontSize: 18 }}>{isOpen ? '−' : '+'}</span>
        </span>
      </button>

      {isOpen && (
        <div style={{ padding: 18 }}>
          {chapter.chapter === 0 && chapter.topic === 'Introduction & How to Use' ? (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, lineHeight: 1.7, color: 'var(--text2)' }}>
              <p style={{ marginBottom: 12 }}>
                This page is your visual companion to the entire <strong style={{ color: 'var(--text)' }}>Map syllabus</strong> for
                UPSC History Optional — <strong style={{ color: ACCENT }}>940 sites</strong> across <strong style={{ color: ACCENT }}>26 chapters</strong>.
              </p>
              <p style={{ marginBottom: 12 }}>
                Each chapter below opens into an interactive map and a list of sites. Click any
                site (on the map or in the list) to see its location and significance.
              </p>
              <p style={{ marginBottom: 12 }}>
                Sites with a{' '}
                <span style={{ fontSize: 11, color: '#eab308', background: 'rgba(234,179,8,0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                  PYQ badge
                </span>{' '}
                have appeared in actual UPSC Mains map questions — these deserve extra attention while revising.
              </p>
              <p style={{ marginBottom: 0 }}>
                Use the <strong style={{ color: 'var(--text)' }}>search bar</strong> above to jump
                directly to any site by name or location, or browse chapter-by-chapter using the{' '}
                <strong style={{ color: 'var(--text)' }}>Part tabs</strong>.
              </p>
            </div>
          ) : visibleSites.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>
              {pyqOnly ? 'No PYQ sites in this chapter.' : 'No sites in this chapter.'}
            </p>
          ) : (
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 400px', minWidth: 300 }}>
                <MappingMap
                  sites={sitesWithCoords}
                  selectedSite={selectedSite}
                  noLabels={noLabels}
                  onSiteClick={(name) => {
                    onSiteClick(name);
                    const chapterKey = `${chapter.part}-${chapter.topic}-${chapter.chapter}`;
                    setTimeout(() => {
                      document.getElementById(`site-${chapterKey}-${name}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                />
              </div>
              <div style={{ flex: '1 1 350px', minWidth: 280, maxHeight: 420, overflowY: 'auto' }}>
                {visibleSites.map((site) => {
                  const isSelected = selectedSite === site.name;
                  const hasPYQ = site.pyqYears && site.pyqYears.length > 0;
                  const chapterKey = `${chapter.part}-${chapter.topic}-${chapter.chapter}`;
                  return (
                    <div
                      key={site.name}
                      id={`site-${chapterKey}-${site.name}`}
                      onClick={() => onSiteClick(site.name)}
                      style={{
                        padding: '10px 12px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                        background: isSelected ? 'rgba(167,139,250,0.12)' : 'var(--bg4)',
                        border: isSelected ? `1px solid ${ACCENT}` : '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 14 }}>{site.name}</strong>
                        {hasPYQ && (
                          <span style={{ fontSize: 10, color: '#eab308', background: 'rgba(234,179,8,0.1)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                            PYQ {site.pyqYears.join(', ')}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{site.location}</div>
                      {isSelected && (
                        <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{site.majorAspect}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Quiz Panel ────────────────────────────────────────────────────────────────

type QuizSubMode = 'mcq' | 'type';

function QuizPanel({ pyqOnly }: { pyqOnly: boolean }) {
  const pool = useMemo(() =>
    allSitesWithCoords.filter(s => !pyqOnly || (s.pyqYears && s.pyqYears.length > 0)),
    [pyqOnly]
  );

  const [subMode, setSubMode]       = useState<QuizSubMode>('mcq');
  const [site, setSite]             = useState<BookSite>(() => pickRandom(pool));
  const [options, setOptions]       = useState<BookSite[]>([]);
  const [chosen, setChosen]         = useState<string | null>(null);
  const [typed, setTyped]           = useState('');
  const [submitted, setSubmitted]   = useState(false);
  const [score, setScore]           = useState({ correct: 0, total: 0 });
  const [streak, setStreak]         = useState(0);

  const buildOptions = useCallback((s: BookSite) => {
    const distractors = getDistractors(s, 3);
    return shuffle([s, ...distractors]);
  }, []);

  useEffect(() => {
    setOptions(buildOptions(site));
  }, [site]);

  const nextQuestion = () => {
    const next = pickRandom(pool.filter(s => s.name !== site.name));
    setSite(next);
    setOptions(buildOptions(next));
    setChosen(null);
    setTyped('');
    setSubmitted(false);
  };

  // MCQ answer
  const handleMCQ = (name: string) => {
    if (chosen) return;
    setChosen(name);
    const correct = name === site.name;
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
    setStreak(prev => correct ? prev + 1 : 0);
  };

  // Type answer
  const handleType = () => {
    if (submitted) return;
    setSubmitted(true);
    const correct = typed.trim().toLowerCase() === site.name.toLowerCase();
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
    setStreak(prev => correct ? prev + 1 : 0);
  };

  const isCorrectType = typed.trim().toLowerCase() === site.name.toLowerCase();
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Top bar: sub-mode + score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Sub-mode toggle */}
        <div style={{ display: 'flex', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {(['mcq', 'type'] as QuizSubMode[]).map(m => (
            <button
              key={m}
              onClick={() => { setSubMode(m); setChosen(null); setTyped(''); setSubmitted(false); }}
              style={{
                padding: '7px 20px', border: 'none', cursor: 'pointer',
                background: subMode === m ? ACCENT : 'transparent',
                color: subMode === m ? '#fff' : 'var(--text2)',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                transition: 'background 0.15s',
              }}
            >
              {m === 'mcq' ? '4 Options' : 'Type Name'}
            </button>
          ))}
        </div>

        {/* Score + streak */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {streak >= 3 && (
            <span style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              🔥 {streak}
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text2)' }}>
            {score.correct}/{score.total}
            {score.total > 0 && (
              <span style={{ color: accuracy >= 70 ? '#4ade80' : '#f87171', marginLeft: 6 }}>
                {accuracy}%
              </span>
            )}
          </span>
          <button
            onClick={() => { setScore({ correct: 0, total: 0 }); setStreak(0); nextQuestion(); }}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              color: 'var(--text3)', fontSize: 12, padding: '4px 10px', cursor: 'pointer',
            }}
          >Reset</button>
        </div>
      </div>

      {/* Map */}
      <QuizMap site={site} />

      {/* Hint */}
      <div style={{
        textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 12,
        color: 'var(--text3)', letterSpacing: '0.05em',
      }}>
        HINT — <span style={{ color: 'var(--text2)' }}>{siteToChapter.get(site.name) ?? '—'}</span>
        {site.pyqYears?.length > 0 && (
          <span style={{ color: '#eab308', marginLeft: 10 }}>PYQ {site.pyqYears.join(', ')}</span>
        )}
      </div>

      {/* MCQ Options */}
      {subMode === 'mcq' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {options.slice(0, 4).map(opt => {
            const isCorrect = opt.name === site.name;
            const isChosen  = opt.name === chosen;
            let bg = 'var(--bg3)';
            let border = 'var(--border)';
            let color = 'var(--text)';
            if (chosen) {
              if (isCorrect)       { bg = 'rgba(74,222,128,0.12)'; border = '#4ade80'; color = '#4ade80'; }
              else if (isChosen)   { bg = 'rgba(248,113,113,0.12)'; border = '#f87171'; color = '#f87171'; }
            }
            return (
              <button
                key={opt.name}
                onClick={() => handleMCQ(opt.name)}
                style={{
                  padding: '14px 16px', borderRadius: 8, border: `1.5px solid ${border}`,
                  background: bg, color, fontFamily: 'var(--font-ui)', fontSize: 14,
                  fontWeight: 500, cursor: chosen ? 'default' : 'pointer',
                  textAlign: 'left', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}
              >
                <span>{opt.name}</span>
                {chosen && (
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{opt.location}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Type mode */}
      {subMode === 'type' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !submitted && handleType()}
              disabled={submitted}
              placeholder="Type the site name..."
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 8,
                border: submitted
                  ? `1.5px solid ${isCorrectType ? '#4ade80' : '#f87171'}`
                  : '1.5px solid var(--border)',
                background: 'var(--bg3)', color: 'var(--text)',
                fontFamily: 'var(--font-ui)', fontSize: 14, outline: 'none',
              }}
            />
            <button
              onClick={handleType}
              disabled={submitted || !typed.trim()}
              style={{
                padding: '12px 20px', borderRadius: 8, border: 'none',
                background: submitted || !typed.trim() ? 'var(--bg3)' : ACCENT,
                color: submitted || !typed.trim() ? 'var(--text3)' : '#fff',
                fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14,
                cursor: submitted || !typed.trim() ? 'not-allowed' : 'pointer',
              }}
            >Submit</button>
          </div>

          {submitted && (
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: isCorrectType ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${isCorrectType ? '#4ade80' : '#f87171'}`,
              fontFamily: 'var(--font-ui)', fontSize: 14,
            }}>
              {isCorrectType ? (
                <span style={{ color: '#4ade80' }}>✓ Correct!</span>
              ) : (
                <span style={{ color: '#f87171' }}>
                  ✗ Answer: <strong style={{ color: 'var(--text)' }}>{site.name}</strong>
                  <span style={{ color: 'var(--text3)', marginLeft: 8, fontSize: 12 }}>{site.location}</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reveal info after answer */}
      {(chosen || submitted) && (
        <div style={{
          padding: '14px 16px', borderRadius: 8,
          background: 'var(--bg3)', border: '1px solid var(--border)',
          fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>
            {site.name}
          </strong>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{site.location}</div>
          <div>{site.majorAspect}</div>
          {site.pyqYears?.length > 0 && (
            <div style={{ marginTop: 6, color: '#eab308', fontSize: 12 }}>
              PYQ: {site.pyqYears.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Next button */}
      {(chosen || submitted) && (
        <button
          onClick={nextQuestion}
          style={{
            alignSelf: 'flex-end', padding: '10px 28px', borderRadius: 8,
            background: ACCENT, color: '#fff', border: 'none',
            fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14,
            cursor: 'pointer',
          }}
        >Next →</button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MappingPage() {
  const [activePart, setActivePart]   = useState(PART_ORDER[1]);
  const [quizMode, setQuizMode]       = useState(false);
  const [noLabels, setNoLabels]       = useState(false);
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [globalPYQOnly, setGlobalPYQOnly] = useState(false);
  const [chapterPYQOverrides, setChapterPYQOverrides] = useState<Record<string, boolean>>({});
  const [quizPYQOnly, setQuizPYQOnly] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  const toggleGlobalPYQ = () => {
    setGlobalPYQOnly(prev => { setChapterPYQOverrides({}); return !prev; });
  };

  const toggleChapterPYQ = (key: string) => {
    setChapterPYQOverrides(prev => ({ ...prev, [key]: !(prev[key] ?? globalPYQOnly) }));
  };

  const chaptersByPart = useMemo(() => {
    const map: Record<string, BookChapter[]> = {};
    for (const ch of bookData) {
      if (!map[ch.part]) map[ch.part] = [];
      map[ch.part].push(ch);
    }
    return map;
  }, []);

  const searchResults = useMemo(() => {
    if (search.trim().length < 2) return [];
    const q = search.trim().toLowerCase();
    const results: { site: BookSite; chapter: BookChapter }[] = [];
    for (const ch of bookData) {
      for (const site of ch.sites) {
        if (site.name.toLowerCase().includes(q) || site.location.toLowerCase().includes(q)) {
          results.push({ site, chapter: ch });
        }
      }
    }
    return results.slice(0, 20);
  }, [search]);

  const toggleChapter = (key: string) => {
    setOpenChapters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const jumpToSite = (chapter: BookChapter, site: BookSite) => {
    const key = `${chapter.part}-${chapter.topic}-${chapter.chapter}`;
    setActivePart(chapter.part);
    setOpenChapters(prev => new Set(prev).add(key));
    setSelectedSite(site.name);
    setSearch('');
    setTimeout(() => {
      const el = document.getElementById(`site-${key}-${site.name}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 60px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
            {quizMode ? 'Map Quiz' : 'Map Reference — All Sites'}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>
            {quizMode
              ? 'Identify the marked site on the map.'
              : <>Browse all 940 archaeological & historical sites. <span style={{ color: '#eab308' }}>Yellow</span> markers = UPSC PYQs.</>
            }
          </p>
        </div>

        {/* Quiz Mode toggle */}
        <button
          onClick={() => setQuizMode(prev => !prev)}
          style={{
            padding: '9px 20px', borderRadius: 8, border: `1.5px solid ${quizMode ? ACCENT : 'var(--border)'}`,
            background: quizMode ? `${ACCENT}22` : 'var(--bg3)',
            color: quizMode ? ACCENT : 'var(--text2)',
            fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span>🧠</span> {quizMode ? 'Exit Quiz' : 'Quiz Mode'}
        </button>
      </div>

      {/* ── QUIZ MODE ── */}
      {quizMode && (
        <div>
          {/* PYQ only toggle for quiz */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: quizPYQOnly ? '#eab308' : 'var(--text3)' }}>PYQ Sites Only</span>
            <div
              role="button"
              onClick={() => setQuizPYQOnly(p => !p)}
              style={{
                position: 'relative', display: 'inline-block', width: 42, height: 24,
                borderRadius: 12, background: quizPYQOnly ? '#eab308' : 'var(--border2)',
                transition: 'background 0.2s', cursor: 'pointer',
              }}
            >
              <span style={{
                position: 'absolute', top: 2, left: quizPYQOnly ? 20 : 2,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)', transition: 'left 0.2s',
              }} />
            </div>
          </div>
          <QuizPanel pyqOnly={quizPYQOnly} />
        </div>
      )}

      {/* ── BROWSE MODE ── */}
      {!quizMode && (
        <>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 24, marginTop: 16 }}>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search any site by name or location..."
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 8,
                border: `1px solid ${ACCENT}55`, background: 'var(--bg3)',
                color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 14, outline: 'none',
              }}
            />
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'var(--bg3)', border: `1px solid ${ACCENT}55`, borderRadius: 8,
                maxHeight: 320, overflowY: 'auto', zIndex: 50,
              }}>
                {searchResults.map(({ site, chapter }) => (
                  <div
                    key={`${chapter.chapter}-${site.name}`}
                    onClick={() => jumpToSite(chapter, site)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-ui)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(167,139,250,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <strong style={{ color: 'var(--text)', fontSize: 14 }}>{site.name}</strong>
                    <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 8 }}>
                      {chapter.topic} · {site.location}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Part tabs + PYQ toggle + No Labels toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PART_ORDER.map((part) => (
                <button
                  key={part}
                  onClick={() => setActivePart(part)}
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    border: activePart === part ? `1px solid ${ACCENT}` : '1px solid var(--border)',
                    background: activePart === part ? 'rgba(167,139,250,0.12)' : 'var(--bg3)',
                    color: activePart === part ? ACCENT : 'var(--text2)',
                    fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >{part}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {/* No Labels toggle */}
              <div role="button" onClick={() => setNoLabels(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: noLabels ? ACCENT : 'var(--text2)', whiteSpace: 'nowrap' }}>
                  No Labels
                </span>
                <span style={{
                  position: 'relative', display: 'inline-block', width: 42, height: 24,
                  borderRadius: 12, background: noLabels ? ACCENT : 'var(--border2)', transition: 'background 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', top: 2, left: noLabels ? 20 : 2,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)', transition: 'left 0.2s',
                  }} />
                </span>
              </div>

              {/* PYQ Only toggle */}
              <div role="button" onClick={toggleGlobalPYQ}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: globalPYQOnly ? '#eab308' : 'var(--text2)', whiteSpace: 'nowrap' }}>
                  PYQ Only
                </span>
                <span style={{
                  position: 'relative', display: 'inline-block', width: 42, height: 24,
                  borderRadius: 12, background: globalPYQOnly ? '#eab308' : 'var(--border2)', transition: 'background 0.2s ease',
                }}>
                  <span style={{
                    position: 'absolute', top: 2, left: globalPYQOnly ? 20 : 2,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)', transition: 'left 0.2s ease',
                  }} />
                </span>
              </div>
            </div>
          </div>

          {/* Chapters */}
          {(chaptersByPart[activePart] || [])
            .filter(chapter => {
              if (!globalPYQOnly) return true;
              if (chapter.chapter === 0 && chapter.topic === 'Introduction & How to Use') return true;
              return chapter.sites.some(s => s.pyqYears && s.pyqYears.length > 0);
            })
            .map((chapter) => {
              const key = `${chapter.part}-${chapter.topic}-${chapter.chapter}`;
              const effectivePYQOnly = chapterPYQOverrides[key] ?? globalPYQOnly;
              return (
                <div id={key} key={key}>
                  <ChapterSection
                    chapter={chapter}
                    isOpen={openChapters.has(key)}
                    onToggle={() => toggleChapter(key)}
                    selectedSite={selectedSite}
                    onSiteClick={(name) => setSelectedSite(prev => prev === name ? null : name)}
                    pyqOnly={effectivePYQOnly}
                    onTogglePYQOnly={() => toggleChapterPYQ(key)}
                    noLabels={noLabels}
                  />
                </div>
              );
            })}
        </>
      )}
    </div>
  );
}
