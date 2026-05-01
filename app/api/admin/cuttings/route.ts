import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminAuthed } from '@/lib/admin-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'newspaper_cuttings')
      .single();
    if (error || !data) return NextResponse.json({ cuttings: [] });
    return NextResponse.json({ cuttings: JSON.parse(data.value) });
  } catch {
    return NextResponse.json({ cuttings: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdminAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { cuttings } = await req.json();
    const { error } = await supabase
      .from('site_config')
      .upsert({ key: 'newspaper_cuttings', value: JSON.stringify(cuttings) }, { onConflict: 'key' });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Cuttings POST error:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
