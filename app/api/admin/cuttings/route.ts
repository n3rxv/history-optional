import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const token = req.headers.get('x-admin-token');
    const verify = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/verify-token`, {
      headers: { 'x-admin-token': token || '' }
    });
    if (!verify.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { cuttings } = await req.json();
    const { error } = await supabase
      .from('site_config')
      .upsert({ key: 'newspaper_cuttings', value: JSON.stringify(cuttings) }, { onConflict: 'key' });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
