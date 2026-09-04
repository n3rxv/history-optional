# Dependency advisories — assessed, not just counted

`npm audit` reports 26 advisories in production dependencies. None is reachable
in this application. This file records why, so the number is not re-litigated
every few months, and so anything that *does* become reachable stands out.

Re-check when upgrading Next.js or Firebase.

## Do not run `npm audit fix`

It breaks the build. It pulls Next.js to 16.3.x, and Turbopack in 16.3.4 fails
to resolve `@tailwindcss/postcss` even when the package is present in
`node_modules` and even after bumping Tailwind to a matching 4.3.3:

```
Error: Turbopack build failed with 7 errors:
Error: Cannot find module '@tailwindcss/postcss'
```

Verified on 2026-09-04 with `next@16.3.4` + `@tailwindcss/postcss@4.3.3`.
Revisit when a later Next 16.x ships.

## What was actually fixed

| Package | Action |
|---|---|
| `dompurify` | 3.3.3 → 3.4.14. It is the sanitizer in `lib/sanitizeHtml.ts`, so an advisory here is worth acting on even when not exploitable. All 17 tests in `tests/sanitizeHtml.test.mts` pass on the new version. |

Sixteen unused packages were also removed, which cleared four advisories.

## What remains, and why it is not reachable

### `undici` (high) — via `firebase`, `firebase-admin`

Request smuggling, unbounded decompression, WebSocket parser crashes. All
require an attacker to control the HTTP responses the server receives. These
SDKs talk only to Google endpoints. Fixing needs a Firebase major upgrade.

### `axios` (high) — via `razorpay`

SSRF via `NO_PROXY` normalisation, and prototype pollution in `validateStatus`.
Both need attacker control over the request target or the merge input. The
Razorpay SDK calls fixed Razorpay endpoints with arguments we construct.
Fixing needs Razorpay to bump its own dependency.

### `sharp` (high) — via `next`

Inherited libvips CVEs, reachable through image processing. `next.config.ts`
sets `images: { unoptimized: true }`, so Next never invokes sharp. Nothing in
the app processes uploaded images server-side either: `/api/evaluate` and
`/api/ocr` base64 the bytes and hand them to a model without decoding them.

### `postcss` (high) — via `next`

XSS via unescaped `</style>` in stringify output, and file read via
attacker-controlled source maps. Build-time only. CSS here is authored in the
repository, so an attacker would already need commit access.

### `nanoid` (high) — via `next`

Infinite loop on a zero or negative `size`. Called by Next internals with
fixed sizes; no application code calls it.

### `fast-xml-parser`, `follow-redirects`, `form-data` (moderate)

Transitive under the SDKs above, reachable only through those same
server-to-server calls.

## The pattern

Every remaining advisory sits in a transitive dependency of `next`, `firebase`
or `razorpay`, and every one needs either attacker-controlled input we never
pass or a code path we never invoke. They are fixed by upgrading those three
majors, which is worth doing on its own schedule — not by an `audit fix` that
breaks the build.
