import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
const pdfParse = require("pdf-parse");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

function chunkText(text: string, chunkSize = 600, overlap = 100): string[] {
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

async function uploadBook(filePath: string, bookTitle: string) {
  console.log(`Reading: ${bookTitle}`);
  const buffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(buffer);
  const chunks = chunkText(parsed.text);
  console.log(`Total chunks: ${chunks.length}`);
  let uploaded = 0;
  for (const chunk of chunks) {
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk,
    });
    await supabase.from('book_chunks').insert({
      content: chunk,
      embedding: res.data[0].embedding,
      book_title: bookTitle,
    });
    uploaded++;
    if (uploaded % 20 === 0) console.log(`  ${uploaded}/${chunks.length} done`);
    await new Promise(r => setTimeout(r, 100));
  }
  console.log(`Done: ${bookTitle}`);
}

uploadBook('./books/Delhi Sultanate-IGNOU.pdf', 'Delhi Sultanate IGNOU');
uploadBook('./books/Mughals-IGNOU.pdf', 'Mughals IGNOU');
