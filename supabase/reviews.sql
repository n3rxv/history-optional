-- Reviews and suggestions from signed-in readers (components/ReviewPrompt,
-- app/api/review). A row holds what the reader wrote, with the name, attempt
-- and designation they gave. The form tells them a review may be shown on
-- the site; can_publish marks the rows that have a review to show. Reviews
-- reach the home page only by hand, through lib/testimonials.ts.
--
-- New tables are granted to service_role by hand: Supabase stopped doing it
-- for new tables on 30 October 2026. Nothing is readable with the public key.
-- Ids are random uuids, not sequences.
--
-- Run once. Safe to re-run.

begin;

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  uid         text not null,
  email       text,
  name        text,
  attempt     text,          -- '1'..'4', '5+', or 'none' (not attempted yet)
  about       text,          -- designation or a line about them
  review      text,
  suggestions text,
  can_publish boolean not null default false,
  page        text,
  created_at  timestamptz not null default now(),
  constraint reviews_has_text check (coalesce(review, '') <> '' or coalesce(suggestions, '') <> '')
);

create index if not exists reviews_uid_idx on public.reviews (uid);
create index if not exists reviews_created_idx on public.reviews (created_at desc);

alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
grant select, insert, update, delete on public.reviews to service_role;

commit;
