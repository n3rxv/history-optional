'use client';
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from '@/components/Link';
import { useLang } from '@/lib/i18n/LangContext';
import { paper1Notes, paper2Notes } from '@/lib/notes';
import { useSyllabusTracker } from '@/hooks/useSyllabusTracker';
import { useAttemptedPyqs } from '@/hooks/useAttemptedPyqs';
import { useUsageTracker } from '@/hooks/useUsageTracker';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { loadHistory, type AnswerEntry } from '@/hooks/useAnswerHistory';
import LoginPromptModal from '@/components/LoginPromptModal';
import { readLastNote } from '@/lib/lastNote';
import { REFERRAL_REWARD_PAISE, formatPaise } from '@/lib/referral';
import { daysToMains, NEXT_MAINS } from '@/lib/examDates';
import { istDay } from '@/lib/istDay';
import type { DailyQuestion } from '@/lib/dailyQuestions';
// Ranges, not the questions: lib/pyqData.ts is 600 KB of question text, and
// this page only needs to know which section an id falls in.
import { PYQ_SECTION_TOTALS, sectionForPyq } from '@/lib/pyqSectionRanges';
import { SECTIONS, type SectionKey } from '@/components/notes/sections';
import { pyqSection, tintFor } from '@/components/pyq/sections';
import { usePyqHi } from '@/lib/pyqHi';
import { noteTitle, sectionName } from '@/lib/notesHi';

/**
 * The reader's own page: what to do today, how far they have come, and the
 * tools. Everything in it is read from this browser (ticked topics, attempted
 * questions, flashcards, checked answers), so it renders empty on the server
 * and fills in once the page is in the browser.
 */

const ALL_NOTES = [...paper1Notes, ...paper2Notes];
const CHAT_HISTORY_KEY = 'ho_chat_history_v1';

type FlashStats = { reviewed: number; due: number; recall: number | null };
function loadFlash(): FlashStats {
  const empty = { reviewed: 0, due: 0, recall: null };
  let sr: Record<string, { nextDue: string; lastGrade?: number }> = {};
  try { sr = JSON.parse(localStorage.getItem('ho_flashcards_v1') ?? '{}'); } catch { return empty; }
  const cards = Object.values(sr);
  if (!cards.length) return empty;
  const now = new Date().toISOString();
  // Cards saved before grades were kept have none; they are left out of the
  // share rather than counted as forgotten.
  const graded = cards.filter((c) => c.lastGrade != null);
  return {
    reviewed: cards.length,
    due: cards.filter((c) => c.nextDue <= now).length,
    recall: graded.length ? Math.round((graded.filter((c) => (c.lastGrade ?? 0) >= 3).length / graded.length) * 100) : null,
  };
}

type Part = 'introduction' | 'body' | 'conclusion' | 'presentation';
const PARTS: Part[] = ['introduction', 'body', 'conclusion', 'presentation'];
function scoreOf(e: AnswerEntry): number {
  const sm = e.sectionMarks;
  const out = PARTS.reduce((s, p) => s + (sm?.[p]?.out_of || 0), 0);
  const got = PARTS.reduce((s, p) => s + (sm?.[p]?.awarded || 0), 0);
  return out > 0 ? Math.round((got / out) * 100) : e.marksOutOf ? Math.round((e.marks / e.marksOutOf) * 100) : 0;
}

function lastChat(): { id: string; title: string; updatedAt: number } | null {
  try {
    const list = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) ?? '[]') as { id: string; title: string; updatedAt: number; messages?: unknown[] }[];
    if (!Array.isArray(list) || !list.length) return null;
    const c = [...list].filter((x) => x?.id).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    // An untitled chat gets its name where it is shown, in the reader's language.
    return c ? { id: c.id, title: c.title || '', updatedAt: c.updatedAt || 0 } : null;
  } catch { return null; }
}

/** Everything the page reads from this browser, in one pass. */
function readLocal() {
  return {
    flash: loadFlash(),
    // Map checks keep their score in the introduction's slot; they are not
    // answers and would pull its average about.
    answers: loadHistory().filter((e) => e.type !== 'map'),
    note: readLastNote(),
    chat: lastChat(),
    streak: streakOf(),
    /** A topic finished before this is due another look. */
    monthAgo: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  };
}

function streakOf(): number {
  try { return Number(JSON.parse(localStorage.getItem('ho_streak_v1') ?? '{}').streak) || 0; } catch { return 0; }
}

function ago(ms: number, hi: boolean) {
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days <= 0) return hi ? 'आज' : 'today';
  if (days === 1) return hi ? 'कल' : 'yesterday';
  if (days < 30) return hi ? `${days} दिन पहले` : `${days} days ago`;
  return new Date(ms).toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' });
}
const fmtDate = (iso: string | null, hi = false) => (iso ? new Date(iso).toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null);
/** A subscriber's plan, named from the plan id the status route returns. */
const PLAN_EN: Record<string, string> = { yearly: 'Yearly plan', sixmonths: '6-month plan', daily: 'One-day plan' };
const PLAN_HI: Record<string, string> = { yearly: 'सालाना प्लान', sixmonths: '6 महीने का प्लान', daily: 'एक दिन का प्लान' };
const tone = (pct: number) => (pct >= 70 ? 'var(--success-text)' : pct >= 50 ? 'var(--warning-text)' : 'var(--danger-text)');

