import assert from 'node:assert/strict';
import { csvText, csvValue } from '../lib/csv';

let passed = 0;
function ok(name: string, fn: () => void) { fn(); passed++; console.log('  ok  ' + name); }

// ── quoting, which both share ──────────────────────────────────────────────
ok('quotes plain values', () => {
  assert.equal(csvText('Rahul'), '"Rahul"');
  assert.equal(csvValue('+919812345678'), '"+919812345678"');
});
ok('a comma does not split the row', () => {
  assert.equal(csvText('Ram, Jr'), '"Ram, Jr"');
});
ok('doubles embedded quotes', () => {
  assert.equal(csvText('He said "hi"'), '"He said ""hi"""');
});
ok('null and undefined render empty, not as the word', () => {
  for (const f of [csvText, csvValue]) {
    assert.equal(f(null), '""');
    assert.equal(f(undefined), '""');
  }
});

// ── formula injection, which only csvText defends against ──────────────────
// Names here are typed by the public and the export is opened in Excel, so a
// leading =, +, - or @ would be evaluated on open.
ok('csvText defuses a formula', () => {
  assert.equal(csvText('=1+1'), `"'=1+1"`);
});
ok('csvText defuses every leading character a spreadsheet acts on', () => {
  for (const c of ['=', '+', '-', '@', '\t', '\r']) {
    assert.equal(csvText(`${c}danger`).startsWith(`"'${c}`), true, `${JSON.stringify(c)} should be defused`);
  }
});
ok('csvText leaves those characters alone when not leading', () => {
  assert.equal(csvText('Anne-Marie'), '"Anne-Marie"');
  assert.equal(csvText('a=b'), '"a=b"');
});

// This is the reason the two functions exist. Every phone number begins with
// '+', so defusing them would write '+91... into the phone column and break
// the file for any tool that imports it.
ok('csvValue does NOT defuse a phone number', () => {
  assert.equal(csvValue('+919812345678'), '"+919812345678"');
});
ok('a phone through csvText would have been mangled', () => {
  assert.notEqual(csvText('+919812345678'), csvValue('+919812345678'));
});

console.log(`\n${passed} assertions passed`);
