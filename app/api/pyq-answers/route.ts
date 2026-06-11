import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

async function getAuthUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const db = createServerClient();
  const { data: { user } } = await db.auth.getUser(auth.replace('Bearer ', ''));
  return user ?? null;
}

export async function GET(req: NextRequest) {
  const pyqId = req.nextUrl.searchParams.get('pyq_id');
  if (!pyqId) return NextResponse.json({ error: 'Missing pyq_id' }, { status: 400 });
  const db = createServerClient();
  const { data, error } = await db
    .from('pyq_answers')
    .select('id, display_name, storage_path, answer_number, created_at, user_id')
    .eq('pyq_id', parseInt(pyqId))
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const answers = (data ?? []).map((row: any) => ({
    ...row,
    public_url: `${supabaseUrl}/storage/v1/object/public/pyq-answers/${row.storage_path}`,
  }));
  return NextResponse.json({ answers });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Login required to submit answers.' }, { status: 401 });

  const formData = await req.formData();
  const pyqId   = parseInt(formData.get('pyq_id') as string);
  const rawName = (formData.get('display_name') as string ?? '').trim();
  const file    = formData.get('file') as File | null;

  if (!pyqId || !rawName || !file)
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  if (file.type !== 'application/pdf')
    return NextResponse.json({ error: 'Only PDF files are allowed.' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'File too large (max 5 MB).' }, { status: 400 });

  const safeName = rawName.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 30).trim() || 'User';
  const db = createServerClient();

  const { count: userCount } = await db
    .from('pyq_answers')
    .select('id', { count: 'exact', head: true })
    .eq('pyq_id', pyqId)
    .eq('user_id', user.id);

  const answerNumber = (userCount ?? 0) + 1;
  const fileName    = `${safeName.replace(/ /g, '-')}-${answerNumber}.pdf`;
  const storagePath = `pyq-${pyqId}/${user.id}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await db.storage
    .from('pyq-answers')
    .upload(storagePath, arrayBuffer, { contentType: 'application/pdf', upsert: false });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: inserted, error: insertErr } = await db
    .from('pyq_answers')
    .insert({ pyq_id: pyqId, user_id: user.id, display_name: safeName, storage_path: storagePath, answer_number: answerNumber })
    .select('id, display_name, storage_path, answer_number, created_at, user_id')
    .single();

  if (insertErr) {
    await db.storage.from('pyq-answers').remove([storagePath]);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return NextResponse.json({
    answer: {
      ...inserted,
      public_url: `${supabaseUrl}/storage/v1/object/public/pyq-answers/${storagePath}`,
    },
  });
}