const noop = () => () => {};
const useInBrowser = () => useSyncExternalStore(noop, () => true, () => false);

const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const ICON: Record<string, ReactNode> = {
  notes: <path d="M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6" />,
  pyq: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01" /></>,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  evaluate: <><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" /></>,
  test: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></>,
  map: <><path d="M9 4L3 6.5v13L9 17l6 3 6-2.5v-13L15 7z" /><path d="M9 4v13M15 7v13" /></>,
  cards: <><rect x="3" y="7" width="14" height="13" rx="2" /><path d="M7 4h12a2 2 0 0 1 2 2v11" /></>,
};
const Glyph = ({ name }: { name: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON[name]}</svg>
);

function Ring({ value, total, color = 'var(--success-text)' }: { value: number; total: number; color?: string }) {
  const pct = total ? value / total : 0;
  const r = 30, c = 2 * Math.PI * r;
  return (
    <span className="db-ring" aria-hidden="true">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="7" className="db-ring-track" />
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="7" strokeLinecap="round" stroke={color} strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 38 38)" className="db-ring-fill" />
      </svg>
      <span>{Math.round(pct * 100)}%</span>
    </span>
  );
}
function Bar({ label, value, total, style, color }: { label: string; value: number; total: number; style?: React.CSSProperties; color?: string }) {
  return (
    <div className="db-pbar" style={style}>
      <div className="db-pbar-top"><span>{label}</span><span>{value} / {total}</span></div>
      <div className="db-bar"><span style={{ width: `${total ? (value / total) * 100 : 0}%`, background: color }} /></div>
    </div>
  );
}

