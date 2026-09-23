'use client';
import React, { useState } from 'react';
import { Badge } from '../uui/base/badges';
import { relative, truncate } from './format';

/**
 * The evaluations table, with each row opening to show what the reader
 * actually got back.
 *
 * The list on its own answers "how many and how fast" and nothing about the
 * marking itself, which is the reason to look at one. The evaluation is
 * already on the row as jsonb, so opening it costs no further query.
 *
 * Client-side because a table that expands needs to hold which row is open;
 * everything it renders was fetched by the server view above it.
 */
type SectionMark = { awarded?: number; out_of?: number; reasoning?: string };

type SectionCritique = {
  analysis?: string;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  what_was_written?: string;
};

type ModelAnswer = { introduction?: string; body?: string[]; conclusion?: string };

type EvaluationBody = {
  demand_of_question?: string[];
  section_marks?: Record<string, SectionMark>;
  introduction?: SectionCritique;
  body?: SectionCritique;
  conclusion?: SectionCritique;
  model_answer?: ModelAnswer;
  overall_feedback?: string;
  historians_to_cite?: { name?: string; work?: string; argument?: string }[];
  word_count?: number;
  word_count_rating?: string;
};

export type EvaluationRow = {
  id?: string | number;
  created_at: string;
  email?: string | null;
  question?: string | null;
  duration_ms?: number | null;
  marks_awarded?: number | null;
  marks_out_of?: string | number | null;
  pages?: number | null;
  answer_text?: string | null;
  evaluation?: EvaluationBody | null;
};

const SLOW_MS = 8_000;

/* Marked sections in the order they are written, not the order the keys
   happen to land in. 'presentation' carries marks but no critique. */
const SECTIONS = ['introduction', 'body', 'conclusion', 'presentation'];

/**
 * A critique line, with its leading [TAG] lifted out to a pill.
 *
 * The tag set is deliberately open, so this matches whatever is in the
 * brackets rather than a list of known tags: a tag the model invents still
 * renders as a tag instead of as literal brackets in the middle of a
 * sentence.
 */
function Tagged({ line }: { line: string }) {
  const m = /^\s*\[([^\]]+)\]\s*/.exec(line);
  if (!m) return <>{line}</>;
  return (
    <>
      <Badge type="pill-color" size="sm" color="gray">{m[1]}</Badge>
      <span className="ml-2">{line.slice(m[0].length)}</span>
    </>
  );
}

