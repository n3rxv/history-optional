-- Lets a profile hold a name before it holds a number.
--
-- phone was NOT NULL, which is right for a row the modal creates: the modal
-- always collects one. It is wrong for a row the Google backfill creates,
-- because Google gives a display name and no phone number, so a name-only row
-- could not be written at all.
--
-- Nothing reads phone without checking it: the gate treats a null phone as
-- "still needs asking", which is exactly what a backfilled row is.
--
-- Run this once against the project database.

alter table user_profiles alter column phone drop not null;

-- A row still has to be about someone.
alter table user_profiles drop constraint if exists user_profiles_has_content_check;
alter table user_profiles add  constraint user_profiles_has_content_check
  check (phone is not null or first_name is not null);
