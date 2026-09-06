-- Keeps what students submitted for evaluation, so it can be read in the admin
-- panel instead of in the server logs.
--
-- /api/evaluate printed the OCR transcript and the model's chain-of-thought to
-- the console. Both contain the student's handwritten answer verbatim, which
-- put readers' work in Vercel's log stream — readable by anyone with project
-- access, retained on their schedule, and impossible to search or delete per
-- person. It was also the only copy: once the response was rendered, the
-- answer, the question and the marking existed nowhere.
--
-- Storing it deliberately is both the privacy fix and the feature. The row is
-- reachable only through the service-role key behind an admin session.

create table if not exists answer_evaluations (
  id            uuid primary key default gen_random_uuid(),
  firebase_uid  text,
  email         text,
  question      text not null,
  marks_out_of  text,
  marks_awarded numeric,
  -- What the student actually wrote: the client's extracted text when the
  -- answer was typed, otherwise the OCR transcript of their handwriting.
  answer_text   text,
  -- The full marking, so the panel can show what feedback was given and not
  -- just the score.
  evaluation    jsonb,
  pages         integer,
  lang          text,
  created_at    timestamptz not null default now()
);

-- The panel's default view, and "show me this reader's history".
create index if not exists answer_evaluations_recent_idx
  on answer_evaluations (created_at desc);
create index if not exists answer_evaluations_uid_idx
  on answer_evaluations (firebase_uid, created_at desc);
create index if not exists answer_evaluations_email_idx
  on answer_evaluations (lower(email));

-- Service-role only. RLS on with no policies denies every other client, which
-- matters more here than elsewhere: these rows are readers' own writing.
alter table answer_evaluations enable row level security;

-- ── Added 2026-09-06 ──────────────────────────────────────────────────────
-- How long the evaluation took, alongside what it produced.
--
-- The per-stage durations were emitted as one `[evaluate:timing]` log line and
-- nothing kept them, so answering "are we close to the 60s Vercel Hobby
-- ceiling?" meant running evaluations by hand and reading them out of the log
-- stream before it rolled over. Stored here, that question is a query, and the
-- sample grows on its own as readers use the product.

alter table answer_evaluations
  add column if not exists duration_ms integer,
  add column if not exists timings     jsonb;

-- "Which evaluations came closest to the ceiling" — the query that matters.
create index if not exists answer_evaluations_duration_idx
  on answer_evaluations (duration_ms desc nulls last);
