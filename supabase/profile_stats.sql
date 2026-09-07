-- Counts for the admin header.
--
-- A row is not a person. The same person on a laptop and a phone is two
-- visitor_ids and therefore two rows, and a shared family number is one number
-- across two people. The write path allows both on purpose: enforcing
-- uniqueness there would trap a real visitor behind a mandatory modal that
-- refuses their number.
--
-- So the header has to show both figures, or "154 collected" gets read as 154
-- people when it may be far fewer. Postgres counts distinct cheaply; PostgREST
-- cannot express it, hence the function.
--
-- Run this once against the project database.

create or replace function profile_stats()
returns table (
  rows_total     bigint,
  people_total   bigint,   -- distinct phone numbers
  with_phone     bigint,
  awaiting_phone bigint,   -- backfilled name, number still to come
  authed         bigint,
  anon           bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select count(*)                                             as rows_total,
         count(distinct phone)                                as people_total,
         count(phone)                                         as with_phone,
         count(*) filter (where phone is null)                as awaiting_phone,
         count(*) filter (where firebase_uid is not null)     as authed,
         count(*) filter (where firebase_uid is null)         as anon
    from user_profiles;
$$;

-- Admin routes use the service role. Nothing else should be able to count the
-- table.
revoke all on function profile_stats() from public, anon, authenticated;
grant execute on function profile_stats() to service_role;
