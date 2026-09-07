-- Makes user_profiles usable, and extends it to anonymous visitors.
--
-- The table was written for Supabase auth: user_id is the primary key, NOT
-- NULL, and a foreign key into auth.users. This app authenticates with
-- Firebase, so there is no auth.users row to point at, and /api/profile only
-- ever writes firebase_uid. Every insert it attempted would have failed on the
-- user_id not-null constraint.
--
-- That is why the table has zero rows despite PhoneModal, /api/profile and
-- /api/chat-usage all having been written against it.
--
-- Run this once against the project database.

-- ── 1. Drop the Supabase-auth assumptions ───────────────────────────────────
alter table user_profiles drop constraint if exists user_profiles_user_id_fkey;
alter table user_profiles drop constraint if exists user_profiles_pkey;
alter table user_profiles alter column user_id drop not null;

-- The RLS policy compares auth.uid() to user_id, which is never populated
-- under Firebase auth, so it denies everything. Every route reaching this
-- table uses the service role and bypasses RLS; leaving a policy that cannot
-- match anything is worse than saying so plainly.
drop policy if exists "Users manage own profile" on user_profiles;

-- ── 2. Identity ─────────────────────────────────────────────────────────────
-- A row belongs to a signed-in user (firebase_uid) or to a browser
-- (visitor_id, the FingerprintJS id that user_sessions already keys on).
alter table user_profiles add column if not exists visitor_id text;
alter table user_profiles add column if not exists source     text;
alter table user_profiles add column if not exists created_at timestamptz default now();
alter table user_profiles add column if not exists verified   boolean default false;

alter table user_profiles drop constraint if exists user_profiles_identity_check;
alter table user_profiles add  constraint user_profiles_identity_check
  check (firebase_uid is not null or visitor_id is not null);

-- One row per signed-in user, one per anonymous browser. Partial, because
-- either column is null on the other kind of row.
drop index if exists user_profiles_firebase_uid_idx;
create unique index if not exists user_profiles_firebase_uid_key
  on user_profiles (firebase_uid) where firebase_uid is not null;
create unique index if not exists user_profiles_visitor_id_key
  on user_profiles (visitor_id)   where visitor_id   is not null;

-- ── 3. Phone is no longer globally unique ───────────────────────────────────
-- It was UNIQUE across the whole table. With anonymous capture that rejects
-- honest cases: the same person on a phone and a laptop is two visitor_ids,
-- and siblings preparing together share a number. Under a hard gate the
-- second one is stuck behind a modal that will never accept their number.
--
-- Duplicates are a reporting problem, not a write-path problem, so they are
-- deduplicated in the admin view instead.
alter table user_profiles drop constraint if exists user_profiles_phone_key;
create index if not exists user_profiles_phone_idx on user_profiles (phone);

-- ── 4. Where the number came from ───────────────────────────────────────────
-- 'authed' for signed-in users, 'anon' for the soft prompt. Kept so the two
-- populations can be told apart later, since they will differ in quality.
update user_profiles
   set source = case when firebase_uid is not null then 'authed' else 'anon' end
 where source is null;
