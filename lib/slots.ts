import { createClient } from '@supabase/supabase-js';

/**
 * How many subscription slots remain.
 *
 * There were two answers to this. /api/slots counted the subscriptions table
 * live; /api/razorpay/order read subscription_slots.subscribers, a stored
 * counter that nothing in the codebase has ever written. It sat at 1 while
 * seven people were subscribed, so the two routes advertised 38 and 44 slots
 * left on the same page.
 *
 * There is one definition now: count the rows. subscription_slots keeps
 * max_slots, which is configuration, and the stale counter column is dropped
 * in supabase/slots_cleanup.sql so it cannot be read back into service.
 */

const FALLBACK_SLOTS = 45;

export type SlotInfo = { slots: number; subscribers: number; maxSlots: number };

export async function getSlotInfo(): Promise<SlotInfo> {
  const fallback: SlotInfo = { slots: FALLBACK_SLOTS, subscribers: 0, maxSlots: FALLBACK_SLOTS };

  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false } }
    );

    const [{ data: config }, { count, error: countError }] = await Promise.all([
      db.from('subscription_slots').select('max_slots').eq('id', 1).maybeSingle(),
      db
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString()),
    ]);

    if (!config || countError) return fallback;

    const subscribers = count ?? 0;
    const maxSlots = config.max_slots ?? FALLBACK_SLOTS;
    return { slots: Math.max(0, maxSlots - subscribers), subscribers, maxSlots };
  } catch {
    // Showing the opening number is better than showing nothing; the count is
    // display copy, and the real limit is enforced when an order is created.
    return fallback;
  }
}
