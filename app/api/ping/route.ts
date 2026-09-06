import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, clientIp } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
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

  /**
   * Opt-in credential check: /api/ping?check=firebase
   *
   * Nothing in normal operation exercises the Firebase *private* key. Every
   * route calls verifyIdToken, which validates against Google's public certs,
   * so a dead service-account key looks exactly like a healthy one — which is
   * how ours stayed rejected long enough to be forgotten. This makes that
   * state observable without waiting for someone to add an admin feature and
   * hit a confusing app/invalid-credential.
   *
   * Not part of the default response: AuthGuard pings on page load, and a
   * Google API call per pageview would be a poor trade for a value that only
   * changes when a key is rotated.
   */
  if (req.nextUrl.searchParams.get('check') === 'firebase') {
    const { allowed } = await checkRateLimit(`ping-firebase:${clientIp(req)}`, {
      limit: 10,
      windowSeconds: 60,
    });
    if (!allowed) {
      results.firebaseAdmin = 'rate_limited';
    } else {
      try {
        const { adminAuth } = await import('@/lib/firebaseAdmin');
        await adminAuth.listUsers(1);
        results.firebaseAdmin = 'ok';
      } catch (e) {
        // The code, not the message: it says whether the credential is the
        // problem without describing the account.
        results.firebaseAdmin = (e as { errorInfo?: { code?: string } })?.errorInfo?.code ?? 'error';
      }
    }
  }

  const allOk = results.db === 'ok' && results.firebaseAdmin !== 'app/invalid-credential';
  return NextResponse.json({ ok: allOk, ts: new Date().toISOString(), ...results });
}
