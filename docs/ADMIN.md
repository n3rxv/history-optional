# Atlas: the History Optional CMS

The admin panel. This document is the contract for how it is built, so that
adding to it later is a matter of following a pattern rather than rediscovering
one.

Status: **all ten surfaces built.** Mockups are at `design/admin-atlas.html` and
`design/admin-board.html`, both gitignored and opened locally. The previous
monolith is preserved at `app/admin-legacy/page.tsx` and reachable at
`/admin-legacy`, so there is always a known-good panel to fall back to.

---

## 1. The idea

Every general purpose CMS manages an *unbounded stream*: posts, documents,
issues, arriving forever. Their admins are therefore all variations on "a list,
newest first".

Our corpus is the opposite. It is **bounded and its shape is known in advance**:
two papers, four sections, 51 syllabus topics, defined in `lib/notes.ts`. We are
not publishing a feed, we are filling in a map. The interesting question is never
"what is newest" but "what is still thin".

So the home surface is the syllabus itself, rendered as a coverage map. A tile
per topic, banded by section, each carrying its state and its counts. The design
earns its keep on lines like *"Vijayanagara has 9 PYQs and no note"*, which a
list of documents can never tell you.

---

## 2. Architecture

```
app/admin/
  layout.tsx            auth gate, wraps every surface
  page.tsx              /admin redirects to the home surface, preserving ?key=
  registry.ts           THE source of truth for surfaces
  admin.css             the CMS style layer, tokens only
  auth.ts               useAdminAuth and apiCall, extracted verbatim
  AuthGate.tsx          login screen and the gate
  AdminShell.tsx        top bar and the tab strip
  <surface>/page.tsx    one route per surface, so each code-splits
  surfaces/             Board, Notes, NoteEditor, Posts, Notifications,
                        Evaluations, Submissions, Phones, TopperCopies,
                        Analytics, Settings
  ui/
    index.tsx           Table, Chip, Figure, Sparkline, Meter, Axis, Empty
    Panel.tsx           a board module, draggable and resizable
    DataSurface.tsx     the shape every table surface shares
  lib/
    useResource.ts      the only place admin reads happen
    useBoardLayout.ts   board drag, resize and persistence
```

### 2.1 The surface registry

`app/admin/registry.ts` is the single source of truth. The rail, the command
palette and the router all read from it. Nothing else enumerates surfaces.

```ts
export type Surface = {
  id: string;              // URL segment, e.g. 'evaluations'
  label: string;           // rail label
  icon: string;            // rail glyph
  badge?: () => number;    // optional count shown in the rail
  commands?: Command[];    // contributed to Cmd-K
};
```

**All nine surfaces are equal peers.** There is no grouping, nesting or implied
hierarchy in the rail. This is deliberate: the panel's jobs are genuinely
co-equal and the nav should not imply otherwise.

### 2.2 Routes, not a tab variable

The previous admin was one client component switching on `tab === '...'`, so
every screen's code loaded even if you only opened Notes. Each surface is now its
own route under `app/admin/[surface]/`, which gives code splitting, deep links
and working browser back. The auth gate lives once in `app/admin/layout.tsx`.

URLs change from `/admin?key=...` to `/admin/notes?key=...`. The `?key=` and
password mechanism itself is unchanged.

### 2.3 Config-driven tables

Four surfaces are fundamentally tables (Evaluations, Submissions, Phone Numbers,
Topper Copies). They all use `ui/Table` with a column spec, so a table surface is
configuration rather than markup:

```ts
const columns: Column<Evaluation>[] = [
  { key: 'created_at', label: 'When',    render: r => relative(r.created_at), mono: true },
  { key: 'email',      label: 'User',    emphasis: true },
  { key: 'topic',      label: 'Topic' },
  { key: 'ms',         label: 'Latency', align: 'right', mono: true },
  { key: 'status',     label: 'Status',  align: 'right', render: r => <Chip tone={tone(r)} /> },
];
```

Adding a fifth data surface costs a config object and a registry entry.

