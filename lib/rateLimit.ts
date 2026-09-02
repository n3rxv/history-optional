import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Durable rate limiting, backed by the rate_limits table and the
 * check_rate_limit function in supabase/rate_limits.sql.
 *
 * Replaces the module-level Maps the routes used to count with. Those were
 * per-lambda-instance on Vercel, so a caller spreading requests across
 * instances was never actually limited.
 */

export type RateLimitOptions = {
  /** Requests permitted per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /**
   * What to do when the database cannot be reached.
   *
   * Defaults to failing open: a database blip should not take the whole site
   * down. Security controls (admin login) must pass true, because failing open
   * there would hand an attacker unlimited guesses during an outage.
   */
  failClosed?: boolean;
};

export type RateLimitResult = {
  allowed: boolean;
  /** True when the limiter could not consult the database. */
  degraded: boolean;
};

export async function checkRateLimit(
  key: string,
  { limit, windowSeconds, failClosed = false }: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      // Most likely cause is supabase/rate_limits.sql never having been run.
      console.error(`[rateLimit] ${key}: RPC failed (${error.message})`);
      return { allowed: !failClosed, degraded: true };
    }
    return { allowed: data === true, degraded: false };
  } catch (e) {
    console.error(`[rateLimit] ${key}: unreachable`, e);
    return { allowed: !failClosed, degraded: true };
  }
}

/**
 * Clears a key's counter. Used where a success should forgive earlier
 * failures, e.g. a correct admin password resetting the attempt count.
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    await supabase.from('rate_limits').delete().eq('key', key);
  } catch (e) {
    console.error(`[rateLimit] ${key}: reset failed`, e);
  }
}

/** Best-available caller identity. Vercel sets x-forwarded-for. */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export function tooManyRequests() {
  return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
}
