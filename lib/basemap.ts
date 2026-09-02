/**
 * Basemap tile source.
 *
 * CARTO retired keyless raster basemaps: without a valid key every tile comes
 * back stamped "API KEY REQUIRED" as a normal HTTP 200 image, so there is no
 * error to catch — a bad key looks exactly like no key. We therefore only point
 * at CARTO when a key is actually configured, and otherwise fall back to Esri's
 * keyless canvas so the maps always render something clean.
 *
 * Free CARTO key (5M tile requests/month, no account needed):
 *   https://carto.com/basemaps/apikey/
 * Set it as NEXT_PUBLIC_CARTO_KEY. Next.js inlines NEXT_PUBLIC_* at build time,
 * so adding it to Vercel requires a redeploy to take effect.
 *
 * Note: CARTO has said raster basemaps are being retired in favour of vector
 * tiles, so this key buys time rather than a permanent fix.
 */

export type Basemap = {
  url: string;
  attribution: string;
  maxNativeZoom: number;
  /** CARTO's free tier requires CARTO + OSM attribution to stay visible. */
  requireVisibleAttribution: boolean;
};

const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY;

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const ESRI: Basemap = {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
  maxNativeZoom: 16,
  requireVisibleAttribution: false,
};

function carto(stylePath: string): Basemap {
  return {
    url: `https://basemaps.cartocdn.com/${stylePath}/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
    attribution: CARTO_ATTRIBUTION,
    maxNativeZoom: 20,
    requireVisibleAttribution: true,
  };
}

export const usingCarto = Boolean(CARTO_KEY);

/** /mapping book map — no labels, since we draw our own state boundaries on top. */
export const bookBasemap: Basemap = CARTO_KEY ? carto('rastertiles/voyager_nolabels') : ESRI;

/** Map quiz — keeps CARTO's place labels. */
export const quizBasemap: Basemap = CARTO_KEY ? carto('light_all') : ESRI;
