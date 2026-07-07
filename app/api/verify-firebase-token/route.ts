import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 });

    const decoded = await adminAuth.verifyIdToken(token);
    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email ?? null,
    });
  } catch (err) {
    console.error('[firebase-verify] error:', err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
