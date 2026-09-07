import assert from 'node:assert/strict';
import { normalizeFirstName, normalizeLastName } from '../lib/name';

let passed = 0;
function ok(name: string, fn: () => void) { fn(); passed++; console.log('  ok  ' + name); }

// ── First name is mandatory ────────────────────────────────────────────────
ok('accepts an ordinary name', () => {
  assert.deepEqual(normalizeFirstName('Nirav'), { ok: true, name: 'Nirav' });
});
ok('trims and collapses whitespace', () => {
  assert.deepEqual(normalizeFirstName('  Ram   Kumar '), { ok: true, name: 'Ram Kumar' });
});
ok('rejects empty, blank and non-strings', () => {
  assert.equal(normalizeFirstName('').ok, false);
  assert.equal(normalizeFirstName('   ').ok, false);
  assert.equal(normalizeFirstName(undefined).ok, false);
  assert.equal(normalizeFirstName(42).ok, false);
});
ok('rejects a name with no letter in it', () => {
  assert.equal(normalizeFirstName('123').ok, false);
  assert.equal(normalizeFirstName('...').ok, false);
  assert.equal(normalizeFirstName('---').ok, false);
});
ok('rejects an over-long name', () => {
  assert.equal(normalizeFirstName('a'.repeat(61)).ok, false);
  assert.equal(normalizeFirstName('a'.repeat(60)).ok, true);
});

// The gate is mandatory, so a validator that rejects a real name locks that
// person out of the site entirely. These must all pass.
ok('accepts names that a naive validator would reject', () => {
  for (const n of [
    "O'Brien",          // apostrophe
    'Jean-Luc',         // hyphen
    'Ravi Shankar',     // space
    'José',             // accent
    'निरव',              // Devanagari
    'அருண்',             // Tamil
    'محمد',             // Arabic
    '李',                // single CJK character
    'Anne-Marie Dupré', // several at once
  ]) {
    assert.equal(normalizeFirstName(n).ok, true, `${n} should be accepted`);
  }
});
ok('strips invisible characters rather than failing on them', () => {
  const r = normalizeFirstName('​Nirav﻿');
  assert.deepEqual(r, { ok: true, name: 'Nirav' });
});
ok('flattens a pasted newline instead of storing it', () => {
  assert.deepEqual(normalizeFirstName('Ram\nKumar'), { ok: true, name: 'Ram Kumar' });
});

// ── Last name is optional ──────────────────────────────────────────────────
ok('treats missing, null and blank last names as absent', () => {
  assert.deepEqual(normalizeLastName(undefined), { ok: true, name: null });
  assert.deepEqual(normalizeLastName(null), { ok: true, name: null });
  assert.deepEqual(normalizeLastName('   '), { ok: true, name: null });
});
ok('accepts a real last name', () => {
  assert.deepEqual(normalizeLastName(' Sharma '), { ok: true, name: 'Sharma' });
});
ok('still rejects a last name that is junk or too long', () => {
  assert.equal(normalizeLastName('123').ok, false);
  assert.equal(normalizeLastName('a'.repeat(61)).ok, false);
});

console.log(`\n${passed} assertions passed`);
