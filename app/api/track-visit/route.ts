import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Analytics pings. The highest-traffic endpoint in the app, so it does one
 * database round trip per pageview and nothing else.
 *
 * It used to run a SELECT, mutate the row in JavaScript, then write the whole
 * row back — two round trips per pageview, three when merging an old
 * fingerprint. That also raced: concurrent pageviews both read "no row" and
 * both inserted, which is how one visitor ended up holding two rows with their
 * visits split between them. All the logic now lives in record_visit; see
 * supabase/track_visit.sql.
 */

const BOT_UA =
  /bot|crawler|spider|crawling|headlesschrome|googlebot|bingbot|ahrefsbot|semrushbot|mj12bot|dotbot|rogerbot|facebookexternalhit|python|curl|wget|axios|node-fetch|go-http-client|java|ruby|scrapy/i;

// Deliberately in-memory rather than the durable limiter in lib/rateLimit.
// This only suppresses duplicate pings, and a database round trip to decide
// whether to skip a single-statement write would cost more than it saves.
// Per-instance dedup is adequate for that.
const RATE_LIMIT_WINDOW = 10_000;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_MAX_KEYS = 10_000;
const recentPings = new Map<string, number[]>();

function isRateLimited(visitorId: string): boolean {
  const now = Date.now();
  const recent = (recentPings.get(visitorId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) {
    recentPings.set(visitorId, recent);
    return true;
  }
  recent.push(now);
  recentPings.set(visitorId, recent);

  // Map iteration order is insertion order, so the oldest keys go first. The
  // previous version deleted a single key per request once over the cap, which
  // could not keep up with a burst.
  if (recentPings.size > RATE_LIMIT_MAX_KEYS) {
    let toDrop = recentPings.size - RATE_LIMIT_MAX_KEYS;
    for (const key of recentPings.keys()) {
      recentPings.delete(key);
      if (--toDrop <= 0) break;
    }
  }
  return false;
}

/**
 * Only visits from India are recorded. The country is Vercel's reading of the
 * visitor's IP; a request without one is not recorded either, which also keeps
 * local development out of the table.
 */
const RECORDED_COUNTRY = 'IN';
const fromIndia = (req: NextRequest) => req.headers.get('x-vercel-ip-country') === RECORDED_COUNTRY;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Caps anything the browser supplies before it reaches a row. */
function field(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || null;
}

/** The most pages one beat may carry; the tracker queues no more than this. */
const MAX_BEAT_PAGES = 20;

/**
 * Heartbeat: refresh last_active and the session (supabase/real_sessions.sql).
 * It also carries the pages opened since the tracker's last call, which wait
 * for a beat rather than costing a call each (components/VisitorTracker.tsx).
 * Each is recorded as a pageview, and record_visit refreshes the session as
 * touch_visit would.
 */
export async function PATCH(req: NextRequest) {
  try {
    if (BOT_UA.test(req.headers.get('user-agent') ?? '')) {
      return NextResponse.json({ ok: false, reason: 'bot' });
    }
    if (!fromIndia(req)) return NextResponse.json({ ok: false, reason: 'outside_india' });
    const body = await req.json();
    const visitorId = field(body.visitor_id, 128);
    if (!visitorId) return NextResponse.json({ ok: false });

    const pages = (Array.isArray(body.pages) ? body.pages : [])
      .slice(0, MAX_BEAT_PAGES)
      .map((p: unknown) => field(p, 512))
      .filter((p: string | null): p is string => Boolean(p));
    const supabase = db();
    if (!pages.length) {
      await supabase.rpc('touch_visit', { p_visitor_id: visitorId });
      return NextResponse.json({ ok: true });
    }

    // A database call per page, so the same guard as a pageview.
    if (isRateLimited(visitorId)) return NextResponse.json({ ok: false, reason: 'rate_limited' });

    const country = req.headers.get('x-vercel-ip-country') || null;
    const city = decodeURIComponent(req.headers.get('x-vercel-ip-city') || '') || null;
    // In order, so the last page read is the one left as the exit page.
    for (const page of pages) {
      const { error } = await supabase.rpc('record_visit', {
        p_visitor_id: visitorId,
        p_page: page,
        p_device: field(body.device, 32),
        p_os: field(body.os, 32),
        p_browser: field(body.browser, 32),
        p_country: country,
        p_city: city,
        p_firebase_uid: field(body.firebase_uid, 128),
      });
      if (error) {
        console.error('[track-visit] record_visit failed:', error.message);
        return NextResponse.json({ ok: false, reason: 'rpc error' });
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (BOT_UA.test(req.headers.get('user-agent') ?? '')) {
      return NextResponse.json({ ok: false, reason: 'bot' });
    }
    if (!fromIndia(req)) return NextResponse.json({ ok: false, reason: 'outside_india' });

    const body = await req.json();
    const visitorId = field(body.visitor_id, 128);
    if (!visitorId) return NextResponse.json({ ok: false, reason: 'no visitor_id' });

    if (isRateLimited(visitorId)) {
      return NextResponse.json({ ok: false, reason: 'rate_limited' });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json({ ok: false, reason: 'missing env' });
    }

    // A first visit carries the seconds the visitor had already spent. Under a
    // second is someone who bounced straight off, and that is not a visit.
    const first = body.first === true;
    const dwell = typeof body.dwell === 'number' && Number.isFinite(body.dwell)
      ? Math.min(Math.max(Math.floor(body.dwell), 0), 3600)
      : 0;
    if (first && dwell < 1) return NextResponse.json({ ok: false, reason: 'too_short' });

    const supabase = db();

    // One-off, only sent while a visitor is still carrying a pre-FingerprintJS
    // id. Runs before the visit so the merged row is the one recorded against.
    const oldFp = field(body.old_fp, 128);
    if (oldFp) {
      await supabase.rpc('merge_visitor', { p_old_id: oldFp, p_new_id: visitorId });
    }

    const { error } = await supabase.rpc('record_visit', {
      p_visitor_id: visitorId,
      p_page: field(body.page, 512),
      p_referrer: field(body.referrer, 512),
      p_device: field(body.device, 32),
      p_os: field(body.os, 32),
      p_browser: field(body.browser, 32),
      p_country: req.headers.get('x-vercel-ip-country') || null,
      p_city: decodeURIComponent(req.headers.get('x-vercel-ip-city') || '') || null,
      p_firebase_uid: field(body.firebase_uid, 128),
      // A first visit's time before its ping. record_visit starts the row, or
      // the session, that much earlier, in whichever order this and the next
      // pageview arrive (supabase/real_sessions.sql).
      p_dwell: first ? dwell : 0,
    });

    if (error) {
      // Most likely cause is supabase/track_visit.sql never having been run.
      console.error('[track-visit] record_visit failed:', error.message);
      return NextResponse.json({ ok: false, reason: 'rpc error' });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: 'exception', error: (e as Error).message });
  }
}
