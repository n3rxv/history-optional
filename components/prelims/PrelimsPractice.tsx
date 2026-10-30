'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { prelimsQuestions, type PrelimsQuestion } from '@/lib/prelimsData';
import { useLang } from '@/lib/i18n/LangContext';
import { usePrelimsHi } from '@/lib/prelimsHi';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { useRefreshSafe } from '@/hooks/useRefreshSafe';
import LoginPromptModal from '@/components/LoginPromptModal';
import OwlLoader from '@/components/OwlLoader';

/**
 * Prelims questions one at a time, marked as in the exam: +2 right, −0.66
 * wrong, nothing for a skip. After each answer a Premium reader gets the
 * explanation: the solution, the technique that cracks it, a smart guess and
 * the concepts it needs.
 */

type Filter = 'all' | 'pyq' | 'practice' | 'bookmarked';
interface AIResult { solution: string; technique: string; concepts: string; related: string; smart_guess: string }
interface QState { selected: number | null; submitted: boolean; marked: boolean; aiResult: AIResult | null }

const TOPICS = Array.from(new Set(prelimsQuestions.map((q) => q.topic)));
const YEARS = Array.from(new Set(prelimsQuestions.filter((q) => q.year).map((q) => q.year!))).sort((a, b) => b - a);
const EMPTY_Q: QState = { selected: null, submitted: false, marked: false, aiResult: null };

// ── The reader's answers, kept on this device. Read through a store rather
// than in a useState initialiser: the server has no localStorage, so an
// initialiser that read it rendered differently in the browser and failed
// hydration for anyone with an answer saved.
const KEY = 'ho_prelims_states';
type States = Record<string, QState>;
const NONE: States = {};
let cache: States | null = null;
const listeners = new Set<() => void>();
function readStates(): States {
  if (cache === null) {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Partial<QState>>;
      cache = Object.fromEntries(Object.entries(raw).map(([id, s]) => [id, { selected: s.selected ?? null, submitted: Boolean(s.submitted), marked: Boolean(s.marked), aiResult: s.aiResult ?? null }]));
    } catch { cache = {}; }
  }
  return cache;
}
function writeStates(next: States) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* full or private */ }
  listeners.forEach((l) => l());
}
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const useStates = () => useSyncExternalStore(subscribe, readStates, () => NONE);

const EXPLAIN_KEY = 'prelims_explanations_v2';
function cachedExplanation(id: string): AIResult | null {
  try { return JSON.parse(localStorage.getItem(EXPLAIN_KEY) ?? '{}')[id] ?? null; } catch { return null; }
}
function cacheExplanation(id: string, r: AIResult) {
  try { const o = JSON.parse(localStorage.getItem(EXPLAIN_KEY) ?? '{}'); o[id] = r; localStorage.setItem(EXPLAIN_KEY, JSON.stringify(o)); } catch { /* optional */ }
}

function filterQuestions(filter: Filter, topic: string, year: string, states: States) {
  return prelimsQuestions.filter((q) => {
    if (filter === 'bookmarked') return Boolean(states[q.id]?.marked);
    if (filter !== 'all' && q.type !== filter) return false;
    if (topic !== 'all' && q.topic !== topic) return false;
    if (year !== 'all' && String(q.year) !== year) return false;
    return true;
  });
}
function scoreOf(questions: PrelimsQuestion[], states: States) {
  let score = 0, correct = 0, wrong = 0;
  for (const q of questions) {
    const s = states[q.id];
    if (!s?.submitted || s.selected === null) continue;
    if (s.selected === q.correct) { score += 2; correct += 1; } else { score -= 0.66; wrong += 1; }
  }
  return { score: Math.round(score * 100) / 100, correct, wrong, skipped: questions.length - correct - wrong };
}

const TECHNIQUES = /(LINCHPIN STATEMENT|LINCHPIN\/ANCHOR STATEMENT|PAIR ELIMINATION|ODD-ONE-OUT|EXTREME LANGUAGE TRAP|CHRONOLOGICAL ORDERING|GEOGRAPHICAL ELIMINATION|ASSERTION-REASON|MATCH-THE-FOLLOWING|NEGATIVE QUESTION|DEGREE-OF-CERTAINTY|PROCESS-OF-ELIMINATION|NCERT ANCHOR|CONTEMPORARY SOURCE|ADMINISTRATIVE\/ECONOMIC TERM)/;
/** A section's points ("a || b || c"), with the technique names picked out. */
function Points({ text }: { text: string }) {
  return (
    <ul className="pp-points">
      {text.split('||').map((point, i) => (
        <li key={i}>{point.trim().split(TECHNIQUES).map((part, j) => (TECHNIQUES.test(part) ? <span key={j} className="pp-tech">{part.toLowerCase()}</span> : <span key={j}>{part}</span>))}</li>
      ))}
    </ul>
  );
}

