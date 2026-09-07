import assert from 'node:assert/strict';
import { normalizePhone } from '../lib/phone';

let passed = 0;
function ok(name: string, fn: () => void) {
  fn(); passed++; console.log('  ok  ' + name);
}

// ── Accepts ────────────────────────────────────────────────────────────────
ok('accepts a plain Indian mobile with country code', () => {
  assert.deepEqual(normalizePhone('+919876543210'), { ok: true, phone: '+919876543210' });
});
ok('accepts the separators people actually type', () => {
  assert.deepEqual(normalizePhone('+91 98765-43210'), { ok: true, phone: '+919876543210' });
  assert.deepEqual(normalizePhone('+1 (415) 555-2671'), { ok: true, phone: '+14155552671' });
});
ok('adds the missing plus', () => {
  assert.deepEqual(normalizePhone('919876543210'), { ok: true, phone: '+919876543210' });
});
ok('accepts a short valid international number', () => {
  assert.equal(normalizePhone('+4571234567').ok, true);
});

// ── Rejects ────────────────────────────────────────────────────────────────
ok('rejects a non-string', () => {
  assert.equal(normalizePhone(null).ok, false);
  assert.equal(normalizePhone(12345).ok, false);
});
ok('rejects letters and injection attempts', () => {
  assert.equal(normalizePhone('+91abcdefghij').ok, false);
  assert.equal(normalizePhone("+91987654321'; drop table user_profiles;--").ok, false);
});
ok('rejects too short and too long', () => {
  assert.equal(normalizePhone('+91123').ok, false);
  assert.equal(normalizePhone('+9112345678901234567').ok, false);
});

// The point of the whole feature is being able to reach someone. A number that
// passes the format check and cannot be dialled is worse than no row at all,
// because it looks like a real contact in the export.
ok('rejects repeated-digit junk', () => {
  assert.equal(normalizePhone('+919999999999').ok, false);
  assert.equal(normalizePhone('+918888888888').ok, false);
});
ok('rejects sequential junk', () => {
  assert.equal(normalizePhone('+911234567890').ok, false);
});

// A hard gate means a wrong rule traps a real user with no way out, so the
// Indian rule is checked in both directions.
ok('rejects an Indian number with an impossible leading digit', () => {
  assert.equal(normalizePhone('+915876543210').ok, false);
  assert.equal(normalizePhone('+911876543210').ok, false);
});
ok('accepts every valid Indian leading digit', () => {
  for (const d of ['6', '7', '8', '9']) {
    assert.equal(normalizePhone(`+91${d}876543210`).ok, true, `leading ${d} should be valid`);
  }
});
ok('does not apply the Indian rule to other countries', () => {
  // +1 555... would fail the 6-9 rule if it were applied blindly.
  assert.equal(normalizePhone('+15555555551').ok, true);
});

// The picker supplies the country code and the reader types it again. Fourteen
// digits passes the generic international length check, so without this it
// would be stored as a number nobody can dial.
ok('drops a duplicated +91 country code', () => {
  assert.deepEqual(normalizePhone('+91919876543210'), { ok: true, phone: '+919876543210' });
  assert.deepEqual(normalizePhone('+91 91 98765 43210'), { ok: true, phone: '+919876543210' });
});
ok('leaves a 9191 number alone when the tail is not an Indian mobile', () => {
  // Same length and same prefix, but 5... is not a valid Indian mobile, so
  // the strip must not fire and the number passes through untouched.
  assert.deepEqual(normalizePhone('+91915234567890'), { ok: true, phone: '+91915234567890' });
});
ok('leaves an unrelated 14-digit number alone', () => {
  assert.deepEqual(normalizePhone('+12345678901234'), { ok: true, phone: '+12345678901234' });
});
ok('does not mangle a normal Indian number', () => {
  assert.deepEqual(normalizePhone('+919876543210'), { ok: true, phone: '+919876543210' });
});

console.log(`\n${passed} assertions passed`);
