import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results: Record<string, string> = {};

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    await supabase.from('subscription_slots').select('id').limit(1);
    results.db = 'ok';
  } catch {
    results.db = 'error';
  }

  // Voyage AI has no warmup needed — no cold start
  results.embed = 'voyage-ai';

  const allOk = results.db === 'ok';
  return NextResponse.json({ ok: allOk, ts: new Date().toISOString(), ...results });
}
