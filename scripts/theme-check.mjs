#!/usr/bin/env node
/**
 * Verifies the two theme blocks define the same set of tokens.
 *
 * This exists because of a bug that produced no error anywhere. Swapping which
 * ground sat in :root dragged 18 aliases into the [data-theme="light"] block
 * only, so in dark mode --yellow, --red, --green and the whole gradient and
 * glow family were undefined. A declaration like color:var(--yellow) with an
 * undefined variable is simply invalid, so the element inherited white: the
 * feature card headings and the stat numbers lost their colour on dark and kept
 * it on light, and nothing in any build output mentioned it.
 *
 * The rule: a token defined for one ground must be defined for the other, and
 * anything identical on both grounds belongs in a shared :root instead. Every
 * var() must also resolve to something.
 *
 *   node scripts/theme-check.mjs
 */
import fs from 'node:fs';

const CSS = 'app/globals.css';
const src = fs.readFileSync(CSS, 'utf8');

// strip comments so a token named inside prose is not counted as defined
const code = src.replace(/\/\*[\s\S]*?\*\//g, '');

// Escape once, here, rather than at every call site. Passing a pre-escaped
// selector in and escaping it again produced a pattern that matched nothing, so
// the check reported "0 overridden for light" and passed vacuously.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function blocksFor(selector) {
  const out = [];
  const re = new RegExp('^' + esc(selector) + '\\s*\\{', 'gm');
  let m;
  while ((m = re.exec(code)) !== null) {
    const end = code.indexOf('\n}', m.index);
    if (end > -1) out.push(code.slice(m.index, end));
  }
  if (!out.length) {
    console.error(`theme-check: no block matched ${selector}. The selector has`);
    console.error('changed, so this check would pass without testing anything.');
    process.exit(2);
  }
  return out;
}

const decls = (text) =>
  new Set([...text.matchAll(/(?:^|\s|;)(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]));

const shared = new Set();
for (const b of blocksFor(':root')) for (const t of decls(b)) shared.add(t);

const lightBlocks = blocksFor(':root[data-theme="light"]');
const light = new Set();
for (const b of lightBlocks) for (const t of decls(b)) light.add(t);

const problems = [];

for (const t of [...light].sort()) {
  if (!shared.has(t)) problems.push(`${t} is defined for light but not for dark`);
}

// every var() reference must resolve
const defined = new Set([...shared, ...light]);
const used = new Set([...code.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
for (const t of [...used].sort()) {
  if (!defined.has(t)) problems.push(`${t} is referenced but never defined`);
}

// braces, since a stray one silently swallows the rest of a block
const opens = (code.match(/\{/g) || []).length;
const closes = (code.match(/\}/g) || []).length;
if (opens !== closes) problems.push(`unbalanced braces: ${opens} { against ${closes} }`);

console.log(`${shared.size} tokens in :root, ${light.size} overridden for light`);

if (problems.length) {
  console.error('\nTheme problems:\n');
  for (const p of problems) console.error(`  ${p}`);
  console.error('\nA var() that resolves to nothing is an invalid declaration, not an');
  console.error('error, so the element silently inherits instead.\n');
  process.exit(1);
}
console.log('every light token has a dark counterpart, and every var() resolves');