### 2.4 Data layer

`lib/useResource.ts` wraps the admin fetches and returns list, search, sort,
paginate and mutate for one resource. Surfaces never call `fetch` directly.

### 2.5 Dependency rule

**Surfaces never import each other.** A surface may import from `ui/`, `lib/`
and shared app libraries, nothing else. This keeps the graph flat and means any
surface can be deleted or rewritten without touching another.

---

## 3. Design rules

These are enforced by `npm run design-lint`, `theme-check` and `font-check`.

**Tokens only.** No raw colour, ever, in admin code. A component may name a
semantic token (`--bg2`, `--text3`, `--accent-text`); it may not name a primitive
(`--black-800`, `--lapis-500`). This is what makes both grounds work by
construction rather than by inspection. The old admin hardcoded its own dark ramp
(`#080808`, `#0f0f0f`, `#1e1e1e`) which is exactly why light mode showed black
inputs on a white card.

**The tool speaks Inter, the content speaks Baskerville.** Chrome is
`--font-ui` at 11 to 13px with tight tracking. Every number, label and
identifier is `--font-mono` with `tabular-nums`. Editor content is `--font-body`
at the reader's exact size, so WYSIWYG is honest. You should always be able to
tell at a glance whether you are looking at the tool or at what a user will read.

**Colour only ever carries information.** The chrome is pure neutral. All colour
comes from data:

| Meaning | Token |
|---|---|
| Ancient India | `--ancient-text` |
| Medieval India | `--medieval-text` |
| Modern India | `--modern-text` |
| World History | `--world-text` |
| live / ok | `--success-text` on `--success-wash` |
| draft / slow | `--warning-text` on `--warning-wash` |
| empty / failed | `--danger-text` on `--danger-wash` |
| current selection, primary action | `--accent`, `--accent-text`, `--accent-wash` |

There is no decorative accent anywhere. If a colour is not telling you something,
it should not be on screen.

**One primary action per surface.** The primary is a solid `--accent` fill with
`--accent-on` over it. Everything else is tinted or ghosted. A tinted "primary"
reads as secondary, which is why the old panel had no visible primary at all.

**A tinted surface cannot carry its own shape.** Role washes measure only
1.1 to 1.5:1 against the ground, so a bordered tinted tile needs its edge at
**70%** of the role colour to clear 3:1 on both grounds. 70% is the solved
family-wide minimum; do not lower it.

**Accessibility.** Visible `:focus-visible` ring on every control, 4.5:1 for
text, 3:1 for non-text UI, and a `prefers-reduced-motion` guard on every
animation. Motion is 150 to 180ms and only on state change.

---

## 4. Adding a new surface

1. Create `app/admin/surfaces/Thing.tsx`.
2. Add one entry to `registry.ts`.
3. If it is a table, write a column spec and use `ui/Table`.
4. If it needs data, add a `useResource` call. Do not call `fetch` in the surface.
5. Run `npm run build`, which runs design-lint, font-check and theme-check.

The rail, the command palette and the route are all automatic from step 2.

---

## 5. Implementation phases

| Phase | Scope | Status |
|---|---|---|
| 0 | Local mockups | done |
| 1 | Shell, `admin.css`, `ui/` primitives, Board | done |
| 2 | Notes: the Atlas and the editor | done |
| 3 | Evaluations, Submissions, Phones, Topper Copies on `DataSurface` | done |
| 4 | Posts, Notifications, Analytics | done |
| 5 | Settings, accessibility, verification | done |

### Still to move across

- **Composing** a post, a notification edit, and a topper copy still happen in
  `/admin-legacy`. Read, filter, detail and delete are rebuilt; the create and
  edit forms for posts and topper copies are not.
- **No command palette yet.** `Surface` is shaped to carry a `commands` array
  but nothing reads that field.

**Every phase preserves the existing API calls and data hooks verbatim.** Only
the UI is new. The current implementation is kept as `page.legacy.tsx` until all
nine surfaces are live, so there is always a working admin to fall back to.

