'use client';
import React, { useMemo, useState } from 'react';
import { Button } from '@payloadcms/ui';
import { truncate } from './format';
import { Facets, type Facet } from './Facets';

export type Row = {
  id: string | number;
  question: string | null;
  note: string | null;
  start_page: number | null;
  /* Whether a PDF exists. The R2 object key never reaches the browser; the
     PDF button hits a route that signs a fresh URL and redirects. */
  hasPdf: boolean;
  /* Rendered on the server. relative() reads Date.now(), so computing it here
     would give the server and the client different text and break hydration. */
  added: string;
  pyq_ids: string[];
};
export type PyqLite = { id: number; year: number; marks: number; section: string; question: string };

/**
 * topper_copies belongs to the app rather than to Payload, so it cannot be a
 * collection with a generated edit screen. This is the edit screen: it writes
 * through /api/cms/topper-copies, which authorises against the caller's own
 * Payload session, so there is no second password anywhere.
 */
const FACETS: Facet<Row>[] = [
  { id: 'all',      label: 'questions',      hint: 'show everything', test: () => true },
  { id: 'pdf',      label: 'pdf on file',    hint: 'has a PDF',       test: r => r.hasPdf },
  { id: 'mapped',   label: 'mapped to pyqs', hint: 'has a PYQ',       test: r => r.pyq_ids.length > 0 },
  { id: 'unmapped', label: 'unmapped',       hint: 'needs a PYQ',     test: r => r.pyq_ids.length === 0 },
];

