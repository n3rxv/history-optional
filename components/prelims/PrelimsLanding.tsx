'use client';
import { useRouter } from 'next/navigation';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import { tintFor } from '@/components/pyq/sections';
import { useLang } from '@/lib/i18n/LangContext';
import { usePrelimsHi } from '@/lib/prelimsHi';

export type PrelimsTopic = { name: string; total: number; pyq: number; day: number };

const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

/** The course's days run by period: two for ancient India, one each after. */
const PERIODS: { title: string; titleHi: string; key: 'ancient' | 'medieval' | 'modern'; days: number[] }[] = [
  { title: 'Ancient India', titleHi: 'प्राचीन भारत', key: 'ancient', days: [1, 2] },
  { title: 'Early medieval India', titleHi: 'प्रारंभिक मध्यकालीन भारत', key: 'medieval', days: [3] },
  { title: 'Medieval India', titleHi: 'मध्यकालीन भारत', key: 'medieval', days: [4] },
  { title: 'Modern India', titleHi: 'आधुनिक भारत', key: 'modern', days: [5] },
];

const GIVES = [
  { title: 'The solution, step by step', titleHi: 'चरण-दर-चरण हल', body: 'How the right option is reached, statement by statement.', bodyHi: 'सही विकल्प तक कैसे पहुँचें, एक-एक कथन जाँचते हुए।', d: 'M4 6h16M4 12h10M4 18h7' },
  { title: 'The technique that cracks it', titleHi: 'प्रश्न खोलने की तकनीक', body: 'Linchpin statements, pair elimination, the odd one out: named, so you spot them next time.', bodyHi: 'निर्णायक कथन, जोड़ियों से विकल्प हटाना, बेमेल को पहचानना: हर तकनीक का नाम, ताकि अगली बार आप उसे पहचान लें।', d: 'M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8' },
  { title: 'A smart guess when unsure', titleHi: 'अनिश्चित हों तो स्मार्ट अनुमान', body: 'How to narrow it down when you genuinely do not know.', bodyHi: 'जब सच में उत्तर न पता हो, तब विकल्प कैसे कम करें।', d: 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z' },
  { title: 'Only the concepts it needs', titleHi: 'केवल ज़रूरी अवधारणाएँ', body: 'The minimum to know, and the related terms worth a look.', bodyHi: 'जितना जानना ज़रूरी है उतना, और देखने लायक़ संबंधित शब्द।', d: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6' },
];

/**
 * The Prelims front page: what is here, a way in by topic, and what the
 * Premium explanation adds. Starting needs an account, as it always has;
 * the questions themselves are free.
 */
export default function PrelimsLanding({ topics, first }: { topics: PrelimsTopic[]; first: number }) {
  const router = useRouter();
  const { langHi: hi } = useLang();
  const T = (en: string, h: string) => (hi ? h : en);
  const phi = usePrelimsHi(hi);
  const topicName = (t: string) => phi?.topics[t] ?? t;
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();
  const go = (topic?: string) => {
    if (!requireLogin(T('Sign in free to start Prelims practice.', 'प्रिलिम्स अभ्यास शुरू करने के लिए निःशुल्क साइन इन करें।'))) return;
    router.push(topic ? `/prelims/practice?topic=${encodeURIComponent(topic)}` : '/prelims/practice');
  };

  return (
    <div className="pl ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="pl-hero">
        <div className="ds-container">
          <h1 className="ds-h1 pl-h1">{T('Prelims practice', 'प्रिलिम्स अभ्यास')}</h1>
          <p className="ds-lede pl-lede">
            {hi
              ? `प्रिलिम्स इतिहास, विषय-दर-विषय। ${first} से अब तक के पिछले प्रश्न और अभ्यास MCQ, असली परीक्षा की तरह अंकित, यानी ग़लत अनुमान पर 0.66 अंक कटते हैं।`
              : <>Prelims History, topic by topic. Past questions since {first} plus practice MCQs, marked like the real exam, so a wrong guess costs you 0.66.</>}
          </p>
          <div className="pl-actions">
            <button type="button" className="ds-btn ds-btn-solid ds-btn-lg" onClick={() => go()}>{T('Start practising', 'अभ्यास शुरू करें')} <Arrow /></button>
            <span className="pl-free">{T('The questions are free. The explanations are Premium.', 'प्रश्न निःशुल्क हैं। स्पष्टीकरण प्रीमियम में हैं।')}</span>
          </div>
        </div>
      </header>

      <div className="ds-container">
        <section className="pl-section" aria-labelledby="pl-topics">
          <div className="pl-section-head">
            <h2 id="pl-topics" className="pl-h2">{T('Pick a topic', 'विषय चुनें')}</h2>
            <span>{hi ? `${topics.length} विषय, पाषाण युग से स्वतंत्रता आंदोलन तक` : `${topics.length} topics, from the Stone Age to the freedom movement`}</span>
          </div>
          {PERIODS.map((period) => {
            const list = topics.filter((t) => period.days.includes(t.day));
            if (!list.length) return null;
            return (
              <div key={period.title} className="pl-period" style={tintFor(period.key)}>
                <h3 className="pl-period-title">{hi ? period.titleHi : period.title}<span>{list.reduce((n, t) => n + t.total, 0)} {T('questions', 'प्रश्न')}</span></h3>
                <div className="pl-topics">
                  {list.map((t) => (
                    <button key={t.name} type="button" className="pl-topic" onClick={() => go(t.name)}>
                      <span className="pl-topic-name">{topicName(t.name)}</span>
                      <span className="pl-topic-meta">{t.total} {T('questions', 'प्रश्न')}{t.pyq ? ` · ${t.pyq} ${T('asked', 'पूछे गए')}` : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="pl-section" aria-labelledby="pl-gives">
          <div className="pl-section-head">
            <h2 id="pl-gives" className="pl-h2">{T('After each answer, with Premium', 'प्रीमियम के साथ, हर उत्तर के बाद')}</h2>
            <span>{T('How a sharp aspirant would think it through', 'एक कुशल अभ्यर्थी इसे कैसे हल करेगा')}</span>
          </div>
          <div className="pl-gives">
            {GIVES.map((g) => (
              <div key={g.title} className="pl-give">
                <span className="pl-give-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={g.d} /></svg></span>
                <div><strong>{hi ? g.titleHi : g.title}</strong><p>{hi ? g.bodyHi : g.body}</p></div>
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
