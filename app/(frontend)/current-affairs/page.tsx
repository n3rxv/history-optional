import Link from 'next/link';
import { listPosts, loadCuttings, type PostCard } from '@/lib/posts';
import { AdminToolsSlot } from '@/components/currentAffairs/AdminSlot';
import { CA_CSS } from '@/components/currentAffairs/styles';
import { HiText } from '@/components/ui/HiText';
import { POST_HI } from '@/lib/postsHi';

/**
 * Current affairs, rendered on the server and rebuilt hourly, or at once when
 * the owner saves a post or a cutting. The list used to be fetched in every
 * reader's browser, every post's body and base64 cover included.
 */
export const revalidate = 3600;

const fmt = (iso: string, locale = 'en-IN') => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
/** A date in both languages, drawn on the server. */
const Day = ({ iso }: { iso: string }) => <time dateTime={iso}><HiText en={fmt(iso)} hi={fmt(iso, 'hi-IN')} /></time>;
/**
 * A post's own words: the English from the database, and in Hindi mode the
 * translation from lib/postsHi.ts when there is one for the post.
 */
const T = ({ en, hi }: { en: string; hi?: string }) => (hi ? <HiText en={en} hi={hi} /> : <>{en}</>);
const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

function Meta({ p }: { p: PostCard }) {
  const hiTags = POST_HI[p.slug]?.tags;
  const tags = (list: string[]) => list.slice(0, 2).map((t) => <span key={t} className="ca-tag">{t}</span>);
  return (
    <span className="ca-meta">
      <Day iso={p.publishedAt} />
      {hiTags?.length ? <HiText en={tags(p.tags)} hi={tags(hiTags)} /> : tags(p.tags)}
    </span>
  );
}

function Title({ p }: { p: PostCard }) {
  return <h2 className="ca-title"><T en={p.title} hi={POST_HI[p.slug]?.title} /></h2>;
}

function Excerpt({ p }: { p: PostCard }) {
  return p.excerpt ? <p className="ca-excerpt"><T en={p.excerpt} hi={POST_HI[p.slug]?.excerpt} /></p> : null;
}

export default async function CurrentAffairsPage() {
  let posts: PostCard[] = [];
  let cuttings: Awaited<ReturnType<typeof loadCuttings>> = [];
  try { [posts, cuttings] = await Promise.all([listPosts(), loadCuttings()]); } catch (e) { console.error('Current affairs fetch failed:', e); }
  const affairs = posts.filter((p) => p.type === 'current-affairs');
  const notes = posts.filter((p) => p.type === 'new-note');
  const [lead, ...rest] = affairs;

  return (
    <div className="ca ds">
      <style dangerouslySetInnerHTML={{ __html: CA_CSS }} />
      <header className="ca-hero">
        <div className="ds-container">
          <h1 id="ca-title" className="ds-h1 ca-h1"><HiText en="Current affairs" hi="समसामयिकी" /></h1>
          <p className="ds-lede ca-lede"><HiText en="History in the news, like a new excavation or an anniversary, and how you can use it in your answers." hi="ख़बरों में इतिहास, जैसे कोई नई खुदाई या कोई वर्षगाँठ, और आप इसे अपने उत्तरों में कैसे इस्तेमाल कर सकते हैं।" /></p>
        </div>
      </header>
      <div className="ds-container">
        {cuttings.length > 0 && (
          <section className="ca-section" aria-labelledby="ca-cut">
            <h2 id="ca-cut" className="ca-h2"><HiText en="From the papers" hi="अख़बारों से" /></h2>
            <div className="ca-cuttings">
              {cuttings.map((c) => (
                <figure key={c.id} className="ca-cutting">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt={c.headline} loading="lazy" />
                  <figcaption><strong>{c.headline}</strong><span>{c.source} · {c.date}</span></figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="ca-section" aria-labelledby="ca-title">
          {!lead ? (
            <p className="ca-empty"><HiText en="Nothing here yet. New pieces appear as the news gives reason to write them." hi="अभी यहाँ कुछ नहीं है। जब ख़बरें लिखने का कारण देंगी, नए लेख यहाँ आएँगे।" /></p>
          ) : (
            <>
              <Link href={`/posts/${lead.slug}`} className="ca-lead">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {lead.cover ? <img src={lead.cover} alt="" className="ca-cover" /> : <span className="ca-cover" aria-hidden="true" />}
                <span className="ca-lead-text">
                  <Meta p={lead} />
                  <Title p={lead} />
                  <Excerpt p={lead} />
                  <span className="ca-read"><HiText en="Read it" hi="पढ़ें" /> <Arrow /></span>
                </span>
              </Link>
              {rest.length > 0 && (
                <div className="ca-grid">
                  {rest.map((p) => (
                    <Link key={p.id} href={`/posts/${p.slug}`} className="ca-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.cover ? <img src={p.cover} alt="" className="ca-cover" loading="lazy" /> : <span className="ca-cover" aria-hidden="true" />}
                      <Meta p={p} />
                      <Title p={p} />
                      <Excerpt p={p} />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {notes.length > 0 && (
          <section className="ca-section" aria-labelledby="ca-notes">
            <h2 id="ca-notes" className="ca-h2"><HiText en="New in the notes" hi="नोट्स में नया" /></h2>
            <div className="ca-grid">
              {notes.map((p) => (
                <Link key={p.id} href={`/posts/${p.slug}`} className="ca-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.cover ? <img src={p.cover} alt="" className="ca-cover" loading="lazy" /> : null}
                  <Meta p={p} />
                  <Title p={p} />
                  <Excerpt p={p} />
                </Link>
              ))}
            </div>
          </section>
        )}
        <AdminToolsSlot />
      </div>
    </div>
  );
}
