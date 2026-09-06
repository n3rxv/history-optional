/**
 * Cleans OCR sidecar text before it goes into the book corpus.
 *
 * Raw tesseract output is not fit to embed. Three things dominate:
 *
 *   1. 1,961 words split across a line break by a hyphen ("publica-\ntion").
 *      Left alone, "publication" is absent and "tion" appears 100 times.
 *   2. Page furniture repeated on every page — a library watermark 263 times,
 *      a funding stamp 158 times, running headers like "TUGHLUQ DYNASTY 173"
 *      17 times. Embedded, these become the most repeated strings in the
 *      corpus and drag unrelated queries toward them.
 *   3. Every visual line is its own text line, so sentences arrive in
 *      fragments and chunk boundaries land mid-clause.
 *
 * Name corrections are deliberately a short, hand-verified list rather than
 * anything automatic. Fuzzy matching against frequent tokens proposed
 * Bhatti->Bhakti, Malda->Malwa, Pandua->Pandya and Lahori->Lahore — all real,
 * distinct names being "corrected" into different real names. In a history
 * corpus that is worse than the OCR error it fixes. Every entry below was
 * checked against its occurrences in the text; anything that could be a
 * legitimate transliteration (Ferishta/Firishta, Qutab/Qutub, Sikandar/
 * Sikander, Hosain/Husain) was left alone.
 *
 * Usage: npx tsx scripts/cleanOcr.mts <in.txt> <out.txt>
 */
import fs from 'node:fs';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) { console.error('usage: cleanOcr.mts <in.txt> <out.txt>'); process.exit(1); }

/** Verified OCR damage. Key must be a whole word. */
const CORRECTIONS: Record<string, string> = {
  // q read as g — the book itself uses Tughluq 369 times.
  Tughlug: 'Tughluq', Tughtuq: 'Tughluq', Tughiuq: 'Tughluq',
  // l read as i, or I as l.
  Iitutmish: 'Iltutmish', Ultutmish: 'Iltutmish', Iltutmis: 'Iltutmish',
  Suitan: 'Sultan', Muitan: 'Multan', Caicutta: 'Calcutta',
  KHALII: 'KHALJI',
  // h read as b.
  Delbi: 'Delhi', Mubammad: 'Muhammad',
  // Doubled or dropped letters.
  Allauddin: 'Alauddin', Qutubddin: 'Qutubuddin', Muhamma: 'Muhammad',
  Fireze: 'Firoze', Alberunt: 'Alberuni', Tarihh: 'Tarikh', Baghadad: 'Baghdad',
  Truks: 'Turks', Engligh: 'English', Ghort: 'Ghori', MEDIRVAL: 'MEDIEVAL',
  thouglit: 'thought',
};

/** Lines that are page furniture, not content. */
const FURNITURE: RegExp[] = [
  /^Gandhi Memorial College Of Education Bantalab Jammu\s*$/,
  /^CC-0 Agamnigam Digital Preservation Foundation.*$/,
  /^GOVT\.? COLLEGE,? LIBR[GA]RY\s*$/i,
  /^KOTA \(Raj\.\)\s*$/,
  /^\[OCR skipped on page\(s\)[^\]]*\]\s*$/,
  /^-{0,2}\s*\d{1,4}\s*(of\s*\d+)?\s*-{0,2}$/,          // bare page numbers
  /^[A-Z][A-Z ,.\-']{4,60}\s+\d{1,3}\s*$/,               // "TUGHLUQ DYNASTY 173"
  /^\d{1,3}\s+[A-Z][A-Z ,.\-']{4,60}\s*$/,               // "173 TUGHLUQ DYNASTY"
  /^ADVANCED STUDY IN THE HISTORY OF MEDIEVAL INDIA\s*$/,
];

let text = fs.readFileSync(inPath, 'utf8');
const before = { chars: text.length, lines: text.split('\n').length };

// ── 1. Drop furniture, line by line ──────────────────────────────────────
let dropped = 0;
text = text.split('\n').filter(l => {
  if (FURNITURE.some(re => re.test(l.trim()))) { dropped++; return false; }
  return true;
}).join('\n');

// ── 1b. The same stamps again, inline. On pages where the watermark overlaps
//      a running header the OCR merges them into one garbled line, so a
//      whole-line match misses it: "x Gandhi Memorial College Of Education
//      Rantalgk BEV AL INDIA". Scrub the phrase wherever it sits, then drop
//      whatever is left of the line if it is mostly noise. ────────────────
let scrubbed = 0;
text = text.replace(/Gandhi Memorial College[^\n]{0,55}/gi, () => { scrubbed++; return ' '; });
text = text.replace(/[A-Z]{0,3}[-+.]?\s*0?\s*Agamniga[^\n]{0,85}/gi, () => { scrubbed++; return ' '; });

let noise = 0;
text = text.split('\n').filter(l => {
  const t = l.trim();
  if (t.length < 8) return true;                       // short lines are judged elsewhere
  const letters = (t.match(/[A-Za-z]/g) ?? []).length;
  const words   = (t.match(/(?<![A-Za-z])[A-Za-z]{3,}(?![A-Za-z])/g) ?? []).length;
  // A line of real prose is mostly letters and holds several whole words.
  if (letters / t.length < 0.55 || (t.length > 25 && words < 3)) { noise++; return false; }
  return true;
}).join('\n');

// ── 2. Rejoin words broken across a line break ───────────────────────────
let dehyphenated = 0;
text = text.replace(/([A-Za-z]{2,})-\n[ \t]*([a-z]{2,})/g, (_m, a, b) => { dehyphenated++; return a + b; });

// ── 3. Reflow: a single newline inside a paragraph is a scan artefact, not
//      a break the author wrote. Two or more newlines stay a paragraph. ───
text = text.replace(/([^\n])\n(?!\n)([^\n])/g, '$1 $2');

// ── 4. Curated name corrections ──────────────────────────────────────────
const applied: Record<string, number> = {};
for (const [wrong, right] of Object.entries(CORRECTIONS)) {
  const re = new RegExp(`(?<![A-Za-z])${wrong}(?![A-Za-z])`, 'g');
  const n = (text.match(re) ?? []).length;
  if (n) { applied[`${wrong} -> ${right}`] = n; text = text.replace(re, right); }
}

// ── 5. Whitespace and quotes ─────────────────────────────────────────────
text = text
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[ \t]{2,}/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

fs.writeFileSync(outPath, text);
console.log(`  ${inPath.split('/').pop()}`);
console.log(`      ${before.chars.toLocaleString()} -> ${text.length.toLocaleString()} chars`);
console.log(`      furniture lines dropped : ${dropped}`);
console.log(`      stamps scrubbed inline  : ${scrubbed}`);
console.log(`      noise lines dropped     : ${noise}`);
console.log(`      hyphen splits rejoined  : ${dehyphenated}`);
console.log(`      corrections applied     : ${Object.values(applied).reduce((a, b) => a + b, 0)}`);
for (const [k, v] of Object.entries(applied).sort((a, b) => b[1] - a[1])) {
  console.log(`          ${String(v).padStart(4)}x  ${k}`);
}
