import { NextRequest, NextResponse } from 'next/server';

/**
 * Shared access gate for the answer-evaluation flow.
 *
 * Every step of that flow (OCR -> question detection -> evaluation) spends money
 * on an LLM call, so each step has to be gated the same way. This used to be
 * open-coded in /api/evaluate only, which left /api/ocr-pdf and
 * /api/detect-questions callable by anyone.
 *
 * Order: owner -> active subscription -> free quota.
 */

export const FREE_EVAL_LIMIT = 1;

export type EvalAccess =
  | { allowed: true; uid: string | null; isOwner: boolean; isPremium: boolean }
  | { allowed: false; reason: 'limit_reached' };

export async function resolveEvalAccess(req: NextRequest): Promise<EvalAccess> {
  const token = req.headers.get('x-user-token') ?? '';
  const fingerprint = req.headers.get('x-fingerprint') ?? '';

  let uid: string | null = null;
  let isOwner = false;

  if (token) {
    try {
      const { verifyFirebaseToken } = await import('@/lib/verifyFirebaseToken');
      const user = await verifyFirebaseToken(token);
      if (user) {
        uid = user.uid;
        if (user.email === process.env.OWNER_EMAIL) isOwner = true;
      }
    } catch {
      // An unverifiable token is treated as anonymous, not as an error.
    }
  }

  if (isOwner) return { allowed: true, uid, isOwner: true, isPremium: false };

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  if (uid) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('firebase_uid', uid)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (sub) return { allowed: true, uid, isOwner: false, isPremium: true };
  }

  // Free tier. Usage has to be attributable to somebody: a caller sending
  // neither a token nor a fingerprint would otherwise get unlimited AI calls
  // simply by omitting both headers.
  if (!uid && !fingerprint) return { allowed: false, reason: 'limit_reached' };

  let used = 0;
  if (uid) {
    const { data } = await supabase
      .from('usage_tracking')
      .select('eval_count')
      .eq('firebase_uid', uid)
      .maybeSingle();
    used = Math.max(used, data?.eval_count ?? 0);
  }
  if (fingerprint) {
    const { data } = await supabase
      .from('usage_tracking')
      .select('eval_count')
      .eq('fingerprint', fingerprint)
      .maybeSingle();
    used = Math.max(used, data?.eval_count ?? 0);
  }

  if (used >= FREE_EVAL_LIMIT) return { allowed: false, reason: 'limit_reached' };
  return { allowed: true, uid, isOwner: false, isPremium: false };
}

/** Matches the existing client contract: it keys the paywall off `limit_reached`. */
export function evalAccessDenied(reason: 'limit_reached') {
  return NextResponse.json({ error: reason }, { status: 403 });
}
