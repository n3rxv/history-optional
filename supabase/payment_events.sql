-- Payment ledger: one row per Razorpay payment we have acted on.
--
-- /api/razorpay/verify used to grant access purely on a valid signature. A
-- signature is a static value the browser already holds, so replaying the same
-- verify request extended the subscription again every time — each replay took
-- the existing expires_at as its base and added another term. One ₹2,999
-- payment could be turned into an unbounded number of years.
--
-- The primary key below is the latch. verify claims the payment_id here first;
-- a second attempt hits the conflict, is recognised as already applied, and
-- returns the existing subscription instead of extending it again.
--
-- It doubles as the reconciliation record. `subscriptions` only keeps the most
-- recent payment ids, so before this table there was no way to tie a Razorpay
-- settlement report back to the access that was granted for it.
--
-- Run this once against the project database.

create table if not exists payment_events (
  payment_id   text primary key,
  order_id     text        not null,
  firebase_uid text        not null,
  email        text,
  kind         text        not null default 'subscription',
  plan         text        not null,
  amount_paise integer     not null,
  expires_at   timestamptz,
  applied_at   timestamptz not null default now()
);

-- Supports "what has this user paid for", which is the shape every support
-- question takes.
create index if not exists payment_events_uid_idx
  on payment_events (firebase_uid, applied_at desc);

create index if not exists payment_events_order_idx
  on payment_events (order_id);

-- PostgREST exposes every table to anyone holding the public anon key. Nothing
-- outside the server routes should be able to read this ledger, and nothing at
-- all should be able to delete a row from it — deleting a row would re-arm the
-- replay this table exists to prevent.
alter table payment_events enable row level security;
-- Deliberately no policies: RLS with no policy denies every non-service role.

revoke all on table payment_events from anon, authenticated;
