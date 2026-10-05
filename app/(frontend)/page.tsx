import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { allNotes } from '@/lib/notes';
import { pyqs } from '@/lib/pyqData';
import { countPublished } from '@/lib/flashcardStore';
import { getDailyQuestions } from '@/lib/dailyQuestions';
import { istDay } from '@/lib/istDay';
import { PLANS, PLAN_ORDER, PLAN_DURATION, planPriceLabel } from '@/lib/plans';
import HomeAsk from '@/components/home/HomeAsk';
import { HeroActions } from '@/components/home/HomeLinks';
import HomeShowcase from '@/components/home/HomeShowcase';
import TodayPractice from '@/components/home/TodayPractice';
import { SECTIONS, SectionIcon } from '@/components/notes/sections';

// Static: the daily questions are the build day's, and TodayPractice fetches
// the current day's set when it differs. The page used to revalidate hourly
// just to roll them over at midnight IST, rendering and writing itself to the
// ISR cache 24 times a day.

export const metadata: Metadata = {
  title: 'History Optional · Notes, PYQs and answer checking for UPSC',
  description: 'Notes for every topic in both papers, every History Optional PYQ since 1979, an AI tutor that reads the standard books, and answer checking for UPSC Mains.',
  alternates: { canonical: 'https://historyoptional.xyz' },
  openGraph: {
    title: 'History Optional · Notes, PYQs and answer checking for UPSC',
    description: 'Notes for every topic in both papers, every History Optional PYQ since 1979, an AI tutor that reads the standard books, and answer checking for UPSC Mains.',
    url: 'https://historyoptional.xyz',
    type: 'website',
  },
};

const PLAN_NOTE: Record<string, string> = {
  daily: 'For the last few days before the exam.',
  sixmonths: 'For the months leading up to Mains.',
  yearly: 'For the whole cycle, from Prelims to the interview.',
};

