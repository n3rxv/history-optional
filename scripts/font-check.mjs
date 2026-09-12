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

// Fonts that ship with the OS and are never loaded by us. Georgia is on macOS
// and Windows but NOT on Android, so naming it is only safe with a web font
// behind it; this check enforces that rather than waving it through.
const SYSTEM = new Set(['Georgia', 'Times New Roman', 'Arial', 'Helvetica',
  'system-ui', '-apple-system', 'ui-monospace', 'SF Mono', 'Consolas',
  'serif', 'sans-serif', 'monospace']);

// families the tokens ask for, in stack order. The first entry was matched
// quoted only at first, which meant a stack starting with an unquoted Georgia
// silently dropped out of this check entirely.
const wanted = [...css.matchAll(/--font-([a-z]+):\s*([^;]+);/g)].map((m) => {
  const stack = m[2].split(',').map((x) => x.trim().replace(/^'|'$/g, ''));
  return { token: `--font-${m[1]}`, stack };
});

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
console.log('token            first family                   status');
console.log('-'.repeat(78));
for (const { token, stack } of wanted) {
  const first = stack[0];
  if (SYSTEM.has(first)) {
    // A system font is fine only if something we actually load sits behind it,
    // otherwise a platform without it falls through to a generic.
    const backup = stack.slice(1).find((f) => served.has(f));
    if (backup) {
      console.log(`${token.padEnd(16)} ${first.padEnd(30)} system font, backed by ${backup}`);
    } else {
      bad++;
      console.log(`${token.padEnd(16)} ${first.padEnd(30)} NO WEB FONT BEHIND IT  <-- breaks where the OS lacks it`);
    }
    continue;
  }
  const ok = served.has(first);
  if (!ok) bad++;
  console.log(`${token.padEnd(16)} ${first.padEnd(30)} ${ok ? 'loaded' : 'NO  <-- falls back silently'}`);
}
console.log(`\n${served.size} families loaded: ${[...served].sort().join(', ')}`);

if (bad) {
  console.error(`\n${bad} token(s) name a family that is never loaded.`);
  process.exit(1);
}
console.log('\nevery --font-* token resolves to a loaded family');
