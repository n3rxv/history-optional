'use client';
import { useEffect, useState } from 'react';
import Mascot from '@/components/Mascot';

/**
 * The waiting screen while an answer is marked.
 *
 * Every tick here is a step /api/evaluate reported finishing (the
 * x-eval-stages stream), so the list never claims work that has not
 * happened. The three opening steps run side by side on the server, and
 * spin side by side here; the rest follow one another.
 */
export type EvalStages = {
  read?: { pages: number; typed: boolean };
  transcribed?: { words: number };
  books?: { passages: number };
  reference?: { ok: boolean };
  marking?: true;
  marked?: true;
  scoring?: true;
  scored?: true;
  feedback?: true;
  feedback_done?: true;
};

export function applyEvalStage(s: EvalStages, e: { id?: string } & Record<string, unknown>): EvalStages {
  switch (e.id) {
    case 'read':          return { ...s, read: { pages: Number(e.pages) || 0, typed: Boolean(e.typed) } };
    case 'transcribed':   return { ...s, transcribed: { words: Number(e.words) || 0 } };
    case 'books':         return { ...s, books: { passages: Number(e.passages) || 0 } };
    case 'reference':     return { ...s, reference: { ok: Boolean(e.ok) } };
    case 'marking':       return { ...s, marking: true };
    case 'marked':        return { ...s, marked: true };
    case 'scoring':       return { ...s, scoring: true };
    case 'scored':        return { ...s, scored: true };
    case 'feedback':      return { ...s, feedback: true };
    case 'feedback_done': return { ...s, feedback_done: true };
    default:              return s;
  }
}

type Row = { key: string; state: 'pending' | 'active' | 'done'; text: string };

function rows(s: EvalStages, hi: boolean): Row[] {
  const pages = s.read?.pages ?? 0;
  const plural = pages === 1 ? '' : 's';
  const started = Boolean(s.read);

  const read: Row = s.transcribed
    ? {
        key: 'read', state: 'done',
        text: s.read?.typed
          ? (hi ? `आपका उत्तर पढ़ा: ${s.transcribed.words} शब्द` : `Read your answer: ${s.transcribed.words} words`)
          : s.transcribed.words > 0
            ? (hi ? `लिखावट पढ़ी: ${pages} पन्नों में ${s.transcribed.words} शब्द` : `Read your handwriting: ${s.transcribed.words} words across ${pages} page${plural}`)
            : (hi ? 'लिखावट साफ़ नहीं पढ़ी गई; परीक्षक पन्ने सीधे पढ़ेगा' : "Couldn't transcribe the handwriting cleanly; the marker will read the pages directly"),
      }
    : {
        key: 'read', state: 'active',
        text: !started
          ? (hi ? 'आपका उत्तर भेज रहा हूँ' : 'Sending your answer')
          : s.read?.typed
            ? (hi ? 'आपका उत्तर पढ़ रहा हूँ' : 'Reading your answer')
            : (hi ? `आपकी लिखावट पढ़ रहा हूँ (${pages} पन्ने)` : `Reading your handwriting (${pages} page${plural})`),
      };

  const books: Row = s.books
    ? {
        key: 'books', state: 'done',
        text: s.books.passages > 0
          ? (hi ? `संदर्भ पुस्तकों में ${s.books.passages} अंश मिले` : `Found ${s.books.passages} passages in the reference books`)
          : (hi ? 'पुस्तकों में सीधा अंश नहीं मिला; केवल रूब्रिक से जाँच' : 'No close passages in the books; marking against the rubric alone'),
      }
    : { key: 'books', state: started ? 'active' : 'pending', text: hi ? 'देख रहा हूँ पुस्तकें इस पर क्या कहती हैं' : 'Finding what the books say about it' };

  const reference: Row = s.reference
    ? {
        key: 'reference', state: 'done',
        text: s.reference.ok
          ? (hi ? 'तुलना के लिए एक आदर्श उत्तर तैयार किया' : 'Drafted a model answer to mark against')
          : (hi ? 'आदर्श उत्तर नहीं बन सका; रूब्रिक से जाँच' : "Couldn't draft a model answer; marking against the rubric"),
      }
    : { key: 'reference', state: started ? 'active' : 'pending', text: hi ? 'तुलना के लिए आदर्श उत्तर तैयार कर रहा हूँ' : 'Drafting a model answer to mark against' };

  const step = (key: string, begun?: true, ended?: true, doing?: string, did?: string, todo?: string): Row =>
    ended ? { key, state: 'done', text: did! } : begun ? { key, state: 'active', text: doing! } : { key, state: 'pending', text: todo! };

  return [
    read, books, reference,
    step('marking', s.marking, s.marked,
      hi ? 'UPSC रूब्रिक पर जाँच रहा हूँ' : 'Marking against the UPSC rubric',
      hi ? 'UPSC रूब्रिक पर जाँचा' : 'Marked against the UPSC rubric',
      hi ? 'UPSC रूब्रिक पर जाँच' : 'Mark against the UPSC rubric'),
    step('scoring', s.scoring, s.scored,
      hi ? 'हर भाग के अंक तय कर रहा हूँ' : 'Scoring introduction, body, conclusion and presentation',
      hi ? 'हर भाग के अंक तय किए' : 'Scored each section',
      hi ? 'हर भाग के अंक' : 'Score each section'),
    step('feedback', s.feedback, s.feedback_done,
      hi ? 'आपकी प्रतिक्रिया लिख रहा हूँ' : 'Writing your feedback',
      hi ? 'प्रतिक्रिया लिखी' : 'Feedback written',
      hi ? 'प्रतिक्रिया लिखना' : 'Write your feedback'),
  ];
}

