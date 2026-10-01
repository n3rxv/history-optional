/**
 * Applies scripts/pyq/questionFixes.json to lib/pyqData.ts.
 *
 * The first generator OCR'd the PYQ book, and the OCR left debris in the
 * question text that has been live on the site since:
 *
 *   "…an important source of Indian history. Turkish Conquest"   next heading glued on
 *   "…Did it 6 accelerate the process of Indian independence? INA a"   margin digit, stray letters
 *   "…the socio- economic transformations…"   space inside a hyphenated word
 *
 * Each entry in the JSON was checked against the book's own text layer, which
 * is clean. An entry only applies while the question still reads exactly as
 * its `from`, so it cannot overwrite a question that has changed since.
 *
 * regenerate.mts carries question text over from lib/pyqData.ts, so a fix
 * made here survives regeneration. It applies the same file too, in case it
 * is ever run from an older copy.
 *
 * Run: npx tsx scripts/pyq/fixQuestions.mts
 */
import fs from 'node:fs';

type Fix = { from: string; to: string };
const { fixes } = JSON.parse(fs.readFileSync('scripts/pyq/questionFixes.json', 'utf8')) as { fixes: Record<string, Fix> };

const FILE = 'lib/pyqData.ts';
const lines = fs.readFileSync(FILE, 'utf8').split('\n');
// regenerate.mts writes every question as JSON.stringify(text) at the end of its line.
const tail = (s: string) => `question: ${JSON.stringify(s)} },`;

let applied = 0, already = 0;
for (const [id, f] of Object.entries(fixes)) {
  const k = lines.findIndex(l => l.startsWith(`  { id: ${id}, `));
  if (k < 0) throw new Error(`id ${id} is not in ${FILE}`);
  if (lines[k].endsWith(tail(f.to))) { already++; continue; }
  if (!lines[k].endsWith(tail(f.from))) throw new Error(`id ${id}: the question reads neither as the fix's "from" nor its "to"`);
  lines[k] = lines[k].slice(0, -tail(f.from).length) + tail(f.to);
  applied++;
}

fs.writeFileSync(FILE, lines.join('\n'));
console.log(`  applied ${applied}, already applied ${already}, of ${Object.keys(fixes).length}`);
