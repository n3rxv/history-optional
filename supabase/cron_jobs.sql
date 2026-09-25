-- Scheduled jobs (pg_cron).
--
-- These were created directly against the database and existed nowhere in
-- version control, which meant a rebuilt project would have come up silently
-- missing them -- including the one that expires subscriptions. Recorded here
-- so they are reproducible.
--
-- Times are UTC. IST is UTC+05:30, so 02:00 UTC is 07:30 in the morning
-- locally, which is low traffic.
--
-- Inspect what is actually scheduled:
--   select jobid, jobname, schedule, active, command from cron.job order by jobid;
--
-- Inspect recent runs:
--   select jobid, status, return_message, end_time
--     from cron.job_run_details order by end_time desc limit 20;

create extension if not exists pg_cron;

-- ── expire-subscriptions ────────────────────────────────────────────────────
-- Marks paid subscriptions as expired once their expires_at has passed.
--
-- This is bookkeeping, not access control. Every route that grants premium
-- filters on expires_at in the same query as status -- sub-status, usage,
-- chat, prelims-explain, evalAccess, topper-copies and the rest all do
-- .eq('status','active').gt('expires_at', now()) -- so an expired subscriber
-- is refused in real time regardless of what this column says. Nothing in the
-- codebase ever reads the value 'expired'; it exists for admin views and for
-- anyone querying the database directly.
--
-- It ran every minute until 25 Sep 2026. That wrote a row to
-- cron.job_run_details every minute -- 1,440 a day -- which had quietly made
-- that table the largest on the instance at 3.6 MB, larger than any
-- application table. Daily is ample for a field nothing reads in real time.
select cron.schedule(
  'expire-subscriptions',
  '0 2 * * *',
  $$
    update subscriptions
    set status = 'expired'
    where status = 'active'
    and expires_at < now();
  $$
);

-- ── purge-cron-history ──────────────────────────────────────────────────────
-- cron.job_run_details grows without limit on its own. An hour after the job
-- above, so the day's run is already recorded when this sweeps.
select cron.schedule(
  'purge-cron-history',
  '0 3 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '7 days'$$
);

-- ── Changing a schedule without recreating the job ──────────────────────────
--   select cron.alter_job(<jobid>, schedule => '*/15 * * * *');
--
-- To restore the old per-minute cadence:
--   select cron.alter_job(5, schedule => '* * * * *');
