import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost, listPosts } from '@/lib/posts';
import { PostAdminSlot } from '@/components/currentAffairs/AdminSlot';
import { PO_CSS } from '@/components/currentAffairs/styles';

/**
 * A current-affairs post, rendered on the server and kept for an hour, or
 * rebuilt at once when the owner saves it. The body is cleaned on the server
 * (lib/posts.ts) before it is rendered. It used to be fetched in the browser,
 * cover and all, after the page had loaded.
 */
export const revalidate = 3600;
export function generateStaticParams() { return []; }

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

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

  return (
    <div className="po ds">
      <style dangerouslySetInnerHTML={{ __html: PO_CSS }} />
      <article className="ds-container po-wrap">
        <Link href="/current-affairs" className="po-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          Current affairs
        </Link>
        <PostAdminSlot slug={post.slug} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {post.cover && <img src={post.cover} alt="" className="po-cover" />}
        <div className="po-meta">
          <time dateTime={post.publishedAt}>{fmt(post.publishedAt)}</time>
          {post.tags.map((t) => <span key={t} className="po-tag">{t}</span>)}
        </div>
        <h1 className="po-h1">{post.title}</h1>
        {post.excerpt && <p className="po-lede">{post.excerpt}</p>}
        <div className="po-prose" dangerouslySetInnerHTML={{ __html: post.content }} />

        {more.length > 0 && (
          <section className="po-more" aria-labelledby="po-more">
            <h2 id="po-more">More current affairs</h2>
            <div className="po-more-list">
              {more.map((p) => (
                <Link key={p.id} href={`/posts/${p.slug}`} className="po-more-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.cover ? <img src={p.cover} alt="" loading="lazy" /> : <span />}
                  <span><strong>{p.title}</strong><span>{fmt(p.publishedAt)}</span></span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
