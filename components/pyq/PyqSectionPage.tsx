import Link from '@/components/Link';
import { pyqs, type PYQ } from '@/lib/pyqData';
import { SectionIcon } from '@/components/notes/sections';
import AttemptedRing from './AttemptedRing';
import AttemptTick from './AttemptTick';
import { PYQ_SECTIONS, sourceLabel, tintFor } from './sections';
import { PYQ_HERO_CSS, PYQ_LIST_CSS } from './styles';
import { HiText, PyqQ, PyqSub, PyqSyllabus, PyqTopic, PyqWriteLink } from './PyqHiText';

/**
 * One section of the PYQ book on a page of its own: every question in it,
 * by topic and sub-topic. These pages are how search engines reach the
 * questions, so each one is a real link in the HTML; searching and filtering
 * them is the full list's job, which the hero links to.
 *
 * They used to be six hand-copied pages that had drifted apart.
 */

const BACK = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
const ARROW = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export default function PyqSectionPage({ slug }: { slug: string }) {
  const meta = PYQ_SECTIONS.find((s) => s.slug === slug)!;
  const questions = pyqs.filter((q) => q.section === meta.value);
  const first = Math.min(...questions.map((q) => q.year));
  const url = `https://historyoptional.xyz/pyqs/${slug}`;

  // Topic, then sub-topic in the book's order, newest first within it.
  const topics: { topic: string; syllabus: string[]; subs: { sub: string; items: PYQ[] }[]; n: number }[] = [];
  for (const q of questions) {
    let t = topics.find((x) => x.topic === q.topic);
    if (!t) { t = { topic: q.topic, syllabus: q.syllabus, subs: [], n: 0 }; topics.push(t); }
    let s = t.subs.find((x) => x.sub === q.subtopic);
    if (!s) { s = { sub: q.subtopic, items: [] }; t.subs.push(s); }
    s.items.push(q);
    t.n++;
  }
  topics.sort((a, b) => a.topic.localeCompare(b.topic));
  const idOf = (topic: string) => `t-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  for (const t of topics) for (const s of t.subs) s.items.sort((a, b) => b.year - a.year);

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        url,
        name: `${meta.name} PYQs, UPSC History Optional`,
        description: `${questions.length} previous year questions on ${meta.name} for UPSC History Optional`,
        isPartOf: { '@id': 'https://historyoptional.xyz/#website' },
        inLanguage: 'en-IN',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://historyoptional.xyz' },
          { '@type': 'ListItem', position: 2, name: 'PYQs', item: 'https://historyoptional.xyz/pyqs' },
          { '@type': 'ListItem', position: 3, name: meta.name, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <style dangerouslySetInnerHTML={{ __html: PYQ_HERO_CSS + PYQ_LIST_CSS }} />
      <div className="pl ds" style={tintFor(meta.key)}>
        <section className="pl-hero">
          <div className="ds-container pl-hero-row">
            <div className="pl-hero-main">
              <Link href="/pyqs" className="ds-back">{BACK}<HiText en="PYQs" hi="पिछले प्रश्न" /></Link>
              <div className="pl-title">
                <span className="pl-icon" aria-hidden="true"><SectionIcon id={meta.key} size={24} /></span>
                <h1 className="ds-h1"><HiText en={`${meta.name} PYQs`} hi={`${meta.nameHi}: पिछले प्रश्न`} /></h1>
              </div>
              <p className="ds-lede pl-lede">
                <HiText
                  en={<>Every {meta.name} question UPSC has asked since {first}, topic by topic.<span className="pl-more"> Open one to see how to approach it, or write your answer and get it checked.</span></>}
                  hi={<>{first} से अब तक UPSC द्वारा पूछे गए {meta.nameHi} के सभी प्रश्न, विषयवार।<span className="pl-more"> कोई प्रश्न खोलकर देखें कि उसे कैसे हल करें, या अपना उत्तर लिखकर जँचवाएँ।</span></>}
                />
              </p>
              <div className="pl-actions">
                <Link href={`/pyqs?section=${encodeURIComponent(meta.value)}`} className="ds-btn ds-btn-line ds-btn-sm"><HiText en="Search and filter these" hi="इन्हें खोजें और छाँटें" /> {ARROW}</Link>
              </div>
              <nav className="pl-chips pl-siblings" aria-labelledby="pl-siblings-label">
                <span id="pl-siblings-label" hidden><HiText en="The other sections" hi="बाक़ी खंड" /></span>
                {PYQ_SECTIONS.filter((s) => s.slug !== slug).map((s) => (
                  <Link key={s.slug} href={`/pyqs/${s.slug}`} style={{ ['--st' as string]: `var(--tint-${s.key})` }}><span aria-hidden="true" /><HiText en={s.name} hi={s.nameHi} /></Link>
                ))}
              </nav>
            </div>
            <div className="pl-hero-side">
              <AttemptedRing ids={questions.map((q) => q.id)} />
            </div>
          </div>
        </section>

        <section className="pl-body">
          <div className="ds-container">
            <div className="pq pq-static">
              <div className="pq-main pq-group">
                {topics.map((t) => (
                  <section key={t.topic} id={idOf(t.topic)} className="pq-topic-block">
                    <div className="pq-topic-head">
                      <h2 className="pq-topic-title"><PyqTopic topic={t.topic} /></h2>
                      <span className="pq-topic-count">{t.n} <HiText en={t.n === 1 ? 'question' : 'questions'} hi="प्रश्न" /></span>
                    </div>
                    {t.syllabus.length > 0 && <p className="pq-syllabus"><PyqSyllabus items={t.syllabus} /></p>}
                    {t.subs.map((s) => (
                      <div key={s.sub || '-'} className="pq-sub">
                        {s.sub && <h3 className="pq-sub-head"><PyqSub sub={s.sub} /></h3>}
                        <div className="pq-cards">
                          {s.items.map((q) => (
                            <article key={q.id} className="pq-card">
                              <div className="pq-meta">
                                <span className="pq-year-tag">{q.year}</span>
                                {q.source !== 'UPSC' && <span className="pq-src"><HiText en={q.source} hi={sourceLabel(q.source, true)} /></span>}
                                <span className="pq-marks">{q.marks} <HiText en="marks" hi="अंक" /></span>
                              </div>
                              <p className="pq-q"><Link href={`/pyqs/${q.id}`}><PyqQ id={q.id} en={q.question} /></Link></p>
                              <div className="pq-foot">
                                <span className="pq-foot-end">
                                  <AttemptTick id={q.id} />
                                  <PyqWriteLink id={q.id} en={q.question} marks={q.marks}>{ARROW}</PyqWriteLink>
                                </span>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </section>
                ))}
              </div>
              <aside className="pq-aside" aria-labelledby="pl-topics-label">
                <span id="pl-topics-label" hidden><HiText en="Topics in this section" hi="इस खंड के विषय" /></span>
                <div className="pq-side pq-side-jumps">
                  <h2><HiText en="Jump to a topic" hi="विषय पर जाएँ" /></h2>
                  <ol className="pq-jump">
                    <li>
                      <ol>
                        {topics.map((t) => (
                          <li key={t.topic}><a href={`#${idOf(t.topic)}`}><span className="pq-jump-name"><PyqTopic topic={t.topic} /></span><span className="pq-jump-n">{t.n}</span></a></li>
                        ))}
                      </ol>
                    </li>
                  </ol>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
