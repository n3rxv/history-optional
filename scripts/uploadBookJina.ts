import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
async function pdfParse(buffer: Buffer): Promise<{ text: string }> {
  const fs = require('fs');
  const { execFileSync } = require('child_process');
  const tmp = '/tmp/book_upload_input.pdf';
  fs.writeFileSync(tmp, buffer);
  try {
    const result = execFileSync('python3', ['scripts/extract_pdf.py', tmp], {
      maxBuffer: 200 * 1024 * 1024
    });
    return { text: result.toString() };
  } catch(e: any) {
    console.error('PDF extraction error:', e.message);
    return { text: '' };
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function jinaEmbed(texts: string[], retries = 5): Promise<number[][]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        task: 'retrieval.passage',
        dimensions: 384,
        input: texts,
      }),
    });
    const data = await res.json();
    if (data.data) return data.data.map((d: any) => d.embedding);
    console.error(`Jina error (attempt ${attempt + 1}):`, JSON.stringify(data));
    const wait = (attempt + 1) * 5000;
    console.log(`Retrying in ${wait / 1000}s...`);
    await new Promise(r => setTimeout(r, wait));
  }
  throw new Error('jinaEmbed failed after retries');
}

function chunkText(text: string, chunkSize = 250, overlap = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 50) chunks.push(chunk.trim());
    i += chunkSize - overlap;
  }
  return chunks;
}

async function reEmbedExisting() {
  console.log('Fetching existing chunks...');
  const { data: chunks, error } = await supabase
    .from('book_chunks')
    .select('id, content')
    .order('id');
  if (error || !chunks) { console.error(error); return; }
  console.log(`Found ${chunks.length} chunks to re-embed`);
  const BATCH = 10;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const embeddings = await jinaEmbed(batch.map(c => c.content));
    for (let j = 0; j < batch.length; j++) {
      await supabase.from('book_chunks').update({ embedding: embeddings[j] }).eq('id', batch[j].id);
    }
    console.log(`Re-embedded ${Math.min(i + BATCH, chunks.length)}/${chunks.length}`);
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('Re-embedding done!');
}

async function uploadBook(filePath: string, bookTitle: string) {
  console.log(`Reading: ${bookTitle}`);
  let extractedText: string;
  if (filePath.endsWith('.txt')) {
    const raw = require('fs').readFileSync(filePath, 'utf-8');
    extractedText = raw
      .replace(/\r\n/g, '\n')
      .replace(/\f/g, '\n')
      .replace(/^\s*\d+\s*$/gm, '')
      .replace(/check your progress[\s\S]{0,400}/gi, '')
      .replace(/suggested readings[\s\S]{0,400}/gi, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/_{4,}/g, '')
      .replace(/\.{4,}/g, '')
      .replace(/-\n/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/ {3,}/g, ' ')
      .trim();
  } else {
    const buffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(buffer);
    extractedText = parsed.text;
  }
  const chunks = chunkText(extractedText);
  console.log(`Total chunks: ${chunks.length}`);
  const BATCH = 10;
  let uploaded = 0;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const embeddings = await jinaEmbed(batch);
    const rows = batch.map((content, j) => ({ content, embedding: embeddings[j], book_title: bookTitle }));
    await supabase.from('book_chunks').insert(rows);
    uploaded += batch.length;
    console.log(`  ${Math.min(uploaded, chunks.length)}/${chunks.length} done`);
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`Done: ${bookTitle}`);
}

const args = process.argv.slice(2);
if (args[0] === 'reembed') reEmbedExisting();
else if (args[0] === 'upload' && args[1] && args[2]) uploadBook(args[1], args[2]);
else {
  console.log('Usage:');
  console.log('  npx ts-node scripts/uploadBookJina.ts reembed');
  console.log('  npx ts-node scripts/uploadBookJina.ts upload ./books/file.pdf "Book Title"');
}
