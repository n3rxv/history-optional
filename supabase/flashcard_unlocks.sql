-- The free allowance for flashcard answers.
--
-- The rule is a quota of cards, not a fixed free subset: a reader may open the
-- answer of any hundred cards in the deck, whichever hundred they choose, and
-- after that the answers are premium. Fronts stay free for everybody, so the
-- whole deck remains browsable and the reader spends their allowance on cards
-- they actually want.
--
-- Two consequences shape the design:
--
--   * An unlock has to be remembered per card, not counted. Spaced repetition
--     shows the same card again and again; if re-opening a card you have
--     already unlocked spent another unit, a hundred unlocks would be gone in
--     a week of ordinary revision and the allowance would not mean what it
--     says. So this stores the set of cards unlocked, and re-opening one is
--     free forever.
--
--   * It has to be atomic. supabase/usage_counters.sql documents what the
--     select-then-update shape cost us elsewhere: ten parallel requests all
--     read the same count, all passed the check, and all wrote count+1. The
--     same race here would hand out an unbounded allowance to anyone willing
--     to fire requests in parallel, so the check and the insert happen in one
--     statement under an advisory lock.
--
-- Identity follows usage_tracking: a row carries the Firebase uid, the device
-- fingerprint, or both, and a reader is whoever matches either. Signing in on
-- a device that has already spent its allowance therefore does not hand out a
-- fresh one, and clearing cookies does not either if you are signed in.
--
-- Run this once against the project database.

create table if not exists flashcard_unlocks (
  id           bigserial primary key,

  -- At least one must be present; see the check below. Both are stored when
  -- both are known, so the two identities converge on one row rather than
  -- accumulating a second allowance.
  firebase_uid text,
  fingerprint  text,

  card_id      text not null references flashcards(id) on delete cascade,
  created_at   timestamptz not null default now(),

  -- An unlock with no owner would be an allowance granted to nobody, which in
  -- practice means an allowance granted to everybody.
  constraint flashcard_unlocks_identity_check
    check (coalesce(firebase_uid, '') <> '' or coalesce(fingerprint, '') <> '')
);

-- One row per identity per card. Partial, because a row may carry only one of
-- the two identities and NULLs would otherwise not collide.
create unique index if not exists flashcard_unlocks_uid_card_idx
  on flashcard_unlocks (firebase_uid, card_id) where firebase_uid is not null;
create unique index if not exists flashcard_unlocks_fp_card_idx
  on flashcard_unlocks (fingerprint, card_id) where fingerprint is not null;

-- ── Spending the allowance ──────────────────────────────────────────────────
-- Returns a row per requested card saying whether the reader may see its
-- answer. Cards already unlocked cost nothing; new ones cost one unit each
-- until the limit is reached, after which they come back denied rather than
-- raising, so a reader at the limit sees a paywall and not an error.

