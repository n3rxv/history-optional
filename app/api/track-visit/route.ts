import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Analytics pings. The highest-traffic endpoint in the app, so it does exactly
 * one database round trip and nothing else.
 *
 * It used to run a SELECT, mutate the row in JavaScript, then write the whole
 * row back — two round trips per pageview, three when merging an old
 * fingerprint. That also raced: concurrent pageviews both read "no row" and
 * both inserted, which is how one visitor ended up holding two rows with their
 * visits split between them. All the logic now lives in record_visit; see
 * supabase/track_visit.sql.
 */

const BOT_UA =
  /bot|crawler|spider|crawling|googlebot|bingbot|ahrefsbot|semrushbot|mj12bot|dotbot|rogerbot|facebookexternalhit|python|curl|wget|axios|node-fetch|go-http-client|java|ruby|scrapy/i;

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

/** Heartbeat: refresh last_active and recompute the session duration. */
export async function PATCH(req: NextRequest) {
  try {
    if (BOT_UA.test(req.headers.get('user-agent') ?? '')) {
      return NextResponse.json({ ok: false, reason: 'bot' });
    }
    const { visitor_id } = await req.json();
    const visitorId = field(visitor_id, 128);
    if (!visitorId) return NextResponse.json({ ok: false });

    await db().rpc('touch_visit', { p_visitor_id: visitorId });
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

    const body = await req.json();
    const visitorId = field(body.visitor_id, 128);
    if (!visitorId) return NextResponse.json({ ok: false, reason: 'no visitor_id' });

    if (isRateLimited(visitorId)) {
      return NextResponse.json({ ok: false, reason: 'rate_limited' });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json({ ok: false, reason: 'missing env' });
    }

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
