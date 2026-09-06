/**
 * The bug worth pinning: lib/admin-auth read `process.env.ADMIN_PASSWORD ?? ''`
 * and an empty HMAC key is one anyone can compute, so a deployment missing the
 * variable accepted forged tokens while looking completely healthy.
 *
 * These assert on behaviour rather than on the module's internals: a token is
 * built the way an attacker would build one, and the check must refuse it.
 */
import crypto from 'crypto';
import { NextRequest } from 'next/server';

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        got:  ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`);
};

const reqWith = (token: string) =>
  new NextRequest('https://example.test/api/admin/verify-token', {
    headers: { 'x-admin-token': token },
  });

/** A token in the current format, signed with whatever key the caller has. */
const mint = (secret: string, sid = 'a'.repeat(32), ttlMs = 3600_000) => {
  const payload = `${Date.now() + ttlMs}.${sid}`;
  return `${payload}.${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
};

console.log('\nadmin-auth fails closed without ADMIN_PASSWORD');

delete process.env.ADMIN_PASSWORD;
// Point at a database that cannot answer, to prove the refusal happens before
// and independently of any lookup.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://unreachable.invalid';
process.env.SUPABASE_SECRET_KEY ??= 'not-a-key';

const { isAdminAuthed, generateAdminToken } = await import('../lib/admin-auth');

eq('a token forged with the empty key is rejected',
  await isAdminAuthed(reqWith(mint(''))), false);

eq('no token is rejected',
  await isAdminAuthed(new NextRequest('https://example.test/x')), false);

eq('a malformed token is rejected',
  await isAdminAuthed(reqWith('garbage')), false);

eq('the old two-part {exp}.{sig} format is rejected',
  await isAdminAuthed(reqWith(`${Date.now() + 3600_000}.${crypto.createHmac('sha256', '').update('x').digest('hex')}`)),
  false);

eq('no token is issued without a password',
  await generateAdminToken(), null);

console.log('\nadmin-auth rejects bad tokens when a password IS set');

process.env.ADMIN_PASSWORD = 'correct-horse-battery-staple';

eq('a token signed with the wrong key is rejected',
  await isAdminAuthed(reqWith(mint('wrong-key'))), false);

eq('an expired token is rejected',
  await isAdminAuthed(reqWith(mint(process.env.ADMIN_PASSWORD, 'b'.repeat(32), -1000))), false);

// A correctly signed, unexpired token still must not pass on signature alone —
// it has no admin_sessions row, and the database here is unreachable, so this
// also covers "a lookup failure denies rather than allows".
eq('a well-signed token with no session row is rejected',
  await isAdminAuthed(reqWith(mint(process.env.ADMIN_PASSWORD))), false);

console.log(fails === 0 ? '\nAll admin-auth checks passed.\n' : `\n${fails} FAILED\n`);
process.exit(fails === 0 ? 0 : 1);