export function TopperEditor({ rows, pyqs }: { rows: Row[]; pyqs: PyqLite[] }) {
  const [openId, setOpenId] = useState<string | number | null>(null);
  const [items, setItems] = useState(rows);
  const [filter, setFilter] = useState('');
  const [facet, setFacet] = useState('all');

  const q = filter.trim().toLowerCase();
  const active = FACETS.find(f => f.id === facet)!;
  const visible = useMemo(
    () => items.filter(active.test).filter(r =>
      !q || (r.question ?? '').toLowerCase().includes(q) || (r.note ?? '').toLowerCase().includes(q)),
    [items, q, active]);

  const patch = (id: string | number, next: Partial<Row>) =>
    setItems(list => list.map(r => (r.id === id ? { ...r, ...next } : r)));

  const remove = (id: string | number) => setItems(list => list.filter(r => r.id !== id));

  return (
    <>
      <Facets facets={FACETS} rows={items} active={facet}
        onChange={id => { setFacet(id); setOpenId(null); }} />

      <input
        className="ops-input ops-search"
        placeholder={`Filter ${active.id === 'all' ? 'questions' : active.label} by text…`}
        aria-label="Filter topper copies"
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />
      <table className="ops-table ops-editable">
        <thead><tr>
          <th>Question</th><th>PYQ</th><th>PDF</th>
          <th className="ops-num">Start</th><th className="ops-num">Added</th><th className="ops-num" />
        </tr></thead>
        <tbody>
          {visible.slice(0, 300).map(r => (
            <React.Fragment key={r.id}>
              <tr>
                <td className="ops-wrap">{truncate(r.question, 120)}</td>
                <td>{r.pyq_ids.length
                  ? <span className="ops-pill" data-tone="success">{r.pyq_ids.length} mapped</span>
                  : <span className="ops-pill" data-tone="warning">unmapped</span>}</td>
                <td>{r.hasPdf
                  ? <span className="ops-pill" data-tone="success">on file</span>
                  : <span className="ops-pill" data-tone="error">missing</span>}</td>
                <td className="ops-num ops-dim">{r.start_page ?? '—'}</td>
                <td className="ops-num ops-dim">{r.added}</td>
                <td className="ops-actions-cell">
                  <div className="ops-actions">
                    {r.hasPdf ? (
                      <Button el="anchor" buttonStyle="secondary" size="small"
                        url={`/api/cms/topper-copies/pdf?id=${encodeURIComponent(String(r.id))}`}
                        newTab>PDF</Button>
                    ) : null}
                    <Button buttonStyle="secondary" size="small"
                      onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                      {openId === r.id ? 'Close' : 'Edit'}
                    </Button>
                  </div>
                </td>
              </tr>
              {openId === r.id ? (
                <tr>
                  <td colSpan={6}>
                    <EditForm
                      row={r} pyqs={pyqs}
                      onSaved={next => patch(r.id, next)}
                      onDeleted={() => { remove(r.id); setOpenId(null); }}
                      onClose={() => setOpenId(null)}
                    />
                  </td>
                </tr>
              ) : null}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {visible.length === 0 ? <p className="ops-empty">Nothing matches.</p> : null}
      {visible.length > 300 ? <p className="ops-empty">Showing 300 of {visible.length}.</p> : null}
    </>
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
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [problem, setProblem] = useState<string | null>(null);

  // Searching 1,584 questions on every keystroke is fine, but showing them all
  // is not, so the list is capped and the current selection always shown.
  const s = search.trim().toLowerCase();
  const matches = useMemo(() => {
    const chosen = pyqs.filter(p => ids.includes(String(p.id)));
    if (!s) return chosen.slice(0, 40);
    const hits = pyqs.filter(p => p.question.toLowerCase().includes(s) || String(p.year).includes(s));
    return [...chosen, ...hits.filter(h => !ids.includes(String(h.id)))].slice(0, 40);
  }, [pyqs, ids, s]);

  const toggle = (id: number) =>
    setIds(cur => (cur.includes(String(id)) ? cur.filter(x => x !== String(id)) : [...cur, String(id)]));

  const save = async () => {
    setState('saving'); setProblem(null);
    const res = await fetch('/api/cms/topper-copies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        id: row.id, question, note,
        start_page: startPage === '' ? null : Number(startPage),
        pyq_ids: ids,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setState('error'); setProblem(json.error ?? String(res.status)); return; }
    onSaved({ question, note, start_page: startPage === '' ? null : Number(startPage), pyq_ids: ids });
    setState('saved');
    setTimeout(() => setState('idle'), 2000);
  };

  const destroy = async () => {
    if (!confirm('Delete this topper copy and its PYQ mappings? This cannot be undone.')) return;
    setState('saving');
    const res = await fetch('/api/cms/topper-copies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: row.id }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setState('error'); setProblem(json.error ?? String(res.status)); return;
    }
    onDeleted();
  };

  return (
    <div className="ops-edit">
      {problem ? <div className="ops-error">{problem}</div> : null}

      <div className="ops-field">
        <label htmlFor={`q-${row.id}`}>Question</label>
        <textarea id={`q-${row.id}`} className="ops-textarea" value={question}
          onChange={e => setQuestion(e.target.value)} />
      </div>

      <div className="ops-inline">
        <div className="ops-field">
          <label htmlFor={`n-${row.id}`}>Note</label>
          <input id={`n-${row.id}`} className="ops-input" value={note}
            onChange={e => setNote(e.target.value)} placeholder="Optional" />
        </div>
        <div className="ops-field" style={{ maxWidth: 120 }}>
          <label htmlFor={`p-${row.id}`}>Start page</label>
          <input id={`p-${row.id}`} className="ops-input" inputMode="numeric" value={startPage}
            onChange={e => setStartPage(e.target.value.replace(/[^0-9]/g, ''))} />
        </div>
      </div>

      <div className="ops-field">
        <label htmlFor={`s-${row.id}`}>Mapped PYQs · {ids.length}</label>
        <input id={`s-${row.id}`} className="ops-input" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search 1,584 questions by text or year…" />
        <div className="ops-scroll" style={{ marginTop: 6 }}>
          <div className="ops-chips">
            {matches.map(p => (
              <button type="button" key={p.id} className="ops-chip"
                data-on={ids.includes(String(p.id))}
                onClick={() => toggle(p.id)}
                title={p.question}>
                {p.year} · {p.question.slice(0, 60)}{p.question.length > 60 ? '…' : ''}
              </button>
            ))}
            {matches.length === 0 ? <span className="ops-empty">No match.</span> : null}
          </div>
        </div>
      </div>

      <div className="ops-form-actions">
        <Button onClick={save} disabled={state === 'saving'}>
          {state === 'saving' ? 'Saving…' : 'Save'}
        </Button>
        <Button buttonStyle="secondary" onClick={onClose}>Cancel</Button>
        <Button buttonStyle="error" onClick={destroy}>Delete</Button>
        {state === 'saved' ? <span className="ops-saved">Saved</span> : null}
      </div>
    </div>
  );
}
