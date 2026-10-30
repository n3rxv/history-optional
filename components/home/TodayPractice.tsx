'use client';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { DailyQuestion } from '@/lib/dailyQuestions';
import { istDay } from '@/lib/istDay';
import { useLang } from '@/lib/i18n/LangContext';
import { usePyqHi } from '@/lib/pyqHi';
import { pyqSection } from '@/components/pyq/sections';

/**
 * Today's five questions, the same for everyone that day (IST), with an
 * optional timer set to roughly what the marks allow.
 *
 * `questions` is the set for `day`, the date the home page was prerendered.
 * On any later day it fetches that day's set; the page is static and does
 * not re-render itself at midnight.
 */

const minutesFor = (marks: number) => (marks <= 10 ? 7 : marks <= 15 ? 11 : 14);
const pad = (n: number) => String(n).padStart(2, '0');

/** "Paper I - Ancient India" -> the section's tint name. */
function tintOf(section: string): string {
  if (section.includes('Ancient')) return 'ancient';
  if (section.includes('Medieval') || section.includes('Early Medieval')) return 'medieval';
  if (section.includes('World')) return 'world';
  return 'modern';
}

export default function TodayPractice({ questions: built, day }: { questions: DailyQuestion[]; day: string }) {
  const { langHi } = useLang();
  // The questions in Hindi come from the Hindi bank, loaded only in Hindi mode.
  const pyqHi = usePyqHi(langHi);
  const [questions, setQuestions] = useState(built);
  useEffect(() => {
    const today = istDay();
    if (today === day) return;
    let cancelled = false;
    fetch(`/api/daily-questions?day=${today}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && Array.isArray(d?.questions)) setQuestions(d.questions); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [day]);

  const totalMins = useMemo(() => questions.reduce((a, q) => a + minutesFor(q.marks), 0), [questions]);
  const [started, setStarted] = useState(false);
  // One question first; the rest on request, or straight away when the reader
  // came for them (the menu's "Daily answer writing" links to #daily-answer).
  const [opened, setAll] = useState(false);
  const cameForIt = useSyncExternalStore(
    (cb) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); },
    () => window.location.hash === '#daily-answer',
    () => false,
  );
  const all = opened || cameForIt;
  const [secsLeft, setSecsLeft] = useState(totalMins * 60);
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);


  useEffect(() => {
    if (!started || finished) return;
    timer.current = setInterval(() => {
      setSecsLeft(prev => {
        if (prev <= 1) { if (timer.current) clearInterval(timer.current); setFinished(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [started, finished]);

  const shown = all ? questions : questions.slice(0, 1);
  const pct = started ? ((totalMins * 60 - secsLeft) / (totalMins * 60)) * 100 : 0;
  const low = started && secsLeft < 120;

  return (
    <div className="tp ds-card">
      <div className="tp-head">
        <div>
          <h3>{langHi ? (all ? 'आज के पाँच प्रश्न' : 'आज का प्रश्न') : (all ? 'Today\u2019s five questions' : 'Today\u2019s question')}</h3>
          <p>{langHi
            ? (all ? `आज सबके लिए यही प्रश्न हैं। पाँचों के लिए लगभग ${totalMins} मिनट।` : 'आज सबके लिए तय पाँच प्रश्नों में से एक। इसे लिखें और जँचवाएँ।')
            : (all ? `The same set for everyone today. About ${totalMins} minutes for all five.` : 'One of five set for everyone today. Write it, and get it checked.')}</p>
        </div>
        {!all ? null : started ? (
          <div className={`tp-clock${low ? ' low' : ''}`} role="timer" aria-live="off">
            {finished ? (langHi ? 'समय समाप्त' : 'Time up') : `${pad(Math.floor(secsLeft / 60))}:${pad(secsLeft % 60)}`}
          </div>
        ) : (
          <button className="ds-btn ds-btn-line ds-btn-sm" onClick={() => { setSecsLeft(totalMins * 60); setStarted(true); }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></svg>
            {langHi ? `${totalMins} मिनट का टाइमर शुरू करें` : `Start a ${totalMins}-minute timer`}
          </button>
        )}
      </div>
      {started && <div className="tp-bar" aria-hidden="true"><span className={low ? 'low' : ''} style={{ width: `${pct}%` }} /></div>}

      <ol className="tp-list">
        {shown.map((q, i) => {
          const text = pyqHi?.q[q.id] ?? q.question;
          const section = langHi ? (pyqSection(q.section)?.nameHi ?? q.section) : q.section.replace(/^Paper I+ - /, '');
          return (
            <li key={q.id} className="tp-q" style={{ ['--t' as string]: `var(--tint-${tintOf(q.section)})` }}>
              <span className="tp-n">{i + 1}</span>
              <div className="tp-body">
                <p>{text}</p>
                <span className="tp-meta">
                  <span className="tp-dot" aria-hidden="true" />
                  {section} · {q.year} · {q.marks} {langHi ? 'अंक' : 'marks'}
                </span>
              </div>
              {/* ?question= is what the evaluate page reads; it starts a fresh answer with it filled in. */}
              <Link className="tp-write" href={`/evaluate?question=${encodeURIComponent(text)}&marks=${q.marks}`} aria-label={langHi ? `प्रश्न ${i + 1} का उत्तर लिखें` : `Write an answer to question ${i + 1}`}>
                {langHi ? 'लिखें' : 'Write'}
              </Link>
            </li>
          );
        })}
      </ol>
      {!all && questions.length > 1 && (
        <button className="tp-more" onClick={() => setAll(true)}>
          {langHi ? 'पाँचों दिखाएँ, टाइमर के साथ' : 'Show all five, with a timer'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      )}
    </div>
  );
}
