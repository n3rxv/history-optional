-- Copies that came already evaluated.
--
-- Many topper copies are test-series booklets that the coaching institute
-- marked before the topper or the institute published them: a score circled at
-- the end of each answer and the examiner's remarks in the margin (GS Score,
-- several Drishti IAS sets, a few others). Students ask for these to see how
-- answers are marked, so the topper copies page can filter on this column.
--
-- The marks are the coaching examiner's, not UPSC's.
--
-- Values were set on 2026-11-23 from a page-by-page check of every booklet.
-- The list of copies is kept outside this repo because it holds R2 object keys.
-- New copies default to false: set it when a newly added booklet carries marks.

alter table topper_copies
  add column if not exists evaluated boolean not null default false;

comment on column topper_copies.evaluated is
  'The copy carries a test-series examiner''s marks or remarks (not UPSC''s).';
