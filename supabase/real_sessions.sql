-- Real sessions on user_sessions (2026-11-01).
--
-- The table keeps one row per visitor (track_visit.sql). session_start was
-- their first visit ever, so session_duration_secs counted the time since:
-- 12 million seconds for someone first seen in June, whatever they did today.
-- Now:
--   first_seen             their first visit
--   session_start          the start of their latest session; coming back
--                          after 30 minutes away starts a new one
--   session_duration_secs  the length of that session
--   session_count          sessions so far
--   total_active_secs      time on the site across sessions, gaps of more
--                          than 30 minutes left out
-- A first visit also carries the seconds spent before its ping (p_dwell), so
-- whichever of it and the next pageview reaches the database first, the row
-- starts when the visitor arrived.
--
-- Run once against the project database.

begin;

alter table user_sessions
  add column if not exists first_seen timestamptz,
  add column if not exists session_count integer not null default 1,
  add column if not exists total_active_secs integer;

-- Existing rows: the old session_start is the first visit. The latest
-- session's length and the total time were never recorded, so they stay
-- empty, and the next visit after 30 minutes starts a fresh session.
update user_sessions
   set first_seen = coalesce(session_start, visited_at, last_active),
       session_start = last_active,
       session_duration_secs = null
 where first_seen is null;

comment on column user_sessions.first_seen is 'The visitor''s first visit.';
comment on column user_sessions.session_start is 'Start of the latest session. A visit after 30 minutes away starts a new one.';
comment on column user_sessions.session_duration_secs is 'Length of the latest session in seconds. Empty for sessions before 1 Nov 2026, which were never measured.';
comment on column user_sessions.session_count is 'Sessions since 1 Nov 2026, plus 1 for everything before.';
comment on column user_sessions.total_active_secs is 'Seconds on the site across sessions, gaps over 30 minutes left out. Counted from 1 Nov 2026.';

-- A new parameter changes the signature, so the old one goes first. The
-- route's calls name their arguments, and p_dwell has a default, so a
-- deployment still on the old route keeps working.
drop function if exists record_visit(text, text, text, text, text, text, text, text, text);

create function record_visit(
  p_visitor_id   text,
  p_page         text,
  p_referrer     text default null,
  p_device       text default null,
  p_os           text default null,
  p_browser      text default null,
  p_country      text default null,
  p_city         text default null,
  p_firebase_uid text default null,
  p_dwell        integer default 0
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Distinct pages only, and capped. The page name arrives from the browser,
  -- so without a ceiling a caller could grow one row without limit.
  k_max_pages constant integer := 200;
  -- Away this long, and the next visit is a new session.
  k_gap constant interval := interval '30 minutes';
  v_dwell   integer := least(greatest(coalesce(p_dwell, 0), 0), 3600);
  v_arrived timestamptz := now() - make_interval(secs => least(greatest(coalesce(p_dwell, 0), 0), 3600));
begin
  if coalesce(p_visitor_id, '') = '' then
    return;
  end if;

  insert into user_sessions (
    visitor_id, visit_count, visited_at, last_active, session_start, first_seen,
    session_count, session_duration_secs, total_active_secs,
    last_page, entry_page, exit_page, pages_visited, referrer,
    device, os, browser, country, city, is_bounce, firebase_uid
  )
  values (
    p_visitor_id, 1, now(), now(), v_arrived, v_arrived,
    1, v_dwell, v_dwell,
    p_page, p_page, p_page,
    case when coalesce(p_page, '') = '' then '{}'::text[] else array[p_page] end,
    coalesce(nullif(p_referrer, ''), 'direct'),
    coalesce(nullif(p_device, ''), 'unknown'),
    coalesce(nullif(p_os, ''), 'unknown'),
    coalesce(nullif(p_browser, ''), 'unknown'),
    nullif(p_country, ''), nullif(p_city, ''),
    true, nullif(p_firebase_uid, '')
  )
  -- Every expression below reads the row as it was before this visit.
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

    -- Back after 30 minutes away: a new session, from when they arrived.
    -- Otherwise the same one, moved earlier if a first visit's time says so.
    session_count = user_sessions.session_count
      + case when coalesce(user_sessions.last_active, '-infinity'::timestamptz) < now() - k_gap then 1 else 0 end,
    session_start = case
      when coalesce(user_sessions.last_active, '-infinity'::timestamptz) < now() - k_gap then v_arrived
      else least(coalesce(user_sessions.session_start, v_arrived), v_arrived)
    end,
    session_duration_secs = greatest(0, extract(epoch from now() - case
      when coalesce(user_sessions.last_active, '-infinity'::timestamptz) < now() - k_gap then v_arrived
      else least(coalesce(user_sessions.session_start, v_arrived), v_arrived)
    end))::integer,
    first_seen = least(coalesce(user_sessions.first_seen, v_arrived), v_arrived),
    -- The time since the last ping counts while the session lasts, and a
    -- first visit adds the time before its ping.
    total_active_secs = coalesce(user_sessions.total_active_secs, 0) + v_dwell
      + case when coalesce(user_sessions.last_active, '-infinity'::timestamptz) >= now() - k_gap
             then greatest(0, extract(epoch from now() - user_sessions.last_active))::integer
             else 0 end,

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

-- Heartbeat, sent while the reader is active and when the tab is hidden. The
-- same session rules: after 30 minutes away it starts a new session.
create or replace function touch_visit(p_visitor_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update user_sessions
     set session_count = session_count
           + case when coalesce(last_active, '-infinity'::timestamptz) < now() - interval '30 minutes' then 1 else 0 end,
         session_start = case
           when coalesce(last_active, '-infinity'::timestamptz) < now() - interval '30 minutes' then now()
           else coalesce(session_start, now())
         end,
         session_duration_secs = case
           when coalesce(last_active, '-infinity'::timestamptz) < now() - interval '30 minutes' then 0
           else greatest(0, extract(epoch from now() - coalesce(session_start, now())))::integer
         end,
         total_active_secs = coalesce(total_active_secs, 0)
           + case when coalesce(last_active, '-infinity'::timestamptz) >= now() - interval '30 minutes'
                  then greatest(0, extract(epoch from now() - last_active))::integer
                  else 0 end,
         last_active = now()
   where visitor_id = p_visitor_id;
$$;

-- Only the server routes, which use the service role, may call these.
revoke all on function record_visit(text, text, text, text, text, text, text, text, text, integer)
  from public, anon, authenticated;
revoke all on function touch_visit(text) from public, anon, authenticated;
grant execute on function record_visit(text, text, text, text, text, text, text, text, text, integer)
  to service_role;
grant execute on function touch_visit(text) to service_role;

commit;