const fmt = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n)}`;
const noop = () => () => {};

export default function PrelimsPractice() {
  const { langHi: hi } = useLang();
  const T = (en: string, h: string) => (hi ? h : en);
  // The questions, options and topic names in Hindi once loaded; any without
  // Hindi yet stay in English. Answers are checked by option index either way.
  const phi = usePrelimsHi(hi);
  const topicName = (t: string) => phi?.topics[t] ?? t;
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();
  const states = useStates();

  const [filter, setFilter] = useState<Filter>('all');
  // ?topic= from a link into one topic's set; a choice made here takes over.
  const urlTopic = useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get('topic'), () => null);
  const [topicOwn, setTopicOwn] = useState<string | null>(null);
  const topic = topicOwn ?? (urlTopic && TOPICS.includes(urlTopic) ? urlTopic : 'all');
  const [year, setYear] = useState('all');
  const [current, setCurrent] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState<Set<string>>(() => new Set());
  const [failed, setFailed] = useState<Set<string>>(() => new Set());

  // The place in the set and its filters are kept for the tab; a link into a
  // different topic starts that topic fresh.
  useRefreshSafe(
    'ho_prelims_practice_v2',
    { filter, topic, year, current, showResult },
    (saved) => {
      const fromUrl = new URLSearchParams(window.location.search).get('topic');
      if (fromUrl && fromUrl !== saved.topic) return;
      setFilter(saved.filter); setTopicOwn(saved.topic); setYear(saved.year);
      const size = filterQuestions(saved.filter, saved.topic, saved.year, readStates()).length;
      setCurrent(Math.min(saved.current, Math.max(0, size - 1)));
      setShowResult(saved.showResult);
    },
  );

  // Premium is read once Firebase knows who is signed in; on a fresh load the
  // session is still being restored when the page mounts.
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setIsPremium(false); return; }
    try {
      const res = await fetch('/api/usage?fp=premcheck', { headers: { 'x-user-token': await user.getIdToken() } });
      setIsPremium((await res.json()).subscribed === true);
    } catch { setIsPremium(false); }
  }), []);

  const filtered = filterQuestions(filter, topic, year, states);
  const q = filtered[Math.min(current, Math.max(0, filtered.length - 1))];
  const qs = q ? (states[q.id] ?? EMPTY_Q) : EMPTY_Q;
  const update = (id: string, patch: Partial<QState>) => { const all = readStates(); writeStates({ ...all, [id]: { ...(all[id] ?? EMPTY_Q), ...patch } }); };
  const refilter = () => { setCurrent(0); setShowResult(false); };

  const asked = useRef(new Set<string>());
  const loadExplanation = async (item: PrelimsQuestion) => {
    const user = auth.currentUser;
    if (!user) return;
    asked.current.add(item.id);
    const hit = cachedExplanation(item.id);
    if (hit) { update(item.id, { aiResult: hit }); return; }
    setLoading((s) => new Set(s).add(item.id));
    setFailed((s) => { const n = new Set(s); n.delete(item.id); return n; });
    try {
      const res = await fetch('/api/prelims-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ question: item.question, options: item.options, correct: item.correct, topic: item.topic, lang: hi ? 'hi' : 'en' }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      cacheExplanation(item.id, data);
      update(item.id, { aiResult: data });
    } catch {
      setFailed((s) => new Set(s).add(item.id));
    } finally {
      setLoading((s) => { const n = new Set(s); n.delete(item.id); return n; });
    }
  };

  // An answered question without its explanation (answered before Premium
  // was confirmed) fetches it when opened.
  useEffect(() => {
    if (!isPremium || !q || !qs.submitted || qs.aiResult || asked.current.has(q.id)) return;
    loadExplanation(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, q?.id, qs.submitted, qs.aiResult]);

  const select = (i: number) => {
    if (!q || qs.submitted) return;
    if (!requireLogin(T('Sign in free to attempt Prelims practice questions.', 'प्रिलिम्स अभ्यास प्रश्न हल करने के लिए निःशुल्क साइन इन करें।'))) return;
    update(q.id, { selected: i });
  };
  const submit = () => {
    if (!q || qs.selected === null || qs.submitted) return;
    update(q.id, { submitted: true });
    if (isPremium) loadExplanation(q);
  };
  const goTo = (i: number) => { setCurrent(i); setShowResult(false); setNavOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const reset = () => {
    // Bookmarks and explanations already fetched are kept.
    const next: States = {};
    for (const [id, s] of Object.entries(readStates())) if (s.marked || s.aiResult) next[id] = { ...EMPTY_Q, marked: s.marked, aiResult: s.aiResult };
    writeStates(next);
    setCurrent(0); setConfirmReset(false); setShowResult(false);
  };

  const { score, correct, wrong, skipped } = scoreOf(filtered, states);
  const answered = correct + wrong;
  const maxScore = filtered.length * 2;
  const marked = filtered.filter((x) => states[x.id]?.marked).length;
  const setName = filter === 'bookmarked' ? T('Bookmarked', 'बुकमार्क') : topic !== 'all' ? topicName(topic) : T('All topics', 'सभी विषय');
  const idx = q ? filtered.indexOf(q) : 0;
  const qHi = q ? phi?.q[q.id] : undefined;
  const qText = qHi?.q || q?.question;
  const qOptions = q ? (qHi && qHi.o.length === q.options.length ? qHi.o : q.options) : [];

  const navigator = (
    <>
      <div className="pp-legend" aria-hidden="true">
        <span><i className="ok" />{T('Right', 'सही')}</span><span><i className="no" />{T('Wrong', 'ग़लत')}</span><span><i className="mk" />{T('Bookmarked', 'बुकमार्क')}</span><span><i />{T('Not tried', 'बाक़ी')}</span>
      </div>
      <div className="pp-grid-nums">
        {filtered.map((fq, i) => {
          const s = states[fq.id];
          const tone = s?.submitted ? (s.selected === fq.correct ? 'ok' : 'no') : '';
          return (
            <button key={fq.id} type="button" className={`pp-num ${tone}${s?.marked ? ' mk' : ''}${i === idx ? ' on' : ''}`} onClick={() => goTo(i)} aria-label={`${T('Question', 'प्रश्न')} ${i + 1}`} aria-current={i === idx ? 'true' : undefined}>{i + 1}</button>
          );
        })}
      </div>
      <dl className="pp-sum">
        <div><dt>{T('Score', 'स्कोर')}</dt><dd className={score >= 0 ? 'ok' : 'no'}>{fmt(score)}</dd></div>
        <div><dt>{T('Right', 'सही')}</dt><dd className="ok">{correct}</dd></div>
        <div><dt>{T('Wrong', 'ग़लत')}</dt><dd className="no">{wrong}</dd></div>
        <div><dt>{T('Bookmarked', 'बुकमार्क')}</dt><dd className="mk">{marked}</dd></div>
        <div><dt>{T('Left', 'बाक़ी')}</dt><dd>{filtered.length - answered}</dd></div>
      </dl>
    </>
  );

  return (
    <div className="pp ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pp-bar">
        <div className="ds-container pp-bar-in">
          <Link href="/prelims" className="pp-back" aria-label={T('Prelims topics', 'प्रिलिम्स विषय')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          </Link>
          <div className="pp-bar-title">
            <strong>{setName}</strong>
            <span>{filtered.length ? T(`Question ${idx + 1} of ${filtered.length}`, `प्रश्न ${idx + 1} / ${filtered.length}`) : T('No questions', 'कोई प्रश्न नहीं')}</span>
          </div>
          <span className={`pp-score ${score >= 0 ? 'ok' : 'no'}`} title={T('Your score in this set', 'इस सेट में स्कोर')}>{fmt(score)}</span>
          <button type="button" className="ds-btn ds-btn-line ds-btn-sm pp-qs" onClick={() => setNavOpen(true)}>{T('Questions', 'प्रश्न')}</button>
        </div>
      </div>

      <div className="ds-container pp-filters">
        <div className="pp-seg" role="radiogroup" aria-label={T('Which questions', 'कौन-से प्रश्न')}>
          {([['all', T('All', 'सभी')], ['pyq', T('Past questions', 'पिछले प्रश्न')], ['practice', T('Practice', 'अभ्यास')]] as [Filter, string][]).map(([f, label]) => (
            <button key={f} type="button" role="radio" aria-checked={filter === f} className={filter === f ? 'on' : ''} onClick={() => { setFilter(f); refilter(); }}>{label}</button>
          ))}
        </div>
        <select className={`pp-select${topic !== 'all' ? ' set' : ''}`} value={topic} onChange={(e) => { setTopicOwn(e.target.value); refilter(); }} aria-label={T('Topic', 'विषय')}>
          <option value="all">{T('All topics', 'सभी विषय')}</option>
          {TOPICS.map((t) => <option key={t} value={t}>{topicName(t)}</option>)}
        </select>
        <select className={`pp-select${year !== 'all' ? ' set' : ''}`} value={year} onChange={(e) => { setYear(e.target.value); refilter(); }} aria-label={T('Year', 'वर्ष')}>
          <option value="all">{T('Every year', 'सभी वर्ष')}</option>
          {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
        <button type="button" className={`pp-chip${filter === 'bookmarked' ? ' on' : ''}`} aria-pressed={filter === 'bookmarked'} onClick={() => { setFilter(filter === 'bookmarked' ? 'all' : 'bookmarked'); refilter(); }}>
          {T('Bookmarked', 'बुकमार्क')}{marked ? ` · ${marked}` : ''}
        </button>
        {answered > 0 && (
          <span className="pp-filter-actions">
            <button type="button" className="pp-link" onClick={() => setShowResult(true)}>{T('Your score', 'आपका स्कोर')}</button>
            <button type="button" className="pp-link" onClick={() => setConfirmReset(true)}>{T('Start over', 'फिर से शुरू')}</button>
          </span>
        )}
      </div>

      <div className="ds-container pp-layout">
        <main className="pp-main">
          {showResult ? (
            <section className="pp-card pp-result">
              <span className="pp-result-label">{T('Your score in this set', 'इस सेट में आपका स्कोर')}</span>
              <span className={`pp-result-num ${score >= 0 ? 'ok' : 'no'}`}>{fmt(score)}<small> / {maxScore}</small></span>
              <div className="pp-meter"><span style={{ width: `${maxScore ? Math.max(0, (score / maxScore) * 100) : 0}%` }} /></div>
              <div className="pp-tiles">
                <div><strong className="ok">{correct}</strong><span>{T('right', 'सही')} · +{(correct * 2).toFixed(0)}</span></div>
                <div><strong className="no">{wrong}</strong><span>{T('wrong', 'ग़लत')} · −{(wrong * 0.66).toFixed(2)}</span></div>
                <div><strong>{skipped}</strong><span>{T('not tried', 'बाक़ी')}</span></div>
              </div>
              <p className="pp-result-note">{T('As in the exam: +2 for a right answer, −0.66 for a wrong one, nothing for one left alone.', 'परीक्षा की तरह: सही पर +2, ग़लत पर −0.66, छोड़े पर कुछ नहीं।')}</p>
              <div className="pp-actions">
                <button type="button" className="ds-btn ds-btn-solid" onClick={() => setShowResult(false)}>{T('Back to the questions', 'प्रश्नों पर लौटें')}</button>
                <button type="button" className="ds-btn ds-btn-line" onClick={() => setConfirmReset(true)}>{T('Start over', 'फिर से शुरू')}</button>
              </div>
            </section>
          ) : !q ? (
            <section className="pp-card pp-empty">
              <strong>{filter === 'bookmarked' ? T('No bookmarks yet', 'अभी कोई बुकमार्क नहीं') : T('No questions match', 'कोई प्रश्न नहीं मिला')}</strong>
              <p>{filter === 'bookmarked' ? T('Bookmark a question to come back to it here.', 'किसी प्रश्न को बुकमार्क करें, वह यहाँ मिलेगा।') : T('Try another topic or year.', 'कोई दूसरा विषय या वर्ष चुनें।')}</p>
              <button type="button" className="ds-btn ds-btn-line" onClick={() => { setFilter('all'); setTopicOwn('all'); setYear('all'); refilter(); }}>{T('Show every question', 'सभी प्रश्न दिखाएँ')}</button>
            </section>
          ) : (
            <>
              <section className="pp-card">
                <div className="pp-meta">
                  <span className="pp-qn">{T('Question', 'प्रश्न')} {idx + 1}</span>
                  <span className={`pp-type${q.type === 'pyq' ? ' pyq' : ''}`}>{q.type === 'pyq' ? `${T('Asked in', 'पूछा गया')} ${q.year ?? ''}` : T('Practice', 'अभ्यास')}</span>
                  <span className="pp-topic">{topicName(q.topic)}</span>
                </div>
                <p className="pp-q">{qText}</p>
                <div className="pp-options" role="radiogroup" aria-label={T('Options', 'विकल्प')}>
                  {qOptions.map((opt, i) => {
                    const state = qs.submitted ? (i === q.correct ? ' right' : qs.selected === i ? ' wrong' : ' faded') : qs.selected === i ? ' on' : '';
                    return (
                      <button key={i} type="button" role="radio" aria-checked={qs.selected === i} className={`pp-opt${state}`} onClick={() => select(i)} disabled={qs.submitted}>
                        <span className="pp-letter">{qs.submitted && i === q.correct ? '✓' : qs.submitted && qs.selected === i ? '✕' : String.fromCharCode(65 + i)}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="pp-row">
                  {qs.submitted ? (
                    <span className={`pp-verdict${qs.selected === q.correct ? ' ok' : ''}`}>
                      {qs.selected === q.correct ? T('Right, +2', 'सही, +2') : T(`Not quite, −0.66. The answer is (${String.fromCharCode(65 + q.correct)}).`, `सही नहीं, −0.66. उत्तर (${String.fromCharCode(65 + q.correct)}) है।`)}
                    </span>
                  ) : (
                    <button type="button" className="ds-btn ds-btn-solid pp-check" disabled={qs.selected === null} onClick={submit}>{T('Check my answer', 'उत्तर जाँचें')}</button>
                  )}
                  <button type="button" className={`pp-mark${qs.marked ? ' on' : ''}`} aria-pressed={qs.marked} onClick={() => update(q.id, { marked: !qs.marked })}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={qs.marked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
                    {qs.marked ? T('Bookmarked', 'बुकमार्क किया') : T('Bookmark', 'बुकमार्क')}
                  </button>
                  <span className="pp-steps">
                    <button type="button" className="ds-btn ds-btn-line ds-btn-sm" disabled={idx === 0} onClick={() => goTo(idx - 1)}>{T('Previous', 'पिछला')}</button>
                    <button type="button" className="ds-btn ds-btn-line ds-btn-sm" disabled={idx === filtered.length - 1} onClick={() => goTo(idx + 1)}>{T('Next', 'अगला')}</button>
                  </span>
                </div>
              </section>

              {qs.submitted && (
                <section className="pp-card pp-explain" aria-label={T('Explanation', 'स्पष्टीकरण')}>
                  <div className="pp-explain-head"><strong>{T('How to reason it out', 'इसे कैसे सोचें')}</strong><span className="pp-premium">{T('Premium', 'प्रीमियम')}</span></div>
                  {!isPremium ? (
                    <div className="pp-lock">
                      <p>{T('The step-by-step solution, the technique that cracks this kind of question, a smart guess for when you are unsure, and the concepts it needs.', 'चरण-दर-चरण हल, ऐसे प्रश्न को खोलने की तकनीक, अनिश्चित होने पर स्मार्ट अनुमान, और ज़रूरी अवधारणाएँ।')}</p>
                      <button type="button" className="ds-btn ds-btn-premium" onClick={() => window.dispatchEvent(new Event('open-premium-modal'))}>{T('See Premium', 'प्रीमियम देखें')}</button>
                    </div>
                  ) : loading.has(q.id) ? (
                    <OwlLoader size="small" caption={T('Writing the explanation', 'स्पष्टीकरण तैयार हो रहा है')} />
                  ) : qs.aiResult ? (
                    <div className="pp-secs">
                      {[
                        { label: T('The solution', 'हल'), body: qs.aiResult.solution },
                        { label: T('The technique', 'तकनीक'), body: qs.aiResult.technique },
                        ...(qs.aiResult.smart_guess ? [{ label: T('A smart guess', 'स्मार्ट अनुमान'), body: qs.aiResult.smart_guess }] : []),
                        { label: T('The concepts it needs', 'ज़रूरी अवधारणाएँ'), body: qs.aiResult.concepts },
                        { label: T('Related terms', 'संबंधित शब्द'), body: qs.aiResult.related },
                      ].filter((x) => x.body).map((x) => (
                        <div key={x.label} className="pp-sec"><h3>{x.label}</h3><Points text={x.body} /></div>
                      ))}
                    </div>
                  ) : (
                    <div className="pp-lock">
                      <p>{failed.has(q.id) ? T('The explanation did not load.', 'स्पष्टीकरण लोड नहीं हुआ।') : T('No explanation yet.', 'अभी स्पष्टीकरण नहीं।')}</p>
                      <button type="button" className="ds-btn ds-btn-line ds-btn-sm" onClick={() => loadExplanation(q)}>{T('Try again', 'फिर कोशिश करें')}</button>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </main>

        <aside className={`pp-nav${navOpen ? ' open' : ''}`} aria-label={T('Questions in this set', 'इस सेट के प्रश्न')}>
          <div className="pp-nav-head">
            <strong>{T('Questions', 'प्रश्न')}</strong>
            <button type="button" className="ds-x pp-nav-x" onClick={() => setNavOpen(false)} aria-label={T('Close', 'बंद करें')}>✕</button>
          </div>
          {navigator}
        </aside>
        {navOpen && <div className="pp-scrim" onClick={() => setNavOpen(false)} />}
      </div>

      {confirmReset && (
        <div className="ds-overlay" onClick={() => setConfirmReset(false)}>
          <div className="ds-modal pp-confirm" role="dialog" aria-modal="true" aria-labelledby="pp-confirm-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="pp-confirm-title">{T('Start over?', 'फिर से शुरू करें?')}</h2>
            <p>{T('Your answers are cleared. Bookmarks, and explanations already written, are kept.', 'आपके उत्तर हट जाएँगे। बुकमार्क और लिखे जा चुके स्पष्टीकरण बने रहेंगे।')}</p>
            <div className="pp-actions">
              <button type="button" className="ds-btn ds-btn-ghost" onClick={() => setConfirmReset(false)}>{T('Cancel', 'रद्द करें')}</button>
              <button type="button" className="ds-btn ds-btn-solid" onClick={reset}>{T('Clear my answers', 'उत्तर हटाएँ')}</button>
            </div>
          </div>
        </div>
      )}
      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}

const CSS = `
.pp { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.pp-bar { position: sticky; top: 60px; z-index: 40; background: color-mix(in srgb, var(--bg) 94%, transparent); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); }
.pp-bar-in { display: flex; align-items: center; gap: var(--space-3); padding-top: var(--space-2); padding-bottom: var(--space-2); }
.pp-back { width: 36px; height: 36px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-md); color: var(--text2); }
.pp-back:hover { background: var(--ds-soft); color: var(--text); }
.pp-bar-title { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.3; }
.pp-bar-title strong { font-size: 0.98rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp-bar-title span { font-size: 0.82rem; color: var(--text3); }
.pp-score { font-size: 1.1rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.pp-score.ok, .pp .ok { color: var(--success-text); }
.pp-score.no, .pp .no { color: var(--danger-text); }
.pp .mk { color: var(--warning-text); }
.pp-qs { display: none; }

.pp-filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); padding-top: var(--space-4); padding-bottom: var(--space-2); }
.pp-seg { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.pp-seg button { padding: 6px 14px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
.pp-seg button.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.pp-select { appearance: none; -webkit-appearance: none; max-width: 240px; height: 38px; padding: 0 32px 0 14px; background: var(--ds-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center; border: 1px solid var(--border2); border-radius: var(--radius-full); color: var(--text); font: inherit; font-size: 0.88rem; cursor: pointer; text-overflow: ellipsis; }
.pp-select.set { border-color: color-mix(in srgb, var(--accent) 50%, transparent); background-color: var(--accent-dim); color: var(--accent-text); font-weight: 600; }
.pp-chip { height: 38px; padding: 0 14px; border: 1px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font: inherit; font-size: 0.88rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
.pp-chip.on { border-color: color-mix(in srgb, var(--warning-text) 50%, transparent); background: var(--warning-wash); color: var(--warning-text); }
.pp-filter-actions { display: inline-flex; gap: var(--space-4); margin-left: auto; }
.pp-link { padding: 0; border: none; background: none; font: inherit; font-size: 0.9rem; font-weight: 600; color: var(--accent-text); cursor: pointer; }

.pp-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: var(--space-6); align-items: start; padding-top: var(--space-3); }
.pp-main { display: flex; flex-direction: column; gap: var(--space-4); min-width: 0; }
.pp-card { padding: var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.pp-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px var(--space-2); margin-bottom: var(--space-3); }
.pp-qn { font-size: 0.86rem; font-weight: 700; color: var(--text3); }
.pp-type { padding: 2px 10px; border-radius: var(--radius-full); background: var(--accent-dim); color: var(--accent-text); font-size: 0.78rem; font-weight: 700; }
.pp-type.pyq { background: var(--warning-wash); color: var(--warning-text); }
.pp-topic { padding: 2px 10px; border-radius: var(--radius-full); background: var(--ds-soft); color: var(--text2); font-size: 0.78rem; font-weight: 600; }
.pp-q { margin: 0 0 var(--space-5); font-size: 1.08rem; line-height: 1.7; white-space: pre-line; }
.pp-options { display: flex; flex-direction: column; gap: var(--space-2); }
.pp-opt { display: flex; align-items: flex-start; gap: var(--space-3); width: 100%; padding: var(--space-3) var(--space-4); border: 1.5px solid var(--border2); border-radius: var(--radius-lg); background: var(--bg); color: var(--text); font: inherit; font-size: 0.98rem; line-height: 1.55; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.pp-opt:hover:not(:disabled) { border-color: color-mix(in srgb, var(--accent) 50%, transparent); }
.pp-opt:disabled { cursor: default; }
.pp-letter { width: 26px; height: 26px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--ds-soft); color: var(--text2); font-size: 0.82rem; font-weight: 800; }
.pp-opt.on { border-color: var(--accent); background: var(--accent-dim); }
.pp-opt.on .pp-letter { background: var(--accent); color: #fff; }
.pp-opt.right { border-color: var(--success-text); background: var(--success-wash); }
.pp-opt.right .pp-letter { background: var(--success-text); color: #fff; }
.pp-opt.wrong { border-color: var(--danger-text); background: var(--danger-wash); }
.pp-opt.wrong .pp-letter { background: var(--danger-text); color: #fff; }
.pp-opt.faded { opacity: 0.6; }
.pp-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); margin-top: var(--space-5); }
.pp-check { min-width: 170px; justify-content: center; }
.pp-check:disabled { opacity: 0.5; cursor: not-allowed; }
.pp-verdict { padding: 8px 14px; border-radius: var(--radius-lg); background: var(--danger-wash); color: var(--danger-text); font-weight: 700; font-size: 0.94rem; }
.pp-verdict.ok { background: var(--success-wash); color: var(--success-text); }
.pp-mark { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 12px; border: 1px solid var(--border2); border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.88rem; font-weight: 600; cursor: pointer; }
.pp-mark.on { border-color: color-mix(in srgb, var(--warning-text) 50%, transparent); background: var(--warning-wash); color: var(--warning-text); }
.pp-steps { display: inline-flex; gap: var(--space-2); margin-left: auto; }
.pp-steps .ds-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.pp-explain-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); margin-bottom: var(--space-3); }
.pp-explain-head strong { font-size: 1.05rem; }
.pp-premium { padding: 2px 10px; border-radius: var(--radius-full); background: var(--premium-wash); color: var(--premium-text); font-size: 0.78rem; font-weight: 700; }
.pp-lock { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-3); }
.pp-lock p { margin: 0; color: var(--text2); line-height: 1.6; }
.pp-secs { display: flex; flex-direction: column; gap: var(--space-4); }
.pp-sec h3 { margin: 0 0 var(--space-2); font-size: 0.92rem; font-weight: 800; color: var(--accent-text); }
.pp-points { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 6px; font-size: 0.96rem; line-height: 1.65; color: var(--text); }
.pp-points li::marker { color: var(--accent); }
.pp-tech { display: inline-flex; padding: 0 8px; margin: 0 2px; border-radius: var(--radius-full); background: var(--accent-dim); color: var(--accent-text); font-size: 0.82em; font-weight: 700; text-transform: capitalize; }

.pp-result { display: flex; flex-direction: column; gap: var(--space-3); }
.pp-result-label { font-size: 0.9rem; color: var(--text3); }
.pp-result-num { font-size: 3rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
.pp-result-num small { font-size: 1.1rem; font-weight: 600; color: var(--text3); }
.pp-meter { height: 8px; border-radius: var(--radius-full); background: var(--ds-soft); overflow: hidden; }
.pp-meter span { display: block; height: 100%; background: var(--success-text); border-radius: inherit; }
.pp-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-2); }
.pp-tiles div { display: flex; flex-direction: column; gap: 2px; padding: var(--space-3); border-radius: var(--radius-lg); background: var(--ds-soft); }
.pp-tiles strong { font-size: 1.5rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.pp-tiles span { font-size: 0.82rem; color: var(--text3); }
.pp-result-note { margin: 0; font-size: 0.88rem; color: var(--text3); }
.pp-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2); }
.pp-empty { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-2); }
.pp-empty p { margin: 0 0 var(--space-2); color: var(--text2); }

