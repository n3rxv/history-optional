-- Adds the name fields to user_profiles.
--
-- Both are nullable here even though first_name is mandatory in the product.
-- The API rejects a missing first name with a 400 and a message naming the
-- field, which the modal shows against that input. A NOT NULL column would
-- turn the same mistake into a 500 with nothing useful to display, and the
-- only writer is /api/profile.
--
-- Run this once against the project database.

alter table user_profiles add column if not exists first_name text;
alter table user_profiles add column if not exists last_name  text;

-- Rows are looked up by identity and listed by recency. The admin search does
-- reach the name, but over a table this size a sequential scan is cheaper than
-- an index to maintain; revisit if it grows past a few tens of thousands.
