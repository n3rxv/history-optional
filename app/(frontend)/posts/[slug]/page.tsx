import type { Metadata } from 'next';
import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import { getPost, listPosts, sanitizePostHtml } from '@/lib/posts';
import { PO_CSS } from '@/components/currentAffairs/styles';
import { HiText } from '@/components/ui/HiText';
import { POST_HI } from '@/lib/postsHi';

/**
 * A current-affairs post, rendered on the server and kept for an hour, or
 * rebuilt at once when the owner saves it. The body is cleaned on the server
 * (lib/posts.ts) before it is rendered. It used to be fetched in the browser,
 * cover and all, after the page had loaded.
 */
export const revalidate = 3600;
export function generateStaticParams() { return []; }

const fmt = (iso: string, locale = 'en-IN') => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
/** A date in both languages, drawn on the server. */
const Day = ({ iso }: { iso: string }) => <HiText en={fmt(iso)} hi={fmt(iso, 'hi-IN')} />;
/**
 * A post's own words: the English from the database, and in Hindi mode the
 * translation from lib/postsHi.ts when there is one for the post.
 */
const T = ({ en, hi }: { en: string; hi?: string }) => (hi ? <HiText en={en} hi={hi} /> : <>{en}</>);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: 'Post not found' };
  return {
    // The site's template adds " | History Optional".
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { canonical: `https://historyoptional.xyz/posts/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt || undefined, type: 'article', url: `https://historyoptional.xyz/posts/${post.slug}` },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const more = (await listPosts().catch(() => [])).filter((p) => p.id !== post.id).slice(0, 3);
  const hi = POST_HI[post.slug];
  // The Hindi body is cleaned exactly as the English one is in getPost.
  const hiContent = hi?.content ? sanitizePostHtml(hi.content) : '';
  const prose = (html: string) => <div className="po-prose" dangerouslySetInnerHTML={{ __html: html }} />;
  const tags = (list: string[]) => list.map((t) => <span key={t} className="po-tag">{t}</span>);

  return (
    <div className="po ds">
      <style dangerouslySetInnerHTML={{ __html: PO_CSS }} />
      <article className="ds-container po-wrap">
        <Link href="/current-affairs" className="po-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          <HiText en="Current affairs" hi="समसामयिकी" />
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {post.cover && <img src={post.cover} alt="" className="po-cover" />}
        <div className="po-meta">
          <time dateTime={post.publishedAt}><Day iso={post.publishedAt} /></time>
          {hi?.tags?.length ? <HiText en={tags(post.tags)} hi={tags(hi.tags)} /> : tags(post.tags)}
        </div>
        <h1 className="po-h1"><T en={post.title} hi={hi?.title} /></h1>
        {post.excerpt && <p className="po-lede"><T en={post.excerpt} hi={hi?.excerpt} /></p>}
        {hiContent ? <HiText en={prose(post.content)} hi={prose(hiContent)} /> : prose(post.content)}

        {more.length > 0 && (
          <section className="po-more" aria-labelledby="po-more">
            <h2 id="po-more"><HiText en="More current affairs" hi="और समसामयिकी" /></h2>
            <div className="po-more-list">
              {more.map((p) => (
                <Link key={p.id} href={`/posts/${p.slug}`} className="po-more-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.cover ? <img src={p.cover} alt="" loading="lazy" /> : <span />}
                  <span><strong><T en={p.title} hi={POST_HI[p.slug]?.title} /></strong><span><Day iso={p.publishedAt} /></span></span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
