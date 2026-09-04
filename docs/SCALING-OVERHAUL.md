# Scaling overhaul — September 2026

A record of what was wrong, why it was wrong, and what replaced it. Written for
whoever touches this code next, including future-us.

Two things to take from it beyond the fixes themselves:

- **Several of these were deliberate decisions whose reason had expired.** The
  chat buffering and the evaluate pipeline were both built the way they were on
  purpose. Check `git log` before assuming something is an oversight — the
  reasoning is usually in a commit message.
- **Two bugs were found by things that were listening, not by reading code.**
  A Razorpay script had been blocked on every checkout for months, silently.
  Prefer changes that make failures visible over changes that assume success.

Dates are commit dates. Prior work on **2026-09-02** (`abccd55`, `3875bdf`,
`5fce3be`) is included because it is the same effort.

---

## 1. Payment plan could be forged
**2026-09-03 · `10327ad` · `app/api/razorpay/verify/route.ts`**

The route took the plan and the amount from the request body. The Razorpay
signature only proves `order_id` and `payment_id` belong together — it says
nothing about what was bought. So: create a ₹49 `daily` order, pay it, then
send `plan: "yearly"` to verify.

```ts
// before — the browser decides what it paid for
const { razorpay_order_id, razorpay_payment_id, razorpay_signature,
        fingerprint, plan, amount } = await req.json();
```

```ts
// after — Razorpay decides, from notes we wrote server-side in /order
const order = await razorpay.orders.fetch(razorpay_order_id);
const notes = (order.notes ?? {}) as Record<string, unknown>;
if (String(notes.user_id ?? '') !== firebaseUser.uid) return /* 403 */;
if (!isPlanId(notes.plan)) return /* 400 */;
if (Number(order.amount) !== planAmountPaise(notes.plan)) return /* 400 */;
```

`lib/plans.ts` is now the single price table both `/order` and `/verify` read,
so they cannot drift.

## 2. One payment could be replayed forever
**2026-09-03 · `10327ad` · `supabase/payment_events.sql`**

Nothing recorded that a payment had been acted on. Each replay took the current
`expires_at` as its base and added another term.

The ledger is claimed *before* any state changes, so a replay can never reach
the code that extends the subscription:

```ts
const { error: claimErr } = await db.from('payment_events').insert({
  payment_id: paymentId, order_id: orderId, firebase_uid: uid, plan, /* ... */
});
if (claimErr?.code === '23505') {
  // Already applied. Return the subscription as it stands — do not extend.
  return { ok: true, status: 'already_applied', /* ... */ };
}
```

Verified in production: a real payment produced exactly one ledger row despite
both the browser and the webhook processing it.

## 3. Payments could be taken without granting access
**2026-09-03 · `10327ad` · `app/api/razorpay/webhook/route.ts`**

Access was granted only if the browser survived long enough to call `/verify`.
Close the tab on the payment screen and the money was captured with nothing
granted.

Razorpay now reports the payment independently. Both paths call
`applySubscriptionPayment()` in `lib/subscriptionGrant.ts` — deliberately one
function, because two code paths granting subscriptions *will* drift on pricing
or expiry. The ledger makes whichever arrives second a no-op.

**Contract worth remembering:** a 2xx tells Razorpay to stop retrying. Return it
for events you deliberately ignore too, or they are redelivered forever.

## 4. The paid topper library was free
**2026-09-03 `4e2f45b` · 2026-09-04 `540618e`**

`/api/topper-copies/all` returned `drive_file_id` for all **376** PDFs with no
authentication, and the R2 bucket served any file to anyone holding a key. The
entitlement check on `/pyqs/topper/[id]` was decoration.

Two steps, because the first alone was not enough:

1. Listings stopped returning the key. That closed enumeration.
2. Keys already copied still worked forever, so `/api/topper-copies/[id]` now
   returns a **signed URL valid for five minutes**, issued only after the
   entitlement check — and the bucket's public development URL was **disabled**.

That last step is the one that actually revoked the leaked keys. Verified: the
public URL now returns 401 for a key that previously worked.

> R2 credentials live in `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` /
> `R2_SECRET_ACCESS_KEY` / `R2_BUCKET`. The account ID is **32 hex characters** —
> a truncated one produces `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`, not a 403,
> because Cloudflare wildcard-resolves the DNS but the certificate does not cover it.

## 5. Eight endpoints had no authentication
**2026-09-03 · `4e2f45b`**

