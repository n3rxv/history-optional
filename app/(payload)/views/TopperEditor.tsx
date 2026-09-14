'use client';
import React, { useMemo, useState } from 'react';
import { Badge } from '../uui/base/badges';
import { Button } from '../uui/base/button';
import { Input } from '../uui/base/input';
import { TextArea } from '../uui/base/textarea';
import { Facets, type Facet } from './Facets';
import { truncate } from './format';

export type Row = {
  id: string | number;
  question: string | null;
  note: string | null;
  start_page: number | null;
  /* Whether a PDF exists. The R2 object key never reaches the browser; the PDF
     button hits a route that signs a fresh URL and redirects, because a
     signature lives 300 seconds. */
  hasPdf: boolean;
  /* Resolved on the server: relative() reads Date.now(), and computing it here
     would give the server and the client different text. */
  added: string;
  pyq_ids: string[];
};
export type PyqLite = { id: number; year: number; marks: number; section: string; question: string };

const FACETS: Facet<Row>[] = [
  { id: 'all',      label: 'Questions',      hint: 'Show everything', test: () => true },
  { id: 'pdf',      label: 'PDF on file',    hint: 'Has a PDF',       test: r => r.hasPdf },
  { id: 'mapped',   label: 'Mapped to PYQs', hint: 'Has a PYQ',       test: r => r.pyq_ids.length > 0 },
  { id: 'unmapped', label: 'Unmapped',       hint: 'Needs a PYQ',     test: r => r.pyq_ids.length === 0 },
];

