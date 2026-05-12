import { pipeline } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

let embedder;
async function getEmbedding(text) {
  if (!embedder) {
    console.log('Loading embedding model (first time ~50MB download)...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

async function extractText(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await getDocument({ data }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

function chunkText(text, chunkSize = 600, overlap = 100) {
  const words = text.split(/\s+/);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 50) chunks.push(chunk.trim());
    i += chunkSize - overlap;
  }
  return chunks;
}

async function uploadBook(filePath, bookTitle) {
  console.log(`Reading: ${bookTitle}`);
  const text = await extractText(filePath);
  const chunks = chunkText(text);
  console.log(`Total chunks: ${chunks.length}`);
  if (chunks.length === 0) { console.log('⚠️ No text - skipping'); return; }
  let uploaded = 0;
  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk);
    await supabase.from('book_chunks').insert({
      content: chunk,
      embedding: embedding,
      book_title: bookTitle,
    });
    uploaded++;
    if (uploaded % 10 === 0) console.log(`  ${uploaded}/${chunks.length} done`);
  }
  console.log(`✅ Done: ${bookTitle}`);
}

await uploadBook('./books/Mughals-IGNOU.pdf', 'Mughals IGNOU');
