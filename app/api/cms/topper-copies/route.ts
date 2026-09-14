import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { createServerClient } from '@/lib/supabase';

/**
 * Write path for topper copies, used by the Topper Copies view inside /cms.
 *
 * topper_copies belongs to the app, not to Payload, so it cannot be a Payload
 * collection. Authorisation is still Payload's: every request is checked
 * against the caller's Payload session before anything is written, so there is
 * no second password and no separate token to leak.
 */
async function requireCmsUser(req: NextRequest) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  return user ?? null;
}

export async function PATCH(req: NextRequest) {
  if (!await requireCmsUser(req)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as
    | { id?: string | number; question?: string; note?: string; start_page?: number | null; pyq_ids?: string[] }
    | null;
  if (!body?.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createServerClient();

  // Only the fields the form actually sends, so a partial save cannot blank
  // a column it never showed.
  const patch: Record<string, unknown> = {};
  if (typeof body.question === 'string') patch.question = body.question.trim();
  if (typeof body.note === 'string') patch.note = body.note.trim() || null;
  if (body.start_page === null || typeof body.start_page === 'number') patch.start_page = body.start_page;

  if (Object.keys(patch).length) {
    const { error } = await db.from('topper_copies').update(patch).eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // PYQ mapping lives in its own join table, replaced wholesale so removing a
  // mapping works the same way as adding one.
  if (Array.isArray(body.pyq_ids)) {
    const del = await db.from('topper_copy_pyq_map').delete().eq('topper_copy_id', body.id);
    if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
    if (body.pyq_ids.length) {
      const ins = await db.from('topper_copy_pyq_map')
        .insert(body.pyq_ids.map(pyq_id => ({ topper_copy_id: body.id, pyq_id })));
      if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await requireCmsUser(req)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  }
  const { id } = await req.json().catch(() => ({ id: null })) as { id?: string | number | null };
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createServerClient();
  await db.from('topper_copy_pyq_map').delete().eq('topper_copy_id', id);
  const { error } = await db.from('topper_copies').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
