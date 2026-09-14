import React from 'react';
import { pyqs } from '@/lib/pyqData';
import { Shell } from './Shell';
import { readTable, relative } from './data';
import { TopperEditor, type Row, type PyqLite } from './TopperEditor';

type Copy = {
  id: string | number;
  created_at: string;
  drive_file_id?: string | null;
  question?: string | null;
  note?: string | null;
  start_page?: number | null;
};
type Mapping = { topper_copy_id: string | number; pyq_id: string };

export default async function TopperCopiesView() {
  const [copies, maps] = await Promise.all([
    readTable<Copy>('topper_copies', '*', { column: 'created_at' }, 1000),
    readTable<Mapping>('topper_copy_pyq_map', '*', undefined, 5000),
  ]);

  // The join table is the only record of which questions map to a PYQ.
  const byCopy = new Map<string, string[]>();
  for (const m of maps.rows) {
    const k = String(m.topper_copy_id);
    byCopy.set(k, [...(byCopy.get(k) ?? []), String(m.pyq_id)]);
  }

  const rows: Row[] = copies.rows.map(c => ({
    id: c.id,
    question: c.question ?? null,
    note: c.note ?? null,
    start_page: c.start_page ?? null,
    // Only whether a file exists. The key stays on the server and the URL is
    // signed per click, because a signature lives 300 seconds.
    hasPdf: Boolean(c.drive_file_id),
    added: relative(c.created_at),
    pyq_ids: byCopy.get(String(c.id)) ?? [],
  }));

  // Only the fields the picker shows, so 1,584 rows are not shipped in full.
  const lite: PyqLite[] = pyqs.map(p => ({
    id: p.id, year: p.year, marks: p.marks, section: p.section, question: p.question,
  }));

  return (
    <Shell title="Topper Copies" count={`${rows.length} questions`} error={copies.error}>
      {maps.error ? <div className="ops-error">PYQ mappings could not load: {maps.error}</div> : null}
      <TopperEditor rows={rows} pyqs={lite} />
    </Shell>
  );
}
