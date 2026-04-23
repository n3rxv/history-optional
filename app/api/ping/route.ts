import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    // Lightweight query — just checks DB is alive
    await supabase.from('subscription_slots').select('id').limit(1);
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
