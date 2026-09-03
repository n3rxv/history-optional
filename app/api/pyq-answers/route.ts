import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { checkRateLimit, clientIp } from '@/lib/rateLimit';

async function getFirebaseUid(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const user = await verifyFirebaseToken(auth.replace('Bearer ', ''));
  return user?.uid ?? null;
}

export async function GET(req: NextRequest) {
  const pyqId = req.nextUrl.searchParams.get('pyq_id');
  if (!pyqId) return NextResponse.json({ error: 'Missing pyq_id' }, { status: 400 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { data, error } = await db
    .from('pyq_answers')
    .select('id, display_name, storage_path, answer_number, created_at')
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
  // Uploads land in Supabase Storage and are served publicly. Anonymous
  // posting is deliberate (answers are shared under a display name, not an
  // account), so the ceiling is per-IP rather than per-user. Without it this
  // is an open 5MB-per-request write endpoint into paid storage.
  const { allowed } = await checkRateLimit(`pyq-upload:${clientIp(req)}`, {
    limit: 5,
    windowSeconds: 60 * 60,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429 }
    );
  }

  const formData  = await req.formData();
  const pyqId     = parseInt(formData.get('pyq_id') as string);
  const rawName   = (formData.get('display_name') as string ?? '').trim();
  const file      = formData.get('file') as File | null;

  if (!pyqId || !rawName || !file)
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  if (file.type !== 'application/pdf')
    return NextResponse.json({ error: 'Only PDF files are allowed.' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'File too large (max 5 MB).' }, { status: 400 });

  // Optional auth — logged in users get firebase_uid attached
  const firebase_uid = await getFirebaseUid(req);

  const safeName = rawName.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 30).trim() || 'User';
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

  const { count: totalCount } = await db
    .from('pyq_answers')
    .select('id', { count: 'exact', head: true })
    .eq('pyq_id', pyqId);

  const answerNumber = (totalCount ?? 0) + 1;
  const fileName     = `${safeName.replace(/ /g, '-')}-${answerNumber}.pdf`;
  const storagePath  = `pyq-${pyqId}/anon/${Date.now()}-${fileName}`;
  const arrayBuffer  = await file.arrayBuffer();

  const { error: uploadErr } = await db.storage
    .from('pyq-answers')
    .upload(storagePath, arrayBuffer, { contentType: 'application/pdf', upsert: false });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const insertData: any = {
    pyq_id: pyqId,
    display_name: safeName,
    storage_path: storagePath,
    answer_number: answerNumber,
  };
  if (firebase_uid) insertData.firebase_uid = firebase_uid;

  const { data: inserted, error: insertErr } = await db
    .from('pyq_answers')
    .insert(insertData)
    .select('id, display_name, storage_path, answer_number, created_at')
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
