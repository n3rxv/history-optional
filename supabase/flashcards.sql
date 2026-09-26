-- Flashcards, moved out of the JavaScript bundle.
--
-- They lived in lib/flashcards.ts as a TypeScript literal, imported by
-- app/(frontend)/flashcards/page.tsx -- which is a client component, so every
-- card shipped to every visitor's browser. At 55 cards and ~3 KB each
-- (English plus Hindi) that is 172 KB, which is survivable. It does not
-- scale: 500 cards is ~1.5 MB and 2,000 is ~6 MB of JavaScript, which is not
-- something to send a student on mobile data.
--
-- The data itself is tiny by database standards -- 2,000 cards is about 6 MB,
-- against the 30 MB this instance now holds in total -- so Postgres is the
-- right home. It also makes cards editable without a deploy, and gives
-- generated cards somewhere to sit for review before going live.
--
-- Run this once against the project database.

create table if not exists flashcards (
  -- Text ids, matching the existing 'a001' scheme. This matters: the study
  -- page keys its spaced-repetition state on card id in localStorage, so
  -- preserving ids means nobody loses their review progress in the move.
  id              text primary key,

  topic           text     not null,   -- slug from lib/notes.ts
  paper           smallint not null,
  section         text     not null,
  type            text     not null,
  front           text     not null,
  back            text     not null,
  front_hi        text,
  back_hi         text,

  -- Provenance. Cards generated from the book corpus record where they came
  -- from, so a questionable card can be traced back to the passage that
  -- produced it rather than argued about from memory.
  source_book     text,
  source_author   text,
  source_chunk_id bigint,

  -- Generated cards land as 'draft' and are only served once reviewed. The
  -- read policy below enforces that, so an unreviewed card cannot reach a
  -- student even if some query forgets to filter.
  status          text not null default 'published',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint flashcards_paper_check  check (paper in (1, 2)),
  constraint flashcards_type_check   check (type in ('historian','comparison','cause-effect','quote','concept')),
  constraint flashcards_status_check check (status in ('draft','published','archived'))
);

-- The study page filters on section and type, and counts what is due across
-- the whole published set.
create index if not exists flashcards_status_section_idx on flashcards (status, section);
create index if not exists flashcards_status_type_idx    on flashcards (status, type);
create index if not exists flashcards_topic_idx          on flashcards (topic);

-- Keep updated_at honest without every caller remembering to set it.
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists flashcards_set_updated_at on flashcards;
create trigger flashcards_set_updated_at
  before update on flashcards
  for each row execute function set_updated_at();

-- ── Row level security ──────────────────────────────────────────────────────
-- Same shape as posts: public reads published rows, writes are service role
-- only. Studying does not require an account, so reads are open to anon.
alter table flashcards enable row level security;

drop policy if exists "read published flashcards" on flashcards;
create policy "read published flashcards" on flashcards
  as permissive for select to anon, authenticated
  using (status = 'published');

drop policy if exists "service role manages flashcards" on flashcards;
create policy "service role manages flashcards" on flashcards
  as permissive for all to service_role
  using (true) with check (true);
