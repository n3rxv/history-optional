import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/verifyFirebaseToken';
import { createServerClient } from '@/lib/supabase';
import { isUpiId, normalisePhone } from '@/lib/referral';

/**
 * Asks for the reader's whole invite balance to be sent to a UPI id. The
 * database decides whether a milestone is open (supabase/referral_balance.sql);
 * the money leaves the balance at once, and the request becomes a row in
 * referral_payouts, which the user reads in Supabase and pays by hand.
 *
 *   POST /api/referral/payout   { upi: 'name@bank', phone: '98765 43210' }
 *
 * A refusal carries a `code` the page words in English or Hindi.
 */
const REFUSED = new Set(['no_window', 'pending', 'not_yet', 'empty']);

export async function POST(req: NextRequest) {
  const user = await verifyFirebaseToken(req.headers.get('x-user-token'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { upi, phone } = await req.json().catch(() => ({}));
  if (!isUpiId(upi)) return NextResponse.json({ code: 'bad_upi' }, { status: 400 });
  const mobile = normalisePhone(phone);
  if (!mobile) return NextResponse.json({ code: 'bad_phone' }, { status: 400 });

  const { data, error } = await createServerClient().rpc('request_referral_payout', {
    p_uid: user.uid,
    p_email: user.email ?? '',
    p_name: user.name ?? '',
    p_phone: mobile,
    p_upi: String(upi).trim(),
  });
  if (error) {
    console.error('[referral/payout]', error.message);
    return NextResponse.json({ code: 'failed' }, { status: 500 });
  }
  if (data?.result !== 'requested') {
    return NextResponse.json({ code: REFUSED.has(data?.result) ? data.result : 'failed' }, { status: 409 });
  }
  return NextResponse.json({ requested: true, amountPaise: data.amount_paise }, { headers: { 'Cache-Control': 'no-store' } });
}
