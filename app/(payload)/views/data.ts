import 'server-only';
import { createServerClient } from '@/lib/supabase';
import { selectAll } from '@/lib/selectAll';

export { relative, truncate } from './format';

/**
 * These tables belong to the app, not to Payload, so they are read directly
 * rather than through Payload's local API. The admin API routes are gated by
 * the old admin token, which a Payload session does not carry; Payload's own
 * auth already gates every view here, so the service client is the right
 * level. Nothing in this module writes.
 */
export type Loaded<T> = { rows: T[]; error: string | null };

export async function readTable<T>(
  table: string,
  columns = '*',
  orderBy?: { column: string; ascending?: boolean },
  limit = 500,
): Promise<Loaded<T>> {
  try {
    const db = createServerClient();
    let q = db.from(table).select(columns).limit(limit);
    if (orderBy) q = q.order(orderBy.column, { ascending: orderBy.ascending ?? false });
    const { data, error } = await q;
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []) as T[], error: null };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : 'unknown error' };
  }
}

/**
 * Every row, however many. readTable's limit cannot get past the API's
 * 1,000-row cap (see lib/selectAll.ts). `order` sets the page order and must
 * end on a unique column, or rows repeat or go missing between pages.
 */
export async function readAll<T>(
  table: string,
  columns: string,
  order: { column: string; ascending?: boolean }[],
): Promise<Loaded<T>> {
  try {
    const db = createServerClient();
    const rows = await selectAll<T>((from, to) => {
      let q = db.from(table).select(columns);
      for (const o of order) q = q.order(o.column, { ascending: o.ascending ?? true });
      return q.range(from, to) as unknown as PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
    });
    return { rows, error: null };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : 'unknown error' };
  }
}

export const since = (rows: { created_at?: string | null }[], ms: number) =>
  rows.filter(r => r.created_at && Date.parse(r.created_at) > Date.now() - ms).length;