export function TopperEditor({ rows, pyqs }: { rows: Row[]; pyqs: PyqLite[] }) {
  const [openId, setOpenId] = useState<string | number | null>(null);
  const [items, setItems] = useState(rows);
  const [filter, setFilter] = useState('');
  const [facet, setFacet] = useState('all');

  const active = FACETS.find(f => f.id === facet)!;
  const q = filter.trim().toLowerCase();

  const visible = useMemo(
    () => items.filter(active.test).filter(r =>
      !q || (r.question ?? '').toLowerCase().includes(q) || (r.note ?? '').toLowerCase().includes(q)),
    [items, q, active]);

  const patch = (id: string | number, next: Partial<Row>) =>
    setItems(list => list.map(r => (r.id === id ? { ...r, ...next } : r)));

  return (
    <div className="uui">
      <Facets facets={FACETS} rows={items} active={facet}
        onChange={id => { setFacet(id); setOpenId(null); }} />

      <div className="mt-5">
        <Input
          aria-label="Filter topper copies"
          placeholder={`Filter ${active.id === 'all' ? 'questions' : active.label.toLowerCase()} by text`}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-secondary">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-secondary bg-secondary">
              {[
                { l: 'Question' }, { l: 'PYQ' }, { l: 'PDF' },
                { l: 'Start', r: true }, { l: 'Added', r: true }, { l: '', r: true },
              ].map((h, i) => (
                <th key={i} className={`px-4 py-3 text-xs font-medium text-tertiary ${h.r ? 'text-right' : 'text-left'}`}>
                  {h.l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.slice(0, 300).map(r => (
              <React.Fragment key={r.id}>
                <tr className="border-b border-secondary last:border-0 hover:bg-secondary">
                  <td className="px-4 py-3 text-sm text-secondary">{truncate(r.question, 110)}</td>
                  <td className="px-4 py-3">
                    {r.pyq_ids.length
                      ? <Badge type="pill-color" size="sm" color="success">{r.pyq_ids.length} mapped</Badge>
                      : <Badge type="pill-color" size="sm" color="warning">Unmapped</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    {r.hasPdf
                      ? <Badge type="pill-color" size="sm" color="success">On file</Badge>
                      : <Badge type="pill-color" size="sm" color="error">Missing</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-tertiary">{r.start_page ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-tertiary">{r.added}</td>
                  <td className="w-px whitespace-nowrap px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {r.hasPdf ? (
                        <Button
                          color="secondary" size="sm"
                          href={`/api/cms/topper-copies/pdf?id=${encodeURIComponent(String(r.id))}`}
                          target="_blank" rel="noopener noreferrer"
                        >PDF</Button>
                      ) : null}
                      <Button color="secondary" size="sm"
                        onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                        {openId === r.id ? 'Close' : 'Edit'}
                      </Button>
                    </div>
                  </td>
                </tr>
                {openId === r.id ? (
                  <tr>
                    <td colSpan={6} className="bg-secondary px-4 py-4">
                      <EditForm
                        row={r} pyqs={pyqs}
                        onSaved={next => patch(r.id, next)}
                        onDeleted={() => { setItems(l => l.filter(x => x.id !== r.id)); setOpenId(null); }}
                        onClose={() => setOpenId(null)}
                      />
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-tertiary">Nothing matches.</p>
        ) : null}
      </div>

      {visible.length > 300 ? (
        <p className="mt-3 text-sm text-tertiary">Showing 300 of {visible.length}.</p>
      ) : null}
    </div>
  );
}

function EditForm({ row, pyqs, onSaved, onDeleted, onClose }: {
  row: Row;
  pyqs: PyqLite[];
  onSaved: (next: Partial<Row>) => void;
  onDeleted: () => void;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState(row.question ?? '');
  const [note, setNote] = useState(row.note ?? '');
  const [startPage, setStartPage] = useState(row.start_page?.toString() ?? '');
  const [ids, setIds] = useState<string[]>(row.pyq_ids);
  const [search, setSearch] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [problem, setProblem] = useState<string | null>(null);

  // Searching 1,584 questions per keystroke is cheap; rendering them is not, so
  // the list is capped and the current selection is always shown first.
  const s = search.trim().toLowerCase();
  const matches = useMemo(() => {
    const chosen = pyqs.filter(p => ids.includes(String(p.id)));
    if (!s) return chosen.slice(0, 40);
    const hits = pyqs.filter(p => p.question.toLowerCase().includes(s) || String(p.year).includes(s));
    return [...chosen, ...hits.filter(h => !ids.includes(String(h.id)))].slice(0, 40);
  }, [pyqs, ids, s]);

  const toggle = (id: number) =>
    setIds(cur => (cur.includes(String(id)) ? cur.filter(x => x !== String(id)) : [...cur, String(id)]));

  const send = async (method: 'PATCH' | 'DELETE') => {
    setState('saving');
    setProblem(null);
    const body = method === 'DELETE'
      ? { id: row.id }
      : { id: row.id, question, note, start_page: startPage === '' ? null : Number(startPage), pyq_ids: ids };
    const res = await fetch('/api/cms/topper-copies', {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setState('idle'); setProblem(json.error ?? String(res.status)); return false; }
    return true;
  };

  const save = async () => {
    if (!await send('PATCH')) return;
    onSaved({ question, note, start_page: startPage === '' ? null : Number(startPage), pyq_ids: ids });
    setState('saved');
    setTimeout(() => setState('idle'), 2000);
  };

  const destroy = async () => {
    if (!confirm('Delete this topper copy and its PYQ mappings? This cannot be undone.')) return;
    if (await send('DELETE')) onDeleted();
  };

  return (
    <div className="rounded-xl border border-secondary bg-primary p-4">
      {problem ? (
        <div className="mb-3 rounded-lg border border-error_subtle bg-error-primary px-3 py-2 text-sm text-error-primary">
          {problem}
        </div>
      ) : null}

      <TextArea label="Question" value={question} onChange={setQuestion} rows={3} />

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input label="Note" placeholder="Optional" value={note} onChange={setNote} />
        </div>
        <div className="sm:w-32">
          <Input
            label="Start page" inputMode="numeric" value={startPage}
            onChange={v => setStartPage(v.replace(/[^0-9]/g, ''))}
          />
        </div>
      </div>

      <div className="mt-4">
        <Input
          label={`Mapped PYQs · ${ids.length}`}
          placeholder="Search 1,584 questions by text or year"
          value={search}
          onChange={setSearch}
        />
        <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-secondary p-2">
          <div className="flex flex-wrap gap-2">
            {matches.map(p => {
              const on = ids.includes(String(p.id));
              return (
                <button
                  key={p.id}
                  type="button"
                  title={p.question}
                  onClick={() => toggle(p.id)}
                  className={[
                    'rounded-full border px-3 py-1 text-xs transition',
                    on
                      ? 'border-success-600 bg-success-primary text-success-primary'
                      : 'border-secondary bg-primary text-secondary hover:bg-secondary',
                  ].join(' ')}
                >
                  {p.year} · {p.question.slice(0, 56)}{p.question.length > 56 ? '…' : ''}
                </button>
              );
            })}
            {matches.length === 0 ? <span className="text-sm text-tertiary">No match.</span> : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={save} isDisabled={state === 'saving'}>
          {state === 'saving' ? 'Saving…' : 'Save'}
        </Button>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button color="primary-destructive" onClick={destroy}>Delete</Button>
        {state === 'saved' ? <span className="text-sm text-success-primary">Saved</span> : null}
      </div>
    </div>
  );
}
