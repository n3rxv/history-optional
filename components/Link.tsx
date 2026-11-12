import NextLink from 'next/link';
import type { ComponentProps } from 'react';

/**
 * next/link that never prefetches. Every page imports this in place of
 * next/link.
 *
 * By default each <Link> in view prefetches its page, and every request counts
 * against Vercel's CDN allowance; here each one also runs middleware.ts. On
 * 2026-11-13 one load of /pyqs made 89 requests, 43 of them prefetches,
 * scrolling the list prefetched 43 more, and a reload made them all again.
 * Prefetching on hover costs about six requests a link, against one for a
 * plain click.
 */
export default function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink {...props} prefetch={false} />;
}
