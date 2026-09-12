#!/usr/bin/env node
/**
 * Checks that every family named in a --font-* token is actually loaded.
 *
 * This exists because the same failure happened twice. Playfair Display and
 * Fira Code sat in tokens for 518 uses and were never imported at all, so
 * headings rendered in Georgia. Then the variable fontsource packages were
 * adopted, which register 'Libre Baskerville Variable' rather than the plain
 * name, and the body fell back to Georgia again. Neither produced an error:
 * a font-family that matches nothing just moves to the next entry.
 *
 * So: pull the first family out of each --font-* stack, collect every
 * font-family declared by the @fontsource CSS actually imported in
 * app/layout.tsx, and report anything requested but not served.
 *
 *   node scripts/font-check.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const CSS = 'app/globals.css';
const LAYOUT = 'app/layout.tsx';

const css = fs.readFileSync(CSS, 'utf8');
const layout = fs.readFileSync(LAYOUT, 'utf8');

// families the tokens ask for, first entry of each stack
const wanted = [...css.matchAll(/--font-([a-z]+):\s*'([^']+)'/g)]
  .map((m) => ({ token: `--font-${m[1]}`, family: m[2] }));

// families the imported fontsource css actually declares
const served = new Set();
for (const m of layout.matchAll(/from\s+'(@fontsource[^']+)'|import\s+'(@fontsource[^']+)'/g)) {
  const spec = m[1] || m[2];
  let file = path.join('node_modules', spec);
  if (!fs.existsSync(file)) continue;
  if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.css');
  if (!fs.existsSync(file)) continue;
  for (const f of fs.readFileSync(file, 'utf8').matchAll(/font-family:\s*'([^']+)'/g)) {
    served.add(f[1]);
  }
}

let bad = 0;
console.log('token            family requested                        loaded?');
console.log('-'.repeat(72));
for (const { token, family } of wanted) {
  const ok = served.has(family);
  if (!ok) bad++;
  console.log(`${token.padEnd(16)} ${family.padEnd(38)} ${ok ? 'yes' : 'NO  <-- falls back silently'}`);
}
console.log(`\n${served.size} families loaded: ${[...served].sort().join(', ')}`);

if (bad) {
  console.error(`\n${bad} token(s) name a family that is never loaded.`);
  process.exit(1);
}
console.log('\nevery --font-* token resolves to a loaded family');
