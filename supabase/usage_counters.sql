-- Atomic free-tier metering.
--
-- Every quota in the app was a read-modify-write across two round trips:
--
--     select eval_count ... where firebase_uid = $1     -- returns 0
--     ... do the paid work ...
--     update usage_tracking set eval_count = 0 + 1      -- writes 1
--
-- Ten requests fired at once all read 0, all passed the check, and all wrote
-- 1. The free tier was bypassable by concurrency alone, on /api/evaluate,
-- /api/chat, /api/topper-click and /api/usage alike.
--
-- consume_usage does the check and the increment in one statement under a lock,
-- so exactly one caller can cross the limit boundary.
--
-- Run this once against the project database.

-- ── Shared identity resolution ───────────────────────────────────────────────
-- usage_tracking.fingerprint is NOT NULL and UNIQUE; firebase_uid is UNIQUE and
-- nullable. A row therefore always has a fingerprint and may or may not be
-- linked to an account, and one person can own two rows: one created
-- anonymously by device, one created by account. Both are consulted, and the
-- higher count wins, so signing up on a device that already spent its quota
-- does not hand out a fresh one.

create or replace function consume_usage(
  p_uid   text,
  p_fp    text,
  p_field text,
  p_limit integer
) returns table (allowed boolean, used integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used    integer := 0;
  v_new     integer;
  v_updated integer := 0;
  v_rows    integer;
  k_uid     bigint;
  k_fp      bigint;
begin
  -- Whitelisted so the format() calls below can never interpolate arbitrary
  -- text into a statement.
  if p_field not in ('eval_count', 'chat_count', 'topper_clicks') then
    raise exception 'consume_usage: unsupported field %', p_field;
  end if;

  -- Usage must be attributable to somebody. A caller presenting neither
  -- identity would otherwise get an unmetered allowance by sending nothing.
  if coalesce(p_uid, '') = '' and coalesce(p_fp, '') = '' then
    return query select false, 0;
    return;
  end if;

  -- Serialize concurrent callers for this identity. Locks are taken in a
  -- deterministic order so two requests presenting the same pair in different
  -- combinations cannot deadlock. Transaction-scoped: released at commit.
  k_uid := hashtext('usage:uid:' || coalesce(p_uid, ''));
  k_fp  := hashtext('usage:fp:'  || coalesce(p_fp, ''));
  if coalesce(p_uid, '') <> '' and coalesce(p_fp, '') <> '' then
    perform pg_advisory_xact_lock(least(k_uid, k_fp));
    perform pg_advisory_xact_lock(greatest(k_uid, k_fp));
  elsif coalesce(p_uid, '') <> '' then
    perform pg_advisory_xact_lock(k_uid);
  else
    perform pg_advisory_xact_lock(k_fp);
  end if;

  execute format($q$
    select coalesce(max(%I), 0) from usage_tracking
     where (nullif($1, '') is not null and firebase_uid = $1)
        or (nullif($2, '') is not null and fingerprint  = $2)
  $q$, p_field)
  into v_used
  using coalesce(p_uid, ''), coalesce(p_fp, '');

  if v_used >= p_limit then
    return query select false, v_used;
    return;
  end if;

  v_new := v_used + 1;

  -- Updates only touch the counter, never the unique columns, so they cannot
  -- collide with the other identity's row.
  if coalesce(p_uid, '') <> '' then
    execute format(
      'update usage_tracking set %I = $2, updated_at = now() where firebase_uid = $1',
      p_field
    ) using p_uid, v_new;
    get diagnostics v_rows = row_count;
    v_updated := v_updated + v_rows;
  end if;

  if coalesce(p_fp, '') <> '' then
    execute format(
      'update usage_tracking set %I = $2, updated_at = now() where fingerprint = $1',
      p_field
    ) using p_fp, v_new;
    get diagnostics v_rows = row_count;
    v_updated := v_updated + v_rows;
  end if;

  -- First time we have seen this person under either identity.
  -- fingerprint is NOT NULL, so an account with no usable device id gets the
  -- synthetic one /api/usage already uses.
  if v_updated = 0 then
    execute format($q$
      insert into usage_tracking (fingerprint, firebase_uid, %I)
      values (coalesce(nullif($1, ''), 'uid_' || $2), nullif($2, ''), $3)
      on conflict do nothing
    $q$, p_field)
    using coalesce(p_fp, ''), coalesce(p_uid, ''), v_new;
  end if;

  return query select true, v_new;
end;
$$;

-- ── Refund ───────────────────────────────────────────────────────────────────
-- consume_usage runs before the paid work, which is the only ordering that
-- closes the race. When that work then fails, the caller gives the unit back
-- rather than charging for nothing.

create or replace function release_usage(
  p_uid   text,
  p_fp    text,
  p_field text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_field not in ('eval_count', 'chat_count', 'topper_clicks') then
    raise exception 'release_usage: unsupported field %', p_field;
  end if;

  execute format($q$
    update usage_tracking
       set %I = greatest(coalesce(%I, 0) - 1, 0), updated_at = now()
     where (nullif($1, '') is not null and firebase_uid = $1)
        or (nullif($2, '') is not null and fingerprint  = $2)
  $q$, p_field, p_field)
  using coalesce(p_uid, ''), coalesce(p_fp, '');
end;
$$;

-- PostgREST exposes functions to anyone holding the public anon key. Letting a
-- browser call release_usage directly would hand out unlimited free usage, and
-- letting it call consume_usage would let one person burn another's quota.
revoke all on function consume_usage(text, text, text, integer) from public, anon, authenticated;
revoke all on function release_usage(text, text, text)          from public, anon, authenticated;
grant execute on function consume_usage(text, text, text, integer) to service_role;
grant execute on function release_usage(text, text, text)          to service_role;