---

## 6. Verification

```bash
npx tsc --noEmit            # types
npm run design-lint         # token discipline, ratcheting per-file baseline
node scripts/theme-check.mjs  # every token defined for both grounds, every var() resolves
node scripts/font-check.mjs   # no font requested that is not actually served
npm run build               # runs all three, then next build
```

`design-lint` **ratchets**: it fails on an increase against
`scripts/design-lint-baseline.json`, not on any violation. Run
`npm run design-lint -- --update` only when an increase is deliberate, and say
why in the commit message.

---

## 7. Decisions on record

**The admin follows the site theme** rather than pinning to one ground. The
product is one system with two grounds and the admin is not an exception.

**Auth is unchanged.** `?key=` plus the password gate works exactly as before;
only the login screen's appearance is redesigned.

**`.site-editor` uses the site's real faces.** It previously set Lora, which the
site never loads, so the editor previewed a typeface that would never ship. It
now uses `--font-body` and `--font-display`.

**The syllabus is read from `lib/notes.ts`**, which already carries `slug`,
`title`, `paper`, `section`, `topic` ordinal, `description` and `subtopics[]`
for all 51 topics. The Atlas needs no new data model.


---

## 8. What the surfaces actually show

Every figure in the new panel is derived from rows the admin fetched. Nothing is
illustrative, because a dashboard you cannot trust is worse than no dashboard.
A figure with no value renders as a dash, and a failed endpoint says
`failed (403)` rather than showing zero.

Two consequences, both of which make a panel less exciting than its mockup:

**The Atlas distinguishes "edited in CMS" from "shipped default", not draft from
published.** All 51 topics already ship with content in `lib/noteContent.ts`, and
`note_overrides` has no status column, so there is no editorial state to read.
Adding one is a small migration and would make the Atlas considerably more
useful than it currently is.

**There is no PYQ-per-topic panel.** The best thing in the mockup was a list of
topics with questions asked and no note written. No verified mapping from a PYQ
to a syllabus topic was found, and inventing those counts would have meant
writing notes against fictional gaps.

## 9. Repairs made during the rebuild

Reading the old source turned up damage from an earlier colour sweep. Recorded
here because the cause generalises.

**Six emoji were destroyed.** `&#128221;` (memo), `&#128279;` (link) and
`&#127942;` (trophy) had become `&var(--success-text);` and rendered as that
literal text on live PYQ pages, not only in the admin. A numeric HTML entity's
digits are all valid hex characters, so `#128221` inside `&#128221;` matched a
colour regex. Any three or six digit numeric entity was vulnerable, which is
every emoji entity. `design-lint` now carries a zero-tolerance rule for this,
and `raw-color` uses `(?<!&)` so it no longer counts entities as colours.

**An example hex in user-facing prose was rewritten.** The toolbar's colour
prompt read `Hex color (e.g. var(--danger-text)):`. Restored to `#e63946`.

**Fifty-two values were neutrals misclassified as roles.** The sweep's guard was
`s < 0.18 || l < 0.06 || l > 0.96`, far too loose. The Find pill's
`rgba(10,14,26,0.95)` has S 44% and L 7%, so it cleared the floor by one point
and became the accent; the admin's cream `#f5f0e8` has S 39% and L 94% and
became amber, which is why every admin heading turned brown. A workable guard is
closer to `s < 32 || l < 20 || l > 88`.

**A rename reads as a regression.** `design-lint` keys its baseline by file
path, so moving `app/admin/page.tsx` to `app/admin-legacy/page.tsx` presented
as a fresh set of violations. Re-baselining is correct for a rename, but it
means a rename can mask a real regression in the same commit.

---

## 10. Payload CMS

The hand-built panel did not look good enough to keep as the editing surface, so
editorial content moves to **Payload CMS**. This section is the record of why and
of how it is wired.

### Why Payload and not the alternatives

Payload is MIT licensed, self-hosted, installs *into* this Next.js app rather
than beside it, and runs against **our existing Supabase Postgres**. So there is
no new bill, no second deployment, no second host, and no second datastore.

