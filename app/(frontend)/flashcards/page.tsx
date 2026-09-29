'use client';
import { useLang } from '@/lib/i18n/LangContext';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import SessionComplete from '@/components/SessionComplete';
import { useFlashcardDeck } from '@/hooks/useFlashcardDeck';
import { FLASHCARD_TYPES } from '@/lib/flashcardMeta';
// Type-only, so it is erased at compile time and pulls nothing into the
// bundle. The cards themselves now come from /api/flashcards.
import type { StoredFlashCard } from '@/lib/flashcardStore';
import OwlLoader from '@/components/OwlLoader';

type FlashCard = StoredFlashCard;

type SRData = {
  interval: number;
  easeFactor: number;
  nextDue: string;
  reps: number;
  /**
   * How the card was last graded. SM-2 only needs the grade to compute the
   * next interval and threw it away, so there was no way to ask "show me
   * everything I drew a blank on". Optional: entries saved before this exists
   * simply have no grade yet.
   */
  lastGrade?: 1 | 2 | 3 | 4;
};

const GRADE_LABELS: Record<number, string> = { 1: 'Blank', 2: 'Hard', 3: 'Good', 4: 'Easy' };
const GRADE_LABELS_HI: Record<number, string> = { 1: 'खाली', 2: 'कठिन', 3: 'अच्छा', 4: 'आसान' };
// Same colours as the Blank/Hard/Good/Easy buttons, so the badge reads as the
// button that produced it.
const GRADE_COLORS: Record<number, string> = { 1: 'var(--danger-text)', 2: 'var(--warning-text)', 3: 'var(--accent)', 4: 'var(--success-text)' };

const STORAGE_KEY = 'ho_flashcards_v1';
function loadSR(): Record<string, SRData> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}
function saveSR(data: Record<string, SRData>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

/**
 * The Last Session tile used to hold a count and nothing else, so clicking it
 * had nothing to show. The ids are kept so the tile can list the cards it
 * counted, and they outlive a reload the way the review state does.
 */
const SESSION_KEY = 'ho_flashcards_last_session_v1';
function loadSession(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const v = JSON.parse(localStorage.getItem(SESSION_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}
function saveSession(ids: string[]) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(ids)); } catch {}
}
function sm2(card: SRData | undefined, grade: 1 | 2 | 3 | 4): SRData {
  const ef = card?.easeFactor ?? 2.5;
  const reps = card?.reps ?? 0;
  const newEF = Math.max(1.3, ef + (0.1 - (4 - grade) * (0.08 + (4 - grade) * 0.02)));
  let interval = 1;
  if (grade < 2) { interval = 1; }
  else if (reps === 0) { interval = 1; }
  else if (reps === 1) { interval = 6; }
  else { interval = Math.round((card?.interval ?? 1) * newEF); }
  const nextDue = new Date(Date.now() + interval * 86400000).toISOString();
  return { interval, easeFactor: newEF, nextDue, reps: grade >= 2 ? reps + 1 : 0, lastGrade: grade };
}

const TYPE_LABELS: Record<string, string> = {
  historian: 'Historian',
  comparison: 'Comparison',
  'cause-effect': 'Cause & Effect',
  quote: 'Quote',
  concept: 'Concept',
};
const TYPE_COLORS: Record<string, { main: string; dim: string; glow: string }> = {
  historian:      { main: 'var(--accent)', dim: 'color-mix(in srgb, var(--accent) 12%, transparent)',  glow: 'color-mix(in srgb, var(--accent) 35%, transparent)' },
  comparison:     { main: 'var(--accent)', dim: 'color-mix(in srgb, var(--accent) 12%, transparent)', glow: 'color-mix(in srgb, var(--accent) 35%, transparent)' },
  'cause-effect': { main: 'var(--warning-text)', dim: 'color-mix(in srgb, var(--warning-text) 12%, transparent)', glow: 'color-mix(in srgb, var(--warning-text) 35%, transparent)' },
  quote:          { main: 'var(--success-text)', dim: 'color-mix(in srgb, var(--success-text) 12%, transparent)', glow: 'color-mix(in srgb, var(--success-text) 35%, transparent)' },
  concept:        { main: 'var(--danger-text)', dim: 'color-mix(in srgb, var(--danger-text) 12%, transparent)',  glow: 'color-mix(in srgb, var(--danger-text) 35%, transparent)' },
};

// SVG noise texture as data URI
const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;



/**
 * What stands in for the answer once the free allowance is gone.
 *
 * Shown in place of the text rather than as a modal over it: the reader asked
 * for this card, and covering the screen would lose their place in the queue.
 */
