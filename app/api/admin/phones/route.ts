import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';
import { noStore } from '@/lib/cacheHeaders';
import { csvText, csvValue } from '@/lib/csv';

/**
 * The collected phone numbers.
 *
 * Phone is not unique in the table, on purpose: one person on a laptop and a
 * phone is two visitor_ids, and a shared family number is one number across
 * two people. Enforcing uniqueness on write would have trapped those people
 * behind the gate with no way past, so the duplicates are collapsed here
 * instead, where being wrong costs nothing.
 *
 * `format=csv` returns the deduplicated list for export.
 */

const PAGE_SIZE = 50;

type Row = {
  phone: string;
  first_name: string | null;
  last_name: string | null;
  firebase_uid: string | null;
  visitor_id: string | null;
  source: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const db = createServerClient();
  const search = (params.get('q') ?? '').trim();
  const csv = params.get('format') === 'csv';

  let query = db
    .from('user_profiles')
    .select('phone, first_name, last_name, firebase_uid, visitor_id, source, created_at, updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false });

  // Name or number: an admin looking someone up has one or the other.
  //
  // or() takes a comma-separated grammar, not bound parameters. A comma or a
  // bracket in the search term is read as syntax and either errors or changes
  // which rows come back, so those characters are dropped rather than passed
  // through. Length is capped for the same reason.
  const safeSearch = search.replace(/[,()\\]/g, '').slice(0, 60).trim();
  if (safeSearch) {
    const like = `%${safeSearch}%`;
    query = query.or(`phone.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`);
  }

  // PostgREST caps an unbounded select at 1000 rows and returns that quietly,
  // so an export must page rather than ask for everything at once.
  if (csv) {
    // Most rows today are backfilled Google names with no number yet. A file
    // called phone-numbers.csv should not be mostly blank phone columns.
    const csvQuery = query.not('phone', 'is', null);

    const all: Row[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await csvQuery.range(from, from + 999);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data?.length) break;
      all.push(...(data as Row[]));
      if (data.length < 1000) break;
    }

    // One line per number, keeping the earliest sighting and noting how many
    // identities share it.
    const byPhone = new Map<string, { first: string; count: number; sources: Set<string>; name: string }>();
    for (const r of all) {
      const seen = byPhone.get(r.phone);
      const when = r.created_at ?? r.updated_at ?? '';
      const name = [r.first_name, r.last_name].filter(Boolean).join(' ').trim();
      if (seen) {
        seen.count += 1;
        if (when && when < seen.first) seen.first = when;
        if (r.source) seen.sources.add(r.source);
        if (!seen.name && name) seen.name = name;
      } else {
        byPhone.set(r.phone, { first: when, count: 1, sources: new Set(r.source ? [r.source] : []), name });
      }
    }

    // csvText for the name, which a person typed and a spreadsheet would
    // otherwise evaluate; csvValue for everything this system produced.
    const lines = ['name,phone,first_seen,identities,sources'];
    for (const [phone, v] of byPhone) {
      lines.push([
        csvText(v.name),
        csvValue(phone),
        csvValue(v.first),
        csvValue(v.count),
        csvValue([...v.sources].join(' ')),
      ].join(','));
    }

    return new NextResponse(lines.join('\n'), {
      headers: {
        ...noStore,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="phone-numbers.csv"',
      },
    });
  }

  const page = Math.max(0, Number.parseInt(params.get('page') ?? '0', 10) || 0);

  // Whole-table counts, not per-page ones. A row is not a person, so the
  // header needs the distinct-number figure alongside the row count.
  const [{ data, error, count }, { data: statsRows }] = await Promise.all([
    query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1),
    db.rpc('profile_stats'),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    {
      data: (data ?? []) as Row[],
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
      stats: statsRows?.[0] ?? null,
    },
    { headers: noStore }
  );
}
