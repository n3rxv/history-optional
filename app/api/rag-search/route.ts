import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // RAG disabled on Vercel - local embeddings not supported
  return NextResponse.json({ context: '' });
}
