-- Share links for answer checks, and referrals.
--
-- Sharing. A reader can publish one of their answer checks at /s/<share_id>.
-- The public page shows the question, the marks and a few lines of feedback,
-- never the answer itself, the email or the uid. share_id is random rather
-- than the row's uuid so the link names nothing else, and clearing it takes
-- the page down. Separate from `shareable`, which is the hand-set flag for the
-- homepage samples.
--
-- Referrals. Each reader gets a short code on first asking for their invite
-- link. When a friend makes their first purchase of the 6-month or yearly
-- plan through it, the friend gets extra days and so does the reader who
-- invited them. apply_referral does the bookkeeping and both extensions in one
-- transaction, and the unique keys on referrals make a repeat call a no-op.
-- The server decides eligibility (first purchase, plan) before calling it.
--
-- Only the server reads or writes these, with the service key. Run once
-- against the project database.

alter table answer_evaluations
  add column if not exists share_id  text unique,
  add column if not exists shared_at timestamptz;

create table if not exists referral_codes (
  code         text        primary key,
  firebase_uid text        not null unique,
  created_at   timestamptz not null default now()
);

create table if not exists referrals (
  id            bigserial   primary key,
  code          text        not null references referral_codes (code),
  referrer_uid  text        not null,
  referred_uid  text        not null unique,
  order_id      text        not null unique,
  plan          text        not null,
  referrer_days integer     not null,
  referred_days integer     not null,
  created_at    timestamptz not null default now()
);

create index if not exists referrals_referrer_idx on referrals (referrer_uid);

alter table referral_codes enable row level security;
alter table referrals      enable row level security;

revoke all on referral_codes, referrals from anon, authenticated;
grant select, insert, update, delete on referral_codes, referrals to service_role;
grant usage, select on sequence referrals_id_seq to service_role;

-- Returns {"result": "applied", "expires_at": <buyer's new expiry>} or
-- {"result": <why not>}. Called right after the buyer's grant, so their
-- subscriptions row already holds the plan they paid for.
create or replace function apply_referral(
  p_code          text,
  p_order_id      text,
  p_buyer_uid     text,
  p_plan          text,
  p_referrer_days integer,
  p_referred_days integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer text;
  v_expires  timestamptz;
begin
  select firebase_uid into v_referrer from referral_codes where code = upper(p_code);
  if v_referrer is null then return jsonb_build_object('result', 'unknown_code'); end if;
  if v_referrer = p_buyer_uid then return jsonb_build_object('result', 'own_code'); end if;

  insert into referrals (code, referrer_uid, referred_uid, order_id, plan, referrer_days, referred_days)
  values (upper(p_code), v_referrer, p_buyer_uid, p_order_id, p_plan, p_referrer_days, p_referred_days)
  on conflict do nothing;
  if not found then return jsonb_build_object('result', 'already_referred'); end if;

  update subscriptions
     set expires_at = greatest(expires_at, now()) + make_interval(days => p_referred_days)
   where firebase_uid = p_buyer_uid
  returning expires_at into v_expires;

  -- A referrer with no live plan gets one; a live plan is extended and keeps
  -- its name.
  insert into subscriptions (firebase_uid, status, plan, expires_at)
  values (v_referrer, 'active', 'referral', now() + make_interval(days => p_referrer_days))
  on conflict (firebase_uid) do update
     set expires_at = greatest(subscriptions.expires_at, now()) + make_interval(days => p_referrer_days),
         plan       = case when subscriptions.expires_at > now() then subscriptions.plan else 'referral' end,
         status     = 'active';

  return jsonb_build_object('result', 'applied', 'expires_at', v_expires);
end;
$$;

revoke all on function apply_referral(text, text, text, text, integer, integer) from public, anon, authenticated;
grant execute on function apply_referral(text, text, text, text, integer, integer) to service_role;
