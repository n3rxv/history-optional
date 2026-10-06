'use client';
import { useRouter } from 'next/navigation';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import { tintFor } from '@/components/pyq/sections';

export type PrelimsTopic = { name: string; total: number; pyq: number; day: number };

const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

/** The course's days run by period: two for ancient India, one each after. */
const PERIODS: { title: string; key: 'ancient' | 'medieval' | 'modern'; days: number[] }[] = [
  { title: 'Ancient India', key: 'ancient', days: [1, 2] },
  { title: 'Early medieval India', key: 'medieval', days: [3] },
  { title: 'Medieval India', key: 'medieval', days: [4] },
  { title: 'Modern India', key: 'modern', days: [5] },
];

const GIVES = [
  { title: 'The solution, step by step', body: 'How the right option is reached, statement by statement.', d: 'M4 6h16M4 12h10M4 18h7' },
  { title: 'The technique that cracks it', body: 'Linchpin statements, pair elimination, the odd one out: named, so you spot them next time.', d: 'M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8' },
  { title: 'A smart guess when unsure', body: 'How to narrow it down when you genuinely do not know.', d: 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z' },
  { title: 'Only the concepts it needs', body: 'The minimum to know, and the related terms worth a look.', d: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6' },
];

/**
 * The Prelims front page: what is here, a way in by topic, and what the
 * Premium explanation adds. Starting needs an account, as it always has;
 * the questions themselves are free.
 */
export default function PrelimsLanding({ topics, first }: { topics: PrelimsTopic[]; first: number }) {
  const router = useRouter();
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();
  const go = (topic?: string) => {
    if (!requireLogin('Sign in free to start Prelims practice.')) return;
    router.push(topic ? `/prelims/practice?topic=${encodeURIComponent(topic)}` : '/prelims/practice');
  };

  return (
    <div className="pl ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="pl-hero">
        <div className="ds-container">
          <h1 className="ds-h1 pl-h1">Prelims practice</h1>
          <p className="ds-lede pl-lede">
            Prelims History, topic by topic. Past questions since {first} plus practice MCQs, marked like the real exam, so a wrong guess costs you 0.66.
          </p>
          <div className="pl-actions">
            <button type="button" className="ds-btn ds-btn-solid ds-btn-lg" onClick={() => go()}>Start practising <Arrow /></button>
            <span className="pl-free">The questions are free. The explanations are Premium.</span>
          </div>
        </div>
      </header>

      <div className="ds-container">
        <section className="pl-section" aria-labelledby="pl-topics">
          <div className="pl-section-head">
            <h2 id="pl-topics" className="pl-h2">Pick a topic</h2>
            <span>{topics.length} topics, from the Stone Age to the freedom movement</span>
          </div>
          {PERIODS.map((period) => {
            const list = topics.filter((t) => period.days.includes(t.day));
            if (!list.length) return null;
            return (
              <div key={period.title} className="pl-period" style={tintFor(period.key)}>
                <h3 className="pl-period-title">{period.title}<span>{list.reduce((n, t) => n + t.total, 0)} questions</span></h3>
                <div className="pl-topics">
                  {list.map((t) => (
                    <button key={t.name} type="button" className="pl-topic" onClick={() => go(t.name)}>
                      <span className="pl-topic-name">{t.name}</span>
                      <span className="pl-topic-meta">{t.total} questions{t.pyq ? ` · ${t.pyq} asked` : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="pl-section" aria-labelledby="pl-gives">
          <div className="pl-section-head">
            <h2 id="pl-gives" className="pl-h2">After each answer, with Premium</h2>
            <span>How a sharp aspirant would think it through</span>
          </div>
          <div className="pl-gives">
            {GIVES.map((g) => (
              <div key={g.title} className="pl-give">
                <span className="pl-give-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={g.d} /></svg></span>
                <div><strong>{g.title}</strong><p>{g.body}</p></div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}

const CSS = `
.pl { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.pl-hero { padding: clamp(32px, 6vh, 64px) 0 clamp(20px, 3vh, 32px); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-dim) 60%, var(--bg)) 0%, var(--bg) 100%); }
.pl-h1 { font-size: clamp(2.1rem, 4.6vw, 3.2rem); margin: 0 0 var(--space-3); }
.pl-lede { max-width: 700px; }
.pl-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3) var(--space-4); margin-top: var(--space-5); }
.pl-free { font-size: 0.9rem; color: var(--text3); }
.pl-section { padding-top: var(--space-8); }
.pl-section-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px var(--space-3); margin-bottom: var(--space-4); }
.pl-section-head span { font-size: 0.9rem; color: var(--text3); }
.pl-h2 { margin: 0; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.02em; }
.pl-period + .pl-period { margin-top: var(--space-6); }
.pl-period-title { display: flex; align-items: baseline; gap: var(--space-2); margin: 0 0 var(--space-3); font-size: 1rem; font-weight: 800; color: var(--t); }
.pl-period-title span { font-size: 0.84rem; font-weight: 600; color: var(--text3); }
.pl-topics { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-3); }
.pl-topic { display: flex; flex-direction: column; gap: 4px; padding: var(--space-4); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-lg); color: var(--text); font: inherit; text-align: left; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
.pl-topic { border-left: 3px solid var(--t); }
.pl-topic:hover { border-color: color-mix(in srgb, var(--t) 45%, transparent); border-left-color: var(--t); box-shadow: var(--elev-1); transform: translateY(-1px); }
.pl-topic:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.pl-topic-name { font-size: 0.98rem; font-weight: 700; line-height: 1.35; }
.pl-topic-meta { font-size: 0.84rem; color: var(--text3); }
.pl-gives { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.pl-give { display: flex; gap: var(--space-3); padding: var(--space-5); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.pl-give-icon { width: 40px; height: 40px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--premium-wash); color: var(--premium-text); }
.pl-give strong { display: block; margin-bottom: 4px; font-size: 1rem; }
.pl-give p { margin: 0; font-size: 0.92rem; line-height: 1.55; color: var(--text2); }
@media (max-width: 720px) { .pl-gives { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) {
  .pl-actions .ds-btn { width: 100%; justify-content: center; }
  .pl-free { width: 100%; text-align: center; }
  .pl-topics { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-2); }
  .pl-topic { padding: var(--space-3); }
  .pl-topic-name { font-size: 0.92rem; }
  .pl-topic-meta { font-size: 0.78rem; }
  .pl-give { padding: var(--space-4); }
}
@media (prefers-reduced-motion: reduce) { .pl-topic { transition: none; } .pl-topic:hover { transform: none; } }
`;