function AnswerLocked({ langHi }: { langHi: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', alignItems: 'flex-start' }}>
      <div style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text)' }}>
        {/* The panel shows on the card that was refused, not on the last one
            granted, so it must not claim this was the hundredth answer. */}
        {langHi
          ? 'आपके 100 निःशुल्क उत्तर पूरे हो चुके हैं। प्रश्न पढ़ते रहना निःशुल्क है — उत्तर देखने के लिए सदस्यता लें।'
          : "You've used all 100 free answers. Questions stay free to browse — subscribe to keep opening answers."}
      </div>
      <a
        href="/pricing"
        style={{
          display: 'inline-block', padding: '0.6rem 1.1rem', borderRadius: 8,
          background: 'var(--accent)', color: 'var(--bg)', fontWeight: 600,
          fontSize: '0.82rem', textDecoration: 'none',
        }}
      >
        {langHi ? 'सदस्यता लें' : 'Subscribe'}
      </a>
    </div>
  );
}

export default function Flashcards() {
  const { langHi } = useLang();
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();
  const TYPE_LABELS_HI: Record<string, string> = {
    historian: 'इतिहासकार',
    comparison: 'तुलना',
    'cause-effect': 'कारण-प्रभाव',
    quote: 'उद्धरण',
    concept: 'अवधारणा',
  };
  const getTypeLabel = (type: string) => langHi ? (TYPE_LABELS_HI[type] ?? TYPE_LABELS[type]) : TYPE_LABELS[type];
  const [sr, setSR] = useState<Record<string, SRData>>({});
  const [mounted, setMounted] = useState(false);
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterGrade, setFilterGrade] = useState<string>('All');
  const [filterDue, setFilterDue] = useState<boolean>(false);
  const { index, indexLoading, error: deckError, getCard, isReady, getBack, reveal, allowance, prefetch, keepAhead } =
    useFlashcardDeck();
  /**
   * What happened the last time this reader tried to open an answer. Answers
   * are metered — a hundred free, then a subscription — so a flip can end in a
   * paywall instead of text, and the card has to say which.
   */
  const [revealState, setRevealState] = useState<'idle' | 'loading' | 'locked' | 'login' | 'error'>('idle');
  // The queue is ids, not cards. Ordering only needs the index; the text is
  // fetched into the deck cache ahead of the reader.
  const [queueIds, setQueueIds] = useState<string[]>([]);
  // The browse list renders each card's front, so it pages rather than
  // loading every card. One page covers the whole deck at today's size.
  const [browseLimit, setBrowseLimit] = useState(60);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(0);
  // Whether the last session ran to its end, and how many cards in it were
  // graded Good or Easy; finishing gets the owl, stopping early does not.
  const [sessionFinished, setSessionFinished] = useState(false);
  const [sessionRecalled, setSessionRecalled] = useState(0);
  // Which tile is active. Each narrows the list below to exactly what its
  // number counted; clicking the active one again goes back to everything.
  const [view, setView] = useState<'all' | 'studied' | 'due' | 'session'>('all');
  const [lastSessionIds, setLastSessionIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setSR(loadSR()); setLastSessionIds(loadSession()); setMounted(true);
    // The chat links here with ?section= to revise the cards on the topic it
    // just answered; there is no topic filter, so the section is the nearest.
    const section = new URLSearchParams(window.location.search).get('section');
    if (section) setFilterSection(section);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const today = new Date().toISOString();
  // Computed before buildQueue so a queue can be built from the list on
  // screen, in the order shown.
  const filteredIndex = index.filter(c => {
    if (filterSection !== 'All' && c.section !== filterSection) return false;
    if (filterType !== 'All' && c.type !== filterType) return false;
    if (filterGrade !== 'All' && String(sr[c.id]?.lastGrade ?? '') !== filterGrade) return false;
    // The tiles narrow the same list the dropdowns do, so the two compose
    // rather than fight: Studied inside Ancient India stays possible.
    if (view === 'studied' && !sr[c.id]) return false;
    if (view === 'due') { const s = sr[c.id]; if (s && s.nextDue > today) return false; }
    if (view === 'session' && !lastSessionIds.includes(c.id)) return false;
    return true;
  });

  const buildQueue = useCallback((singleCard?: FlashCard) => {
    if (singleCard) {
      // Continue through the list on screen from the card that was clicked,
      // rather than ending the session after one card. Reviewing is a
      // rhythm, and stopping to click the next card breaks it.
      const ids = filteredIndex.map(c => c.id);
      const start = Math.max(0, ids.indexOf(singleCard.id));
      keepAhead(ids, start);
      setQueueIds(ids); setIdx(start); setFlipped(false); setRevealState('idle'); setSessionDone(0); setSessionFinished(false); setSessionRecalled(0);
      setLastSessionIds([]); saveSession([]);
      setModalOpen(true);
      return;
    }
    const ordered = index
      .filter(c => {
        if (filterSection !== 'All' && c.section !== filterSection) return false;
        if (filterType !== 'All' && c.type !== filterType) return false;
        if (filterGrade !== 'All' && String(sr[c.id]?.lastGrade ?? '') !== filterGrade) return false;
        if (filterDue) { const s = sr[c.id]; if (s && s.nextDue > today) return false; }
        return true;
      })
      .sort((a, b) => {
        const sa = sr[a.id], sb = sr[b.id];
        const aDue = !sa || sa.nextDue <= today, bDue = !sb || sb.nextDue <= today;
        if (aDue && !bDue) return -1; if (!aDue && bDue) return 1;
        return (sa?.easeFactor ?? 2.5) - (sb?.easeFactor ?? 2.5);
      })
      .map(c => c.id);

    // Warm the front of the queue before the modal opens, so the first card
    // is already there rather than arriving a moment later.
    keepAhead(ordered, 0);
    setQueueIds(ordered); setIdx(0); setFlipped(false); setRevealState('idle'); setSessionDone(0); setSessionFinished(false); setSessionRecalled(0);
    setLastSessionIds([]); saveSession([]);
    setModalOpen(true);
  }, [index, filteredIndex, filterSection, filterType, filterGrade, filterDue, sr, keepAhead]);

  // Keep the window full as the reader advances. Running on idx means the
  // refill is triggered by movement, well before the cache runs dry.
  useEffect(() => {
    if (modalOpen && queueIds.length) keepAhead(queueIds, idx);
  }, [modalOpen, queueIds, idx, keepAhead]);

  const closeModal = () => { setModalOpen(false); setFlipped(false); setRevealState('idle'); };

  /**
   * Turn the card over.
   *
   * Flipping back is free and instant. Flipping to the answer is the moment
   * the allowance is spent, so it goes to the server first and only shows the
   * answer face once the server has granted it — otherwise a reader at their
   * limit would see an empty card with no explanation.
   */
  const flipCard = useCallback(async () => {
    const id = queueIds[idx];
    if (!id) return;
    if (flipped) { setFlipped(false); return; }
    if (getBack(id)) { setRevealState('idle'); setFlipped(true); return; }

    // Answers need an account. Asking here as well as on the server saves a
    // round trip and reuses the prompt the rest of the page already shows.
    if (!requireLogin(langHi ? 'उत्तर देखने के लिए निःशुल्क साइन इन करें।' : 'Sign in free to see answers.')) return;

    setRevealState('loading');
    setFlipped(true);
    const outcome = await reveal(id);
    setRevealState(outcome === 'granted' ? 'idle' : outcome);
  }, [queueIds, idx, flipped, getBack, reveal, requireLogin, langHi]);


  const rate = useCallback((grade: 1 | 2 | 3 | 4) => {
    const card = getCard(queueIds[idx]);
    if (!card || animating) return;
    const updated = { ...sr, [card.id]: sm2(sr[card.id], grade) };
    setSR(updated); saveSR(updated);
    setAnimating(true);
    setTimeout(() => {
      setSessionDone(s => s + 1);
      if (grade >= 3) setSessionRecalled(r => r + 1);
      setLastSessionIds(prev => {
        const next = prev.includes(card.id) ? prev : [...prev, card.id];
        saveSession(next);
        return next;
      });
      if (idx + 1 >= queueIds.length) { setSessionFinished(true); closeModal(); }
      else { setIdx(i => i + 1); setFlipped(false); setRevealState('idle'); }
      setAnimating(false);
    }, 200);
  }, [queueIds, idx, sr, animating, getCard]);

  const currentCard = getCard(queueIds[idx]);
  // Whether the answer is actually on screen, as opposed to the card merely
  // being turned over. A locked card is flipped and shows a paywall.
  const answerVisible = currentCard ? getBack(currentCard.id) !== undefined : false;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === ' ' && modalOpen) { e.preventDefault(); void flipCard(); }
      if (e.key === 'ArrowRight' && modalOpen && flipped && answerVisible) rate(3);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen, flipped, answerVisible, flipCard, rate]);

  const dueCount = index.filter(c => { const s = sr[c.id]; return !s || s.nextDue <= today; }).length;
  const studiedCount = Object.keys(sr).length;
  const filteredDue = filteredIndex.filter(c => { const s = sr[c.id]; return !s || s.nextDue <= today; });

  // The browse list shows a page at a time, and fetches the text for exactly
  // that page. At today's deck size one page is the whole thing.
  const visibleIds = useMemo(
    () => filteredIndex.slice(0, browseLimit).map(c => c.id),
    [filteredIndex, browseLimit],
  );
  useEffect(() => { if (visibleIds.length) prefetch(visibleIds); }, [visibleIds, prefetch]);

  // Changing a filter starts the list again from the top.
  useEffect(() => { setBrowseLimit(60); }, [filterSection, filterType, filterGrade, view]);

  // Sections come from the index, so the filter only offers sections that
  // actually have cards. Index order is card-id order, which is syllabus
  // order — Ancient, Medieval, Modern, World.
  const sections = useMemo(() => [...new Set(index.map(c => c.section))], [index]);
  const tc = currentCard ? TYPE_COLORS[currentCard.type] : TYPE_COLORS.concept;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1;  } }
        @keyframes pulse-ring { 0%,100% { opacity:0.4; transform:scale(1); } 50% { opacity:0.15; transform:scale(1.08); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes float { 0%,100% { transform:translateY(0px) rotate(0deg); } 50% { transform:translateY(-12px) rotate(1deg); } }
        .fc-card-wrap { animation: fadeUp 0.45s cubic-bezier(0.23,1,0.32,1) both; }
        .fc-rate-btn { position:relative !important; overflow:hidden !important; }
        .fc-rate-btn::before { content:"" !important; position:absolute !important; top:0 !important; left:-75% !important; width:50% !important; height:100% !important; background:linear-gradient(120deg,transparent 0%,rgba(0,0,0,0.08) 50%,transparent 100%) !important; transform:skewX(-20deg) !important; opacity:0 !important; pointer-events:none !important; z-index:1 !important; }
        .fc-rate-btn:hover::before { opacity:1 !important; animation:glass-shine 0.55s ease forwards !important; }
        .fc-rate-btn:active { opacity: 0.85 !important; }
        .fc-browse-row:hover .fc-browse-arrow { opacity:1 !important; transform:translateX(3px) !important; }
        .flip-inner {
          position:relative; min-height:340px;
          transform-style:preserve-3d;
          transition:transform 0.6s cubic-bezier(0.23,1,0.32,1);
        }
        .flip-inner.flipped { transform:rotateY(180deg); }
        .flip-face {
          position:absolute; inset:0;
          backface-visibility:hidden; -webkit-backface-visibility:hidden;
          border-radius:20px;
          display:flex; flex-direction:column;
        }
        .flip-back { transform:rotateY(180deg); }
        @media (max-width: 480px) {
          .fc-rate-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .fc-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* ── MODAL OVERLAY ── */}
      {modalOpen && currentCard && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          {/* Ambient glow behind card */}
          <div style={{
            position: 'absolute', width: 480, height: 480,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${tc.glow} 0%, transparent 70%)`,
            animation: 'pulse-ring 4s ease-in-out infinite',
            pointerEvents: 'none',
            filter: 'blur(40px)',
          }} />

          <div className="fc-card-wrap" style={{ width: '100%', maxWidth: 620, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>

            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, marginRight: '1rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {idx + 1} / {queueIds.length}
                </span>
                <div style={{ flex: 1, height: 2, background: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(idx / queueIds.length) * 100}%`,
                    background: `linear-gradient(90deg, ${tc.main}, color-mix(in srgb, ${tc.main} 80%, transparent))`,
                    borderRadius: 4, transition: 'width 0.4s ease',
                    boxShadow: `0 0 8px ${tc.glow}`,
                  }} />
                </div>
              </div>
              <button onClick={closeModal} style={{
                background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)',
                color: 'var(--text3)', borderRadius: 6, padding: '0.28rem 0.6rem',
                cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                flexShrink: 0, transition: 'all 0.15s',
              }}>{langHi ? "बंद करें" : "ESC"}</button>
            </div>

            {/* Flip card */}
            <div style={{ perspective: '1400px', cursor: 'pointer' }} onClick={() => flipCard()}>
              <div className={`flip-inner${flipped ? ' flipped' : ''}`}>

                {/* FRONT FACE */}
                <div className="flip-face" style={{
                  background: `linear-gradient(145deg, var(--bg2) 0%, var(--bg3) 50%, var(--bg2) 100%)` as string,
                  border: `1px solid color-mix(in srgb, ${tc.main} 27%, transparent)`,
                  boxShadow: `0 0 0 1px color-mix(in srgb, ${tc.main} 13%, transparent), 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,0,0,0.04)`,
                  padding: '2rem',
                }}>
                  {/* Top accent bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
                    background: `linear-gradient(90deg, transparent, ${tc.main}, transparent)`,
                    borderRadius: 1,
                  }} />
                  {/* Corner graphic — top right */}
                  <svg style={{ position: 'absolute', top: 12, right: 12, opacity: 0.12 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <circle cx="50" cy="10" r="30" stroke={tc.main} strokeWidth="1"/>
                    <circle cx="50" cy="10" r="20" stroke={tc.main} strokeWidth="0.75"/>
                    <circle cx="50" cy="10" r="10" stroke={tc.main} strokeWidth="0.5"/>
                  </svg>
                  {/* Corner graphic — bottom left */}
                  <svg style={{ position: 'absolute', bottom: 16, left: 12, opacity: 0.07 }} width="80" height="40" viewBox="0 0 80 40" fill="none">
                    <line x1="0" y1="40" x2="80" y2="0" stroke={tc.main} strokeWidth="0.75"/>
                    <line x1="0" y1="30" x2="60" y2="0" stroke={tc.main} strokeWidth="0.5"/>
                    <line x1="0" y1="20" x2="40" y2="0" stroke={tc.main} strokeWidth="0.5"/>
                  </svg>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
                    <span style={{
                      fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase', letterSpacing: '0.14em',
                      color: tc.main,
                      background: tc.dim,
                      border: `1px solid color-mix(in srgb, ${tc.main} 27%, transparent)`,
                      padding: '3px 9px', borderRadius: 4,
                      boxShadow: `0 0 12px ${tc.glow}`,
                    }}>{getTypeLabel(currentCard.type)}</span>
                    <span style={{
                      fontSize: '0.62rem', color: 'var(--text3)',
                      fontFamily: 'var(--font-ui)', letterSpacing: '0.04em',
                    }}>{currentCard.section}</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingRight: '1rem' }}>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: '1.15rem',
                      color: 'var(--text)', lineHeight: 1.7,
                      letterSpacing: '-0.01em',
                    }}>
                      {langHi ? (currentCard.front_hi ?? currentCard.front) : currentCard.front}
                    </div>
                  </div>

                  <div style={{
                    marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    color: 'var(--text3)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                    {langHi ? 'उत्तर देखें' : 'Click to reveal'}
                  </div>
                </div>

                {/* BACK FACE */}
                <div className="flip-face flip-back" style={{
                  background: `var(--bg2)`,
                  border: `1px solid color-mix(in srgb, ${tc.main} 33%, transparent)`,
                  boxShadow: `0 0 0 1px color-mix(in srgb, ${tc.main} 16%, transparent), 0 4px 32px rgba(0,0,0,0.08), inset 0 1px 0 color-mix(in srgb, ${tc.main} 9%, transparent)`,
                  padding: '2rem', overflowY: 'auto',
                }}>
                  {/* Top accent bar — stronger on back */}
                  <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
                    background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${tc.main} 80%, transparent), transparent)`,
                  }} />
                  <div style={{
                    fontSize: '0.58rem', fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase', letterSpacing: '0.14em',
                    color: tc.main, marginBottom: '1rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    <div style={{ width: 16, height: 1, background: tc.main, opacity: 0.5 }} />
                    {langHi ? 'उत्तर' : 'Answer'}
                    <div style={{ width: 16, height: 1, background: tc.main, opacity: 0.5 }} />
                  </div>

                  <div style={{
                    color: 'var(--text)', fontSize: '0.92rem',
                    lineHeight: 1.85, whiteSpace: 'pre-line',
                    fontFamily: 'var(--font-body)',
                    position: 'relative', zIndex: 1,
                  }}>
                    {(() => {
                      const answer = getBack(currentCard.id);
                      if (answer) return langHi ? (answer.back_hi ?? answer.back) : answer.back;
                      if (revealState === 'locked') return <AnswerLocked langHi={langHi} />;
                      if (revealState === 'login') {
                        return (
                          <span style={{ color: 'var(--text2)' }}>
                            {langHi
                              ? 'उत्तर देखने के लिए निःशुल्क साइन इन करें।'
                              : 'Sign in free to see answers.'}
                          </span>
                        );
                      }
                      if (revealState === 'error') {
                        return (
                          <span style={{ color: 'var(--danger-text)' }}>
                            {langHi
                              ? 'उत्तर लोड नहीं हो सका। एक बार फिर पलटें।'
                              : 'Could not load the answer. Flip again to retry.'}
                          </span>
                        );
                      }
                      return (
                        <span style={{ color: 'var(--text-dim)' }}>
                          {langHi ? 'उत्तर आ रहा है…' : 'Revealing…'}
                        </span>
                      );
                    })()}
                  </div>
                </div>

              </div>
            </div>

            {/* Rating buttons */}
            <div className="fc-rate-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.55rem',
              // Grading a card you were never shown the answer to would write
              // a review interval for something you did not review.
              opacity: flipped && answerVisible ? 1 : 0,
              transform: flipped && answerVisible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s',
              pointerEvents: flipped && answerVisible ? 'auto' : 'none',
            }}>
              {([
                { grade: 1, label: langHi ? 'खाली' : 'Blank',  sub: langHi ? 'याद नहीं' : 'No recall',   color: 'var(--danger-text)', dim: 'var(--danger-wash)',   glow: 'color-mix(in srgb, var(--danger-text) 30%, transparent)' },
                { grade: 2, label: langHi ? 'कठिन' : 'Hard',   sub: langHi ? 'प्रयास से' : 'With effort', color: 'var(--warning-text)', dim: 'var(--warning-wash)', glow: 'color-mix(in srgb, var(--warning-text) 30%, transparent)' },
                { grade: 3, label: langHi ? 'ठीक' : 'Good',   sub: langHi ? 'याद आया' : 'Recalled',    color: 'var(--accent-text)', dim: 'var(--accent-wash)', glow: 'color-mix(in srgb, var(--accent) 30%, transparent)' },
                { grade: 4, label: langHi ? 'आसान' : 'Easy',   sub: langHi ? 'बिल्कुल सही' : 'Perfect',     color: 'var(--success-text)', dim: 'var(--success-wash)', glow: 'color-mix(in srgb, var(--success-text) 30%, transparent)' },
              ] as const).map(r => (
                <button key={r.grade} className="fc-rate-btn"
                  onClick={(e) => { e.stopPropagation(); rate(r.grade as 1|2|3|4); }}
                  style={{
                    background: r.dim,
                    /* The wash is only 1.1-1.5:1 against the ground, so the edge
                       carries the tile's shape on its own. 70% is the lowest mix
                       that clears 3:1 for all four roles on both grounds. */
                    border: `1px solid color-mix(in srgb, ${r.color} 70%, transparent)`,
                    color: r.color, borderRadius: 10, padding: '0.65rem 0.4rem',
                    cursor: 'pointer', transition: 'all 0.18s', textAlign: 'center',
                    boxShadow: `inset 0 1px 0 color-mix(in srgb, ${r.color} 9%, transparent)`,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.2rem', fontFamily: 'var(--font-ui)' }}>{r.label}</div>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>{r.sub}</div>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ── MAIN PAGE ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.25rem' }}>
          <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
            History Optional
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
            {langHi ? 'विश्लेषणात्मक फ्लैशकार्ड' : 'Analytical Flashcards'}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem', maxWidth: 520, lineHeight: 1.65 }}>
            {langHi ? 'इतिहासकार बहसें, कारण-प्रभाव श्रृंखलाएँ, तुलनाएँ, उद्धरण — Mains के लिए।' : 'Historian debates, cause-effect chains, comparisons, quote attributions — built for Mains-level analysis.'}
          </p>
          {/* How much of the free allowance is left. Questions are free to
              browse; the count is about answers, and says so. */}
          {/* Only once there is an allowance to report. A signed-out visitor is
              told nothing here: they are browsing questions, which are free,
              and the prompt to sign in already arrives when they open a card. */}
          {allowance && !allowance.unlimited && !allowance.requiresLogin && (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600,
              letterSpacing: '0.08em', marginTop: '0.75rem',
              color: allowance.used >= allowance.limit ? 'var(--danger-text)' : 'var(--text2)',
            }}>
              {allowance.used >= allowance.limit
                ? (langHi
                    ? `${allowance.limit} निःशुल्क उत्तर पूरे · सदस्यता लें`
                    : `${allowance.limit} free answers used · subscribe for the rest`)
                : (langHi
                    ? `${allowance.limit - allowance.used} / ${allowance.limit} निःशुल्क उत्तर शेष`
                    : `${allowance.limit - allowance.used} of ${allowance.limit} free answers left`)}
            </div>
          )}
        </div>

        {/* Stats */}
        {mounted && (
          <div className="fc-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', marginBottom: '1.75rem' }}>
            {([
              { key: 'all',     label: langHi ? 'कुल' : 'Total',              value: index.length, color: 'var(--accent)' },
              { key: 'studied', label: langHi ? 'पढ़े गए' : 'Studied',        value: studiedCount,      color: 'var(--accent)' },
              { key: 'due',     label: langHi ? 'आज बाकी' : 'Due Today',      value: dueCount,          color: dueCount > 0 ? 'var(--warning-text)' : 'var(--text3)' },
              { key: 'session', label: langHi ? 'पिछला सत्र' : 'Last Session', value: lastSessionIds.length, color: 'var(--success-text)' },
            ] as const).map(s => {
              const active = view === s.key;
              // Nothing to show means nothing to click into.
              const enabled = s.key === 'all' || s.value > 0;
              return (
              <button
                key={s.label}
                type="button"
                onClick={() => enabled && setView(active ? 'all' : s.key)}
                disabled={!enabled}
                aria-pressed={active}
                title={enabled
                  ? (active ? (langHi ? 'सभी दिखाएँ' : 'Show all') : (langHi ? 'ये कार्ड दिखाएँ' : 'Show these cards'))
                  : (langHi ? 'कोई कार्ड नहीं' : 'No cards yet')}
                style={{
                background: active ? `color-mix(in srgb, ${s.color} 10%, var(--bg2))` : 'var(--bg2)',
                border: `1px solid color-mix(in srgb, ${s.color} ${active ? '55%' : '16%'}, transparent)`,
                borderRadius: 10, padding: '0.9rem 1rem',
                position: 'relative', overflow: 'hidden',
                textAlign: 'left', font: 'inherit',
                cursor: enabled ? 'pointer' : 'default',
                opacity: enabled ? 1 : 0.55,
                transition: 'background 0.15s, border-color 0.15s',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${s.color} 53%, transparent), transparent)`,
                }} />
                <div style={{ fontSize: '0.6rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>{s.label}</div>
                <div style={{ fontSize: '1.65rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>{s.value}</div>
              </button>
            );})}
          </div>
        )}

        {/* Filters + Start */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.75rem', alignItems: 'center' }}>
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '0.38rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer' }}>
            <option value="All">{langHi ? "सभी अनुभाग" : "All Sections"}</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '0.38rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer' }}>
            <option value="All">{langHi ? "सभी प्रकार" : "All Types"}</option>
            {FLASHCARD_TYPES.map(t => <option key={t} value={t}>{getTypeLabel(t)}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text2)', cursor: 'pointer' }}>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '0.38rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer' }}>
            <option value="All">{langHi ? "सभी रेटिंग" : "All Ratings"}</option>
            <option value="1">{langHi ? 'खाली' : 'Blank'}</option>
            <option value="2">{langHi ? 'कठिन' : 'Hard'}</option>
            <option value="3">{langHi ? 'अच्छा' : 'Good'}</option>
            <option value="4">{langHi ? 'आसान' : 'Easy'}</option>
          </select>
            <input type="checkbox" checked={filterDue} onChange={e => setFilterDue(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            {langHi ? 'केवल बाकी' : 'Due only'}
          </label>
          <div style={{ flex: 1 }} />
          <button onClick={() => { if (requireLogin('Sign in free to start your flashcard session.')) buildQueue(); }}
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent))',
              color: 'var(--accent-on)', border: 'none',
              borderRadius: 8, padding: '0.48rem 1.25rem', fontSize: '0.82rem',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
              boxShadow: 'none',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => {}}
            onMouseLeave={e => {}}>
            Start {filteredDue.length > 0 ? `(${filteredDue.length} due)` : `(${filteredIndex.length})`}
          </button>
        </div>

        {/* Session complete */}
        {sessionDone > 0 && sessionFinished && (
          <SessionComplete
            reviewed={sessionDone}
            recalled={sessionRecalled}
            dueLeft={filteredDue.length}
            langHi={langHi}
            onNext={() => buildQueue()}
            onDone={() => { setSessionDone(0); setSessionFinished(false); }}
          />
        )}
        {sessionDone > 0 && !sessionFinished && (
          <div style={{ background: 'var(--accent-dim)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 10, padding: '0.9rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.83rem', color: 'var(--text2)' }}>
              {langHi ? <>सत्र पूर्ण — <strong style={{ color: 'var(--accent)' }}>{sessionDone} कार्ड</strong> समीक्षित।</> : <>Session complete — <strong style={{ color: 'var(--accent)' }}>{sessionDone} cards</strong> reviewed.</>}
            </span>
            <button onClick={() => setSessionDone(0)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.73rem' }}>{langHi ? "हटाएँ" : "Dismiss"}</button>
          </div>
        )}

        {/* Browse list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: '0.15rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            {filteredIndex.length} cards
          </div>
          {visibleIds.map(id => getCard(id)).filter((c): c is FlashCard => !!c).map(card => {
            const s = sr[card.id];
            const isDue = !s || s.nextDue <= today;
            const tc2 = TYPE_COLORS[card.type];
            return (
              <div key={card.id} className="fc-browse-row"
                onClick={() => { if (requireLogin('Sign in free to study flashcards.')) buildQueue(card); }}
                style={{
                  background: 'var(--bg2)',
                  border: `1px solid ${isDue && mounted ? `color-mix(in srgb, tc2.main 20%, transparent)` : 'var(--border)'}`,
                  borderRadius: 10, padding: '0.85rem 1.1rem',
                  display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = `color-mix(in srgb, tc2.main 33%, transparent)`;
                  el.style.background = `var(--bg3)`;
                  el.style.boxShadow = `0 2px 16px color-mix(in srgb, ${tc2.main} 13%, transparent)`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = isDue && mounted ? `color-mix(in srgb, tc2.main 20%, transparent)` : 'var(--border)';
                  el.style.background = 'var(--bg2)';
                  el.style.boxShadow = 'none';
                }}
              >
                {isDue && mounted && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg, transparent, ${tc2.main}, transparent)`, borderRadius: '10px 0 0 10px' }} />
                )}
                <span style={{
                  fontSize: '0.58rem', fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: tc2.main, background: tc2.dim,
                  border: `1px solid color-mix(in srgb, ${tc2.main} 20%, transparent)`,
                  padding: '2px 7px', borderRadius: 4,
                  display: 'block', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2,
                }}>{getTypeLabel(card.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text)', lineHeight: 1.45 }}>{langHi ? (card.front_hi ?? card.front) : card.front}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '0.25rem' }}>{card.section}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {/* How it was last graded. Without it the rating filter is
                      the only way to find out, and the answer is invisible on
                      the card itself. */}
                  {mounted && s?.lastGrade && (
                    <span style={{
                      fontSize: '0.58rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                      textTransform: 'uppercase', color: GRADE_COLORS[s.lastGrade],
                      border: `1px solid color-mix(in srgb, ${GRADE_COLORS[s.lastGrade]} 70%, transparent)`,
                      background: `color-mix(in srgb, ${GRADE_COLORS[s.lastGrade]} 8%, transparent)`,
                      borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap',
                    }}>
                      {langHi ? GRADE_LABELS_HI[s.lastGrade] : GRADE_LABELS[s.lastGrade]}
                    </span>
                  )}
                  {mounted && (
                    <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: isDue ? tc2.main : 'var(--text3)' }}>
                      {isDue ? (s ? (langHi ? 'बाकी' : 'Due') : (langHi ? 'नया' : 'New')) : `${s.interval}d`}
                    </span>
                  )}
                  <span className="fc-browse-arrow" style={{ color: 'var(--text3)', fontSize: '0.75rem', opacity: 0, transition: 'all 0.15s' }}>→</span>
                </div>
              </div>
            );
          })}

          {/* A failed fetch and an empty deck look identical if both render
              nothing, and the second is a lie during an outage. */}
          {deckError && (
            <div style={{ fontSize: '0.8rem', color: 'var(--danger-text)', padding: '16px 0' }}>
              {langHi ? 'फ्लैशकार्ड लोड नहीं हो सके।' : deckError}
            </div>
          )}
          {indexLoading && !deckError && (
            <OwlLoader label={langHi ? 'फ्लैशकार्ड लोड हो रहे हैं' : 'Loading flashcards'} />
          )}
          {!indexLoading && !deckError && filteredIndex.length > browseLimit && (
            <button
              onClick={() => setBrowseLimit(n => n + 60)}
              style={{
                marginTop: '0.35rem', padding: '0.7rem', borderRadius: 10,
                background: 'var(--bg2)', border: '1px solid var(--border)',
                color: 'var(--text2)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.06em',
              }}
            >
              {langHi
                ? `और दिखाएँ (${filteredIndex.length - browseLimit} बाकी)`
                : `Show more (${filteredIndex.length - browseLimit} more)`}
            </button>
          )}
        </div>
      </div>
      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </>
  );
}
