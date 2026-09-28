import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Who may see a flashcard's answer.
 *
 * Fronts are free and public. Answers are metered: a reader may open any
 * hundred of them, whichever hundred they pick, and after that they are
 * premium. The quota is a set of cards rather than a count, so re-opening one
 * you have already unlocked is free forever -- see supabase/flashcard_unlocks.sql
 * for why that distinction matters to spaced repetition.
 *
 * An account is required before any answer is served. The study page already
 * asks for one before it will open a card, but that is a client-side check and
 * the route has to hold the same line on its own -- a request with a
 * fingerprint and no token was being served answers.
 *
 * The fingerprint is still metered alongside the account, which is what stops
 * the obvious way round the wall: signing up again on the same device finds
 * the allowance already spent, because a reader is whoever matches either
 * identity and the count is over the union of both. That is the same rule
 * usage_tracking uses everywhere else in the app.
 */

export const FREE_FLASHCARD_LIMIT = 100;

export type FlashcardReader = {
  uid: string | null;
  fingerprint: string | null;
  /** Owner or active subscriber: no metering at all. */
  unlimited: boolean;
  /** A verified account. Without one, no answer is served at any price. */
  signedIn: boolean;
};

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function resolveReader(req: NextRequest): Promise<FlashcardReader> {
  const token = req.headers.get('x-user-token') ?? '';
  const fingerprint = req.headers.get('x-fingerprint') || null;

  let uid: string | null = null;
  let isOwner = false;

  if (token) {
    try {
      const { verifyFirebaseToken } = await import('@/lib/verifyFirebaseToken');
      const user = await verifyFirebaseToken(token);
      if (user) {
        uid = user.uid;
        if (user.email && user.email === process.env.OWNER_EMAIL) isOwner = true;
      }
    } catch {
      // An unverifiable token is anonymous, not an error.
    }
  }

  if (isOwner) return { uid, fingerprint, unlimited: true, signedIn: true };

  if (uid) {
    const { data: sub } = await db()
      .from('subscriptions')
      .select('status')
      .eq('firebase_uid', uid)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (sub) return { uid, fingerprint, unlimited: true, signedIn: true };
  }

  return { uid, fingerprint, unlimited: false, signedIn: uid !== null };
}

export type UnlockOutcome = {
  /** Ids the reader may see the answer to. */
  granted: string[];
  /** Ids refused because the allowance is gone. */
  locked: string[];
  /** How many of the allowance are spent, after this call. */
  used: number;
  /** True when the database could not be reached. */
  degraded: boolean;
};

/**
 * Which of `ids` has this reader already unlocked, and how many have they
 * spent? Writes nothing.
 *
 * This is what the prefetch uses. The window it pulls is ahead of the reader,
 * who has not chosen those cards yet, so it must not spend anything -- but
 * answers already paid for should arrive with the card rather than after
 * another round trip.
 */
export async function readUnlocks(
  reader: FlashcardReader,
  ids: string[],
): Promise<UnlockOutcome> {
  if (!reader.uid && !reader.fingerprint) {
    return { granted: [], locked: ids, used: 0, degraded: false };
  }
  try {
    const { data, error } = await db().rpc('flashcard_unlock_status', {
      p_uid: reader.uid ?? '',
      p_fp: reader.fingerprint ?? '',
      p_ids: ids.length ? ids : null,
    });
    if (error) {
      console.error('[flashcardAccess] status failed:', error.message);
      return { granted: [], locked: ids, used: 0, degraded: true };
    }
    const row = (Array.isArray(data) ? data[0] : data) as
      | { out_ids: string[] | null; out_used: number }
      | undefined;
    const granted = row?.out_ids ?? [];
    const owned = new Set(granted);
    return {
      granted,
      locked: ids.filter((id) => !owned.has(id)),
      used: row?.out_used ?? 0,
      degraded: false,
    };
  } catch (e) {
    console.error('[flashcardAccess] status unreachable:', e);
    return { granted: [], locked: ids, used: 0, degraded: true };
  }
}

/**
 * Claims allowance for `ids` that are not already unlocked.
 *
 * Fails closed. A database outage must not turn the free tier unlimited, which
 * is the same choice lib/usageQuota.ts makes and for the same reason: the cost
 * of a false refusal is a reader seeing a paywall for a few minutes, and the
 * cost of a false grant is the paid half of the product being free.
 */
export async function spendUnlocks(
  reader: FlashcardReader,
  ids: string[],
): Promise<UnlockOutcome> {
  if (!ids.length) return { granted: [], locked: [], used: 0, degraded: false };
  if (!reader.uid && !reader.fingerprint) {
    return { granted: [], locked: ids, used: 0, degraded: false };
  }
  try {
    const { data, error } = await db().rpc('unlock_flashcards', {
      p_uid: reader.uid ?? '',
      p_fp: reader.fingerprint ?? '',
      p_ids: ids,
      p_limit: FREE_FLASHCARD_LIMIT,
    });
    if (error) {
      // Most likely cause is supabase/flashcard_unlocks.sql never having been run.
      console.error('[flashcardAccess] unlock failed:', error.message);
      return { granted: [], locked: ids, used: 0, degraded: true };
    }
    const rows = (data ?? []) as {
      out_card_id: string;
      out_granted: boolean;
      out_used: number;
    }[];
    const granted = rows.filter((r) => r.out_granted).map((r) => r.out_card_id);
    const locked = rows.filter((r) => !r.out_granted).map((r) => r.out_card_id);
    // The count comes back from the same statement that did the spending, so
    // it is the figure after this call and costs no second round trip.
    return { granted, locked, used: rows[rows.length - 1]?.out_used ?? 0, degraded: false };
  } catch (e) {
    console.error('[flashcardAccess] unlock unreachable:', e);
    return { granted: [], locked: ids, used: 0, degraded: true };
  }
}
