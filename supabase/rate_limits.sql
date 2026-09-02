-- Durable rate limiting.
--
-- The API routes previously counted requests in a module-level Map. On Vercel
-- each lambda instance has its own memory and instances scale out and recycle,
-- so those counters were per-instance: a caller spreading requests across
-- instances was never limited. That mattered most on
-- /api/admin/verify-password, where the counter was the only brute-force
-- protection on the admin password.
--
-- Run this once against the project database.

create table if not exists rate_limits (
  key          text primary key,
  count        integer     not null default 0,
  window_start timestamptz not null default now()
);

-- Supports the opportunistic cleanup below.
create index if not exists rate_limits_window_start_idx
  on rate_limits (window_start);

-- Increment-and-test in a single statement so concurrent requests cannot
-- interleave a read and a write and both pass the limit.
--
-- Returns true when the request is allowed, false when it exceeds p_limit.
create or replace function check_rate_limit(
  p_key            text,
  p_limit          integer,
  p_window_seconds integer
) returns boolean
language plpgsql
as $$
declare
  v_count integer;
begin
  insert into rate_limits as r (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when r.window_start < now() - make_interval(secs => p_window_seconds)
            then 1
          else r.count + 1
        end,
        window_start = case
          when r.window_start < now() - make_interval(secs => p_window_seconds)
            then now()
          else r.window_start
        end
  returning r.count into v_count;

  -- Keys for callers that never return would otherwise accumulate forever.
  -- Cleaning up on roughly 1 in 1000 calls keeps the table bounded without
  -- needing a scheduled job.
  if random() < 0.001 then
    delete from rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end;
$$;

-- PostgREST exposes tables and functions to anyone holding the public anon
-- key. Without the grants below, a caller could delete their own counter rows,
-- or call check_rate_limit directly to inflate someone else's counter and lock
-- them out. Only the service role (used by lib/rateLimit.ts, and exempt from
-- RLS) should reach either.
alter table rate_limits enable row level security;
-- Deliberately no policies: RLS with no policy denies every non-service role.

revoke all on table rate_limits from anon, authenticated;
revoke all on function check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function check_rate_limit(text, integer, integer) to service_role;
