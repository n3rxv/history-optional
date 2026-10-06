import { mapBook } from '@/lib/mapBook';

/**
 * The map book's sites in one language, built at build time and served as a
 * static file: /mapping fetches it rather than bundling every site, in both
 * languages, into the page.
 */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'hi' }];
}

export async function GET(_req: Request, { params }: RouteContext<'/api/map-book/[lang]'>) {
  const { lang } = await params;
  return Response.json(mapBook(lang === 'hi' ? 'hi' : 'en'));
}
