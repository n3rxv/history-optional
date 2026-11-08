'use client';
import Link from 'next/link';
import { useLang } from '@/lib/i18n/LangContext';
import { FEATURES } from '@/lib/features';
import { scoreTone } from '@/components/evaluate/Report';
import InvitedNote from '@/components/InvitedNote';
import type { SharedCheck } from '@/lib/sharedCheck';

const SECTION_NAME = {
  introduction: ['Introduction', 'भूमिका'], body: ['Body', 'मुख्य भाग'],
  conclusion: ['Conclusion', 'निष्कर्ष'], presentation: ['Presentation', 'प्रस्तुति'],
} as const;

/**
 * The public card for a shared answer check. The question and the feedback
 * stay in the language they were marked in; the labels around them follow
 * the visitor's language.
 */
export default function SharedCheckView({ check }: { check: SharedCheck }) {
  const { langHi } = useLang();
  const T = (en: string, hi: string) => (langHi ? hi : en);
  const pct = check.outOf ? check.marks / check.outOf : 0;
  const freeChecks = FEATURES.find((f) => f.name === 'Answer evaluation')?.free.match(/\d+/)?.[0] ?? '1';

  return (
    <div className="shc-page ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ds-container shc-wrap">
        <p className="shc-eyebrow">{T('Answer check · UPSC History Optional', 'उत्तर जाँच · UPSC इतिहास वैकल्पिक')}</p>

        <article className="shc-card ds-card">
          <div className="shc-q">
            <span>{T(`Question · ${check.outOf} marks`, `प्रश्न · ${check.outOf} अंक`)}</span>
            <p lang={check.lang}>{check.question}</p>
          </div>

          <div className="shc-grid">
            <div className="shc-score">
              <div className="shc-num" style={{ color: scoreTone(pct) }}>{check.marks}<span>/ {check.outOf}</span></div>
              <div className="shc-bar"><span style={{ width: `${Math.min(100, pct * 100)}%`, background: scoreTone(pct) }} /></div>
              {check.sections.length > 0 && (
                <div className="shc-secs">
                  {check.sections.map((s) => {
                    const p = s.outOf ? s.awarded / s.outOf : 0;
                    return (
                      <div key={s.key} className="shc-sec">
                        <div className="shc-sec-top"><span>{SECTION_NAME[s.key][langHi ? 1 : 0]}</span><span>{s.awarded} / {s.outOf}</span></div>
                        <div className="shc-sec-bar"><span style={{ width: `${Math.min(100, p * 100)}%`, background: scoreTone(p) }} /></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shc-notes" lang={check.lang}>
              {check.worked.length > 0 && (
                <section>
                  <h2>{T('What worked', 'क्या अच्छा रहा')}</h2>
                  <ul>{check.worked.map((l, i) => <li key={i}>{l}</li>)}</ul>
                </section>
              )}
              {check.improve.length > 0 && (
                <section>
                  <h2>{T('To improve', 'क्या सुधारें')}</h2>
                  <ul>{check.improve.map((l, i) => <li key={i}>{l}</li>)}</ul>
                </section>
              )}
              <p className="shc-private">{T('The answer itself is not shown.', 'उत्तर स्वयं नहीं दिखाया गया है।')}</p>
            </div>
          </div>
        </article>

        <aside className="shc-cta ds-card-soft">
          <h2>{T('Get your own answer checked', 'अपना उत्तर भी जँचवाएँ')}</h2>
          <p>{T(`Photograph a handwritten answer and get marks for each part, feedback and a model answer. Your first ${freeChecks === '1' ? 'check is' : `${freeChecks} checks are`} free.`,
            `हाथ से लिखे उत्तर की फ़ोटो लें और हर भाग के अंक, फ़ीडबैक और आदर्श उत्तर पाएँ। पहली ${freeChecks === '1' ? 'जाँच' : `${freeChecks} जाँचें`} निःशुल्क है।`)}</p>
          <InvitedNote className="shc-invited" />
          <div className="shc-cta-btns">
            <Link href="/evaluate" className="ds-btn ds-btn-solid">{T('Check an answer', 'उत्तर जाँचें')}</Link>
            <Link href="/pricing" className="ds-btn ds-btn-line">{T('See the plans', 'प्लान देखें')}</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

const CSS = `
.shc-wrap { max-width: 860px; padding-top: var(--space-10); padding-bottom: var(--space-12); }
.shc-eyebrow { margin: 0 0 var(--space-4); font-family: var(--font-ui); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text3); }
.shc-card { padding: var(--space-6); }
.shc-q span { font-family: var(--font-ui); font-size: 0.8rem; color: var(--text3); }
.shc-q p { margin: var(--space-2) 0 0; font-size: 1.12rem; line-height: 1.6; color: var(--text); }
.shc-grid { display: grid; grid-template-columns: 240px 1fr; gap: var(--space-8); margin-top: var(--space-6); padding-top: var(--space-6); border-top: 1px solid var(--border); }
.shc-num { font-family: var(--font-body); font-weight: 800; font-size: 3.4rem; line-height: 1; letter-spacing: -0.03em; }
.shc-num span { margin-left: 6px; font-size: 1.3rem; font-weight: 600; color: var(--text3); }
.shc-bar, .shc-sec-bar { height: 8px; margin-top: var(--space-3); border-radius: var(--radius-full); background: var(--bg2); overflow: hidden; }
.shc-sec-bar { height: 6px; margin-top: 6px; }
.shc-bar span, .shc-sec-bar span { display: block; height: 100%; border-radius: inherit; }
.shc-secs { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-6); }
.shc-sec-top { display: flex; justify-content: space-between; font-family: var(--font-ui); font-size: 0.84rem; color: var(--text2); }
.shc-notes section + section { margin-top: var(--space-5); }
.shc-notes h2 { margin: 0 0 var(--space-2); font-family: var(--font-ui); font-size: 0.86rem; font-weight: 700; color: var(--text); }
.shc-notes ul { margin: 0; padding-left: 1.1em; display: flex; flex-direction: column; gap: var(--space-2); }
.shc-notes li { font-size: 0.98rem; line-height: 1.6; color: var(--text2); }
.shc-private { margin: var(--space-5) 0 0; font-family: var(--font-ui); font-size: 0.8rem; color: var(--text3); }
.shc-cta { margin-top: var(--space-6); padding: var(--space-6); }
.shc-cta h2 { margin: 0; font-size: 1.3rem; color: var(--text); }
.shc-cta p { margin: var(--space-2) 0 0; line-height: 1.6; color: var(--text2); }
.shc-cta .shc-invited { font-family: var(--font-ui); font-size: 0.88rem; color: var(--premium-text); }
.shc-cta-btns { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-5); }
@media (max-width: 720px) {
  .shc-wrap { padding-top: var(--space-6); }
  .shc-card, .shc-cta { padding: var(--space-5); }
  .shc-grid { grid-template-columns: 1fr; gap: var(--space-6); }
  .shc-cta-btns .ds-btn { flex: 1 1 100%; justify-content: center; }
}
`;
