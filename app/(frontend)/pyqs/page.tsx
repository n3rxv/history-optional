import Link from '@/components/Link';
import { pyqs } from '@/lib/pyqData';
import { SectionIcon } from '@/components/notes/sections';
import PyqBrowser from '@/components/pyq/PyqBrowser';
import AttemptedRing from '@/components/pyq/AttemptedRing';
import { PYQ_SECTIONS, tintFor, type ListPyq } from '@/components/pyq/sections';
import { PYQ_HERO_CSS, PYQ_LIST_CSS } from '@/components/pyq/styles';
import { HiText } from '@/components/pyq/PyqHiText';

/**
 * Every past question. The list used to be a client page that imported the
 * whole question bank into its own bundle; the server now hands the browser
 * underneath only what it shows, with each topic's syllabus items sent once
 * rather than on every one of its questions.
 */

const BACK = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
const ARROW = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export default function PyqsPage() {
  const questions: ListPyq[] = pyqs.map(({ id, section, topic, subtopic, year, marks, source, question }) => ({ id, section, topic, subtopic, year, marks, source, question }));
  const syllabus: Record<string, string[]> = {};
  for (const q of pyqs) if (!syllabus[q.topic]) syllabus[q.topic] = q.syllabus;
  const years = pyqs.map((q) => q.year);
  const first = Math.min(...years);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PYQ_HERO_CSS + PYQ_LIST_CSS }} />
      <div className="pl ds" style={tintFor(undefined)}>
        <section className="pl-hero">
          <div className="ds-container pl-hero-row">
            <div className="pl-hero-main">
              <Link href="/" className="ds-back">{BACK}<HiText en="Home" hi="होम" /></Link>
              <div className="pl-title">
                <span className="pl-icon" aria-hidden="true"><SectionIcon id="pyqs" size={24} /></span>
                <h1 className="ds-h1"><HiText en="PYQs" hi="पिछले प्रश्न" /></h1>
              </div>
              <p className="ds-lede pl-lede">
                <HiText
                  en={<>Every History question UPSC has asked since {first}, grouped by topic the way the PYQ book does it.<span className="pl-more"> Open one to see how to approach it, or write your answer and get it checked.</span></>}
                  hi={<>{first} से अब तक UPSC द्वारा पूछा गया इतिहास का हर प्रश्न, PYQ पुस्तक की तरह विषयवार।<span className="pl-more"> कोई प्रश्न खोलकर देखें कि उसे कैसे हल करें, या अपना उत्तर लिखकर जँचवाएँ।</span></>}
                />
              </p>
              <div className="pl-actions">
                <Link href="/test" className="ds-btn ds-btn-line ds-btn-sm"><HiText en="Attempt a test paper" hi="टेस्ट पेपर हल करें" /> {ARROW}</Link>
                <Link href="/topper-copies" className="ds-btn ds-btn-ghost ds-btn-sm"><HiText en="Topper copies" hi="टॉपर कॉपियाँ" /></Link>
              </div>
            </div>
            <div className="pl-hero-side">
              <AttemptedRing ids={questions.map((q) => q.id)} />
            </div>
          </div>
        </section>

        <section className="pl-body">
          <div className="ds-container">
            <PyqBrowser questions={questions} syllabus={syllabus} />

            {/* Real links to the section pages, which is how a crawler reaches
                them; the tabs above only filter. */}
            <nav className="pl-browse" aria-labelledby="pl-browse-h">
              <h2 id="pl-browse-h"><HiText en="Each section on a page of its own" hi="हर खंड का अपना पृष्ठ" /></h2>
              <div className="pl-chips">
                {PYQ_SECTIONS.map((s) => (
                  <Link key={s.slug} href={`/pyqs/${s.slug}`} style={{ ['--st' as string]: `var(--tint-${s.key})` }}><span aria-hidden="true" /><HiText en={s.name} hi={s.nameHi} /></Link>
                ))}
              </div>
            </nav>
          </div>
        </section>
      </div>
    </>
  );
}
