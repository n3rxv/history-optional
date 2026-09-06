-- Stores the map evaluation alongside the payment that bought it.
--
-- /api/razorpay/map-verify ran a Claude Sonnet call over the student's PDF and
-- returned the result in the HTTP response only. Nothing kept it. Two
-- consequences:
--
--   * A reader who closed the tab, lost connection, or simply wanted to look
--     again had paid ₹49 for something they could no longer reach.
--   * Re-submitting was the only way to recover it, and re-submitting re-ran
--     the model — so the replay hole was not just a free evaluation, it was
--     the only recovery path the product offered.
--
-- With the result stored, a replay returns what was already produced instead
-- of spending another model call.
--
-- Run this once against the project database.

alter table map_evaluations
  add column if not exists result jsonb;

-- One row per payment, and the lookup a replay does.
create unique index if not exists map_evaluations_payment_id_key
  on map_evaluations (razorpay_payment_id)
  where razorpay_payment_id is not null;

-- "What have I had evaluated" is the shape every support question takes.
create index if not exists map_evaluations_uid_idx
  on map_evaluations (firebase_uid, created_at desc);
