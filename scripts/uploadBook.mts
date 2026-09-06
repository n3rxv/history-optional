/**
 * Adds a book to the "Chat with Books" corpus.
 *
 * Replaces scripts/uploadBook.ts, which could no longer work. That script
 * embedded with OpenAI text-embedding-3-small (1536 dims) while book_chunks is
 * vector(1024) and lib/ragSearch embeds the *query* with Voyage voyage-4-lite.
 * It predates the switch to Voyage and would fail on the first insert — and had
 * it not failed, documents and queries would have lived in different vector
 * spaces and retrieval would have returned noise while looking healthy.
 *
 * Voyage distinguishes document and query embeddings, so input_type matters:
 * ragSearch passes 'query', this passes 'document'. Mixing them degrades
 * retrieval quietly.
 *
 * Usage:
 *   npx tsx scripts/uploadBook.mts "<path.pdf>" "<Author — Title>" [author]
 *   npx tsx scripts/uploadBook.mts "<path.pdf>" "<title>" --dry-run
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
// pdf-parse v2 exports a PDFParse class. The old script called it as a
// function, which is the v1 API — one more reason it could not have run.
const { PDFParse } = require('pdf-parse');

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const [, , filePath, bookTitle, authorArg] = process.argv;
const DRY = process.argv.includes('--dry-run');
if (!filePath || !bookTitle) {
  console.error('usage: uploadBook.mts <path.pdf> <title> [author] [--dry-run]');
  process.exit(1);
}
const author = authorArg && !authorArg.startsWith('--') ? authorArg : bookTitle.split(/\s+[—-]\s+/)[0];

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

/** ~1,500 characters with overlap, matching the corpus average of 1,562. */
function chunkText(text: string, size = 1500, overlap = 200): string[] {
  const clean = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + size, clean.length);
    // Prefer a sentence or paragraph boundary so a chunk does not open
    // mid-clause, which is what the retrieved text gets shown as.
    if (end < clean.length) {
      const window = clean.slice(end - 250, end);
      const br = Math.max(window.lastIndexOf('\n\n'), window.lastIndexOf('. '));
      if (br > 0) end = end - 250 + br + 1;
    }
    const chunk = clean.slice(i, end).trim();
    if (chunk.length > 120) out.push(chunk);
    i = end - overlap;
    if (i <= 0) break;
  }
  return out;
}

async function embedBatch(texts: string[], attempt = 1): Promise<number[][]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'voyage-4-lite', input: texts, input_type: 'document' }),
  });
  if (res.status === 429 && attempt <= 5) {
    const wait = attempt * 5000;
    console.log(`    rate limited, waiting ${wait / 1000}s`);
    await new Promise(r => setTimeout(r, wait));
    return embedBatch(texts, attempt + 1);
  }
  const data = await res.json();
  if (!data.data) throw new Error('Voyage: ' + JSON.stringify(data).slice(0, 300));
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

async function main() {
  const { count: already } = await db
    .from('book_chunks').select('id', { count: 'exact', head: true }).eq('book_title', bookTitle);
  if (already && already > 0) {
    console.error(`  "${bookTitle}" already has ${already} chunks. Delete them first to re-upload.`);
    process.exit(1);
  }

  console.log(`  reading ${filePath}`);
  let raw: string;
  if (filePath.toLowerCase().endsWith('.txt')) {
    // OCR sidecar. Several books in this collection are scans with no text
    // layer at all — both JL Mehta volumes are — so they are OCR'd first with
    // ocrmypdf and the sidecar is fed in here.
    raw = fs.readFileSync(filePath, 'utf8')
      .replace(/\[OCR skipped on page\(s\)[^\]]*\]/g, '')
      // Every page of some scans carries a library or funding stamp. Left in,
      // it becomes the most repeated string in the corpus and pollutes
      // retrieval for any query it happens to sit near.
      .replace(/CC-0 Agamnigam Digital Preservation Foundation[^\n]*/g, '')
      .replace(/Gandhi Memorial College Of Education Bantalab Jammu/g, '');
  } else {
    const parser = new PDFParse({ data: new Uint8Array(fs.readFileSync(filePath)) });
    const parsed = await parser.getText();
    await parser.destroy();
    raw = parsed.text;
  }
  const chunks = chunkText(raw);
  const chars = chunks.reduce((n, c) => n + c.length, 0);
  console.log(`  ${chunks.length} chunks · avg ${Math.round(chars / (chunks.length || 1))} chars`);
  if (!chunks.length) {
    console.error('  no text extracted — a scanned PDF needs OCR first:');
    console.error('    ocrmypdf --force-ocr --sidecar out.txt in.pdf /dev/null');
    process.exit(1);
  }

  if (DRY) {
    console.log('\n  --dry-run, nothing written. First chunk:\n');
    console.log('  ' + chunks[0].slice(0, 400).replace(/\n/g, '\n  '));
    return;
  }

  const BATCH = 64;
  let done = 0;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const slice = chunks.slice(i, i + BATCH);
    const vectors = await embedBatch(slice);
    const { error } = await db.from('book_chunks').insert(
      slice.map((content, k) => ({ content, embedding: vectors[k], book_title: bookTitle, author }))
    );
    if (error) throw new Error(`insert failed at chunk ${i}: ${error.message}`);
    done += slice.length;
    process.stdout.write(`\r  uploaded ${done}/${chunks.length}`);
  }
  console.log(`\n  done — "${bookTitle}" by ${author}`);
}

main().catch(e => { console.error('\n  FAILED:', e.message); process.exit(1); });
