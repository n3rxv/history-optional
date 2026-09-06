-- Removes two dead functions and one stale counter column.
--
-- Run this once against the project database, after the code that stops
-- reading subscription_slots.subscribers has deployed.

-- ── 1. The stale subscriber counter ─────────────────────────────────────────
-- /api/razorpay/order computed remaining slots from this column while
-- /api/slots counted the subscriptions table. Nothing in the codebase has ever
-- written it, so it sat at 1 with seven active subscriptions, and the two
-- routes advertised 44 and 38 slots remaining on the same page.
--
-- lib/slots.ts is the single definition now: count the rows. max_slots stays,
-- because that is configuration rather than a cached total. Dropping the
-- column rather than backfilling it is deliberate — a number that must be kept
-- in step with a table it duplicates will drift again the moment someone
-- forgets, which is exactly what happened.
alter table subscription_slots drop column if exists subscribers;

-- ── 2. Two atomic increment functions that were never called ────────────────
-- These were written before the routes were, and the routes never used them —
-- they did select-then-update in JavaScript instead, which is the race fixed
-- in 3f75867. They are fingerprint-only and do not check a limit, so
-- consume_usage supersedes them entirely.
--
-- Left in place they are a trap: they look like the right thing to call, but
-- would increment past a limit without noticing.
drop function if exists increment_eval_count(text);
drop function if exists increment_chat_count(text);
