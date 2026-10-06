import { getCover } from '@/lib/posts';

/**
 * A post's cover as an image. The ?v= in the URL changes whenever the post is
 * saved, so the edge may keep each version for a week: the base64 leaves
 * Supabase once per version and region, not once per visit.
 */
export async function GET(_req: Request, { params }: RouteContext<'/api/posts/cover/[id]'>) {
  const { id } = await params;
  const cover = await getCover(id);
  if (!cover) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' } });
  return new Response(new Uint8Array(cover.bytes), {
    headers: {
      'Content-Type': cover.type,
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
    },
  });
}
