-- One PDF can hold several questions, so a card has to say where to open it.
--
-- GS Score booklets print three questions on one page, 3.(a), 3.(b), 3.(c),
-- and the candidate answers all three in the same booklet, one after another.
-- Cutting those pages into separate PDFs is risky, because an answer can begin
-- partway down a page and a cut in the wrong place leaves the reader without
-- the answer they paid for.
--
-- So all three questions point at the same PDF, and this column records the
-- page that question's answer starts on. The viewer scrolls there on open.
-- A page number that is slightly off does no harm: the answer is still in the
-- PDF and the reader scrolls a little either way.
--
-- NULL or 1 means open at the beginning, which is correct for every older row.

alter table topper_copies
  add column if not exists start_page integer;

comment on column topper_copies.start_page is
  'Page of the PDF where this question''s answer begins. NULL = first page.';
