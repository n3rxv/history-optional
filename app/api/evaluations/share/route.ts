import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { createServerClient } from '@/lib/supabase';
import { getOrCreateRefCode } from '@/lib/referralServer';
import { SITE } from '@/lib/referral';

/**
 * Publishing one of your own answer checks at /s/<share_id>, and taking it
 * down again. The link carries the reader's invite code, so a friend who
 * comes in through the card and buys counts as their referral.
 */

async function ownRow(req: NextRequest) {
  const user = await verifyFirebaseToken(req.headers.get('x-user-token'));
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { error: NextResponse.json({ error: 'Bad request' }, { status: 400 }) };
  }
  const db = createServerClient();
  const { data: row } = await db.from('answer_evaluations').select('id, firebase_uid, share_id').eq('id', id).maybeSingle();
  if (!row || row.firebase_uid !== user.uid) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }
  return { db, row, uid: user.uid };
}

export async function POST(req: NextRequest) {
  const r = await ownRow(req);
  if ('error' in r) return r.error;
  const { db, row, uid } = r;

  let shareId: string = row.share_id;
  if (!shareId) {
    shareId = randomBytes(8).toString('base64url');
    const { error } = await db.from('answer_evaluations')
      .update({ share_id: shareId, shared_at: new Date().toISOString() })
      .eq('id', row.id);
    if (error) return NextResponse.json({ error: 'Could not make the link. Try again.' }, { status: 500 });
  }
  const code = await getOrCreateRefCode(db, uid);
  return NextResponse.json({ url: `${SITE}/s/${shareId}${code ? `?ref=${code}` : ''}` });
}

export async function DELETE(req: NextRequest) {
  const r = await ownRow(req);
  if ('error' in r) return r.error;
  const { db, row } = r;
  if (row.share_id) {
    const { error } = await db.from('answer_evaluations').update({ share_id: null, shared_at: null }).eq('id', row.id);
    if (error) return NextResponse.json({ error: 'Could not stop sharing. Try again.' }, { status: 500 });
    revalidatePath(`/s/${row.share_id}`);
  }
  return NextResponse.json({ ok: true });
}
