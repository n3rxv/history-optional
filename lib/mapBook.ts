import { bookData } from '@/lib/bookData';
import { indiaGeoJSON } from '@/lib/indiaGeoJSON';

/**
 * The map book, cut to what /mapping needs.
 *
 * bookData is a megabyte, and the page imported all of it into the browser:
 * every site in both languages, though a reader sees one, and before they had
 * opened a single chapter. The page now gets a small index of the chapters
 * from the server, and the sites come from /api/map-book/[lang], built once
 * at build time and served as a static file, in the reader's language only.
 */

export type MapSite = {
  /** The English name; the site's id across languages. */
  name: string;
  /** The name to show, in the reader's language. */
  label: string;
  place: string;
  about: string;
  /** The years UPSC asked it in the map question. */
  asked: number[];
  lat: number;
  lng: number;
  /** The state or country, in English, for the chapter's filter. */
  region: string;
};

export type MapChapterSites = { key: string; sites: MapSite[] };

export type MapChapter = {
  key: string;
  number: number;
  topic: string;
  topicHi?: string;
  part: string;
  count: number;
  asked: number;
};

const INTRO = 'Introduction & How to Use';

const REGIONS = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu', 'Kashmir', 'Ladakh', 'Puducherry', 'Andaman', 'Lakshadweep', 'Chandigarh', 'Harappa', 'Pakistan', 'Afghanistan', 'Bangladesh', 'Nepal', 'Sri Lanka', 'Myanmar', 'Iran', 'Uzbekistan'];

function regionOf(location: string): string {
  if (!location) return 'Other';
  const loc = location.toLowerCase();
  const hit = REGIONS.find((r) => loc.includes(r.toLowerCase()));
  if (hit) return hit;
  const parts = location.split(',');
  return parts[parts.length - 1].trim() || 'Other';
}

const chapters = bookData.map((c, i) => ({ c, key: String(i) })).filter(({ c }) => c.topic !== INTRO);

export function mapChapters(): MapChapter[] {
  return chapters.map(({ c, key }) => ({
    key, number: c.chapter, topic: c.topic, topicHi: c.topic_hi, part: c.part,
    count: c.sites.length, asked: c.sites.filter((s) => s.pyqYears?.length).length,
  }));
}

export const mapSiteCount = () => chapters.reduce((n, { c }) => n + c.sites.length, 0);

export function mapBook(lang: 'en' | 'hi'): MapChapterSites[] {
  const hi = lang === 'hi';
  return chapters.map(({ c, key }) => ({
    key,
    sites: c.sites.filter((s) => s.lat != null && s.lng != null).map((s) => ({
      name: s.name,
      label: (hi && s.name_hi) || s.name,
      place: (hi && s.location_hi) || s.location,
      about: (hi && s.majorAspect_hi) || s.majorAspect,
      asked: s.pyqYears ?? [],
      lat: s.lat as number,
      lng: s.lng as number,
      region: regionOf(s.location),
    })),
  }));
}

type Ring = number[][];
type Feature = { type: 'Feature'; properties: { name: string }; geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: Ring[] | Ring[][] } };

/**
 * The outline map behind "No boundaries" and the quiz: the countries around
 * India, cut from a world file. The whole world was 917 KB; the region, polygon
 * by polygon (so France's islands and Russia's far east drop out), is a
 * quarter of that.
 */
export function mapOutline() {
  const [w, s, e, n] = [50, 0, 110, 45];
  const near = (poly: Ring[]) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const ring of poly) for (const [x, y] of ring) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return !(x1 < w || x0 > e || y1 < s || y0 > n);
  };
  const features = (indiaGeoJSON.features as unknown as Feature[]).flatMap((f) => {
    const polys = f.geometry.type === 'MultiPolygon' ? (f.geometry.coordinates as Ring[][]) : [f.geometry.coordinates as Ring[]];
    const kept = polys.filter(near);
    return kept.length ? [{ type: 'Feature' as const, properties: f.properties, geometry: { type: 'MultiPolygon' as const, coordinates: kept } }] : [];
  });
  return { type: 'FeatureCollection' as const, features };
}
