import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { noStore } from '@/lib/cacheHeaders';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { mergePyq, mergeSyllabus } from '@/lib/progressMerge';

/**
 * A reader's study progress, so it follows them rather than the browser.
 *
 *   GET  /api/progress    what the server holds
 *   POST /api/progress    send what this browser holds; get the merge back
 *
 * One round trip does both directions, because that is what the client
 * actually needs: on load it has a local copy and wants the union of that and
 * whatever another device wrote. Sending a document and receiving the merged
 * result is simpler to reason about than a pull followed by a push, and it
 * cannot interleave with itself to lose a tick.
 *
 * Merge rules and the un-ticking limitation they carry are in
 * lib/progressMerge.ts and supabase/study_progress.sql.
 */

const STORES = ['syllabus', 'pyq'] as const;
type Store = (typeof STORES)[number];

/**
 * A ceiling on what one reader can store. The syllabus has 51 topics and there
 * are 1,584 questions, so a legitimate document is far below this; the limit
 * is here so a bug or a bad actor cannot use the table as free storage.
 */
const MAX_BYTES = 256 * 1024;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}

async function uidFrom(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('x-user-token');
  if (!token) return null;
  const user = await verifyFirebaseToken(token);
  return user?.uid ?? null;
}

async function readAll(uid: string): Promise<Record<Store, unknown>> {
  const { data, error } = await db()
    .from('study_progress')
    .select('store,data')
    .eq('firebase_uid', uid);
  if (error) throw new Error(error.message);
  const out = { syllabus: {}, pyq: {} } as Record<Store, unknown>;
  for (const row of data ?? []) {
    if ((STORES as readonly string[]).includes(row.store)) out[row.store as Store] = row.data;
  }
  return out;
}

export async function GET(req: NextRequest) {
  const uid = await uidFrom(req);
  // Not an error: signed-out readers keep working entirely on their device,
  // and the client asks before it knows whether anyone is signed in.
  if (!uid) return NextResponse.json({ signedIn: false }, { headers: noStore });

  try {
    return NextResponse.json({ signedIn: true, ...(await readAll(uid)) }, { headers: noStore });
  } catch (e) {
    console.error('[api/progress] read', e);
    return NextResponse.json({ error: 'progress_unavailable' }, { status: 503, headers: noStore });
  }
}

export async function POST(req: NextRequest) {
  const uid = await uidFrom(req);
  if (!uid) return NextResponse.json({ signedIn: false }, { headers: noStore });

  let body: { syllabus?: unknown; pyq?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400, headers: noStore });
  }

  try {
    const stored = await readAll(uid);
    const merged = {
      syllabus: mergeSyllabus(stored.syllabus, body.syllabus),
      pyq: mergePyq(stored.pyq, body.pyq),
    };

    for (const store of STORES) {
      if (JSON.stringify(merged[store]).length > MAX_BYTES) {
        return NextResponse.json({ error: 'too_large', store }, { status: 413, headers: noStore });
      }
    }

    // Written even when the merge equals what was stored. Comparing first
    // would save a write, but the documents are small and an equality check on
    // key order is a good way to convince yourself nothing changed when it
    // did. The client syncs on load and on hide, not per tick, so this runs a
    // handful of times a session.
    const rows = STORES.map((store) => ({ firebase_uid: uid, store, data: merged[store] }));
    const { error } = await db()
      .from('study_progress')
      .upsert(rows, { onConflict: 'firebase_uid,store' });
    if (error) throw new Error(error.message);

    return NextResponse.json({ signedIn: true, ...merged }, { headers: noStore });
  } catch (e) {
    // The caller keeps its local copy on failure, so a bad sync costs nothing
    // but the sync itself.
    console.error('[api/progress] sync', e);
    return NextResponse.json({ error: 'progress_unavailable' }, { status: 503, headers: noStore });
  }
}
