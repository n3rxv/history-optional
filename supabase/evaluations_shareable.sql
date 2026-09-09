-- Opt-in flag for showing a real evaluation publicly.
--
-- The three evaluations on file belong to two readers, not to us. Their answer
-- scripts are their own work and the Privacy Policy says their data is used to
-- run the platform, not to advertise it. So nothing is public by default: a
-- row appears on the homepage only when this is deliberately set to true for
-- an evaluation whose author has agreed, or one we wrote ourselves.

alter table answer_evaluations
  add column if not exists shareable boolean not null default false,
  -- Shown instead of the author's email. "Aditya, AIR aspirant" or just
  -- "A reader"; never auto-filled from the account.
  add column if not exists share_label text;

create index if not exists answer_evaluations_shareable_idx
  on answer_evaluations (created_at desc)
  where shareable = true;
