/**
 * Generate flashcards grounded in the book corpus.
 *
 *   npx tsx scripts/generate-flashcards.ts --dry --topics 2
 *   npx tsx scripts/generate-flashcards.ts --uncovered
 *   npx tsx scripts/generate-flashcards.ts --all
 *
 * Flags
 *   --dry            generate and print, write nothing
 *   --uncovered      only topics that currently have no cards
 *   --topics N       stop after N topics (useful for costing a run)
 *   --target N       total cards to aim for across all topics (default 1200)
 *   --model ID       override the model
 *
 * Why it is built this way:
 *
 * The easy version of this script asks a model for "50 flashcards about the
 * Mauryan state" and gets 50 plausible cards, a good share of which attribute
 * a position to the wrong historian. That is worse than having no cards,
 * because a student revising from them cannot tell which ones are wrong.
 *
 * So every request carries three grounds:
 *
 *   passages  retrieved from the 30,305-chunk corpus in Qdrant, spread across
 *             books, so claims and attributions come from text that is
 *             actually in front of the model.
 *   PYQs      the questions UPSC has really asked on this topic since 1979,
 *             so cards target what gets examined rather than what is merely
 *             true.
 *   existing  the fronts of cards already written for this topic, so it adds
 *             rather than repeats.
 *
 * Cards are written as status='draft' with the book and author they came
 * from. Nothing reaches a student until it is reviewed and published -- the
 * RLS policy on the table enforces that independently of this script.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';
import { allNotes } from '../lib/notes';
import { getPYQsForNote } from '../lib/notePyqMap';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const line of readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { searchDiverse } = await import('../lib/vectorStore');

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(`--${name}`);
const value = (name: string, fallback: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const DRY = flag('dry');
const ONLY_UNCOVERED = flag('uncovered');
const TOPIC_CAP = Number(value('topics', '0')) || Infinity;
const TOTAL_TARGET = Number(value('target', '1200'));
const MODEL = value('model', 'claude-opus-5');

// Per request, not per topic. Smaller batches keep each response well inside
// a non-streaming response, and a failure costs one batch rather than a topic.
const CARDS_PER_REQUEST = 10;
const MIN_PER_TOPIC = 12;
const MAX_PER_TOPIC = 40;

const REST = `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')}/rest/v1`;
const KEY = process.env.SUPABASE_SECRET_KEY!;
const sbHeaders = { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` };

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Output shape ────────────────────────────────────────────────────────────

const CardSchema = z.object({
  type: z.enum(['historian', 'comparison', 'cause-effect', 'quote', 'concept']),
  front: z.string().min(15).max(400).describe('The question. One thing, asked precisely.'),
  back: z.string().min(40).max(1600).describe('The answer, naming historians where relevant.'),
  front_hi: z.string().min(5).describe('The front, in Hindi.'),
  back_hi: z.string().min(20).describe('The back, in Hindi.'),
  source_book: z.string().describe('Which supplied passage this came from. Empty if none.'),
  source_author: z.string().describe('That passage\'s author. Empty if none.'),
});
const BatchSchema = z.object({ cards: z.array(CardSchema) });

type Card = z.infer<typeof CardSchema>;

// ── Helpers ─────────────────────────────────────────────────────────────────

async function voyageEmbed(text: string): Promise<number[]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: 'voyage-4-lite', input: [text], input_type: 'query' }),
  });
  const data = await res.json();
  if (!data.data?.[0]?.embedding) throw new Error('Voyage: ' + JSON.stringify(data).slice(0, 200));
  return data.data[0].embedding;
}

async function existingForTopic(topic: string): Promise<{ id: string; front: string }[]> {
  const res = await fetch(
    `${REST}/flashcards?select=id,front&topic=eq.${encodeURIComponent(topic)}`,
    { headers: sbHeaders },
  );
  if (!res.ok) throw new Error(`existing cards: ${res.status}`);
  return res.json();
}

async function nextIdNumber(): Promise<number> {
  const res = await fetch(`${REST}/flashcards?select=id&id=like.g*&order=id.desc&limit=1`, {
    headers: sbHeaders,
  });
  const rows = (await res.json()) as { id: string }[];
  return rows.length ? Number(rows[0].id.slice(1)) + 1 : 1;
}

/** Normalised front text, for catching near-duplicates that differ only in wording. */
const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9ऀ-ॿ ]/g, '').replace(/\s+/g, ' ').trim();

// ── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM = `You write flashcards for UPSC Civil Services History Optional candidates.