Several spent money per call. Four had no callers anywhere and were deleted
outright — the best kind of fix:

| Deleted | Why it was dangerous |
|---|---|
| `device-session` | took `firebase_uid` from the body and deleted rows with a service-role key — anyone could sign out any user |
| `drive-proxy` | open proxy to any Google Drive file |
| `verify-firebase-token` | public token-validation oracle |
| `rag-search` | unauthenticated Voyage embedding spend |

`rag-search` had one caller: `/api/evaluate` POSTing to its own domain. That
became `lib/ragSearch.ts`, called in-process — which also fixed a live bug
where the URL fell back to `http://localhost:3000` when `NEXT_PUBLIC_SITE_URL`
was unset, so retrieval silently returned nothing in production.

The rest were gated. `check-map` was the worst: Claude Sonnet over a whole PDF
on a 120s budget, for anyone, and a free substitute for the paid ₹49 flow.

## 6. The free tier was bypassable, two ways
**2026-09-03 · `3f75867` · `supabase/usage_counters.sql`, `lib/usageQuota.ts`**

Every quota was a read-modify-write straddling the paid work:

```
select eval_count where firebase_uid = $1   -- returns 0
... call the LLM ...
update ... set eval_count = 0 + 1           -- writes 1
```

Ten simultaneous requests all read 0, all passed, all wrote 1.

Worse, the increment only ran when a Firebase token was present while the
*check* accepted a bare fingerprint — a header the client chooses. A fresh
value per request bought unlimited LLM calls.

Now `consume_usage()` does the compare and the increment in one statement under
an advisory lock, and runs **before** the work. `release_usage()` refunds when
the work then fails, which is what makes the inverted order safe.

Two more counters were not merely racy:

- **`topper-click`** issued an `UPDATE` against a row that does not exist for
  anyone never written to `usage_tracking`. It matched nothing, the counter
  never moved, and the five free previews were unlimited.
- **`/api/usage` POST** took the identity from the request body, so any caller
  could burn another user's quota by naming them. Returns 410 now.

**Rule this establishes:** meter before the work, refund on failure. Metering
afterwards is what created the race.

## 7. Every page shipped the entire notes library
**2026-09-03 · `8ec6ce4`, `519ccee`**

`SearchModal` imported `lib/noteContent` (3.3 MB) to substring-match note
bodies. It renders from `Navbar`, which is in the root layout — so **every page
on the site** shipped the whole corpus in case someone pressed ⌘K.
`NoteReader` separately imported both the English *and* Hindi corpora to render
one note.

| | Before | After |
|---|---|---|
| Homepage JS | 4,881 KB | **1,669 KB** |
| Note page JS | 10,391 KB | **1,715 KB** |
| Total client chunks | 14 MB | 8.5 MB |

Titles still match instantly client-side from `lib/notes` (small). Only body
search goes to `/api/search`. Note bodies come from `/api/note-content`, one
note in one language.

> **Side effect worth knowing:** admin note overrides now work in production.
> `/notes/[slug]` is statically generated, so the `note_overrides` row it read
> was frozen at build time — edits made in `/admin` were invisible until a
> redeploy.

## 8. Chat buffered the whole answer — on purpose, for a reason that had expired
**2026-09-03 · `26e2f3f` · `lib/citationGate.ts`**

`9f287ee` (20 Jun) stopped streaming deliberately. A streamed token cannot be
recalled, and the citation audit deletes historian attributions it cannot
substantiate — showing a student a fabricated citation and removing it a second
later is worse than showing nothing.

**That was correct while the audit made an API call over the finished text.**
`4042502` (31 Jul) disabled that verifier, leaving only local string matching
whose rules are all scoped to a single sentence. The buffer was costing 30–60
seconds of blank screen to satisfy a constraint that no longer existed.

`createSentenceGate()` keeps the guarantee — no sentence reaches the client
before it has been audited — and releases each one as it completes.

## 9. The anti-fabrication check was half-blind
**2026-09-03 · `26e2f3f`**

Splitting on `[.!?]` fragments this corpus badly, because the historians are
*R.C. Majumdar*, *D.N. Jha*, *K.A. Nizami*:

```
"R.C. Majumdar argues X."  ->  "R."  "C."  " Majumdar argues X."
```

Rule A only ever saw the last fragment. True of the buffered version too;
streaming merely made it visible. `sentenceEnd()` treats a single letter before
a full stop as an initial — **including when the preceding character is itself a
full stop**, which is the case that catches `R.C.`.