- **Sanity** has a good free tier and embeds well, but content would live in
  Sanity's datastore, giving two sources of truth, and it cannot see the
  operational tables at all.
- **Ghost** is a whole platform with its own database; self-hosting needs a
  server and Ghost(Pro) is paid.
- **Directus** is the better fit for the *operational* tables because it
  introspects an existing database, but it is a separate Node service and the
  genuinely free hosting for that sleeps or expires.
- **Strapi** brings its own schema and its own hosting.

Compatibility was checked rather than assumed: Payload supports Next.js 16.2.x
from 3.73.0 onward, and this app is on Next 16.2.11, React 19.2.3, Payload 3.89.

### How it is wired

| Piece | Value |
|---|---|
| Admin URL | `/cms` (not `/admin`, which is the hand-built panel) |
| API URL | `/cms-api` (not `/api`, which has forty-odd app routes) |
| Database | `@payloadcms/db-postgres` against `DATABASE_URL` |
| Editor | `@payloadcms/richtext-lexical` |
| Config | `payload.config.ts` at the repo root, aliased `@payload-config` |
| Route group | `app/(payload)/` — framework boilerplate, not meant to be edited |
| next.config | wrapped with `withPayload(nextConfig)`; the app config is unchanged |

Collections: `cms_users` (auth), `notes`, `articles`, `announcements`. Notes and
articles have drafts and versions enabled.

**Payload owns the tables it creates.** They are additive. Nothing it does
touches `note_overrides`, `answer_evaluations`, `contact_submissions`,
`user_profiles`, `topper_copies`, `posts` or `notifications`.

### Connecting it: four things that each had to be solved

`/cms` now returns 200. Getting there turned up four separate problems, all
worth recording because each would otherwise be rediscovered.

**1. The direct connection host is IPv6-only.** `SUPABASE_DB_URL` already held a
working-looking string for `db.<ref>.supabase.co:5432`, but that hostname
publishes only an AAAA record, so it fails with `ENOTFOUND` from an IPv4
network. That is precisely what Supabase's **paid** IPv4 add-on exists to sell.
Do not buy it: the *pooler* host, `aws-1-ap-south-1.pooler.supabase.com`,
publishes A records and works for free. The pooler also uses the same database
password, so the string can be derived from `SUPABASE_DB_URL` rather than
fetched.

**2. Transaction mode breaks Drizzle.** Port 6543 parses a prepared statement on
one backend connection and executes it on another, which surfaces as
`there is no parameter $1`. `?pgbouncer=true` does not help, because that is a
Prisma flag and node-postgres ignores it. So `DATABASE_URL` uses the **session
pooler on 5432**. `DATABASE_URL_SESSION` is kept as the same value and is what
migrations run against.