That exam does not reward recognition of facts. It rewards knowing who argued
what, on what evidence, and against whom. A good card here asks something a
candidate would actually need in an answer; a bad one asks something they
could look up and would never write down.

Rules you must follow:

1. GROUND EVERYTHING. Use only what the supplied passages support. If you
   attribute a position to a historian, that attribution must appear in a
   passage. Where a passage does not cover something, write fewer cards
   rather than filling the gap from memory. A card that misattributes an
   argument is worse than a missing card, because the candidate cannot tell.

2. ONE THING PER CARD. The front asks a single question. If the back needs
   "and also", it should have been two cards.

3. NAME PEOPLE. Historiography is the point. "Some historians argue" is a
   wasted card; "R.S. Sharma argues, against D.D. Kosambi, that..." is not.

4. THE BACK IS AN ANSWER, NOT AN ESSAY. Two to five sentences. Enough to
   reconstruct the argument, not enough to reread a chapter.

5. FOLLOW THE EXAM. Previous-year questions are supplied. Weight cards
   toward what is actually asked, and toward the parts of the topic those
   questions keep returning to.

6. DO NOT REPEAT. Existing card fronts are supplied. Cover different ground.

7. HINDI IS A TRANSLATION, NOT A PARAPHRASE. Same claim, same names. Keep
   historian names in Latin script inside the Hindi text -- candidates read
   them that way.

Card types:
  historian     a named scholar's position, and what it argues against
  comparison    two things set against each other on a stated axis
  cause-effect  a causal chain, with the mechanism, not just the outcome
  quote         a specific formulation worth remembering, correctly attributed
  concept       a term or framework, defined as the discipline uses it`;

function buildPrompt(opts: {
  note: (typeof allNotes)[number];
  passages: { content: string; book_title: string; author: string }[];
  pyqs: { year: number; marks?: number; question: string }[];
  existingFronts: string[];
  count: number;
}) {
  const { note, passages, pyqs, existingFronts, count } = opts;

  const passageText = passages
    .map((p, i) => `[Passage ${i + 1} — ${p.book_title} | ${p.author}]\n${p.content.slice(0, 1400)}`)
    .join('\n\n---\n\n');

  const pyqText = pyqs.length
    ? pyqs.slice(0, 25).map((q) => `- (${q.year}${q.marks ? `, ${q.marks}m` : ''}) ${q.question}`).join('\n')
    : '(no previous-year questions mapped to this topic)';

  const existingText = existingFronts.length
    ? existingFronts.map((f) => `- ${f}`).join('\n')
    : '(none yet — this topic has no cards)';

  return `Topic: ${note.title}
Paper ${note.paper}, ${note.section}
Scope: ${note.description}${note.subtopics?.length ? `\nSubtopics: ${note.subtopics.join(', ')}` : ''}

## Passages from the reading list

${passageText}

## Previous-year questions on this topic

${pyqText}

## Cards that already exist (do not repeat these)

${existingText}