```ts
// a single letter before the stop is an initial: R. / C. / e.g. / B.C.
if (/(?:^|[\s(.])[A-Za-z]$/.test(before)) continue;
```

## 10. The HTML sanitizer was decorative
**2026-09-03 `a3b859c` · 2026-09-04 `b67629f`**

```ts
// before — both handler patterns require quotes
html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
```

Six payloads walk through, each now covered by a test that shows the old
version leaking it: `<img src=x onerror=alert(1)>`, `<svg/onload=…>`,
`<body onload=…>`, `<details open ontoggle=…>`, `<a href="java&#115;cript:…">`,
`<iframe srcdoc="…">`.

The input is model output built from RAG passages and uploaded PDFs — all
prompt-injectable. `dompurify` had been in `package.json` since the start and
was never imported. `app/posts/[slug]` had no sanitizing at all.

Note bodies use a **different** sanitizer (`lib/sanitizeNoteHtml.ts`,
`sanitize-html`) because they are server-rendered and DOMPurify needs a DOM.
Only admin-authored overrides are sanitized; the shipped corpus is not, because
anyone who can change version-controlled source already has repository access.

## 11. Razorpay's fraud detection had never worked
**2026-09-04 · `1181bbc`, `18980ba`**

Tightening the CSP was done report-only first, because being wrong about one
line in `checkout.js` breaks payments. It reported no `eval` violations — and
one thing nobody was looking for:

```
script-src-elem blocked
https://cdn.razorpay.com/static/cx/razorpay-risk-detection/bundle.js
```

The allowlist had `checkout.razorpay.com` but never `cdn.razorpay.com`.
Razorpay's risk-detection bundle had failed to load on **every checkout since
the policy was written**. Payments completed, so nobody noticed.

**`report-uri` now stays on the enforcing policy permanently.** That bug was
invisible for months and took ten minutes to find once something was listening.

`unsafe-inline` remains: removing it needs hashes for the three inline scripts
in `app/layout.tsx`, because nonces would force all 26 prerendered pages to
render per request.

## 12. Analytics rewrote a whole row per pageview
**2026-09-04 · `0e9d2d0` · `supabase/track_visit.sql`**

`SELECT`, mutate in JavaScript, write the whole row back — two round trips per
pageview on the busiest endpoint, and racy: two tabs both read "no row" and
both `INSERT`, with no unique constraint to stop them. **It had already
happened** — one visitor held two rows with their 64 visits split across them.

`record_visit()` does it in one `INSERT ... ON CONFLICT`. The migration merges
the split rows first, then adds the unique index.

Two things the old logic got wrong that the SQL now handles: a later ping could
overwrite a known device or country with `'unknown'`, and `pages_visited` grew
with whatever path string the browser sent (capped at 200 now).

`VisitorTracker` also loaded FingerprintJS twice on a first visit, leaked two
event listeners on unmount, and used `require()` inside a client component.

## 13. The database schema existed nowhere
**2026-09-03 · `3228d9f` · `scripts/dump-schema.sh`**

It lived only in the Supabase dashboard. That cost us twice in one afternoon: a
migration had to be written without knowing `usage_tracking.fingerprint` is
`NOT NULL`, and two deploys went out against functions that had never been
created.

```
./scripts/dump-schema.sh    # needs SUPABASE_DB_URL in .env.local
```

Writes `supabase/schema.sql` — 27 tables, 48 constraints, 18 indexes, 8
functions, RLS on every table, 33 policies. No data, ever. **Run it after any
schema change and commit the result.**

`pg_dump` is deliberately not used: Homebrew ships v14 against a newer server
and refuses that pairing. Extension-owned functions are filtered out —
`pgvector` installs ~95 into `public`.

> Found while reading the result: `increment_eval_count` and
> `increment_chat_count` already existed, properly atomic, and **nothing had
> ever called them**. The routes did read-then-write instead. Superseded by
> `consume_usage`, but they are still there and can be dropped.

## 14. Evaluate — optimised without touching a prompt
**2026-09-04 · `ee7a4fe`, `6bc66a3`**

`git log` shows an optimisation sprint on 30 July reverted nine minutes after
its last commit (`e611e0f`), keeping only the removal of Pass 4. What was
thrown away was everything touching **prompt content**: Pass 1 slimmed
7683 → 852 tokens, Pass 2 13k → 3.8k, Pass 0.5 replaced by an inline
self-benchmark.

