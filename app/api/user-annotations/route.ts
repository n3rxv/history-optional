import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';

async function getFirebaseUid(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const user = await verifyFirebaseToken(token);
  return user?.uid ?? null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const firebase_uid = searchParams.get('firebase_uid');
  const slug = searchParams.get('slug');
  if (!firebase_uid) return NextResponse.json({ error: 'Missing firebase_uid' }, { status: 400 });

  const authUid = await getFirebaseUid(req);
  if (!authUid || authUid !== firebase_uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const query = slug
    ? db.from('annotations').select('note_slug, data').eq('firebase_uid', firebase_uid).eq('note_slug', slug)
    : db.from('annotations').select('note_slug, data').eq('firebase_uid', firebase_uid);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const { firebase_uid, note_slug, data } = await req.json();
  if (!firebase_uid || !note_slug) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const authUid = await getFirebaseUid(req);
  if (!authUid || authUid !== firebase_uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { error } = await db.from('annotations').upsert(
    { firebase_uid, note_slug, data, updated_at: new Date().toISOString() },
    { onConflict: 'firebase_uid,note_slug' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { firebase_uid, note_slug } = await req.json();

  const authUid = await getFirebaseUid(req);
  if (!authUid || authUid !== firebase_uid)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { error } = await db
    .from('annotations')
    .delete()
    .eq('firebase_uid', firebase_uid)
    .eq('note_slug', note_slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
