import MapBrowser from '@/components/mapping/MapBrowser';
import { mapChapters } from '@/lib/mapBook';

/**
 * The map book. The chapter list is all the page itself carries; the sites
 * come from /api/map-book/[lang] when the browser asks, in one language.
 */
export default function MappingPage() {
  return <MapBrowser chapters={mapChapters()} />;
}