That reads as a finding, not an accident. `SYSTEM_PROMPT` carries the marking
bands, the verified historian roster and the epistemic protocol; Pass 0.5
exists so Pass 1 marks against a reference instead of in a vacuum.

**So the rule here is: change nothing that reaches a model, remove no pass.**
Under it:

- Pass 0.5 was awaited before OCR even started, though it reads only `question`
  and `marks`. It now joins the same `Promise.all` — exactly what `9edbe975`
  did before being swept up in the revert.
- The `sleep(1000)` between Pass 1 and Pass 2 is gone. Its comment claimed TPM
  protection, but Pass 1 is Anthropic and Pass 2 is Groq, so it protected
  neither. The consecutive *Groq* calls are Pass 2 → Pass 3, which never had a
  delay.
- Images were decoded to base64 then re-parsed with a regex, held twice —
  ~130 MB at the 10 × 5 MB ceiling. One decode produces both shapes.
- Pass 1's system prompt is marked cacheable. Same content, skips reprocessing.

Every evaluation now logs one line so the question stays answerable:

```
[evaluate:timing] {"ocr_rag_ref_parallel":18420,"pass1_haiku_cot":9310,
                   "pass2_json":7740,"pass3_feedback":5210,
                   "total":41200,"pages":3,"marks":"15"}
```

Durations only — never the question, transcript or feedback.

> **The binding constraint is the Vercel Hobby 60s function cap.** That is why
> Pass 4 had to go. If this is not enough headroom the answer is Pro's 300s or a
> background job — *not* more trimming, because trimming has already been shown
> to cost marking accuracy.

## 15. Caching, dependencies, and tests
**2026-09-04 · `edaecbd`, `f08d2a9` · 2026-09-02 `abccd55`, `3875bdf`, `5fce3be`**

Route handlers are dynamic by default, so Next was sending
`max-age=0, must-revalidate` on everything. Six endpoints returning identical
data to everybody are now edge-cached via `lib/cacheHeaders.ts`.

> **The trap, documented there:** a CDN keys on the URL and `Vary`, **not** on
> `x-admin-token`. `/api/admin/blog-posts` returns unpublished drafts to admins
> at a URL a reader can also request — caching that response publicly would
> publish a draft. Both blog routes branch to `private, no-store` for admins.

16 unused dependencies removed (22 prod deps, down from 38), including two
stale 100 KB duplicates in the repo root that were the only reason `pdfmake`
looked alive.

**Do not run `npm audit fix`** — see `SECURITY-NOTES.md`. It pulls Next to
16.3.x where Turbopack cannot resolve `@tailwindcss/postcss`. The remaining 26
advisories are assessed individually there; all are transitive under `next`,
`firebase` or `razorpay` and need input we never pass.

Earlier the same week: rate limiting moved from per-lambda in-memory maps into
the database (`abccd55`), every AI call in the evaluation flow gated
(`3875bdf`), and book retrieval made genuinely diverse (`5fce3be`).

The repo went from **zero tests to 50**, across `tests/citationGate`,
`tests/sanitizeHtml` and `tests/sanitizeNoteHtml`:

```
npm test
```

---

## Still open

- **Answer history lives only in `localStorage`** (`hooks/useAnswerHistory.ts`),
  capped at 50 entries. Clear the cache or switch device and it is gone. A
  results table would fix this *and* be the prerequisite for background
  evaluation. Decide after reading the `[evaluate:timing]` lines.
- **`unsafe-inline` in the CSP** — needs hashes, not nonces (see §11).
- **The Firebase service-account key in use is rejected** with
  `app/invalid-credential`. No production impact today, because `verifyIdToken`
  validates against Google's *public* certs — but the next admin operation
  anyone adds will fail confusingly. Regenerate in Firebase Console → Project
  Settings → Service Accounts.
- **`increment_eval_count` / `increment_chat_count`** are dead and can be dropped.
- **`subscription_slots.subscribers` and `/api/slots`' count** are two sources
  of truth that will drift.

## Conventions this established

1. **Meter before the work, refund on failure.**
2. **Never trust the client for anything that decides money or access.** Read it
   from the payment provider, the order notes, or the database.
3. **Make failures visible.** `report-uri` on the enforcing CSP, `[csp]` and
   `[evaluate:timing]` log lines. Two bugs here survived months of silence.
4. **Check `git log` before "fixing" something odd.** The chat buffer and the
   evaluate pipeline were both deliberate.
5. **Regenerate and commit `supabase/schema.sql` after any schema change.**
6. **Log durations, never student content.**
