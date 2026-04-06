import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const cookies = req.headers.get('cookie') ?? '';
  return NextResponse.json({ cookies });
}
