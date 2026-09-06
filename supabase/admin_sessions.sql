-- Gives admin tokens an identity and a way to be revoked.
--
-- lib/admin-auth minted `{exp}.{hmac(exp)}`. The payload was an expiry and
-- nothing else, so:
--
--   * every token issued in the same millisecond was the same token; there was
--     no session to name in a log and nothing to point at after a leak;
--   * the only way to invalidate one was to change ADMIN_PASSWORD, which is
--     the HMAC key — so revoking a stolen token and changing the password you
--     type were the same action, and neither could be done without the other;
--   * nothing recorded that the admin surface had been used at all.
--
-- Admin traffic is a handful of requests a day from one person, so a primary
-- key lookup per request is affordable and buys all three.

create table if not exists admin_sessions (
  sid         text primary key,
  issued_at   timestamptz not null default now(),
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  last_seen   timestamptz,
  ip          text,
  user_agent  text
);

-- The check every admin request makes.
create index if not exists admin_sessions_live_idx
  on admin_sessions (sid)
  where revoked_at is null;

-- Sessions are short-lived; expired rows are only clutter after a while.
create index if not exists admin_sessions_expiry_idx
  on admin_sessions (expires_at);

-- Service-role only. No policies: RLS on with none defined denies everyone,
-- which is what we want — nothing but the server touches this.
alter table admin_sessions enable row level security;

-- Revoke every live admin session. Run this if a laptop is lost or a token
-- leaks; unlike rotating ADMIN_PASSWORD it does not change the login.
create or replace function revoke_all_admin_sessions()
returns integer
language sql
security definer
set search_path = public
as $$
  with x as (
    update admin_sessions set revoked_at = now()
     where revoked_at is null and expires_at > now()
     returning 1
  ) select count(*)::int from x;
$$;
