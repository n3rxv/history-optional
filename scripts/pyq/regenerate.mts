/**
 * Regenerates lib/pyqData.ts with real topics.
 *
 * The existing file was auto-generated from the same PYQ book, but the
 * generator collapsed `topic` to the section name — 1,584 questions carrying
 * 5 distinct topics, which is why nothing could be browsed topic-wise. The
 * book's own three-level structure (section -> numbered topic -> sub-topic) is
 * still in the PDF, so it is re-derived rather than invented.
 *
 * Question ids are preserved: notePyqMap, dailyQuestions and every /pyqs/[id]
 * link depend on them.
 *
 * Run: npx tsx scripts/pyq/regenerate.mts <book.json> <syllabus.json>
 */
import fs from 'node:fs';
import { pyqs, type PYQ } from '../../lib/pyqData';

type BookQ = { section: string; topic: string | null; subtopic: string | null; raw: string };
type Syll  = { paper: string; num: number; title: string };

const book: BookQ[] = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const syllabus: Syll[] = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const map = JSON.parse(fs.readFileSync('scripts/pyq/topicSyllabusMap.json', 'utf8'));
const manual = JSON.parse(fs.readFileSync('scripts/pyq/manualAssignments.json', 'utf8'));

// ── Repairs to the extraction ────────────────────────────────────────────
// One 2025 GS question sits above the first heading in its section.
for (const b of book) {
  if (b.section === 'India Since Independence' && !b.topic) b.topic = '01. Politics of National Integration';
}
// The book prints "13." twice in Modern India. Renumber that section so the
// display numbers are unique; titles are what the map keys on.
const MI_ORDER = Object.keys(map['Modern India']);
const miRenum = new Map<string, string>();
MI_ORDER.forEach((t, i) => miRenum.set(t, `${String(i + 1).padStart(2, '0')}. ${t.replace(/^\d+\.\s*/, '')}`));

/**
 * A few syllabus items run to several lines in the source. Shown in full they
 * would swamp the question they annotate, so these carry a short form; the
 * numbering still points at the official item.
 */
const SHORT_TITLE: Record<string, string> = {
  'I.1':   'Sources',
  'I.2':   'Pre-history and Proto-history',
  'I.18':  'Fifteenth & Early Sixteenth Century — Politics and Economy',
  'I.19':  'Fifteenth & Early Sixteenth Century — Society and Culture',
  'I.22':  'Economy and Society, 16th–17th Centuries',
  'II.8':  'Birth of Indian Nationalism; Foundation of the Congress',
  'II.9':  'Rise of Gandhi',
  'II.10': 'Constitutional Developments, 1858–1935',
  'II.11': 'Other Strands in the National Movement',
  'II.12': 'Politics of Separatism',
  'II.13': 'Consolidation as a Nation; Nehru\'s Foreign Policy',
  'II.14': 'Caste and Ethnicity after 1947',
  'II.15': 'Economic Development and Political Change',
};

const sylLabel = (code: string) => {
  const [paper, num] = code.split('.');
  const item = syllabus.find(s => s.paper === paper && s.num === Number(num));
  const title = SHORT_TITLE[code] ?? item?.title;
  return title ? `Paper ${paper}, ${num}. ${title}` : code;
};

// ── Matching ─────────────────────────────────────────────────────────────
const norm = (s: string) => s.toLowerCase()
  .replace(/\[[^\]]*\]/g, ' ').replace(/\([^)]*\d{4}[^)]*\)/g, ' ')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const sig = (s: string) => norm(s).split(' ').slice(0, 10).join(' ');

const byS = new Map<string, BookQ[]>();
for (const b of book) {
  const k = sig(b.raw);
  if (!byS.has(k)) byS.set(k, []);
  byS.get(k)!.push(b);
}

// ── Build ────────────────────────────────────────────────────────────────
const SECTION_OF: Record<string, string> = {
  'Ancient India': 'Paper I - Ancient India',
  'Early Medieval Era': 'Paper I - Early Medieval',
  'Medieval India': 'Paper I - Medieval India',
  'Modern India': 'Paper II - Modern India',
  'India Since Independence': 'Paper II - India Since Independence',
  'World History': 'Paper II - World History',
};

const out: (PYQ & { subtopic: string; syllabus: string[] })[] = [];
const unmatched: PYQ[] = [];
let sectionMoved = 0, textFixed = 0;

// Book section a question belongs to, for the manual entries.
const BOOK_SECTION: Record<string, string> = Object.fromEntries(
  Object.entries(SECTION_OF).map(([book, app]) => [app, book])
);