Write ${count} new flashcards on this topic. Ground every claim in the
passages above, name the historians the passages name, and weight the set
toward what the previous-year questions keep asking.`;
}

// ── Generation ──────────────────────────────────────────────────────────────

let totalIn = 0;
let totalOut = 0;

async function generateForTopic(
  note: (typeof allNotes)[number],
  count: number,
): Promise<Card[]> {
  const query = `${note.title}. ${note.description}. ${(note.subtopics ?? []).join('. ')}`;
  const [embedding, existing] = await Promise.all([
    voyageEmbed(query),
    existingForTopic(note.slug),
  ]);

  const passages = await searchDiverse(embedding, { perBook: 3, maxResults: 18 });
  if (passages.length === 0) {
    console.log(`   no passages retrieved — skipping (nothing to ground against)`);
    return [];
  }

  const pyqs = getPYQsForNote(note.slug, note.section) as {
    year: number; marks?: number; question: string;
  }[];

  const seen = new Set(existing.map((e) => norm(e.front)));
  const out: Card[] = [];

  while (out.length < count) {
    const want = Math.min(CARDS_PER_REQUEST, count - out.length);
    const prompt = buildPrompt({
      note,
      passages,
      pyqs,
      existingFronts: [...existing.map((e) => e.front), ...out.map((c) => c.front)],
      count: want,
    });

    const res = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { format: zodOutputFormat(BatchSchema), effort: 'high' },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: prompt }],
    });

    totalIn += res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0);
    totalOut += res.usage.output_tokens;

    const batch = res.parsed_output?.cards ?? [];
    if (batch.length === 0) {
      console.log('   model returned nothing for this batch — moving on');
      break;
    }

    let added = 0;
    for (const card of batch) {
      const key = norm(card.front);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(card);
      added++;
    }
    // Every card in a batch being a duplicate means the topic is exhausted;
    // asking again just spends money to be told the same thing.
    if (added === 0) {
      console.log('   batch was entirely duplicates — topic looks covered');
      break;
    }
  }

  return out;
}

async function insert(note: (typeof allNotes)[number], cards: Card[], startId: number) {
  const rows = cards.map((c, i) => ({
    id: `g${String(startId + i).padStart(4, '0')}`,
    topic: note.slug,
    paper: note.paper,
    section: note.section,
    type: c.type,
    front: c.front,
    back: c.back,
    front_hi: c.front_hi,
    back_hi: c.back_hi,
    source_book: c.source_book || null,
    source_author: c.source_author || null,
    status: 'draft',
  }));

  const res = await fetch(`${REST}/flashcards`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`insert: ${res.status} ${(await res.text()).slice(0, 300)}`);
  return rows.length;
}

// ── Main ────────────────────────────────────────────────────────────────────

const covered = new Map<string, number>();
for (const row of (await (
  await fetch(`${REST}/flashcards?select=topic`, { headers: sbHeaders })
).json()) as { topic: string }[]) {
  covered.set(row.topic, (covered.get(row.topic) ?? 0) + 1);
}

// Weight by how often the topic is examined, so the deck mirrors the exam
// rather than spreading evenly over topics UPSC rarely touches. Square root
// rather than raw count: a topic asked 60 times deserves more cards than one
// asked 6, but not ten times as many — there is only so much to say about it.
//
// The denominator is every topic in the syllabus, not the subset being worked
// on. Computing it over a --uncovered filter would divide the whole target
// across 15 topics and push each one into the cap.
const weighted = allNotes.map((n) => ({
  note: n,
  pyqs: getPYQsForNote(n.slug, n.section).length,
}));
const weightSum = weighted.reduce((s, w) => s + Math.sqrt(w.pyqs + 1), 0);

const plan = weighted
  .filter(({ note }) => !ONLY_UNCOVERED || !covered.has(note.slug))
  .map(({ note, pyqs }) => {
    const share = Math.sqrt(pyqs + 1) / weightSum;
    const already = covered.get(note.slug) ?? 0;
    const target = Math.min(MAX_PER_TOPIC, Math.max(MIN_PER_TOPIC, Math.round(TOTAL_TARGET * share)));
    return { note, pyqs, want: Math.max(0, target - already) };
  })
  .filter((p) => p.want > 0);

console.log(`${plan.length} topics to work on, ${plan.reduce((s, p) => s + p.want, 0)} cards planned`);
console.log(`model ${MODEL}${DRY ? '  (dry run — nothing will be written)' : ''}\n`);

let nextId = DRY ? 1 : await nextIdNumber();
let written = 0;
let done = 0;

for (const { note, pyqs, want } of plan) {
  if (done >= TOPIC_CAP) break;
  done++;
  console.log(`[${done}/${Math.min(plan.length, TOPIC_CAP)}] ${note.title} — want ${want} (${pyqs} PYQs, ${covered.get(note.slug) ?? 0} existing)`);

  try {
    const cards = await generateForTopic(note, want);
    if (!cards.length) continue;

    if (DRY) {
      for (const c of cards.slice(0, 2)) {
        console.log(`   · [${c.type}] ${c.front}`);
        console.log(`     → ${c.back.slice(0, 120)}…  (${c.source_book || 'ungrounded'})`);
      }
      console.log(`   ${cards.length} generated (not written)`);
    } else {
      const n = await insert(note, cards, nextId);
      nextId += n;
      written += n;
      console.log(`   wrote ${n} drafts`);
    }
  } catch (e) {
    // One bad topic should not end the run; the rest are independent.
    console.error(`   FAILED: ${(e as Error).message}`);
  }
}

const cost = (totalIn / 1e6) * 5 + (totalOut / 1e6) * 25;
console.log(`\n${written} cards written as drafts`);
console.log(`tokens: ${totalIn.toLocaleString()} in, ${totalOut.toLocaleString()} out  ≈ $${cost.toFixed(2)} at Opus 5 rates`);
if (!DRY && written) {
  console.log(`\nThey are drafts and are not served yet. Review, then publish:`);
  console.log(`  update flashcards set status = 'published' where id like 'g%' and <your filter>;`);
}
