import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { loadDebates, type DebateInput } from '@/lib/debates';

/**
 * The owner's edits to the historiography bank.
 *
 * The editor used to write to Supabase straight from the browser with the
 * public key, which only worked because the tables let anyone write; the
 * owner check was a comparison in the page's own code. Writes now come here,
 * checked against the signed-in account on the server, and use the secret
 * key. Each change rebuilds /historiography so readers see it at once.
 */

async function owner(req: NextRequest) {
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? req.headers.get('x-user-token');
  const user = await verifyFirebaseToken(bearer ?? null);
  return Boolean(user?.email && process.env.OWNER_EMAIL && user.email === process.env.OWNER_EMAIL);
}

const denied = () => NextResponse.json({ error: 'Not allowed' }, { status: 403 });

function clean(input: DebateInput) {
  const debate = {
    title: String(input.title ?? '').trim(),
    period: String(input.period ?? ''),
    paper: String(input.paper ?? ''),
    topics: Array.isArray(input.topics) ? input.topics.map(String) : [],
    type: input.type === 'topic' ? 'topic' : 'debate',
    upsc_tip: String(input.upsc_tip ?? ''),
  };
  const positions = (Array.isArray(input.positions) ? input.positions : [])
    .filter((p) => String(p.historian_name ?? '').trim())
    .map((p) => ({ historian_name: String(p.historian_name).trim(), stance: String(p.stance ?? ''), key_work: String(p.key_work ?? ''), argument: String(p.argument ?? ''), school: String(p.school ?? '') }));
  return { debate, positions };
}

async function done() {
  revalidatePath('/historiography');
  return NextResponse.json({ debates: await loadDebates() });
}

/** The current bank, for the owner after an edit. */
export async function GET(req: NextRequest) {
  if (!(await owner(req))) return denied();
  return NextResponse.json({ debates: await loadDebates() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  if (!(await owner(req))) return denied();
  const { debate, positions } = clean(await req.json());
  if (!debate.title) return NextResponse.json({ error: 'A title is needed' }, { status: 400 });
  const db = createServerClient();
  const { data, error } = await db.from('debates').insert(debate).select('id').single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not save' }, { status: 500 });
  if (positions.length) {
    const { error: pe } = await db.from('positions').insert(positions.map((p) => ({ ...p, debate_id: data.id })));
    if (pe) return NextResponse.json({ error: pe.message }, { status: 500 });
  }
  return done();
}

export async function PUT(req: NextRequest) {
  if (!(await owner(req))) return denied();
  const body = await req.json();
  const id = String(body.id ?? '');
  const { debate, positions } = clean(body);
  if (!id || !debate.title) return NextResponse.json({ error: 'An id and a title are needed' }, { status: 400 });
  const db = createServerClient();
  const { error } = await db.from('debates').update(debate).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Positions are replaced as a set, as the editor always did.
  const { error: de } = await db.from('positions').delete().eq('debate_id', id);
  if (de) return NextResponse.json({ error: de.message }, { status: 500 });
  if (positions.length) {
    const { error: pe } = await db.from('positions').insert(positions.map((p) => ({ ...p, debate_id: id })));
    if (pe) return NextResponse.json({ error: pe.message }, { status: 500 });
  }
  return done();
}

export async function DELETE(req: NextRequest) {
  if (!(await owner(req))) return denied();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'An id is needed' }, { status: 400 });
  const db = createServerClient();
  await db.from('positions').delete().eq('debate_id', id);
  const { error } = await db.from('debates').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return done();
}