for (const q of pyqs) {
  const hits = byS.get(sig(q.question));
  let b: BookQ | undefined = hits?.[0];

  if (!b) {
    const m = manual[String(q.id)];
    if (!m) { unmatched.push(q); continue; }
    if (m.sameTopicAs) {
      // Placed with its neighbours rather than guessed at independently.
      const twin = out.find(o => o.id === m.sameTopicAs);
      if (!twin) { unmatched.push(q); continue; }
      b = { section: BOOK_SECTION[twin.section], topic: twin.topic.replace(/^\d+\.\s*/, ''), subtopic: twin.subtopic, raw: q.question };
      // twin.topic is already renumbered; recover the book title by lookup.
      const sec = BOOK_SECTION[twin.section];
      const orig = Object.keys(map[sec] ?? {}).find(t => t.replace(/^\d+\.\s*/, '') === b!.topic);
      b.topic = orig ?? Object.keys(map[sec] ?? {})[0];
    } else {
      b = { section: m.section ?? BOOK_SECTION[q.section], topic: m.topic, subtopic: m.subtopic ?? '', raw: q.question };
    }
  }

  let topic = b.topic!;
  if (b.section === 'Modern India' && miRenum.has(topic)) topic = miRenum.get(topic)!;

  const section = SECTION_OF[b.section] ?? q.section;
  if (section !== q.section) sectionMoved++;

  // The old generator glued the next heading onto the end of a question.
  // Only trim where the book's text is a strict prefix — provably safe.
  let question = q.question;
  const bookText = b.raw.replace(/\s*[\[(][^\])]*\d{4}[^\])]*[\])]\s*$/, '').trim();
  if (question.length > bookText.length && norm(question).startsWith(norm(bookText))) {
    question = bookText; textFixed++;
  }

  out.push({
    ...q, section, question, topic,
    subtopic: b.subtopic ?? '',
    syllabus: (map[b.section]?.[b.topic!] ?? []).map(sylLabel),
  });
}

fs.writeFileSync('scripts/pyq/unmatched.json', JSON.stringify(unmatched, null, 1));
console.log(`  matched      ${out.length}`);
console.log(`  unmatched    ${unmatched.length}  -> scripts/pyq/unmatched.json`);
console.log(`  moved to India Since Independence: ${sectionMoved}`);
console.log(`  questions with trailing heading text trimmed: ${textFixed}`);
console.log(`  distinct topics: ${new Set(out.map(o => o.section + '|' + o.topic)).size}`);
console.log(`  distinct sub-topics: ${new Set(out.map(o => o.topic + '|' + o.subtopic)).size}`);

// ── Emit ─────────────────────────────────────────────────────────────────
if (unmatched.length) {
  console.error(`\n  REFUSING to write: ${unmatched.length} questions unplaced.`);
  process.exit(1);
}
if (out.length !== pyqs.length) {
  console.error(`\n  REFUSING to write: ${out.length} out vs ${pyqs.length} in.`);
  process.exit(1);
}

out.sort((a, b) => a.id - b.id);
const esc = (s: string) => JSON.stringify(s);

const body = out.map(q =>
  `  { id: ${q.id}, section: ${esc(q.section)}, topic: ${esc(q.topic)}, ` +
  `subtopic: ${esc(q.subtopic)}, syllabus: [${q.syllabus.map(esc).join(', ')}], ` +
  `year: ${q.year}, marks: ${q.marks}, source: ${esc(q.source)}, question: ${esc(q.question)} },`
).join('\n');

const header = `// AUTO-GENERATED — do not edit by hand.
// Source: History Optional PYQ Book Upto 2025 (4th Edition) + UPSC Mains 2026.
// Regenerate: npx tsx scripts/pyq/regenerate.mts <book.json> <syllabus.json>
//
// \`topic\` and \`subtopic\` come from the book's own three-level structure. The
// previous generation collapsed \`topic\` to the section name, so all 1,584
// questions carried one of five values and nothing could be browsed by topic.
//
// \`syllabus\` maps each topic onto the official UPSC syllabus items it serves —
// see scripts/pyq/topicSyllabusMap.json. A topic can serve more than one.
//
// Total questions: ${out.length}

export interface PYQ {
  id: number;
  section: string;
  /** Book topic, e.g. "05. Mughal Empire". */
  topic: string;
  /** Finer heading within the topic; "" where the book gives none. */
  subtopic: string;
  /** Official syllabus items this topic serves, e.g. "Paper I, 20. Akbar". */
  syllabus: string[];
  year: number;
  marks: number;
  source: string;
  question: string;
}

export const pyqs: PYQ[] = [
`;

// The helpers the app imports. Dropping them broke the build the first time
// this ran, so they are part of the generated output rather than something to
// remember to re-add.
const helpers = `
export function getPYQsBySection(section: string): PYQ[] {
  return pyqs.filter(q => q.section === section);
}

export function getPYQsByYear(year: number): PYQ[] {
  return pyqs.filter(q => q.year === year);
}

export function getPYQsByMarks(marks: number): PYQ[] {
  return pyqs.filter(q => q.marks === marks);
}

export function getPYQsByTopic(topic: string): PYQ[] {
  return pyqs.filter(q => q.topic === topic);
}

/** Every topic in a section, in the book's own order. */
export function topicsForSection(section: string): string[] {
  return [...new Set(pyqs.filter(q => q.section === section).map(q => q.topic))].sort();
}

/** Sub-topics under one topic, in the book's order, "" excluded. */
export function subtopicsForTopic(topic: string): string[] {
  return [...new Set(pyqs.filter(q => q.topic === topic).map(q => q.subtopic))].filter(Boolean);
}

export const pyqSections = [...new Set(pyqs.map(q => q.section))];
export const pyqYears = [...new Set(pyqs.map(q => q.year))].sort((a, b) => b - a);
export const pyqTopics = [...new Set(pyqs.map(q => q.topic))];
`;

fs.writeFileSync('lib/pyqData.ts', header + body + '\n];\n' + helpers);
console.log(`\n  wrote lib/pyqData.ts — ${out.length} questions`);
