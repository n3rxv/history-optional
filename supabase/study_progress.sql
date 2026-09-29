-- Study progress that follows the reader instead of the browser.
--
-- Everything the dashboard reports has lived in localStorage: which syllabus
-- topics are ticked, which past questions have been attempted, flashcard
-- review state, answer history, the streak. That means a reader who opens the
-- site on a second device sees an empty dashboard, and one who clears their
-- browser loses months of it. For a paid product whose headline feature is a
-- progress overview, that is the failure most likely to be noticed.
--
-- This covers the two cheapest and most-missed stores first -- syllabus ticks
-- and PYQ attempts. Both are small, append-mostly documents, which is what
-- makes them safe to sync as whole documents rather than as event streams.
-- The `store` column exists so flashcard state and answer history can follow
-- later without a migration.
--
-- Merge, not replace. A reader with ticks on a phone and different ticks on a
-- laptop must not lose either set, so the API unions the two and keeps the
-- earliest date for anything present in both -- completionDates records when a
-- topic was first finished, and the revision prompt on the dashboard keys off
-- how long ago that was.
--
-- The known limitation of a union merge, recorded here rather than discovered
-- later: un-ticking is not propagated. Untick a topic on a laptop and a phone
-- holding the old document will restore it on its next sync. Ticking is the
-- overwhelmingly common action and losing a completion is the worse failure,
-- so the merge favours keeping. Fixing it properly needs per-item tombstones.
--
-- Writes are deliberately rare -- the client syncs on load and when the tab is
-- hidden, not on every tick -- because each write rewrites the whole row and
-- this project runs on an instance with a disk IO budget worth respecting.
--
-- Run this once against the project database.

create table if not exists study_progress (
  firebase_uid text        not null,
  store        text        not null,
  data         jsonb       not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),

  primary key (firebase_uid, store),

  -- Whitelisted so a client cannot invent stores and use the table as free
  -- key-value storage.
  constraint study_progress_store_check check (store in ('syllabus', 'pyq'))
);

create index if not exists study_progress_updated_idx on study_progress (updated_at desc);

-- Keep updated_at honest without every caller remembering to set it.
drop trigger if exists study_progress_set_updated_at on study_progress;
create trigger study_progress_set_updated_at
  before update on study_progress
  for each row execute function set_updated_at();

-- ── Access ──────────────────────────────────────────────────────────────────
-- Read and written only through /api/progress, which verifies the Firebase
-- token and can therefore be trusted about whose row it is touching. The anon
-- key ships in the browser, so leaving this readable would let anyone enumerate
-- every reader's study history by uid.

alter table study_progress enable row level security;

drop policy if exists "service role manages study progress" on study_progress;
create policy "service role manages study progress" on study_progress
  as permissive for all to service_role
  using (true) with check (true);

revoke select on study_progress from anon, authenticated;