const STEPS = [
  { title: 'Read a topic in the evening', text: 'Open the notes for whatever you are on today. Ask the AI about the bits that don’t click, or the historian you can’t place.' },
  { title: 'Look at what UPSC has asked on it', text: 'The past questions on that topic show you which way the examiners tend to come at it, and the debates they keep returning to.' },
  { title: 'Write one answer and get it checked', text: 'Take a photo of it, upload it, and see where the marks went, which historians you missed, and a model answer to compare.' },
];

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export default async function Home() {
  // Counted from the data at build time, so the numbers stay true as
  // questions, notes and cards are added.
  const flashcards = (await countPublished()) ?? 1200;
  const firstYear = Math.min(...pyqs.map((q) => Number(q.year)).filter(Boolean));
  const fmt = (n: number) => n.toLocaleString('en-IN');
  const counts = SECTIONS.map((sec) => ({
    ...sec,
    topics: allNotes.filter((n) => n.section === sec.name).length,
    pyqs: pyqs.filter((q) => sec.pyq.includes(q.section)).length,
  }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HOME_CSS }} />

      <div className="hm ds">
        {/* ── Hero ── */}
        <section className="hm-hero">
          <div className="ds-container ds-narrow hm-hero-inner">
            <Image src="/mascot/owl.svg" alt="" width={112} height={106} priority className="hm-owl" />
            <h1 className="ds-h1">
              History Optional, <em className="hm-mark">distilled.<svg viewBox="0 0 220 16" preserveAspectRatio="none" aria-hidden="true"><path d="M3 11c34-6 70-8 108-5 30 2 63 3 106-3" /></svg></em>
            </h1>
            <p className="ds-lede hm-lede">
              Notes for all {allNotes.length} topics, every past question since {firstYear}, and an AI that has read the standard history books and shows you the page it is quoting.
            </p>
            <HomeAsk />
            <HeroActions />
          </div>
          <div className="ds-container hm-cards">
            <HomeShowcase />
          </div>
          <p className="hm-proof ds-container">
            Right now there are <b>{fmt(pyqs.length)} past questions</b>, <b>{allNotes.length} topics</b> and <b>{fmt(flashcards)} flashcards</b> in here.
          </p>
        </section>

        {/* ── The four parts of the syllabus ── */}
        <section id="sections" className="hm-section">
          <div className="ds-container">
            <div className="hm-head">
              <h2 className="ds-h2">Where would you like to start?</h2>
              <p className="ds-lede">Two papers, four parts. Each topic has its notes, the historians who argued over it, and every PYQ asked on it.</p>
            </div>
            <div className="hm-secs">
              {counts.map((c) => (
                <Link key={c.key} href={c.href} className="hm-sec ds-card ds-card-link" style={{ ['--t' as string]: `var(--tint-${c.key})`, ['--w' as string]: `var(--wash-${c.key})` }}>
                  <span className="hm-sec-icon" aria-hidden="true"><SectionIcon id={c.key} /></span>
                  <span className="hm-sec-body">
                    <span className="hm-sec-name">{c.name}</span>
                    <span className="hm-sec-sub">{c.sub}</span>
                    <span className="hm-sec-meta">{c.topics} topics · {fmt(c.pyqs)} PYQs</span>
                  </span>
                  <span className="hm-sec-go" aria-hidden="true"><Arrow /></span>
                </Link>
              ))}
            </div>
            <a href="https://distilledcrux.com" target="_blank" rel="noopener" className="hm-other">
              <span>Another optional? Sociology, Anthropology, PSIR, Geography and Public Administration are on <b>DistilledCrux.com</b></span>
              <Arrow />
            </a>
          </div>
        </section>

        {/* ── A question a day ── */}
        <section id="daily-answer" className="hm-section">
          <div className="ds-container ds-narrow">
            <div className="hm-head">
              <h2 className="ds-h2">A question a day</h2>
              <p className="ds-lede">Five PYQs, the same for everyone today. Write one, or all five against the clock.</p>
            </div>
            <TodayPractice questions={getDailyQuestions()} day={istDay()} />
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="hm-section">
          <div className="ds-container">
            <div className="hm-head">
              <h2 className="ds-h2">A good way to use it</h2>
            </div>
            <ol className="hm-steps">
              {STEPS.map((st, i) => (
                <li key={st.title} className="hm-step">
                  <span className="hm-step-n">{i + 1}</span>
                  <span className="ds-h3">{st.title}</span>
                  <span className="hm-step-text">{st.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Plans ── */}
        <section className="hm-section">
          <div className="ds-container">
            <div className="hm-head">
              <h2 className="ds-h2">Pay once, or week by week</h2>
              <p className="ds-lede">Notes and past questions are free with an account. A plan opens unlimited answer checking, the AI tutor, model answers and topper copies.</p>
            </div>
            <div className="hm-plans">
              {PLAN_ORDER.map((id) => (
                <Link key={id} href="/pricing" className={`hm-plan ds-card ds-card-link${id === 'yearly' ? ' featured' : ''}`}>
                  {id === 'yearly' && <span className="ds-tag">Most chosen</span>}
                  <span className="hm-plan-name">{id === 'yearly' ? 'A year' : PLANS[id].label}</span>
                  <span className="hm-plan-price">{planPriceLabel(id)}</span>
                  <span className="hm-plan-period">for {PLAN_DURATION[id] === 'day' ? 'a day' : PLAN_DURATION[id] === 'year' ? 'a year' : PLAN_DURATION[id]}, paid once</span>
                  <span className="hm-plan-text">{PLAN_NOTE[id]}</span>
                </Link>
              ))}
            </div>
            <p className="hm-weekly">Or {planPriceLabel('weekly')} a week, renewing until you stop it.</p>
            <div className="hm-plans-more"><Link href="/pricing" className="ds-btn ds-btn-ghost">See what each plan includes<Arrow /></Link></div>
          </div>
        </section>

        {/* ── Close ── */}
        <section className="hm-section hm-close">
          <div className="ds-container ds-narrow hm-close-inner">
            <Image src="/mascot/owl-reading.svg" alt="" width={110} height={95} className="hm-close-owl" />
            <h2 className="ds-h2">Start with tonight&rsquo;s topic</h2>
            <p className="ds-lede">Open the notes for whatever you are reading today and see if it helps. It is free, and there is no card to enter.</p>
            <HeroActions />
          </div>
        </section>
      </div>
    </>
  );
}

const HOME_CSS = `
.hm { background: var(--bg); }
.hm em { font-style: normal; color: var(--accent-text); }
/* A marker stroke under the word, drawn by hand rather than set as a line. */
.hm-mark { position: relative; display: inline-block; white-space: nowrap; }
.hm-mark svg { position: absolute; left: 0; right: 0; bottom: -0.12em; width: 100%; height: 0.3em; overflow: visible; }
.hm-mark path { fill: none; stroke: color-mix(in srgb, var(--accent) 45%, transparent); stroke-width: 6; stroke-linecap: round; }

/* Hero */
.hm-hero { padding: clamp(36px, 7vh, 80px) 0 clamp(48px, 8vh, 80px); }
.hm-hero-inner { display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--space-4); }
.hm-owl { width: auto; height: clamp(80px, 11vh, 106px); }
.hm-lede { max-width: 620px; margin: 0 auto var(--space-2); }
.hm-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--space-2) var(--space-4); margin-top: var(--space-1); max-width: 100%; }
.hm-continue { max-width: 100%; }
.hm-continue span { overflow: hidden; text-overflow: ellipsis; }
.hm-proof { display: block; max-width: 760px; margin-top: var(--space-8); line-height: 1.7; font-size: 0.98rem; color: var(--text2); text-align: center; }
.hm-proof b { color: var(--text); font-weight: 700; }
.hm-cards { margin-top: clamp(32px, 6vh, 56px); }
.hm-cards.ds-container { max-width: 1248px; }

/* Sections */
.hm-section { padding: clamp(48px, 9vh, 96px) 0; border-top: 1px solid var(--border); }
.hm-head { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-8); max-width: 680px; }

/* The four parts */
.hm-secs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); }
.hm-sec { display: flex; align-items: flex-start; gap: var(--space-4); padding: var(--space-5); }
.hm-sec-icon { width: 46px; height: 46px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-lg); background: var(--w); color: var(--t); }
.hm-sec-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.hm-sec-name { font-weight: 700; font-size: 1.06rem; color: var(--text); }
.hm-sec-sub { font-size: 0.88rem; color: var(--text2); line-height: 1.5; }
.hm-sec-meta { font-family: var(--font-ui); font-size: 0.78rem; color: var(--t); font-weight: 600; margin-top: var(--space-2); }
.hm-sec-go { color: var(--text3); transition: color 0.15s, transform 0.15s; padding-top: 2px; }
.hm-sec:hover .hm-sec-go { color: var(--t); transform: translateX(2px); }
.hm-other { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-top: var(--space-4); padding: var(--space-4) var(--space-5); border: 1px dashed var(--border2); border-radius: var(--radius-xl); color: var(--text2); text-decoration: none; font-size: 0.92rem; line-height: 1.5; transition: border-color 0.15s, color 0.15s; }
.hm-other b { color: var(--text); }
.hm-other svg { flex-shrink: 0; color: var(--text3); }
.hm-other:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); color: var(--text); }

/* Today's question */
.tp { overflow: hidden; }
.tp-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); padding: var(--space-5); }
.tp-head h3 { margin: 0; font-size: 1.05rem; font-weight: 700; }
.tp-head p { margin: 4px 0 0; font-size: 0.86rem; color: var(--text3); line-height: 1.5; }
.tp-clock { font-family: var(--font-ui); font-variant-numeric: tabular-nums; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text); }
.tp-clock.low { color: var(--danger-text); }
.tp-bar { height: 3px; background: var(--border); }
.tp-bar span { display: block; height: 100%; background: var(--accent); transition: width 1s linear; }
.tp-bar span.low { background: var(--danger-text); }
.tp-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--border); }
.tp-q { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border); }
.tp-q:last-child { border-bottom: none; }
.tp-n { flex-shrink: 0; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--ds-soft); font-family: var(--font-ui); font-size: 0.8rem; font-weight: 700; color: var(--text2); }
.tp-body { flex: 1; min-width: 0; }
.tp-body p { margin: 0; font-size: 0.98rem; line-height: 1.55; }
.tp-meta { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; font-family: var(--font-ui); font-size: 0.78rem; color: var(--text3); }
.tp-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--t); }
.tp-write { flex-shrink: 0; align-self: center; padding: 7px 14px; border-radius: var(--radius-full); border: 1px solid var(--border2); color: var(--accent-text); font-size: 0.86rem; font-weight: 700; text-decoration: none; }
.tp-write:hover { border-color: var(--accent); background: var(--accent-dim); }
.tp-more { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; min-height: 48px; border: none; border-top: 1px solid var(--border); background: none; color: var(--accent-text); font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.tp-more:hover { background: var(--ds-soft); }

/* Steps */
.hm-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
.hm-step { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-5); border-left: 2px solid var(--border); }
.hm-step-n { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: var(--space-1); border-radius: var(--radius-circle); background: var(--accent); color: var(--accent-on); font-family: var(--font-ui); font-weight: 700; font-size: 0.9rem; }
.hm-step-text { font-size: 0.92rem; line-height: 1.6; color: var(--text2); }

/* Plans */
.hm-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
.hm-plan { position: relative; display: flex; flex-direction: column; gap: 2px; padding: var(--space-6) var(--space-5); }
.hm-plan.featured { border-color: color-mix(in srgb, var(--accent) 50%, transparent); box-shadow: 0 0 0 3px var(--accent-dim); }
.hm-plan .ds-tag { position: absolute; top: var(--space-4); right: var(--space-4); }
.hm-plan-name { font-family: var(--font-ui); font-size: 0.82rem; font-weight: 600; color: var(--text3); }
.hm-plan-price { font-weight: 700; font-size: 2rem; letter-spacing: -0.02em; color: var(--text); margin-top: var(--space-1); }
.hm-plan-period { font-family: var(--font-ui); font-size: 0.8rem; color: var(--text3); }
.hm-plan-text { font-size: 0.9rem; color: var(--text2); margin-top: var(--space-3); }
.hm-weekly { margin: var(--space-5) 0 0; text-align: center; font-size: 0.92rem; color: var(--text2); }
.hm-plans-more { display: flex; justify-content: center; margin-top: var(--space-3); }

/* Close */
.hm-close-inner { display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--space-3); }
.hm-close-owl { width: auto; height: 95px; }

/* Tablet */
@media (max-width: 960px) {
  .hm-steps, .hm-plans { grid-template-columns: 1fr; }
  .hm-step { border-left: none; border-top: 2px solid var(--border); padding: var(--space-4) 0; flex-direction: row; flex-wrap: wrap; align-items: center; column-gap: var(--space-3); }
  .hm-step-text { flex-basis: 100%; }
  .hm-plans { max-width: 520px; margin: 0 auto; }
}

/* Phone */
@media (max-width: 640px) {
  .hm-hero { padding-top: var(--space-6); }
  .hm-hero-inner { gap: var(--space-3); }
  .hm-owl { height: 76px; }
  .hm-actions { width: 100%; flex-direction: column; }
  .hm-actions .ds-btn-solid { width: 100%; }
  .hm-proof { margin-top: var(--space-6); font-size: 0.9rem; }
  .hm-head { margin-bottom: var(--space-5); }
  .hm-secs { grid-template-columns: 1fr; gap: var(--space-3); }
  .hm-sec { padding: var(--space-4); }
  .hm-other { padding: var(--space-4); }
  .tp-head { flex-direction: column; padding: var(--space-4); }
  .tp-q { padding: var(--space-4); }
  /* A plan is one compact row on a phone: name and price, then its line. */
  .hm-plan { flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: var(--space-2); padding: var(--space-4); }
  .hm-plan-name { flex-basis: 100%; }
  .hm-plan-price { font-size: 1.6rem; margin-top: 0; }
  .hm-plan-text { flex-basis: 100%; margin-top: var(--space-1); }
  .hm-plan .ds-tag { top: var(--space-3); right: var(--space-3); }
}
@media (prefers-reduced-motion: reduce) { .tp-bar span { transition: none; } }
`;
