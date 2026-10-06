import sanitizeHtmlLib from 'sanitize-html';
import { createServerClient } from '@/lib/supabase';

/**
 * Current-affairs posts, read on the server.
 *
 * Each post keeps its cover as a data URL in the row, a few hundred KB of
 * base64. The list route returned every column of every post, covers and
 * bodies, to every visitor's browser. Pages now read only what they show, and
 * covers are served as images from /api/posts/cover/[id], cached at the edge
 * for a week under a version that changes when the post does.
 */

export type PostCard = {
  id: string;
  slug: string;
  type: 'current-affairs' | 'new-note';
  title: string;
  excerpt: string;
  tags: string[];
  publishedAt: string;
  cover: string | null;
};

export type Post = PostCard & { content: string };

const coverUrl = (id: string, updatedAt: string | null, hasCover: boolean) =>
  hasCover ? `/api/posts/cover/${encodeURIComponent(id)}?v=${updatedAt ? Date.parse(updatedAt) : 0}` : null;

type Row = { id: string; slug: string | null; type: PostCard['type']; title: string; excerpt: string | null; tags: string[] | null; published_at: string; updated_at: string | null; has_cover?: boolean; cover_image?: string | null; content?: string };

const toCard = (r: Row): PostCard => ({
  id: r.id, slug: r.slug || r.id, type: r.type, title: r.title, excerpt: r.excerpt ?? '', tags: r.tags ?? [], publishedAt: r.published_at,
  cover: coverUrl(r.id, r.updated_at, Boolean(r.has_cover ?? r.cover_image)),
});

export async function listPosts(): Promise<PostCard[]> {
  const db = createServerClient();
  // The cover column is never selected here; which posts have none comes
  // from a second, tiny query, so the base64 stays in the database.
  const [list, bare] = await Promise.all([
    db.from('posts').select('id, slug, type, title, excerpt, tags, published_at, updated_at').eq('published', true).order('published_at', { ascending: false }),
    db.from('posts').select('id').eq('published', true).or('cover_image.is.null,cover_image.eq.'),
  ]);
  if (list.error) throw new Error(list.error.message);
  const without = new Set((bare.data ?? []).map((r) => r.id as string));
  return (list.data ?? []).map((r) => toCard({ ...(r as Row), has_cover: !without.has((r as Row).id) }));
}

export async function getPost(slug: string): Promise<Post | null> {
  const db = createServerClient();
  // Matched by slug, or by id for posts saved before slugs existed.
  const safe = slug.replace(/[^a-z0-9_-]/gi, '');
  if (!safe) return null;
  const { data } = await db.from('posts')
    .select('id, slug, type, title, excerpt, tags, published_at, updated_at, content')
    .eq('published', true).or(`slug.eq.${safe},id.eq.${safe}`).limit(1).maybeSingle();
  if (!data) return null;
  const row = data as Row;
  const { data: bare } = await db.from('posts').select('id').eq('id', row.id).or('cover_image.is.null,cover_image.eq.').maybeSingle();
  return { ...toCard({ ...row, has_cover: !bare }), content: sanitizePostHtml(row.content ?? '') };
}

/** The cover as bytes, for the image route. */
export async function getCover(id: string): Promise<{ type: string; bytes: Buffer } | null> {
  const db = createServerClient();
  const { data } = await db.from('posts').select('cover_image').eq('id', id).eq('published', true).maybeSingle();
  const m = (data?.cover_image as string | null | undefined)?.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  return m ? { type: m[1], bytes: Buffer.from(m[2], 'base64') } : null;
}

/**
 * Admin-written post HTML, cleaned on the server before it is rendered: the
 * note rules, plus the YouTube embeds the post editor can insert.
 */
export function sanitizePostHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'p', 'div', 'span', 'br', 'hr', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small', 'blockquote', 'q', 'cite', 'code', 'pre', 'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe'],
    allowedAttributes: {
      '*': ['class'],
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      iframe: ['src', 'allowfullscreen', 'frameborder', 'title'],
      td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan', 'scope'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com'],
    nonTextTags: ['script', 'style', 'textarea', 'noscript', 'object', 'embed'],
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: attribs.target ? { ...attribs, rel: 'noopener noreferrer' } : attribs }),
      iframe: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
    },
  });
}

export type Cutting = { id: string; headline: string; source: string; date: string; image: string; tag?: string };

/** The newspaper cuttings the owner pins on /current-affairs, if any. */
export async function loadCuttings(): Promise<Cutting[]> {
  const db = createServerClient();
  const { data } = await db.from('site_config').select('value').eq('key', 'newspaper_cuttings').maybeSingle();
  try { return data?.value ? (JSON.parse(data.value as string) as Cutting[]) : []; } catch { return []; }
}
