import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const EMBED_SERVICE_URL = process.env.EMBED_SERVICE_URL || 'https://rag-embed-rerank.onrender.com';

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

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${EMBED_SERVICE_URL}/warmup`, { signal: controller.signal });
    clearTimeout(timer);
    results.render = res.ok ? 'ok' : `error:${res.status}`;
  } catch {
    results.render = 'timeout_or_error';
  }

  const allOk = results.db === 'ok';
  return NextResponse.json({ ok: allOk, ts: new Date().toISOString(), ...results });
}
