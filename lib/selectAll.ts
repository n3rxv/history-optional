type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/**
 * Reads every row a query matches, a page at a time.
 *
 * PostgREST stops each response at the project's max_rows, 1,000 here, and
 * .limit() cannot raise it. A query that outgrows that does not fail; it
 * quietly returns the first thousand. That is how the topper copies list
 * dropped 232 of its PYQ links the day the link table passed 1,000 rows.
 *
 * `page` must order on a unique key, or rows can repeat or go missing between
 * pages.
 *
 *   const maps = await selectAll((from, to) =>
 *     sb.from('topper_copy_pyq_map').select('topper_copy_id, pyq_id')
 *       .order('topper_copy_id').order('pyq_id').range(from, to));
 */
export async function selectAll<T>(page: (from: number, to: number) => Page<T>, size = 1000): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw new Error(error.message);
    all.push(...(data ?? []));
    if (!data || data.length < size) return all;
  }
}