export default function Dashboard({ day, question: built }: { day: string; question: DailyQuestion | null }) {
  const { langHi: hi } = useLang();
  const T = (en: string, h: string) => (hi ? h : en);
  /** Topic and section names in the reader's language. */
  const topic = (slug: string, title: string) => noteTitle(slug, title, hi);
  const part = (name: string) => sectionName(name, hi);
  // Today's question in Hindi too, once the Hindi question bank has loaded.
  const pyqHi = usePyqHi(hi);
  const inBrowser = useInBrowser();
  const { user } = useFirebaseAuth();
  const { usage, loading: usageLoading, FREE_EVAL_LIMIT, FREE_CHAT_LIMIT } = useUsageTracker();
  const tracker = useSyllabusTracker();
  const attempts = useAttemptedPyqs();
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();

  // Today's question is the first of the home page's daily five. The page is
  // built on one day; on any later day it asks for that day's set.
  const [question, setQuestion] = useState(built);
  useEffect(() => {
    const today = istDay();
    if (today === day) return;
    let live = true;
    fetch(`/api/daily-questions?day=${today}`).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live && Array.isArray(d?.questions) && d.questions[0]) setQuestion(d.questions[0]); }).catch(() => {});
    return () => { live = false; };
  }, [day]);

  // The plan's name and end date, for a subscriber.
  const [sub, setSub] = useState<{ plan: string | null; expiresAt: string | null } | null>(null);
  useEffect(() => {
    if (!user || !usage?.subscribed) return;
    let live = true;
    user.getIdToken().then((tk) => fetch('/api/sub-status', { headers: { 'x-user-token': tk } }))
      .then((r) => r.json()).then((d) => { if (live && d?.isPremium) setSub({ plan: d.plan ?? null, expiresAt: d.expires_at ?? null }); }).catch(() => {});
    return () => { live = false; };
  }, [user, usage?.subscribed]);

  // What this browser holds, read once it is in the browser.
  const local = useMemo(() => (inBrowser ? readLocal() : null), [inBrowser]);

  const ready = inBrowser && tracker.mounted && attempts.ready && local;
  const done = (slug: string) => Boolean(tracker.progress.completed[slug]);
  const doneNotes = ready ? ALL_NOTES.filter((n) => done(n.slug)) : [];

  // ── The syllabus, by the notes' four parts
  const bySection = SECTIONS.map((s) => {
    const notes = ALL_NOTES.filter((n) => n.section === s.name);
    return { ...s, total: notes.length, done: notes.filter((n) => ready && done(n.slug)).length };
  });
  const nextNote = ready ? ALL_NOTES.find((n) => !done(n.slug)) : undefined;
  // The topic finished longest ago, if a month or more back.
  const coldNote = ready ? doneNotes
    .map((n) => ({ n, at: tracker.progress.completionDates?.[n.slug] }))
    .filter((x): x is { n: typeof x.n; at: string } => Boolean(x.at) && (x.at as string) <= (local?.monthAgo ?? ''))
    .sort((a, b) => a.at.localeCompare(b.at))[0] : undefined;

  // ── Past questions, by the same four parts
  const pyqBy = useMemo(() => {
    const out: Record<SectionKey, { done: number; total: number }> = { ancient: { done: 0, total: 0 }, medieval: { done: 0, total: 0 }, modern: { done: 0, total: 0 }, world: { done: 0, total: 0 } };
    for (const [value, total] of Object.entries(PYQ_SECTION_TOTALS)) { const k = pyqSection(value)?.key; if (k) out[k].total += total; }
    if (attempts.ready) for (const id of Object.keys(attempts.attempted).map(Number)) {
      const value = sectionForPyq(id);
      const k = value ? pyqSection(value)?.key : undefined;
      // A tick on a question no longer in the bank is not counted.
      if (k && out[k].done < out[k].total) out[k].done += 1;
    }
    return out;
  }, [attempts.ready, attempts.attempted]);
  const pyqDone = Object.values(pyqBy).reduce((s, x) => s + x.done, 0);
  const pyqTotal = Object.values(pyqBy).reduce((s, x) => s + x.total, 0);
  const untouched = SECTIONS.filter((s) => pyqBy[s.key].done === 0);

  // ── Checked answers
  const answers = useMemo(() => {
    const list = local?.answers ?? [];
    if (!list.length) return null;
    const scores = list.map(scoreOf);
    const parts = PARTS.map((p) => {
      const vals = list.map((e) => { const s = e.sectionMarks?.[p]; return s && s.out_of ? s.awarded / s.out_of : null; }).filter((v): v is number => v !== null);
      return { part: p, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
    });
    const ranked = parts.filter((x): x is { part: Part; avg: number } => x.avg !== null).sort((a, b) => a.avg - b.avg);
    return {
      count: list.length,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      best: Math.max(...scores),
      recent: scores.slice(0, 6).reverse(),
      parts,
      weakest: list.length >= 3 ? ranked[0] : undefined,
    };
  }, [local]);
  const partName: Record<Part, string> = { introduction: T('Introduction', 'भूमिका'), body: T('Body', 'मुख्य भाग'), conclusion: T('Conclusion', 'निष्कर्ष'), presentation: T('Presentation', 'प्रस्तुति') };

  // ── What to do, after the reader's own places to pick up. Only real items;
  // padding it out with advice when nothing is due would teach readers to
  // stop reading it.
  const extras: { key: string; icon: string; title: string; sub: string; href: string }[] = [];
  if (local && local.flash.due > 0) extras.push({ key: 'cards', icon: 'cards', title: T(`${local.flash.due} flashcards to review`, `${local.flash.due} फ़्लैशकार्ड दोहराने हैं`), sub: T('They have come round again', 'इनका समय फिर आ गया है'), href: '/flashcards' });
  if (coldNote) extras.push({ key: 'cold', icon: 'notes', title: T(`Revise ${coldNote.n.title}`, `${topic(coldNote.n.slug, coldNote.n.title)} दोहराएँ`), sub: T(`Finished ${ago(new Date(coldNote.at).getTime(), false)}`, `${ago(new Date(coldNote.at).getTime(), true)} पूरा किया`), href: `/notes/${coldNote.n.slug}` });
  if (answers?.weakest && answers.weakest.avg < 0.6) extras.push({ key: 'weak', icon: 'evaluate', title: T(`Work on your ${partName[answers.weakest.part].toLowerCase()}`, `अपनी ${partName[answers.weakest.part]} सुधारें`), sub: T(`It averages ${Math.round(answers.weakest.avg * 100)}% across your answers`, `आपके उत्तरों में औसत ${Math.round(answers.weakest.avg * 100)}%`), href: '/evaluate' });
  if (ready && pyqDone > 0 && untouched[0]) extras.push({ key: 'pyq', icon: 'pyq', title: T(`Try a past question in ${untouched[0].name}`, `${part(untouched[0].name)} का कोई PYQ हल करें`), sub: T('None attempted there yet', 'वहाँ अभी कोई हल नहीं किया'), href: `/pyqs/${untouched[0].key === 'ancient' ? 'ancient-india' : untouched[0].key === 'medieval' ? 'medieval-india' : untouched[0].key === 'modern' ? 'modern-india' : 'world-history'}` });
  if (nextNote && doneNotes.length > 0) extras.push({ key: 'next', icon: 'notes', title: T(`Next in the syllabus: ${nextNote.title}`, `पाठ्यक्रम में अगला: ${topic(nextNote.slug, nextNote.title)}`), sub: `${part(nextNote.section)} · ${T('topic', 'विषय')} ${nextNote.topic}`, href: `/notes/${nextNote.slug}` });
  const resume = (local?.note ? 1 : 0) + (local?.chat ? 1 : 0);
  const shownExtras = extras.slice(0, Math.max(1, 4 - resume));

  const hour = inBrowser ? new Date().getHours() : -1;
  const firstName = user?.displayName?.split(' ')[0] || '';
  const greeting = hour < 0 ? T('Your dashboard', 'आपका डैशबोर्ड')
    : `${hour < 12 ? T('Good morning', 'सुप्रभात') : hour < 17 ? T('Good afternoon', 'नमस्कार') : T('Good evening', 'शुभ संध्या')}${firstName ? `, ${firstName}` : ''}`;
  const mainsDays = inBrowser ? daysToMains() : null;
  const premium = Boolean(usage?.subscribed);
  const chatsLeft = Math.max(0, FREE_CHAT_LIMIT - (usage?.chat_count ?? 0));

  const syllabusLine = !ready ? '' : doneNotes.length === 0
    ? T('Tick topics off in the notes as you finish them, and they add up here.', 'नोट्स में विषय पूरे होते ही उन्हें चिह्नित करें, वे यहाँ जुड़ते जाएँगे।')
    : doneNotes.length === ALL_NOTES.length ? T('The whole syllabus is done. Time to revise.', 'पूरा पाठ्यक्रम हो गया। अब दोहराने का समय है।')
    : T(`${ALL_NOTES.length - doneNotes.length} topics to go.`, `${ALL_NOTES.length - doneNotes.length} विषय बाक़ी हैं।`);
  const pyqLine = !ready ? '' : pyqDone === 0
    ? T('Mark questions attempted when you answer them, and your coverage shows here.', 'प्रश्न हल करने पर उन्हें चिह्नित करें, आपकी कवरेज यहाँ दिखेगी।')
    : untouched.length ? T(`Not started yet: ${untouched.map((s) => s.name).join(', ')}.`, `अभी शुरू नहीं: ${untouched.map((s) => part(s.name)).join(', ')}।`)
    : T('Every part has at least one question attempted.', 'हर भाग में कम से कम एक प्रश्न हल किया है।');

  const tools = [
    { key: 'notes', title: T('Notes', 'नोट्स'), count: `${ALL_NOTES.length} ${T('topics', 'विषय')}`, desc: T('Every topic in the syllabus, with the historians who argue it.', 'पाठ्यक्रम का हर विषय, उस पर बहस करने वाले इतिहासकारों के साथ।'), href: '/notes' },
    { key: 'pyq', title: T('PYQs', 'पिछले प्रश्न'), count: `${pyqTotal.toLocaleString('en-IN')} ${T('questions', 'प्रश्न')}`, desc: T('By year, section and topic, each one ready to answer.', 'वर्ष, भाग और विषय के अनुसार, हर एक उत्तर के लिए तैयार।'), href: '/pyqs' },
    { key: 'chat', title: T('AI chat', 'AI चैट'), count: null, desc: T('Ask anything. It answers from the standard books and shows where.', 'कुछ भी पूछें। यह मानक पुस्तकों से उत्तर देता है और स्रोत दिखाता है।'), href: '/chat' },
    { key: 'evaluate', title: T('Evaluate', 'मूल्यांकन'), count: null, desc: T('Upload a handwritten answer and get it marked, part by part.', 'हस्तलिखित उत्तर अपलोड करें और हर भाग के अंक पाएँ।'), href: '/evaluate' },
    { key: 'test', title: T('Test papers', 'टेस्ट पेपर'), count: null, desc: T('Timed papers in the Mains format, from past questions.', 'पिछले प्रश्नों से बने, मुख्य परीक्षा के प्रारूप में समयबद्ध पेपर।'), href: '/test' },
    { key: 'map', title: T('Map practice', 'मैप अभ्यास'), count: null, desc: T('All 992 places in the map syllabus, and a quiz.', 'मैप पाठ्यक्रम के सभी 992 स्थल, और एक क्विज़।'), href: '/mapping' },
  ];

  return (
    <div className="db ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="db-hero">
        <div className="ds-container">
          <h1 className="ds-h1 db-h1">{greeting}</h1>
          <div className="db-chips">
            {mainsDays !== null && <span className="db-chip">{T(`Mains ${NEXT_MAINS.slice(0, 4)} in ${mainsDays} days`, `मुख्य परीक्षा ${NEXT_MAINS.slice(0, 4)} में ${mainsDays} दिन बाक़ी`)}</span>}
            {user && !usageLoading && <span className={`db-chip${premium ? ' gold' : ''}`}>{premium ? T('Premium', 'प्रीमियम') : T('Free plan', 'निःशुल्क प्लान')}</span>}
            {local && local.streak > 1 && <span className="db-chip streak">{T(`${local.streak}-day streak`, `${local.streak} दिन लगातार`)}</span>}
          </div>
        </div>
      </header>

      <div className="ds-container db-grid">
        <main className="db-main">
          <section className="db-section">
            <h2 className="db-h2">{T('For today', 'आज के लिए')}</h2>
            {question && (
              <article className="db-today" style={tintFor(pyqSection(question.section)?.key)}>
                <div className="db-today-head">
                  <span className="db-today-label">{T('Today’s question', 'आज का प्रश्न')}</span>
                  <span className="db-today-meta">{question.year} · {(hi ? pyqSection(question.section)?.shortHi : pyqSection(question.section)?.short) ?? question.section} · {question.marks} {T('marks', 'अंक')}</span>
                </div>
                <Link href={`/pyqs/${question.id}`} className="db-today-q" lang={pyqHi?.q[question.id] ? 'hi' : undefined}>{pyqHi?.q[question.id] ?? question.question}</Link>
                <div className="db-today-actions">
                  <Link href={`/evaluate?question=${encodeURIComponent(pyqHi?.q[question.id] ?? question.question)}&marks=${question.marks}`} className="ds-btn ds-btn-solid ds-btn-sm">{T('Write an answer', 'उत्तर लिखें')}</Link>
                  <Link href={`/chat?q=${encodeURIComponent(hi ? `इस प्रश्न का उत्तर कैसे लिखूँ? ${pyqHi?.q[question.id] ?? question.question}` : `How should I approach this question? ${question.question}`)}`} className="ds-btn ds-btn-line ds-btn-sm">{T('Ask the AI how to approach it', 'AI से तरीक़ा पूछें')}</Link>
                  <Link href="/#daily-answer" className="db-more">{T('All five for today', 'आज के सभी पाँच')} <Arrow /></Link>
                </div>
              </article>
            )}
            {local && (local.note || local.chat || shownExtras.length > 0) && (
              <div className="db-resume">
                {local.note && (
                  <Link href={`/notes/${local.note.slug}`} className="db-resume-item">
                    <span className="db-resume-icon"><Glyph name="notes" /></span>
                    <span className="db-resume-text"><strong>{T(`Pick up ${local.note.title}`, `${topic(local.note.slug, local.note.title)} जारी रखें`)}</strong><span>{local.note.section ? `${part(local.note.section)} · ` : ''}{T('opened', 'खोला')} {ago(local.note.at, hi)}</span></span>
                    <Arrow />
                  </Link>
                )}
                {local.chat && (
                  <Link href={`/chat?c=${encodeURIComponent(local.chat.id)}`} className="db-resume-item">
                    <span className="db-resume-icon"><Glyph name="chat" /></span>
                    <span className="db-resume-text"><strong>{T(`Carry on with “${local.chat.title || 'Your last chat'}”`, `“${local.chat.title || 'आपकी पिछली चैट'}” जारी रखें`)}</strong><span>{T('Your last chat', 'आपकी पिछली चैट')} · {ago(local.chat.updatedAt, hi)}</span></span>
                    <Arrow />
                  </Link>
                )}
                {shownExtras.map((x) => (
                  <Link key={x.key} href={x.href} className="db-resume-item">
                    <span className="db-resume-icon"><Glyph name={x.icon} /></span>
                    <span className="db-resume-text"><strong>{x.title}</strong><span>{x.sub}</span></span>
                    <Arrow />
                  </Link>
                ))}
              </div>
            )}
            {local && !local.note && !local.chat && shownExtras.length === 0 && !question && (
              <p className="db-empty">{T('Open a note, ask the chat a question or check an answer, and this fills with where to pick up.', 'कोई नोट खोलें, चैट से पूछें या उत्तर जँचवाएँ, यहाँ आगे का रास्ता दिखेगा।')}</p>
            )}
          </section>

          <section className="db-section">
            <h2 className="db-h2">{T('Your progress', 'आपकी प्रगति')}</h2>
            <div className="db-progress">
              <div className="db-pcard">
                <div className="db-pcard-top">
                  <Ring value={doneNotes.length} total={ALL_NOTES.length} />
                  <div>
                    <h3>{T('Syllabus', 'पाठ्यक्रम')}</h3>
                    <p className="db-pcard-big">{ready ? T(`${doneNotes.length} of ${ALL_NOTES.length} topics done`, `${ALL_NOTES.length} में से ${doneNotes.length} विषय पूरे`) : '…'}</p>
                  </div>
                </div>
                {bySection.map((s) => <Bar key={s.key} label={part(s.name)} value={s.done} total={s.total} style={tintFor(s.key)} color="var(--t)" />)}
                <p className="db-pcard-line">{syllabusLine}</p>
                <Link href="/notes" className="db-link">{T('Open the notes', 'नोट्स खोलें')} <Arrow /></Link>
              </div>
              <div className="db-pcard">
                <div className="db-pcard-top">
                  <Ring value={pyqDone} total={pyqTotal} color="var(--accent)" />
                  <div>
                    <h3>{T('Past questions', 'पिछले प्रश्न')}</h3>
                    <p className="db-pcard-big">{ready ? T(`${pyqDone.toLocaleString('en-IN')} of ${pyqTotal.toLocaleString('en-IN')} attempted`, `${pyqTotal.toLocaleString('en-IN')} में से ${pyqDone.toLocaleString('en-IN')} हल किए`) : '…'}</p>
                  </div>
                </div>
                {SECTIONS.map((s) => <Bar key={s.key} label={part(s.name)} value={pyqBy[s.key].done} total={pyqBy[s.key].total} style={tintFor(s.key)} color="var(--t)" />)}
                <p className="db-pcard-line">{pyqLine}</p>
                <Link href="/pyqs" className="db-link">{T('Open the PYQs', 'PYQ खोलें')} <Arrow /></Link>
              </div>

              <div className="db-pcard">
                <h3>{T('Answer writing', 'उत्तर लेखन')}</h3>
                {answers ? (
                  <>
                    <div className="db-stats">
                      <div><strong style={{ color: tone(answers.avg) }}>{answers.avg}%</strong><span>{T('average', 'औसत')}</span></div>
                      <div><strong style={{ color: tone(answers.best) }}>{answers.best}%</strong><span>{T('best', 'सर्वश्रेष्ठ')}</span></div>
                      <div><strong>{answers.count}</strong><span>{T(answers.count === 1 ? 'answer checked' : 'answers checked', 'उत्तर जाँचे')}</span></div>
                    </div>
                    {answers.parts.filter((x) => x.avg !== null).map((x) => (
                      <Bar key={x.part} label={partName[x.part]} value={Math.round((x.avg ?? 0) * 100)} total={100} color={tone(Math.round((x.avg ?? 0) * 100))} />
                    ))}
                    {answers.recent.length >= 2 && (
                      <div className="db-trend">
                        <span>{T(`Your last ${answers.recent.length}`, `पिछले ${answers.recent.length}`)}</span>
                        <span className="db-trend-bars">{answers.recent.map((v, i) => <i key={i} style={{ height: `${Math.max(8, v)}%`, background: tone(v) }} title={`${v}%`} />)}</span>
                      </div>
                    )}
                    <Link href="/evaluate" className="db-link">{T('Check another answer', 'एक और उत्तर जँचवाएँ')} <Arrow /></Link>
                  </>
                ) : (
                  <>
                    <p className="db-pcard-line">{ready ? T('Check one answer and your marks, your weakest part and how you are moving show here.', 'एक उत्तर जँचवाएँ और आपके अंक, सबसे कमज़ोर भाग और प्रगति यहाँ दिखेगी।') : ''}</p>
                    <Link href="/evaluate" className="db-link">{T('Check your first answer', 'अपना पहला उत्तर जँचवाएँ')} <Arrow /></Link>
                  </>
                )}
              </div>
              <div className="db-pcard">
                <h3>{T('Flashcards', 'फ़्लैशकार्ड')}</h3>
                {local && local.flash.reviewed > 0 ? (
                  <>
                    <div className="db-stats">
                      <div><strong style={{ color: local.flash.due ? 'var(--warning-text)' : 'var(--success-text)' }}>{local.flash.due}</strong><span>{T('due now', 'अभी बाक़ी')}</span></div>
                      <div><strong>{local.flash.reviewed}</strong><span>{T('cards seen', 'कार्ड देखे')}</span></div>
                      <div><strong style={{ color: local.flash.recall === null ? undefined : tone(local.flash.recall) }}>{local.flash.recall === null ? '-' : `${local.flash.recall}%`}</strong><span>{T('remembered', 'याद रहे')}</span></div>
                    </div>
                    <Link href="/flashcards" className="db-link">{local.flash.due ? T(`Review the ${local.flash.due} due`, `${local.flash.due} दोहराएँ`) : T('Open the flashcards', 'फ़्लैशकार्ड खोलें')} <Arrow /></Link>
                  </>
                ) : (
                  <>
                    <p className="db-pcard-line">{local ? T('Historians’ arguments, causes and comparisons, brought back just before you would forget them.', 'इतिहासकारों के तर्क, कारण और तुलनाएँ, भूलने से ठीक पहले फिर सामने।') : ''}</p>
                    <Link href="/flashcards" className="db-link">{T('Start the flashcards', 'फ़्लैशकार्ड शुरू करें')} <Arrow /></Link>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="db-section">
            <h2 className="db-h2">{T('Everything here', 'सब कुछ')}</h2>
            <div className="db-tools">
              {tools.map((t) => (
                <Link key={t.key} href={t.href} className="db-tool">
                  <span className="db-tool-top">
                    <span className="db-tool-icon"><Glyph name={t.key} /></span>
                    {t.count && <span className="db-tool-count">{t.count}</span>}
                  </span>
                  <span className="db-tool-title">{t.title}</span>
                  <span className="db-tool-desc">{t.desc}</span>
                </Link>
              ))}
            </div>
          </section>
        </main>

        <aside className="db-aside">
          <div className="db-card">
            {!user ? (
              <>
                <h2 className="db-card-title">{T('Sign in to keep going', 'आगे बढ़ने के लिए साइन इन करें')}</h2>
                <p className="db-card-text">{T('Your progress here is saved in this browser. Sign in, free, for the AI chat and answer checking.', 'आपकी प्रगति इसी ब्राउज़र में सहेजी है। AI चैट और उत्तर जाँच के लिए मुफ़्त साइन इन करें।')}</p>
                <button type="button" className="ds-btn ds-btn-solid db-card-btn" onClick={() => requireLogin(T('Sign in free to use the AI chat and get answers checked.', 'AI चैट और उत्तर जाँच के लिए निःशुल्क साइन इन करें।'))}>{T('Sign in', 'साइन इन')}</button>
              </>
            ) : premium ? (
              <>
                <div className="db-plan-row"><h2 className="db-card-title">{T('Premium', 'प्रीमियम')}</h2><span className="db-active">{T('Active', 'सक्रिय')}</span></div>
                <p className="db-card-text">
                  {T(PLAN_EN[sub?.plan ?? ''] ?? 'Your plan', PLAN_HI[sub?.plan ?? ''] ?? 'आपका प्लान')}
                  {fmtDate(sub?.expiresAt ?? null) ? T(`, until ${fmtDate(sub?.expiresAt ?? null)}.`, `, ${fmtDate(sub?.expiresAt ?? null, true)} तक।`) : T('.', '।')}
                  {' '}{T('Unlimited chats and answer checks, whole papers marked, and the chat’s book and mentor modes.', 'असीमित चैट और उत्तर जाँच, पूरे पेपर की जाँच, और चैट के बुक व मेंटर मोड।')}
                </p>
                <button type="button" className="db-link" onClick={() => window.dispatchEvent(new Event('open-extend-modal'))}>{T('Extend your plan', 'प्लान बढ़ाएँ')} <Arrow /></button>
                <Link href="/invite" className="db-link db-invite">{T(`Invite a friend, earn ${formatPaise(REFERRAL_REWARD_PAISE)}`, `दोस्त को बुलाएँ, ${formatPaise(REFERRAL_REWARD_PAISE)} कमाएँ`)} <Arrow /></Link>
              </>
            ) : (
              <>
                <h2 className="db-card-title">{T('Free plan', 'निःशुल्क प्लान')}</h2>
                {!usageLoading && usage && (
                  <div className="db-usage">
                    <div className="db-usage-row"><span>{T('AI chats', 'AI चैट')}</span><span>{chatsLeft === 0 ? T('All used', 'सब उपयोग हो गईं') : T(`${chatsLeft} of ${FREE_CHAT_LIMIT} left`, `${FREE_CHAT_LIMIT} में से ${chatsLeft} बाक़ी`)}</span></div>
                    <div className="db-bar"><span style={{ width: `${Math.min(100, ((usage.chat_count ?? 0) / FREE_CHAT_LIMIT) * 100)}%` }} className={chatsLeft === 0 ? 'full' : ''} /></div>
                    <div className="db-usage-row"><span>{T('Answer checks', 'उत्तर जाँच')}</span><span>{(usage.eval_count ?? 0) >= FREE_EVAL_LIMIT ? T('Used', 'उपयोग हो गई') : T(`${FREE_EVAL_LIMIT} free, not used yet`, `${FREE_EVAL_LIMIT} मुफ़्त, अभी बाक़ी`)}</span></div>
                  </div>
                )}
                <p className="db-card-text">{T('Premium checks every answer you write and opens the chat without limits.', 'प्रीमियम आपका हर उत्तर जाँचता है और चैट बिना किसी सीमा के खोल देता है।')}</p>
                <Link href="/pricing" className="ds-btn ds-btn-premium db-card-btn">{T('See the plans', 'प्लान देखें')}</Link>
                <Link href="/invite" className="db-link db-invite">{T(`Invite a friend, earn ${formatPaise(REFERRAL_REWARD_PAISE)}`, `दोस्त को बुलाएँ, ${formatPaise(REFERRAL_REWARD_PAISE)} कमाएँ`)} <Arrow /></Link>
              </>
            )}
          </div>
          {user && (
            <div className="db-card">
              <h2 className="db-card-title">{T('Your account', 'आपका खाता')}</h2>
              <div className="db-facts">
                {user.displayName && <div><span>{T('Name', 'नाम')}</span><span>{user.displayName}</span></div>}
                <div><span>{T('Email', 'ईमेल')}</span><span className="db-email">{user.email}</span></div>
              </div>
              <Link href="/profile" className="db-link">{T('Profile and settings', 'प्रोफ़ाइल और सेटिंग्स')} <Arrow /></Link>
            </div>
          )}
        </aside>
      </div>
      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}

const CSS = `
.db { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.db-hero { padding: clamp(28px, 5vh, 52px) 0 clamp(20px, 3vh, 28px); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-dim) 60%, var(--bg)) 0%, var(--bg) 100%); }
.db-h1 { font-size: clamp(2rem, 4.4vw, 3rem); margin: 0 0 var(--space-3); min-height: 1.1em; }
.db-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); min-height: 32px; }
.db-chip { display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px; border-radius: var(--radius-full); background: var(--ds-card); border: 1px solid var(--border); font-size: 0.88rem; font-weight: 600; color: var(--text2); }
.db-chip.gold { color: var(--premium-text); background: var(--premium-wash); border-color: color-mix(in srgb, var(--premium-text) 30%, transparent); }
.db-chip.streak { color: var(--warning-text); background: var(--warning-wash); border-color: color-mix(in srgb, var(--warning-text) 30%, transparent); }

.db-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: var(--space-6); align-items: start; }
.db-main { display: flex; flex-direction: column; gap: var(--space-8); min-width: 0; }
.db-h2 { margin: 0 0 var(--space-4); font-size: 1.3rem; font-weight: 800; letter-spacing: -0.02em; }
.db-empty { margin: 0; padding: var(--space-4) var(--space-5); border-radius: var(--radius-xl); background: var(--ds-soft); color: var(--text2); line-height: 1.6; }

.db-today { padding: var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--elev-1); }
.db-today-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px var(--space-3); margin-bottom: var(--space-3); }
.db-today-label { font-size: 0.92rem; font-weight: 700; color: var(--t); }
.db-today-meta { font-size: 0.86rem; color: var(--text3); }
.db-today-q { display: block; margin-bottom: var(--space-5); font-size: clamp(1.08rem, 2vw, 1.25rem); font-weight: 600; line-height: 1.5; color: var(--text); text-decoration: none; }
.db-today-q:hover { color: var(--accent-text); }
.db-today-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); }
.db-more { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; font-size: 0.9rem; font-weight: 600; color: var(--accent-text); text-decoration: none; }
.db-more:hover { text-decoration: underline; text-underline-offset: 3px; }

.db-resume { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-3); margin-top: var(--space-3); }
.db-resume-item { display: flex; align-items: center; gap: var(--space-3); min-width: 0; padding: var(--space-4); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); color: var(--text3); text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s, color 0.15s; }
.db-resume-item:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); box-shadow: var(--elev-1); color: var(--accent-text); }
.db-resume-icon { width: 40px; height: 40px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--accent-dim); color: var(--accent-text); }
.db-resume-text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.db-resume-text strong { color: var(--text); font-size: 0.98rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.db-resume-text span { font-size: 0.84rem; color: var(--text3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.db-progress { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); align-items: start; }
.db-pcard { display: flex; flex-direction: column; gap: var(--space-3); min-width: 0; padding: var(--space-5); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.db-pcard-top { display: flex; align-items: center; gap: var(--space-4); }
.db-pcard h3 { margin: 0; font-size: 0.92rem; font-weight: 700; color: var(--text2); }
.db-pcard-big { margin: 2px 0 0; font-size: 1.12rem; font-weight: 800; letter-spacing: -0.01em; }
.db-pcard-line { margin: 0; font-size: 0.9rem; line-height: 1.55; color: var(--text2); }
.db-pcard .db-link { margin-top: auto; }
.db-ring { position: relative; width: 76px; height: 76px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
.db-ring svg { position: absolute; inset: 0; }
.db-ring-track { stroke: var(--ds-soft); }
.db-ring-fill { transition: stroke-dasharray 0.6s ease; }
.db-ring > span { font-size: 0.95rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.db-pbar-top { display: flex; justify-content: space-between; gap: var(--space-2); margin-bottom: 4px; font-size: 0.86rem; color: var(--text2); }
.db-pbar-top span:last-child { font-variant-numeric: tabular-nums; font-weight: 600; color: var(--text); }
.db-bar { height: 6px; border-radius: var(--radius-full); background: var(--ds-soft); overflow: hidden; }
.db-bar span { display: block; height: 100%; border-radius: inherit; background: var(--accent); transition: width 0.6s ease; }
.db-bar span.full { background: var(--danger-text); }
.db-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-2); }
.db-stats > div { display: flex; flex-direction: column; gap: 2px; padding: var(--space-3); border-radius: var(--radius-lg); background: var(--ds-soft); min-width: 0; }
.db-stats strong { font-size: 1.35rem; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.1; }
.db-stats span { font-size: 0.8rem; color: var(--text3); }
.db-trend { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-3); font-size: 0.84rem; color: var(--text3); }
.db-trend-bars { display: inline-flex; align-items: flex-end; gap: 4px; height: 36px; }
.db-trend-bars i { width: 10px; border-radius: 3px 3px 0 0; opacity: 0.85; }

.db-tools { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-3); }
.db-tool { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-5); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
.db-tool:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); box-shadow: var(--elev-2); transform: translateY(-1px); }
.db-tool-top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); margin-bottom: var(--space-1); }
.db-tool-icon { width: 42px; height: 42px; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--accent-dim); color: var(--accent-text); }
.db-tool-count { padding: 2px 10px; border-radius: var(--radius-full); background: var(--ds-soft); font-size: 0.8rem; font-weight: 600; color: var(--text2); }
.db-tool-title { font-size: 1.05rem; font-weight: 700; color: var(--text); }
.db-tool-desc { font-size: 0.9rem; line-height: 1.55; color: var(--text2); }

.db-aside { display: flex; flex-direction: column; gap: var(--space-4); position: sticky; top: 84px; }
.db-card { padding: var(--space-5); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.db-card-title { margin: 0 0 var(--space-3); font-size: 1.05rem; font-weight: 800; }
.db-plan-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
.db-plan-row .db-card-title { margin: 0; color: var(--premium-text); }
.db-active { padding: 2px 10px; border-radius: var(--radius-full); background: var(--success-wash); color: var(--success-text); font-size: 0.8rem; font-weight: 700; }
.db-card-text { margin: var(--space-3) 0 0; font-size: 0.92rem; line-height: 1.6; color: var(--text2); }
.db-card-btn { width: 100%; justify-content: center; margin-top: var(--space-4); }
.db-usage { display: flex; flex-direction: column; gap: var(--space-2); }
.db-usage-row { display: flex; justify-content: space-between; gap: var(--space-3); font-size: 0.92rem; }
.db-usage-row span:first-child { color: var(--text2); }
.db-usage-row span:last-child { font-weight: 600; text-align: right; }
.db-facts { display: flex; flex-direction: column; }
.db-facts div { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-2) 0; border-top: 1px solid var(--border); font-size: 0.92rem; }
.db-facts div:first-child { border-top: none; padding-top: 0; }
.db-facts span:first-child { color: var(--text2); flex-shrink: 0; }
.db-facts span:last-child { min-width: 0; font-weight: 600; text-align: right; }
.db-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.db-link { display: inline-flex; align-items: center; gap: 6px; margin-top: var(--space-3); padding: 0; border: none; background: none; font: inherit; font-size: 0.92rem; font-weight: 600; color: var(--accent-text); text-decoration: none; cursor: pointer; }
.db-invite { display: flex; width: fit-content; }
.db-link:hover { text-decoration: underline; text-underline-offset: 3px; }

@media (max-width: 1100px) { .db-tools { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 960px) {
  .db-grid { grid-template-columns: minmax(0, 1fr); }
  .db-aside { position: static; }
}
@media (max-width: 720px) { .db-progress { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) {
  .db-main { gap: var(--space-6); }
  .db-today { padding: var(--space-5) var(--space-4); }
  .db-today-actions .ds-btn { width: 100%; justify-content: center; }
  .db-more { margin: var(--space-1) auto 0; }
  .db-resume { grid-template-columns: minmax(0, 1fr); }
  .db-pcard { padding: var(--space-4); }
  .db-tool { padding: var(--space-4); gap: 4px; }
  .db-tool-top { flex-direction: column; align-items: flex-start; gap: var(--space-2); }
  .db-tool-desc { display: none; }
  .db-tool-icon { width: 38px; height: 38px; }
}
@media (prefers-reduced-motion: reduce) { .db-tool, .db-bar span, .db-ring-fill { transition: none; } .db-tool:hover { transform: none; } }
`;