.pp-nav { position: sticky; top: 132px; max-height: calc(100vh - 152px); overflow-y: auto; padding: var(--space-4); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.pp-nav-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); }
.pp-nav-head strong { font-size: 0.98rem; }
.pp-nav-x { display: none; }
.pp-legend { display: flex; flex-wrap: wrap; gap: 4px var(--space-3); margin-bottom: var(--space-3); font-size: 0.78rem; color: var(--text3); }
.pp-legend span { display: inline-flex; align-items: center; gap: 5px; }
.pp-legend i { width: 10px; height: 10px; border-radius: 3px; background: var(--ds-soft); border: 1px solid var(--border2); }
.pp-legend i.ok { background: var(--success-text); border-color: var(--success-text); }
.pp-legend i.no { background: var(--danger-text); border-color: var(--danger-text); }
.pp-legend i.mk { background: var(--warning-wash); border: 2px solid var(--warning-text); }
.pp-grid-nums { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }
.pp-num { aspect-ratio: 1; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border2); border-radius: var(--radius-md); background: var(--bg); color: var(--text2); font: inherit; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-variant-numeric: tabular-nums; }
.pp-num.ok { background: var(--success-text); border-color: var(--success-text); color: #fff; }
.pp-num.no { background: var(--danger-text); border-color: var(--danger-text); color: #fff; }
.pp-num.mk { box-shadow: inset 0 0 0 2px var(--warning-text); }
.pp-num.on { outline: 2px solid var(--accent); outline-offset: 1px; font-weight: 800; }
.pp-sum { margin: var(--space-4) 0 0; padding-top: var(--space-3); border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
.pp-sum div { display: flex; justify-content: space-between; font-size: 0.88rem; }
.pp-sum dt { color: var(--text3); }
.pp-sum dd { margin: 0; font-weight: 700; font-variant-numeric: tabular-nums; }
.pp-scrim { display: none; }

.pp-confirm { max-width: 420px; }
.pp-confirm h2 { margin: 0 0 var(--space-2); font-size: 1.25rem; font-weight: 800; }
.pp-confirm p { margin: 0 0 var(--space-3); color: var(--text2); line-height: 1.6; }
.pp-confirm .pp-actions { justify-content: flex-end; }

@media (max-width: 960px) {
  .pp-layout { grid-template-columns: minmax(0, 1fr); }
  .pp-qs { display: inline-flex; }
  /* On a phone the navigator is a sheet from the bottom. */
  .pp-nav { position: fixed; left: 0; right: 0; bottom: 0; top: auto; z-index: 2001; max-height: 78dvh; border-radius: var(--radius-xl) var(--radius-xl) 0 0; padding-bottom: calc(var(--space-5) + env(safe-area-inset-bottom, 0px)); transform: translateY(105%); transition: transform 0.25s ease; box-shadow: var(--elev-3); }
  .pp-nav.open { transform: none; }
  .pp-nav-x { display: inline-flex; }
  .pp-scrim { display: block; position: fixed; inset: 0; z-index: 2000; background: color-mix(in srgb, #000 55%, transparent); }
  .pp-grid-nums { grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); }
}
@media (max-width: 640px) {
  .pp-filters { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin-right: calc(-1 * var(--space-4)); padding-right: var(--space-4); }
  .pp-filters::-webkit-scrollbar { display: none; }
  .pp-filters > * { flex-shrink: 0; }
  .pp-filter-actions { margin-left: var(--space-2); }
  .pp-select { max-width: 200px; }
  .pp-card { padding: var(--space-5) var(--space-4); }
  .pp-q { font-size: 1.02rem; }
  .pp-opt { padding: var(--space-3); font-size: 0.95rem; }
  .pp-check, .pp-verdict { flex: 1 1 100%; }
  .pp-verdict { text-align: center; }
  .pp-steps { flex: 1; }
  .pp-steps .ds-btn { flex: 1; justify-content: center; min-height: 40px; }
  .pp-actions .ds-btn { flex: 1; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) { .pp-nav, .pp-opt { transition: none; } }
`;
