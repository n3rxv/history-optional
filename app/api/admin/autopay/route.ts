import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';
import { noStore } from '@/lib/cacheHeaders';
import { csvText, csvValue } from '@/lib/csv';

/**
 * Every weekly mandate and what became of it, with the address attached.
 *
 * Razorpay has this too, but spread across three screens: the per-cycle order
 * carries no notes because Razorpay generates it, the plan is shared by
 * everyone, and only the subscription itself holds firebase_uid and email.
 *
 * `abandoned` is derived rather than stored. Nothing tells us someone walked
 * away — the absence of a charge is the only signal — so an attempt still
 * sitting at `started` after the grace window is reported as abandoned. It
 * can still turn into a charge afterwards, and will correct itself if it does.
 *
 * `format=csv` for export.
 */

const ABANDONED_AFTER_MINUTES = 30;
const PAGE_SIZE = 100;

type Row = {
  razorpay_subscription_id: string;
  firebase_uid: string;
  email: string | null;
  status: string;
  started_at: string;
  first_charged_at: string | null;
  last_charged_at: string | null;
  charge_count: number;
};

/** started + past the grace window and never charged = walked away. */
function reportedStatus(r: Row): string {
  if (r.status !== 'started') return r.status;
  const age = Date.now() - new Date(r.started_at).getTime();
  return age > ABANDONED_AFTER_MINUTES * 60_000 ? 'abandoned' : 'started';
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const wanted = (params.get('status') ?? '').trim();
  const csv = params.get('format') === 'csv';

  const { data, error } = await createServerClient()
    .from('autopay_attempts')
    .select('razorpay_subscription_id, firebase_uid, email, status, started_at, first_charged_at, last_charged_at, charge_count')
    .order('started_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = ((data ?? []) as Row[]).map(r => ({ ...r, status: reportedStatus(r) }));
  const filtered = wanted ? rows.filter(r => r.status === wanted) : rows;

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  if (csv) {
    const header = 'email,status,started_at,first_charged_at,last_charged_at,charges,subscription_id\n';
    const body = filtered.map(r => [
      csvText(r.email),
      csvValue(r.status),
      csvValue(r.started_at),
      csvValue(r.first_charged_at),
      csvValue(r.last_charged_at),
      csvValue(r.charge_count),
      csvValue(r.razorpay_subscription_id),
    ].join(',')).join('\n');
    return new NextResponse(header + body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="autopay.csv"',
        ...noStore,
      },
    });
  }

  return NextResponse.json({ counts, rows: filtered }, { headers: noStore });
}