**3. Payload's boot introspection crashes on this database.** It queries primary
keys across the schema and fails on a table with a composite primary key
([payloadcms/payload#12858](https://github.com/payloadcms/payload/issues/12858)).
This database has one, `topper_copy_pyq_map` with a 2-column key, and
`user_profiles` has no primary key at all. The fix is
`postgresAdapter({ schemaName: 'payload' })`, so Payload lives in its own
Postgres schema and never looks at the app's tables. That also makes the
separation absolute rather than a matter of naming.

**4. The CLI needs the project to be ESM.** `@payloadcms/richtext-lexical` is an
ESM module with top-level await and the Payload CLI loads the config through
`require()`, giving `ERR_REQUIRE_ASYNC_MODULE`. `package.json` now has
`"type": "module"`. Three stray one-off patch scripts at the repo root
(`apply_login_gates`, `fix_note_gate`, `patch_note_gate2`) were CJS and were
renamed to `.cjs`; nothing references them.

One self-inflicted bug along the way: the `articles.kind` field had
`defaultValue: 'note'` while its options are `current-affairs` and `new-note`,
so the DDL emitted a default the enum did not contain. Also note that
`migrate:create` diffs against the `.json` snapshots in `migrations/`, so
deleting only the `.ts` file produces a partial diff rather than a fresh
migration. Delete the whole directory.

### Running it

```bash
# migrations run against the session pooler
DATABASE_URL="$DATABASE_URL_SESSION" npx payload migrate
npm run dev          # then open /cms?key=...
```

The `payload` schema must exist before the first migration:
`CREATE SCHEMA IF NOT EXISTS payload`.

### Verified state

17 Payload tables live in the `payload` schema. Every app table is untouched,
confirmed by row counts after migrating: `topper_copies` 814, `contact_submissions`
296, `user_profiles` 159, `note_overrides` 38, `notifications` 8, `posts` 4,
`answer_evaluations` 5. `/cms` 200, `/cms` without a key 404, `/admin/board` 200,
`/admin-legacy` 200, the public site 200, `tsc` clean, all three design checks
passing, `next build` compiling.

### The intended end state

Three things exist right now and that is one too many. The plan:

- **Payload at `/cms`** becomes the editing surface for notes, articles and
  announcements. This is where a designed UI actually matters.
- **The panel at `/admin`** keeps the operational surfaces Payload cannot
  manage, because those tables are not Payload's: Evaluations, Submissions,
  Phone Numbers, Topper Copies, and the Board that reads across them.
- **`/admin-legacy` is deleted** once the note and article editors are proven in
  Payload and the content is migrated.

Migrating note content is the real work: 51 notes exist as HTML in
`note_overrides` plus shipped defaults in `lib/noteContent.ts`, and Payload's
Lexical editor stores a node tree, not HTML. `@payloadcms/richtext-lexical`
ships `convertHTMLToLexical` for exactly this. Until that runs, the site keeps
reading `note_overrides` and nothing changes for readers.

### Security note

The middleware returned 404 for `/admin` and `/admin/*` unless a cookie or
`?key=` was present. `/admin-legacy` does not match `startsWith('/admin/')`, so
renaming the old panel silently took it outside that gate. The check is now an
explicit list, `['/admin', '/admin-legacy', '/cms', '/cms-api']`, and a comment
records why a prefix test was the wrong shape.


---

## 11. Two root layouts

The first time `/cms` was opened in a browser it rendered broken, with React
reporting `<main> cannot contain a nested <html>` followed by `insertBefore`
and `removeChild` crashes.

**Cause.** A route group does not escape the root layout. `app/layout.tsx`
applied to everything under `app/`, so Payload's `(payload)/layout.tsx`, which
renders its own `<html>`, `<head>` and `<body>`, was mounted *inside* the site's
`<main>`, after the Navbar. Two documents in one document.

**Fix.** Next.js supports multiple root layouts only when there is no
`app/layout.tsx` and each top-level group owns one. So the app's own routes moved
into `app/(frontend)/`, which now holds the former root layout, `page.tsx` and
`globals.css`. `app/` itself holds only `(frontend)`, `(payload)`, `api`,
`sitemap.xml` and `favicon.svg`.

**Route groups do not appear in URLs**, so this changed nothing a user can see.
Proven two ways: no built route contains a literal `(frontend)` or `(payload)`
segment, and the design-lint totals were byte-identical before and after the move
(raw-color 676, off-scale-space 644, off-scale-radius 99, hardcoded-font 11),
which only holds for a pure rename.

Two scripts had the old paths baked in and now resolve them:
`theme-check.mjs` and `font-check.mjs` looked for `app/globals.css` and
`app/layout.tsx`.

`git mv` silently skipped `app/admin` because the new panel is still untracked;
it needed a plain `mv`.

## 12. The gate has to issue a cookie

Gating `/cms` on `?key=` alone 404'd the CMS's own traffic, because Payload's
client navigations and its `/cms-api` fetches carry no query string. The log
showed `/cms/login` and `/cms-api/cms_users/me` both returning 404, so it could
never reach a login screen.

Passing the gate now sets a short-lived `admin_gate` cookie (httpOnly, lax,
8 hours, secure in production) and later requests present that instead. Payload's
own auth is what actually protects the data; this gate only keeps the panel from
being discoverable.

Verified: `/cms?key=` 200 and sets the cookie, `/cms/login` 200 on the cookie
alone, `/cms-api/cms_users/me` 200, `/cms` with neither 404, and the public site
unaffected.


---

## 13. Everything in /cms

Payload owns its schema, so it cannot point at a table the app writes to. That
left six screens with nowhere to go. They are now **custom admin views** inside
Payload rather than a second panel.

| /cms route | Reads |
|---|---|
| `/cms/collections/notes` | Payload `notes` (drafts, versions) |
| `/cms/collections/articles` | Payload `articles` (drafts, versions) |
| `/cms/collections/announcements` | Payload `announcements` |
| `/cms/overview` | `note_overrides`, `answer_evaluations`, `contact_submissions`, `topper_copies` |
| `/cms/evaluations` | `answer_evaluations` |
| `/cms/submissions` | `contact_submissions` |
| `/cms/phones` | `user_profiles` |
| `/cms/topper-copies` | `topper_copies` joined to `topper_copy_pyq_map` |
| `/cms/operations` | Backups, through Payload's own REST API |

**They are server components that query Supabase directly.** The `/api/admin`
routes are gated by the old admin token, which a Payload session does not carry.
Payload's own auth already gates everything under `/cms`, so the service client
is the right level. `views/data.ts` is `server-only` and contains no writes.

**They are styled with Payload's own theme variables**, not ours:
`--theme-elevation-*`, `--theme-border-color`, `--theme-success/error/warning-*`
and `--base`. So they follow Payload's light and dark modes with no work, and
sit flush with the collections beside them. This is the one place in the repo
that deliberately does not use our design tokens, because it is inside someone
else's design system.

Registration is `admin.components.views` plus `afterNavLinks` in
`payload.config.ts`, resolved through the import map. Adding another view is a
file, a registry entry, and `npx payload generate:importmap`.

### Checking the schema, not guessing it

Three of the field names taken from the old panel's source were wrong, and were
only caught by reading `information_schema`:

- `answer_evaluations` has no `word_count` and no `name`. It has `pages`,
  `firebase_uid`, `lang`, `timings`.
- `contact_submissions` has no `title` and no `link`. It has `page`.
- `user_profiles` has no `awaiting_phone` and no `email`. It has `verified`,
  `visitor_id`, `user_id`.

### /admin is gone, /admin-legacy is not

`/admin` returned 404 after removal; every one of its surfaces now exists in
`/cms`. Its source is kept at
`<scratchpad>/admin-panel-backup` (33 files) because it was never committed.

**`/admin-legacy` has to stay for now.** Payload's collections are empty
(0 notes, 0 articles, 0 announcements) while the content still lives in
`note_overrides` (38 rows) and `notifications` (8 rows), and the site still
reads those. Until the content migration runs, `/admin-legacy` is the only
working note editor. It also still holds the topper-copy editor and the PYQ
picker, which are the only write paths not yet ported.


---

## 14. Content migration

`scripts/cms/migrate-content.mjs` moves editorial content from the app's tables
into Payload. It is **additive, re-runnable and read-only against the app**: it
never writes to `note_overrides`, `notifications` or `posts`, and running it
twice updates rather than duplicates because every collection is keyed on a
stable slug.

```bash
DATABASE_URL="$DATABASE_URL_SESSION" npx tsx scripts/cms/migrate-content.mjs --dry
DATABASE_URL="$DATABASE_URL_SESSION" npx tsx scripts/cms/migrate-content.mjs
```

Notes take their body from the CMS override where one exists and the shipped
default in `lib/noteContent.ts` otherwise, so all 51 arrive with content rather
than only the 38 that had been edited.

### HTML to Lexical

Content is HTML and Lexical stores a node tree, so each body goes through
`convertHTMLToLexical` from `@payloadcms/richtext-lexical`, which needs a
`JSDOM` constructor and a sanitized editor config from `editorConfigFactory`.
`jsdom` was already present as a transitive dependency, so nothing new was
installed.

Fidelity was measured before writing anything, on `mauryan-empire`:

```
source text    31,796 chars
lexical text   30,779 chars   97% retained
node types     heading:33  paragraph:15  list:58  listitem:229  text:569
```

Structure survives, and the 3% is whitespace normalisation. The script also
flags any note whose converted tree is less than half the size of its source
text, so a silent conversion failure cannot pass unnoticed. Nothing was flagged.

### Result

| | |
|---|---|
| `payload.notes` | 51, with 244 subtopic rows |
| `payload.articles` | 4 |
| `payload.announcements` | 8 |
| empty notes | 0 |
| duplicate slugs | 0 |
| `public.note_overrides` | 38, unchanged |
| `public.notifications` | 8, unchanged |
| `public.posts` | 4, unchanged |

### What this does not do yet

**The site still reads the old tables.** Readers are unaffected, which is the
point: the migration is safe to run and verify before anything user-facing
changes. Switching `app/(frontend)/notes/[slug]` and the posts pages to read
from Payload is a separate step, and it is the one that carries risk.

Until that happens both copies exist and can drift. Editing a note in `/cms`
changes Payload's copy only; editing it in `/admin-legacy` changes
`note_overrides` only, and that is the copy readers see. **Use one or the
other, not both**, and re-running the migration overwrites Payload's copy from
the app's tables.


---

## 15. The reader switch

`lib/payloadNotes.ts` serves note bodies from Payload, converting Lexical back
to the HTML the reader already styles. Both read paths now ask Payload first:

- `app/(frontend)/notes/[slug]/page.tsx`, the server-rendered body
- `app/api/note-content/route.ts`, the client refetch and language switch

**Every caller falls back to the old path.** If Payload has no published
document, or the conversion returns something near-empty, or anything throws,
the reader gets exactly what shipped before. `NOTES_FROM_PAYLOAD=0` disables it
entirely without a deploy, and that was tested rather than assumed.

### Measured before switching

Round-tripping `mauryan-empire` through Lexical and back:

```
tags   h2 11/11   h3 18/18   p 15/15   strong 172/172   ul 58/58   h4 4/4
       li 209 -> 229 (nested list items flattened)
text   31,796 -> 30,992 chars, 97% retained
```

Lexical adds `class="list-bullet"` to lists and empty `class`/`style`/`value`
attributes to list items. Both are additive and the existing CSS is unaffected.

### It fixes a Hindi bug

`note_overrides` has no language column, so an English edit was served to Hindi
readers. Demonstrated live: with `NOTES_FROM_PAYLOAD=0`, `mauryan-empire`
returns 30,570 characters for **both** languages. With Payload on, Hindi
correctly returns 27,227 characters of Devanagari.

### Pooling, which had to be solved twice

The build prerenders 51 note pages and each opens a connection, so the session
pooler failed with `EMAXCONNSESSION, max clients are limited to pool_size: 15`.

The transaction pooler on 6543 is the right endpoint for that, and it works now
even though it failed earlier: the original `there is no parameter $1` was the
boot introspection scanning `public`, which `schemaName: 'payload'` fixed. The
adapter pool is also capped at `max: 8` so a build cannot exhaust the pooler.

| | |
|---|---|
| `DATABASE_URL` | pooler **:6543**, transaction, runtime |
| `DATABASE_URL_SESSION` | pooler **:5432**, session, migrations |

Build: 0 connection errors, 103 routes (down from 113 because `/admin` went).

### Where that leaves /admin-legacy

Readers now come from Payload, so **`/cms` is the place to edit notes**. Editing
in `/admin-legacy` writes `note_overrides`, which nothing reads any more unless
the kill switch is on.

`/admin-legacy` can be deleted once you are satisfied with a week of reading
from Payload. Keeping it a little longer costs nothing and is the whole reason
the fallback exists.
