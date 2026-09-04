-- Visit tracking as a single atomic statement.
--
-- /api/track-visit ran a SELECT, mutated the row in JavaScript, then wrote the
-- whole row back. That is two round trips per pageview on the busiest endpoint
-- in the app, and it races: two tabs, or a visitor's first two pageviews
-- arriving together, both read "no row" and both INSERT. It has already
-- happened -- one visitor holds two rows with their 64 visits split across
-- them -- and there is no unique constraint to have stopped it.
--
-- record_visit does the whole thing in one INSERT ... ON CONFLICT, so
-- concurrent pageviews serialise on the row instead of losing each other's
-- writes.
--
-- Run this once against the project database.

-- ── 1. Merge the rows the race already split ────────────────────────────────
-- Keep the earliest row per visitor, fold the others into it: visits sum,
-- pages union, session_start earliest, activity latest.
update user_sessions k
   set visit_count   = agg.total_visits,
       pages_visited = agg.pages,
       session_start = agg.first_start,
       last_active   = agg.last_seen,
       visited_at    = agg.last_visited
  from (
    select u.visitor_id,
           sum(u.visit_count)                                      as total_visits,
           min(u.session_start)                                    as first_start,
           max(u.last_active)                                      as last_seen,
           max(u.visited_at)                                       as last_visited,
           (array_agg(u.id order by u.session_start asc nulls last, u.id))[1] as keep_id,
           (select coalesce(array_agg(distinct p), '{}'::text[])
              from user_sessions u2, unnest(u2.pages_visited) p
             where u2.visitor_id = u.visitor_id)                   as pages
      from user_sessions u
     where u.visitor_id is not null
     group by u.visitor_id
    having count(*) > 1
  ) agg
 where k.id = agg.keep_id;

delete from user_sessions d
 using (
   select visitor_id,
          (array_agg(id order by session_start asc nulls last, id))[1] as keep_id
     from user_sessions
    where visitor_id is not null
    group by visitor_id
   having count(*) > 1
 ) x
 where d.visitor_id = x.visitor_id
   and d.id <> x.keep_id;

-- ── 2. Make the race impossible ─────────────────────────────────────────────
-- Also the conflict target record_visit needs. Rows with a null visitor_id are
-- not written by this route, so a partial index keeps them out of the way.
create unique index if not exists user_sessions_visitor_id_key
  on user_sessions (visitor_id)
  where visitor_id is not null;

-- ── 3. One statement per pageview ───────────────────────────────────────────
create or replace function record_visit(
  p_visitor_id  text,
  p_page        text,
  p_referrer    text default null,
  p_device      text default null,
  p_os          text default null,
  p_browser     text default null,
  p_country     text default null,
  p_city        text default null,
  p_firebase_uid text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Distinct pages only, and capped. The page name arrives from the browser,
  -- so without a ceiling a caller could grow one row without limit by sending
  -- a fresh path each time.
  k_max_pages constant integer := 200;
begin
  if coalesce(p_visitor_id, '') = '' then
    return;
  end if;

  insert into user_sessions (
    visitor_id, visit_count, visited_at, last_active, session_start,
    last_page, entry_page, exit_page, pages_visited, referrer,
    device, os, browser, country, city, is_bounce, firebase_uid,
    session_duration_secs
  )
  values (
    p_visitor_id, 1, now(), now(), now(),
    p_page, p_page, p_page,
    case when coalesce(p_page, '') = '' then '{}'::text[] else array[p_page] end,
    coalesce(nullif(p_referrer, ''), 'direct'),
    coalesce(nullif(p_device, ''), 'unknown'),
    coalesce(nullif(p_os, ''), 'unknown'),
    coalesce(nullif(p_browser, ''), 'unknown'),
    nullif(p_country, ''), nullif(p_city, ''),
    true, nullif(p_firebase_uid, ''), 0
  )
  on conflict (visitor_id) where visitor_id is not null do update set
    visit_count = user_sessions.visit_count + 1,
    visited_at  = now(),
    last_active = now(),
    last_page   = coalesce(nullif(p_page, ''), user_sessions.last_page),
    exit_page   = coalesce(nullif(p_page, ''), user_sessions.exit_page),

    pages_visited = case
      when coalesce(p_page, '') = ''                          then user_sessions.pages_visited
      when p_page = any(user_sessions.pages_visited)          then user_sessions.pages_visited
      when cardinality(user_sessions.pages_visited) >= k_max_pages
                                                              then user_sessions.pages_visited
      else user_sessions.pages_visited || p_page
    end,

    -- A visitor who has seen more than one distinct page did not bounce.
    is_bounce = cardinality(case
      when coalesce(p_page, '') = ''                          then user_sessions.pages_visited
      when p_page = any(user_sessions.pages_visited)          then user_sessions.pages_visited
      when cardinality(user_sessions.pages_visited) >= k_max_pages
                                                              then user_sessions.pages_visited
      else user_sessions.pages_visited || p_page
    end) <= 1,

    session_duration_secs = greatest(
      0,
      extract(epoch from now() - coalesce(user_sessions.session_start, now()))::integer
    ),

    -- Later requests may know things the first did not, but must never
    -- overwrite a known value with 'unknown'.
    device       = coalesce(nullif(p_device, ''),  user_sessions.device),
    os           = coalesce(nullif(p_os, ''),      user_sessions.os),
    browser      = coalesce(nullif(p_browser, ''), user_sessions.browser),
    country      = coalesce(nullif(p_country, ''), user_sessions.country),
    city         = coalesce(nullif(p_city, ''),    user_sessions.city),
    firebase_uid = coalesce(nullif(p_firebase_uid, ''), user_sessions.firebase_uid);
end;
$$;

-- ── 4. Heartbeat ────────────────────────────────────────────────────────────
-- Was also a SELECT followed by an UPDATE. Nothing it read was needed:
-- Postgres can compute the duration from the row it is already updating.
create or replace function touch_visit(p_visitor_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update user_sessions
     set last_active = now(),
         session_duration_secs = greatest(
           0, extract(epoch from now() - coalesce(session_start, now()))::integer
         )
   where visitor_id = p_visitor_id;
$$;

-- ── 5. Merging an old fingerprint into a new one ────────────────────────────
-- Previously a SELECT then an UPDATE. Made a no-op when the new id already
-- exists, because renaming onto it would violate the unique index added above.
create or replace function merge_visitor(p_old_id text, p_new_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(p_old_id, '') = '' or coalesce(p_new_id, '') = '' or p_old_id = p_new_id then
    return;
  end if;
  if exists (select 1 from user_sessions where visitor_id = p_new_id) then
    return;
  end if;
  update user_sessions set visitor_id = p_new_id where visitor_id = p_old_id;
end;
$$;

-- Anyone holding the public anon key can call exposed functions. These write
-- analytics rows for an arbitrary visitor id, so only the server routes -- which
-- use the service role -- should reach them.
revoke all on function record_visit(text, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function touch_visit(text)          from public, anon, authenticated;
revoke all on function merge_visitor(text, text)  from public, anon, authenticated;

grant execute on function record_visit(text, text, text, text, text, text, text, text, text)
  to service_role;
grant execute on function touch_visit(text)         to service_role;
grant execute on function merge_visitor(text, text) to service_role;
