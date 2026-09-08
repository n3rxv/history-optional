-- Lifecycle of every weekly mandate, with the address attached.
--
-- Razorpay holds this, but spread across three screens: the order carries no
-- notes because Razorpay generates it, the plan is shared by everyone, and
-- only the subscription itself has firebase_uid and email. Answering "who
-- started and did not finish" meant four clicks.
--
-- Deliberately NOT the subscriptions table. That one gates access — thirteen
-- checks read status='active' AND expires_at > now — and expires_at is NOT
-- NULL, so a started-but-never-charged attempt has no honest row to occupy
-- there. Keeping attempts separate means a logging bug can never hand out or
-- withhold access.

create table if not exists autopay_attempts (
  razorpay_subscription_id text primary key,
  firebase_uid             text not null,
  email                    text,
  -- started   : mandate created, awaiting authorisation
  -- active    : charged at least once
  -- failed    : Razorpay exhausted its retries (subscription.halted)
  -- cancelled : stopped by the subscriber or by us
  -- completed : ran to total_count
  status                   text not null default 'started',
  started_at               timestamptz not null default now(),
  first_charged_at         timestamptz,
  last_charged_at          timestamptz,
  charge_count             integer not null default 0,
  updated_at               timestamptz not null default now()
);

create index if not exists autopay_attempts_status_idx on autopay_attempts (status, started_at desc);
create index if not exists autopay_attempts_email_idx  on autopay_attempts (email);

alter table autopay_attempts enable row level security;
-- No policy: reachable only through the service key, same as subscriptions.
