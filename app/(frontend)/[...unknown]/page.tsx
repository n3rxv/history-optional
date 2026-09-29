import { notFound } from 'next/navigation';

/**
 * Any URL no route claims lands here and is handed to not-found.tsx beside
 * the layout. The site and the CMS are separate root layouts, so Next has no
 * single place to render a 404 for an unmatched URL and falls back to its own
 * unstyled page; routing the unmatched ones through this group gives them the
 * site's navbar, theme and owl instead. Every real route, /cms and /api
 * included, is more specific than a catch-all and still wins.
 */
export default function Unknown() {
  notFound();
}
