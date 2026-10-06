import Link from 'next/link';
import { listPosts, loadCuttings, type PostCard } from '@/lib/posts';
import { AdminToolsSlot } from '@/components/currentAffairs/AdminSlot';
import { CA_CSS } from '@/components/currentAffairs/styles';

/**
 * Current affairs, rendered on the server and rebuilt hourly, or at once when
 * the owner saves a post or a cutting. The list used to be fetched in every
 * reader's browser, every post's body and base64 cover included.
 */
export const revalidate = 3600;

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

function Meta({ p }: { p: PostCard }) {
  return (
    <span className="ca-meta">
      <time dateTime={p.publishedAt}>{fmt(p.publishedAt)}</time>
      {p.tags.slice(0, 2).map((t) => <span key={t} className="ca-tag">{t}</span>)}
    </span>
  );
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
          <h1 className="ds-h1 ca-h1">Current affairs</h1>
          <p className="ds-lede ca-lede">History in the news, like a new excavation or an anniversary, and how you can use it in your answers.</p>
        </div>
      </header>
      <div className="ds-container">
        {cuttings.length > 0 && (
          <section className="ca-section" aria-labelledby="ca-cut">
            <h2 id="ca-cut" className="ca-h2">From the papers</h2>
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

        <section className="ca-section" aria-label="Current affairs">
          {!lead ? (
            <p className="ca-empty">Nothing here yet. New pieces appear as the news gives reason to write them.</p>
          ) : (
            <>
              <Link href={`/posts/${lead.slug}`} className="ca-lead">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {lead.cover ? <img src={lead.cover} alt="" className="ca-cover" /> : <span className="ca-cover" aria-hidden="true" />}
                <span className="ca-lead-text">
                  <Meta p={lead} />
                  <h2 className="ca-title">{lead.title}</h2>
                  {lead.excerpt && <p className="ca-excerpt">{lead.excerpt}</p>}
                  <span className="ca-read">Read it <Arrow /></span>
                </span>
              </Link>
              {rest.length > 0 && (
                <div className="ca-grid">
                  {rest.map((p) => (
                    <Link key={p.id} href={`/posts/${p.slug}`} className="ca-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.cover ? <img src={p.cover} alt="" className="ca-cover" loading="lazy" /> : <span className="ca-cover" aria-hidden="true" />}
                      <Meta p={p} />
                      <h2 className="ca-title">{p.title}</h2>
                      {p.excerpt && <p className="ca-excerpt">{p.excerpt}</p>}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {notes.length > 0 && (
          <section className="ca-section" aria-labelledby="ca-notes">
            <h2 id="ca-notes" className="ca-h2">New in the notes</h2>
            <div className="ca-grid">
              {notes.map((p) => (
                <Link key={p.id} href={`/posts/${p.slug}`} className="ca-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.cover ? <img src={p.cover} alt="" className="ca-cover" loading="lazy" /> : null}
                  <Meta p={p} />
                  <h2 className="ca-title">{p.title}</h2>
                  {p.excerpt && <p className="ca-excerpt">{p.excerpt}</p>}
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
