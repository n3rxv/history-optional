-- Makes the identity indexes usable as ON CONFLICT targets.
--
-- They were created partial -- UNIQUE (firebase_uid) WHERE firebase_uid IS NOT
-- NULL -- to allow many rows with a null firebase_uid, since anonymous rows
-- carry a visitor_id instead. That reasoning was wrong twice over:
--
--   1. Postgres already treats nulls as distinct in a unique index, so a plain
--      UNIQUE allows as many null firebase_uids as you like. The predicate
--      bought nothing.
--   2. ON CONFLICT can only infer a partial index if the statement repeats its
--      WHERE clause, and PostgREST's onConflict option emits only the column
--      name. So every upsert in /api/profile would have failed with
--      "no unique or exclusion constraint matching the ON CONFLICT
--      specification" -- the same error the name backfill hit.
--
-- Caught by the backfill before any real traffic reached the write path.
--
-- Run this once against the project database.

drop index if exists user_profiles_firebase_uid_key;
drop index if exists user_profiles_visitor_id_key;

create unique index if not exists user_profiles_firebase_uid_key on user_profiles (firebase_uid);
create unique index if not exists user_profiles_visitor_id_key   on user_profiles (visitor_id);