function clock(ms: number) {
  const t = Math.floor(ms / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

export default function EvalProgress({ stages, startedAt, langHi }: { stages: EvalStages; startedAt: number; langHi: boolean }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const list = rows(stages, langHi);
  const done = list.filter((r) => r.state === 'done').length;

  return (
    <div className="evp" role="status" aria-live="polite">
      <style>{EVP_CSS}</style>
      <Mascot pose="reading" width={132} className="evp-owl" preload />
      <div className="evp-eyebrow">{langHi ? 'आपका उत्तर जाँचा जा रहा है' : 'Marking your answer'}</div>
      <div className="evp-sub">
        {/* 31 s was the median of the last twenty evaluations, from answer_evaluations.duration_ms. */}
        {langHi ? 'आमतौर पर लगभग 30 सेकंड लगते हैं' : 'This usually takes about 30 seconds'}
        <span className="evp-clock">{clock(now - startedAt)}</span>
      </div>
      <div className="evp-bar" aria-hidden="true">
        {list.map((r) => <span key={r.key} className={r.state} />)}
      </div>
      <ul className="evp-steps" aria-label={langHi ? `${list.length} में से ${done} चरण पूरे` : `${done} of ${list.length} steps done`}>
        {list.map((r) => (
          <li key={r.key} className={r.state}>
            {r.state === 'done' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.8 2.8L16.5 9.5" /></svg>
            ) : r.state === 'active' ? (
              <svg className="evp-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></svg>
            ) : (
              <span className="evp-dot" aria-hidden="true" />
            )}
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const EVP_CSS = `
.evp { max-width: 560px; margin: 0 auto; padding: var(--space-12) 0 var(--space-10); display: flex; flex-direction: column; align-items: center; text-align: center; }
.evp-owl { width: 132px; height: auto; margin-bottom: var(--space-5); }
.evp-eyebrow { font-family: var(--font-mono); font-size: 0.66rem; letter-spacing: 0.26em; text-transform: uppercase; color: var(--accent-text); margin-bottom: var(--space-2); }
.evp-sub { font-size: 0.92rem; color: var(--text2); display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-6); }
.evp-clock { font-family: var(--font-mono); font-size: 0.8rem; color: var(--text3); padding: 2px var(--space-2); border: 1px solid var(--border); border-radius: var(--radius-sm); }
.evp-bar { width: 100%; display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--space-1); margin-bottom: var(--space-5); }
.evp-bar span { height: 4px; border-radius: var(--radius-pill); background: var(--bg4); transition: background 0.4s; }
.evp-bar span.active { background: color-mix(in srgb, var(--accent) 40%, var(--bg4)); animation: evpPulse 1.4s ease-in-out infinite; }
.evp-bar span.done { background: var(--accent); }
@keyframes evpPulse { 50% { opacity: 0.55; } }
.evp-steps { width: 100%; list-style: none; margin: 0; padding: var(--space-4) var(--space-5); text-align: left;
  background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-xl);
  display: flex; flex-direction: column; gap: var(--space-3); }
.evp-steps li { display: flex; align-items: center; gap: var(--space-3); font-size: 0.92rem; line-height: 1.45; }
.evp-steps li svg, .evp-dot { flex-shrink: 0; }
.evp-steps li.done { color: var(--text); }
.evp-steps li.done svg { color: var(--success-text); }
.evp-steps li.active { color: var(--text); }
.evp-steps li.active svg { color: var(--accent); }
.evp-steps li.pending { color: var(--text3); }
.evp-dot { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; }
.evp-dot::before { content: ''; width: 6px; height: 6px; border-radius: var(--radius-circle); background: var(--border3); }
.evp-spin { animation: evpSpin 1.1s linear infinite; }
@keyframes evpSpin { to { transform: rotate(360deg); } }
@media (max-width: 600px) {
  .evp { padding-top: var(--space-8); }
  .evp-owl { width: 104px; }
  .evp-steps { padding: var(--space-3) var(--space-4); }
  .evp-steps li { font-size: 0.86rem; }
}
@media (prefers-reduced-motion: reduce) { .evp-spin, .evp-bar span.active { animation: none; } }
`;