function Lines({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-tertiary">{label}</div>
      <ul className="flex flex-col gap-1.5">
        {items.map((t, n) => (
          <li key={n} className="text-sm leading-relaxed text-secondary"><Tagged line={t} /></li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-tertiary">{label}</div>
      <div className="text-sm text-secondary">{children}</div>
    </div>
  );
}

export default function EvaluationRows({ rows }: { rows: EvaluationRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      {rows.map((r, i) => {
        const key = String(r.id ?? i);
        const open = openId === key;
        const ev = r.evaluation ?? null;
        const marks = ev?.section_marks ?? {};

        return (
          <React.Fragment key={key}>
            <tr
              onClick={() => setOpenId(open ? null : key)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenId(open ? null : key); }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={open}
              className={`cursor-pointer border-b border-secondary last:border-0 hover:bg-secondary ${open ? 'bg-secondary' : ''}`}
            >
              <td className="whitespace-nowrap px-4 py-3 text-left text-sm text-tertiary">
                <span className="mr-2 inline-block text-xs">{open ? '▾' : '▸'}</span>
                {relative(r.created_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-primary">{r.email ?? '—'}</td>
              <td className="px-4 py-3 text-left text-sm text-secondary">{truncate(r.question, 90)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-tertiary">{r.pages ?? '—'}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-secondary">
                {r.marks_awarded != null ? `${r.marks_awarded}/${r.marks_out_of ?? '—'}` : '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-tertiary">
                {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                {!ev
                  ? <Badge type="pill-color" size="sm" color="error">No result</Badge>
                  : (r.duration_ms ?? 0) >= SLOW_MS
                    ? <Badge type="pill-color" size="sm" color="warning">Slow</Badge>
                    : <Badge type="pill-color" size="sm" color="success">Done</Badge>}
              </td>
            </tr>

            {open && (
              <tr className="border-b border-secondary">
                <td colSpan={7} className="bg-primary px-4 py-5">
                  {!ev ? (
                    <p className="text-sm text-tertiary">
                      This one stored no evaluation. The request failed after the row was written.
                    </p>
                  ) : (
                    <>
                    <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
                      <div>
                        <Field label="Question">{r.question ?? '—'}</Field>

                        {/* What the reader actually wrote, as transcribed from
                            their sheet. Averages around 1,900 characters and
                            runs past 4,000, so it scrolls in its own box rather
                            than pushing the marking off the screen. pre-wrap
                            keeps the paragraph breaks the transcription made. */}
                        {r.answer_text ? (
                          <Field label={`Their answer · ${r.answer_text.trim().split(/\s+/).length} words`}>
                            <div className="max-h-80 overflow-y-auto rounded-lg border border-secondary bg-secondary px-3 py-2">
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary">
                                {r.answer_text}
                              </p>
                            </div>
                          </Field>
                        ) : (
                          <Field label="Their answer">
                            <span className="text-tertiary">Not stored for this one.</span>
                          </Field>
                        )}
                      </div>

                      <div>
                        {ev.demand_of_question?.length ? (
                          <Field label="Demand of the question">
                            <ul className="flex list-disc flex-col gap-1 pl-4">
                              {ev.demand_of_question.map((d, n) => <li key={n}>{d}</li>)}
                            </ul>
                          </Field>
                        ) : null}

                        {ev.overall_feedback ? (
                          <Field label="Overall feedback">{ev.overall_feedback}</Field>
                        ) : null}

                        {ev.historians_to_cite?.length ? (
                          <Field label="Historians to cite">
                            <ul className="flex flex-col gap-1">
                              {ev.historians_to_cite.map((h, n) => (
                                <li key={n}>
                                  <span className="font-medium text-primary">{h.name}</span>
                                  {h.work ? <span className="text-tertiary"> · {h.work}</span> : null}
                                  {h.argument ? <div className="text-tertiary">{h.argument}</div> : null}
                                </li>
                              ))}
                            </ul>
                          </Field>
                        ) : null}

                        {ev.word_count ? (
                          <Field label="Word count">
                            {ev.word_count}{ev.word_count_rating ? ` · ${ev.word_count_rating}` : ''}
                          </Field>
                        ) : null}
                      </div>
                    </div>

                    {/* The half of the marking that was being stored and never
                        shown. A marks row says a section lost points; these say
                        what was written, what it was read as, and what it was
                        told to do instead, which is the part worth reading when
                        a mark looks wrong. Full width because the suggestions
                        run to several lines of quoted prose. */}
                    {SECTIONS.some(n => marks[n] || (ev as Record<string, unknown>)[n]) && (
                      <div className="mt-2">
                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-tertiary">Section by section</div>
                        <div className="flex flex-col gap-3">
                          {SECTIONS.map(name => {
                            const m = marks[name];
                            const c = (ev as Record<string, unknown>)[name] as SectionCritique | undefined;
                            if (!m && !c) return null;
                            return (
                              <div key={name} className="rounded-lg border border-secondary px-3 py-3">
                                <div className="flex items-baseline justify-between gap-3">
                                  <span className="text-sm font-medium capitalize text-primary">{name}</span>
                                  <span className="text-sm tabular-nums text-secondary">
                                    {m?.awarded ?? '—'}/{m?.out_of ?? '—'}
                                  </span>
                                </div>
                                {c?.what_was_written ? (
                                  <p className="mt-2 border-l-2 border-secondary pl-3 text-sm italic leading-relaxed text-tertiary">
                                    {c.what_was_written}
                                  </p>
                                ) : null}
                                {m?.reasoning ? <p className="mt-2 text-sm leading-relaxed text-secondary">{m.reasoning}</p> : null}
                                {c?.analysis ? <p className="mt-2 text-sm leading-relaxed text-secondary">{c.analysis}</p> : null}
                                <Lines label="Strengths" items={c?.strengths} />
                                <Lines label="Weaknesses" items={c?.weaknesses} />
                                <Lines label="Suggestions" items={c?.suggestions} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {ev.model_answer && (ev.model_answer.introduction || ev.model_answer.body?.length || ev.model_answer.conclusion) ? (
                      <div className="mt-5">
                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-tertiary">Model answer</div>
                        <div className="max-h-96 overflow-y-auto rounded-lg border border-secondary bg-secondary px-3 py-3">
                          {ev.model_answer.introduction ? (
                            <p className="text-sm leading-relaxed text-secondary">{ev.model_answer.introduction}</p>
                          ) : null}
                          {ev.model_answer.body?.length ? (
                            <ul className="mt-3 flex list-disc flex-col gap-2 pl-4">
                              {ev.model_answer.body.map((b, n) => (
                                <li key={n} className="text-sm leading-relaxed text-secondary">{b}</li>
                              ))}
                            </ul>
                          ) : null}
                          {ev.model_answer.conclusion ? (
                            <p className="mt-3 text-sm leading-relaxed text-secondary">{ev.model_answer.conclusion}</p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    </>
                  )}
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
