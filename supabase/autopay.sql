-- Recurring weekly subscriptions (Razorpay Autopay).
--
-- The one-time flow stays exactly as it is. expires_at remains the single
-- access gate that every premium check in the app reads, so nothing else has
-- to learn about recurring billing: each successful weekly charge simply
-- pushes expires_at seven days further out.
--
-- What is new is the state needed to manage the mandate itself.

alter table subscriptions
  add column if not exists razorpay_subscription_id text,
  -- true only while Razorpay will charge again. Cancelling sets it false and
  -- leaves expires_at alone, so a cancelled subscriber keeps the days already
  -- paid for.
  add column if not exists auto_renew boolean not null default false,
  add column if not exists cancelled_at timestamptz;

-- One row per Razorpay subscription. Also the lookup the webhook uses to find
-- whose access to extend when a charge lands.
create unique index if not exists subscriptions_razorpay_subscription_id_key
  on subscriptions (razorpay_subscription_id)
  where razorpay_subscription_id is not null;

-- Finding a person's live mandate, for the cancel button and the status strip.
create index if not exists subscriptions_autopay_idx
  on subscriptions (firebase_uid)
  where auto_renew = true;
