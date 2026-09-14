#!/usr/bin/env node
/**
 * Keeps the design system from drifting, by ratcheting rather than gating.
 *
 * The repo has roughly 1,100 raw hex colours, 1,200 rgba() calls and 2,500
 * hardcoded spacing values. A check that fails the build on all of those
 * blocks every commit on the first day and gets deleted in a week. So this
 * records a baseline per file and fails only when a file's count goes UP.
 * Existing violations are allowed to sit; new ones are not. The numbers only
 * ever fall, and nobody has to stop working to make that true.
 *
 * Why a script and not an ESLint plugin: the violations live inside inline
 * style objects, which is awkward to reach through the AST, and a hundred
 * lines of regex that anyone can read beats a plugin nobody will maintain.
 *
 *   node scripts/design-lint.mjs            check against the baseline
 *   node scripts/design-lint.mjs --report   show the worst files per rule
 *   node scripts/design-lint.mjs --update   re-baseline after real cleanup
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['app', 'components', 'lib', 'hooks'];
const EXTS = new Set(['.ts', '.tsx']);
const BASELINE = 'scripts/design-lint-baseline.json';

// Data files are content, not design. lib/indiaGeoJSON.ts alone carries
// thousands of coordinate pairs that look like nothing but are not colours.
const SKIP = /indiaGeoJSON|noteContent|noteContentHi|bookData|prelimsData|pyqData|\.bak$/;

const SPACE = new Set([2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48]);
const RADIUS = new Set([3, 4, 6, 8, 10, 12, 14, 20]);

const RULES = [
  {
    id: 'raw-color',
    why: 'colours come from tokens, so they can follow the theme',
    find: (t) => [
      // (?<!&) keeps a numeric HTML entity out of the count: the digits of
      // &#128221; are all valid hex, so #128221 otherwise reads as a colour.
      ...t.matchAll(/(?<!&)#[0-9a-fA-F]{3,8}\b/g),
      ...t.matchAll(/\brgba?\(\s*\d+\s*,/g),
    ],
  },
  {
    id: 'off-scale-space',
    why: 'spacing comes from --space-*',
    find: (t) => [...t.matchAll(
      /\b(?:padding|margin|gap|rowGap|columnGap)(?:Top|Right|Bottom|Left|Block|Inline)?:\s*'?(-?\d+)(?:px)?'?/g
    )].filter((m) => {
      const v = Math.abs(+m[1]);
      return v !== 0 && !SPACE.has(v);
    }),
  },
  {
    id: 'off-scale-radius',
    why: 'radius comes from --radius-*',
    // The (?!%) matters: borderRadius: '50%' is a shape, not a step on the
    // scale, and --radius-circle exists for exactly that. Without it the regex
    // matched the 50 and flagged every circle in the app.
    find: (t) => [...t.matchAll(/borderRadius:\s*'?(\d+)(?![\d%])(?:px)?/g)]
      .filter((m) => {
        const v = +m[1];
        return v !== 0 && v < 100 && !RADIUS.has(v);
      }),
  },
  {
    id: 'hardcoded-font',
    why: 'families come from --font-*',
    find: (t) => [...t.matchAll(
      /'(?:JetBrains Mono|Inter|Libre Baskerville|IBM Plex Mono|Roboto|Literata)[^']*'/g
    )],
  },
  {
    id: 'text-on-role-fill',
    why: 'a saturated fill takes its foreground from --on-fill, not --text',
    // --text is near-white on the dark ground and near-black on light, so it
    // can never be correct on top of a saturated fill: over the danger colour
    // it measured 2.83:1 on dark and 3.24:1 on light. --on-fill resolves to
    // white or black per ground and lands at 5.5:1 and 6.3:1.
    //
    // A literal counts too. The prelims Submit button used color:'#000' rather
    // than var(--text), so the first version of this rule waved it through:
    // black on the lapis fill measured 4.47:1 and read as a mistake besides.
    // Anything that is not --on-fill or currentColor is wrong here.
    find: (t) => [...t.matchAll(/style=\{\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\}/g)]
      .filter((m) => {
        const b = m[1];
        const onRoleFill = /background(?:Color)?:[^,]*var\(--(?:red|green|yellow|accent|accent2|danger-text|success-text|warning-text|info-text|premium-text)\)/.test(b);
        if (!onRoleFill) return false;
        const fg = b.match(/\bcolor:\s*([^,}]+)/);
        if (!fg) return false;
        const v = fg[1];
        if (/--on-fill|--accent-on|--premium-on|currentColor/.test(v)) return false;
        return /var\(--(?:text|text2|text3)\)|#[0-9a-fA-F]{3,8}/.test(v);
      }),
  },
  {
    id: 'primitive-in-component',
    why: 'components name semantic tokens, never primitives',
    find: (t) => [...t.matchAll(
      /var\(--(?:paper|ink|dark|dink|oxblood|gold)-\d+\)/g
    )],
  },
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (EXTS.has(path.extname(f)) && !SKIP.test(f)) out.push(f);
  }
  return out;
}

function scan() {
  const counts = {};
  for (const rule of RULES) counts[rule.id] = {};
  for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue;
    for (const file of walk(root)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const rule of RULES) {
        const n = rule.find(text).length;
        if (n) counts[rule.id][file] = n;
      }
    }
  }
  return counts;
}

const counts = scan();
const total = (r) => Object.values(counts[r] || {}).reduce((a, b) => a + b, 0);
const arg = process.argv[2];

if (arg === '--report') {
  for (const rule of RULES) {
    const files = Object.entries(counts[rule.id]).sort((a, b) => b[1] - a[1]);
    console.log(`\n${rule.id}  ${total(rule.id)} total  (${rule.why})`);
    for (const [f, n] of files.slice(0, 8)) console.log(`  ${String(n).padStart(5)}  ${f}`);
    if (files.length > 8) console.log(`         ... and ${files.length - 8} more files`);
  }
  process.exit(0);
}

if (arg === '--update') {
  fs.writeFileSync(BASELINE, JSON.stringify(counts, null, 1) + '\n');
  console.log('baseline written');
  for (const rule of RULES) console.log(`  ${rule.id.padEnd(24)} ${total(rule.id)}`);
  process.exit(0);
}

// ── ZERO TOLERANCE ────────────────────────────────────────────────────────────
// A numeric HTML entity of three or six digits is also a syntactically valid
// hex colour (&#128221; contains #128221), so a colour-rewriting pass can eat
// one and leave &var(--success-text); behind. That destroyed six emoji before
// this guard existed. It is always a bug, so it never ratchets.
{
  const broken = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) { if (!/^(node_modules|\.next|\.git)$/.test(e.name)) walk(full); continue; }
      if (!/\.(tsx?|css)$/.test(e.name)) continue;
      const src = fs.readFileSync(full, 'utf8');
      src.split('\n').forEach((line, i) => {
        if (/&(?:var\(--[a-z0-9-]+\)|color-mix\([^)]*\));/.test(line))
          broken.push(`${full}:${i + 1}  ${line.trim().slice(0, 90)}`);
      });
    }
  };
  for (const root of ['app', 'components', 'lib']) if (fs.existsSync(root)) walk(root);
  if (broken.length) {
    console.error('\nDestroyed HTML entities (a token sits where &#NNN; or &#NNNNNN; was):\n');
    for (const b of broken) console.error('  ' + b);
    console.error('\nRestore the entity from git history. This rule never ratchets.\n');
    process.exit(1);
  }
}

if (!fs.existsSync(BASELINE)) {
  console.error(`no baseline at ${BASELINE}. Run with --update first.`);
  process.exit(2);
}

const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
const regressions = [];
let improved = 0;

for (const rule of RULES) {
  const now = counts[rule.id] || {};
  const was = base[rule.id] || {};
  for (const file of new Set([...Object.keys(now), ...Object.keys(was)])) {
    const a = was[file] || 0;
    const b = now[file] || 0;
    if (b > a) regressions.push({ rule: rule.id, file, was: a, now: b, why: rule.why });
    else if (b < a) improved += a - b;
  }
}

if (regressions.length) {
  console.error('\nDesign system regressions:\n');
  for (const r of regressions) {
    console.error(`  ${r.file}`);
    console.error(`    ${r.rule}: ${r.was} -> ${r.now}   ${r.why}\n`);
  }
  console.error('Use the tokens, or run --update if the increase is deliberate.\n');
  process.exit(1);
}

console.log('design-lint: no regressions' + (improved ? `, ${improved} violations removed` : ''));
for (const rule of RULES) console.log(`  ${rule.id.padEnd(24)} ${total(rule.id)}`);
