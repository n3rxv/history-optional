import { createClient } from '@supabase/supabase-js';

/**
 * Free-tier metering, backed by consume_usage/release_usage in
 * supabase/usage_counters.sql.
 *
 * Replaces the select-then-update pairs the routes used to do. Those read the
 * count, did the paid work, then wrote count+1 — so concurrent requests all
 * read the same starting value and all passed the check. The limit was
 * bypassable by firing requests in parallel.
 *
 * Order matters: consume BEFORE the work, refund if the work fails. Metering
 * after the work is what created the race in the first place.
 */

export type UsageField = 'eval_count' | 'chat_count' | 'topper_clicks';

export type ConsumeResult = {
  allowed: boolean;
  used: number;
  /** True when the database could not be reached. */
  degraded: boolean;
};

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Claims one unit of the caller's free allowance.
 *
 * Fails closed: these gate spend on paid LLM calls, so a database outage must
 * not turn the free tier unlimited. That is the opposite of lib/rateLimit,
 * where failing open is right because the cost of a false block is a broken
 * page rather than an unbounded bill.
 */
export async function consumeUsage(
  uid: string | null,
  fingerprint: string | null,
  field: UsageField,
  limit: number
): Promise<ConsumeResult> {
  try {
    const { data, error } = await db().rpc('consume_usage', {
      p_uid: uid ?? '',
      p_fp: fingerprint ?? '',
      p_field: field,
      p_limit: limit,
    });

    if (error) {
      // Most likely cause is supabase/usage_counters.sql never having been run.
      console.error(`[usageQuota] consume ${field} failed:`, error.message);
      return { allowed: false, used: 0, degraded: true };
    }

    // The function returns a single row via `returns table`.
    const row = Array.isArray(data) ? data[0] : data;
    return { allowed: row?.allowed === true, used: row?.used ?? 0, degraded: false };
  } catch (e) {
    console.error(`[usageQuota] consume ${field} unreachable:`, e);
    return { allowed: false, used: 0, degraded: true };
  }
}

/** Gives back a unit claimed by consumeUsage when the work it paid for failed. */
export async function releaseUsage(
  uid: string | null,
  fingerprint: string | null,
  field: UsageField
): Promise<void> {
  try {
    const { error } = await db().rpc('release_usage', {
      p_uid: uid ?? '',
      p_fp: fingerprint ?? '',
      p_field: field,
    });
    if (error) console.error(`[usageQuota] release ${field} failed:`, error.message);
  } catch (e) {
    console.error(`[usageQuota] release ${field} unreachable:`, e);
  }
}
