-- Drop the early-bird slot counter.
--
-- The table held one row, {id: 1, max_slots: 45}. Its only behavioural effect
-- was in SubscribeCard: when the remaining count reached zero, the daily and
-- six-month tiles were hidden and only the annual plan was offered. Nothing
-- ever raised a price, and /api/razorpay/order fetched the count but never
-- rejected an order on it, so the restriction was client-side only and could
-- be bypassed by posting a plan directly.
--
-- It also never fired: 7 active subscribers against 45 slots, all of them on
-- the annual plan the restriction would have pushed them to.
--
-- Run this AFTER the deploy that removes lib/slots.ts and /api/slots, or
-- /api/ping's health check and the order route will query a table that is
-- already gone. /api/ping now checks `subscriptions` instead.

begin;

drop policy if exists "Allow read only" on subscription_slots;
drop table if exists subscription_slots;

commit;
