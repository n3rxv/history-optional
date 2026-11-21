/**
 * Prints what the chat's retrieval returns for some questions: the plan, then
 * each passage with its heading, score and note.
 *
 *   npx tsx --env-file=.env.local scripts/rag/rag_eval.ts            # built-in questions
 *   npx tsx --env-file=.env.local scripts/rag/rag_eval.ts "question"
 */
import { retrieve } from '../../lib/rag/retrieve';
import { checkDates } from '../../lib/rag/dateCheck';

const QUESTIONS = [
  '"Instead of rejecting the plan (Cabinet Mission Plan), they accepted its short-term provisions... the Congress strategy was half-baked and legalistic." Critically examine.',
  'Why did the Cripps Mission of 1942 fail? Analyse.',
  'Evaluate the role of the RIN mutiny of 1946 in the end of British rule.',
];

async function main() {
  const qs = process.argv.slice(2).length ? [process.argv.slice(2).join(' ')] : QUESTIONS;
  for (const q of qs) {
    const r = await retrieve(q);
    console.log(`\n=== ${q.slice(0, 110)}`);
    console.log(`plan: subjects ${JSON.stringify(r.plan.subjects)} periods ${JSON.stringify(r.plan.periods)} topics ${JSON.stringify(r.plan.topics)}`);
    console.log(`      why: ${r.plan.why.join('; ') || '(no topic)'}  claims: ${r.plan.claims.length}`);
    console.log(`stage ${r.stage}, ${r.hits.length} passages, ${r.events.length} timeline rows, ${r.ms} ms`);
    r.hits.forEach((h, i) => console.log(`  [S${i + 1}] ${h.score.toFixed(3)} ${h.header}\n       ${h.context.slice(0, 140)}`));
  }
  const sample = 'The Congress Working Committee resolution of 26 June 1946 accepted the long-term plan.';
  console.log('\ndate check sample:', checkDates(sample).map((i) => i.said));
}
main().catch((e) => { console.error(e); process.exit(1); });