create or replace function unlock_flashcards(
  p_uid   text,
  p_fp    text,
  p_ids   text[],
  p_limit integer
) returns table (out_card_id text, out_granted boolean, out_used integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_have  text[];
  v_used  integer;
  v_valid text[];
  v_id    text;
  k_uid   bigint;
  k_fp    bigint;
begin
  -- Nothing to attribute the spend to. Denying is the only safe answer: a
  -- caller sending neither identity would otherwise read the whole deck by
  -- omitting two headers.
  if coalesce(p_uid, '') = '' and coalesce(p_fp, '') = '' then
    return query select unnest(coalesce(p_ids, '{}'::text[])), false, 0;
    return;
  end if;

  -- Only ids that exist and are live. Anything else would fail the foreign
  -- key mid-loop and abort a request that should simply have denied it.
  select coalesce(array_agg(f.id), '{}'::text[])
    into v_valid
    from flashcards f
   where f.id = any(coalesce(p_ids, '{}'::text[])) and f.status = 'published';

  -- Serialize concurrent requests for this reader, taking the two locks in a
  -- deterministic order so two requests presenting the same pair cannot
  -- deadlock. Transaction-scoped: released at commit.
  k_uid := hashtext('fcunlock:uid:' || coalesce(p_uid, ''));
  k_fp  := hashtext('fcunlock:fp:'  || coalesce(p_fp, ''));
  if coalesce(p_uid, '') <> '' and coalesce(p_fp, '') <> '' then
    perform pg_advisory_xact_lock(least(k_uid, k_fp));
    perform pg_advisory_xact_lock(greatest(k_uid, k_fp));
  elsif coalesce(p_uid, '') <> '' then
    perform pg_advisory_xact_lock(k_uid);
  else
    perform pg_advisory_xact_lock(k_fp);
  end if;

  select coalesce(array_agg(distinct u.card_id), '{}'::text[])
    into v_have
    from flashcard_unlocks u
   where (nullif(p_uid, '') is not null and u.firebase_uid = p_uid)
      or (nullif(p_fp,  '') is not null and u.fingerprint  = p_fp);

  v_used := coalesce(array_length(v_have, 1), 0);

  foreach v_id in array coalesce(p_ids, '{}'::text[]) loop
    if v_id = any(v_have) then
      out_card_id := v_id; out_granted := true;

    elsif not (v_id = any(v_valid)) then
      -- Unknown or unpublished card: nothing to show and nothing to charge.
      out_card_id := v_id; out_granted := false;

    elsif v_used < p_limit then
      insert into flashcard_unlocks (firebase_uid, fingerprint, card_id)
      values (nullif(p_uid, ''), nullif(p_fp, ''), v_id)
      on conflict do nothing;
      v_have := v_have || v_id;
      v_used := v_used + 1;
      out_card_id := v_id; out_granted := true;

    else
      out_card_id := v_id; out_granted := false;
    end if;

    out_used := v_used;
    return next;
  end loop;
end;
$$;

-- ── Reading the allowance without spending it ───────────────────────────────
-- The study page prefetches a window of cards ahead of the reader. That window
-- must not spend anything -- the reader has not chosen those cards yet -- but
-- answers they have already unlocked should still arrive with the rest of the
-- card, so revision stays instant. This answers that question and writes
-- nothing.

-- Returns exactly one row. Returning a row per unlocked card would report a
-- count of zero to a reader who has spent their whole allowance but none of it
-- on the cards being asked about, because the filter would remove every row
-- carrying the count.
create or replace function flashcard_unlock_status(
  p_uid text,
  p_fp  text,
  p_ids text[]
) returns table (out_ids text[], out_used integer)
language sql
stable
security definer
set search_path = public
as $$
  with mine as (
    select distinct u.card_id
      from flashcard_unlocks u
     where (nullif(p_uid, '') is not null and u.firebase_uid = p_uid)
        or (nullif(p_fp,  '') is not null and u.fingerprint  = p_fp)
  )
  select
    coalesce(
      (select array_agg(m.card_id) from mine m
        where p_ids is null or m.card_id = any(p_ids)),
      '{}'::text[]
    ),
    (select count(*)::int from mine);
$$;

-- ── Access ──────────────────────────────────────────────────────────────────
-- PostgREST exposes both tables and functions to anyone holding the anon key,
-- which ships in the browser. A reader who could call unlock_flashcards
-- directly could pass any limit they liked, and one who could insert into the
-- table could grant themselves the deck.

alter table flashcard_unlocks enable row level security;

drop policy if exists "service role manages flashcard unlocks" on flashcard_unlocks;
create policy "service role manages flashcard unlocks" on flashcard_unlocks
  as permissive for all to service_role
  using (true) with check (true);

-- ── The hole this gate would otherwise leave open ───────────────────────────
-- Everything above meters answers at the API. None of it matters while the
-- answers themselves are readable straight from PostgREST: the anon key is
-- public -- it is NEXT_PUBLIC_ and ships in every browser -- and the flashcards
-- read policy grants anon every column of every published row, answers
-- included. Verified before this revoke existed: a plain
-- `select id,back from flashcards` with the anon key returned the text.
--
-- Row level security cannot fix this, because the problem is a column and RLS
-- works on rows. Column privileges can -- but not by revoking the two columns,
-- which is the obvious move and does nothing. Postgres keeps table-level and
-- column-level privileges as separate grants, and a table-level SELECT already
-- covers every column, so `revoke select (back, back_hi)` removes a
-- column-level grant that was never the thing authorising the read. Verified:
-- after that revoke, `select id,back from flashcards` with the anon key still
-- returned the text.
--
-- The table-level grant has to go first, and then exactly the public columns
-- are granted back. `status` is among them because the queries filter on it and
-- Postgres requires select privilege on a column named in a WHERE clause.
-- lib/flashcardStore.ts reads the answers with the service key instead.

revoke select on flashcards from anon, authenticated;

grant select (
  id, topic, paper, section, type,
  front, front_hi,
  source_book, source_author, source_chunk_id,
  status, created_at, updated_at
) on flashcards to anon, authenticated;

-- Note for later: creating or altering this table through the Supabase
-- dashboard can re-apply a blanket `grant select on all tables in schema public
-- to anon`, which would silently restore the leak. If answers ever become
-- readable with the anon key again, this is the first thing to check.

revoke all on function unlock_flashcards(text, text, text[], integer) from public, anon, authenticated;
revoke all on function flashcard_unlock_status(text, text, text[])    from public, anon, authenticated;
grant execute on function unlock_flashcards(text, text, text[], integer) to service_role;
grant execute on function flashcard_unlock_status(text, text, text[])    to service_role;
