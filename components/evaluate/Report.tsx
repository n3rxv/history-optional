'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import type { AnswerEntry } from '@/hooks/useAnswerHistory';
import { toast } from '@/components/ui/Toast';
import PdfButton, { downloadEvaluationPdf } from '@/components/evaluate/PdfButton';
import ShareButton from '@/components/evaluate/ShareButton';

/**
 * A marked answer: the score and the marks for each part beside it, and the
 * feedback, the model answer and the historians to cite as tabs. Shared by an
 * evaluation just made and one opened from the reader's past evaluations,
 * which are stored in a slightly different shape (see fromEvaluation and
 * fromEntry).
 */

type SectionMark = { awarded: number; out_of: number; reasoning?: string };
type Part = { what_was_written?: string; strengths?: unknown; weaknesses?: unknown; analysis?: string; suggestions?: unknown };
type Historian = { name: string; work?: string; argument: string };

/** What /api/evaluate returns. */
export interface Evaluation {
  demand_of_question: string[];
  introduction: Part;
  body: Part;
  conclusion: Part;
  historians_to_cite: Historian[];
  model_answer: { introduction: string; body: string | string[]; conclusion: string };
  overall_feedback: string;
  section_marks: { introduction: SectionMark; body: SectionMark; conclusion: SectionMark; presentation: SectionMark };
  marks: number;
  marks_out_of: number;
  word_count: number;
  word_count_rating: 'LOW' | 'GOOD' | 'HIGH';
  /** The saved row, for sharing. Absent when the save failed. */
  evaluation_id?: string;
}

export type ReportData = {
  question: string;
  allotted: number;
  marks: number;
  marksOutOf: number;
  wordCount?: number;
  wordCountRating?: string;
  overall: string;
  demand: string[];
  sectionMarks?: Evaluation['section_marks'];
  introduction?: Part;
  body?: Part;
  conclusion?: Part;
  historians: Historian[];
  model?: Evaluation['model_answer'];
  date?: string;
  evaluationId?: string;
};

export const fromEvaluation = (question: string, allotted: number, e: Evaluation): ReportData => ({
  question, allotted, marks: e.marks, marksOutOf: e.marks_out_of, wordCount: e.word_count, wordCountRating: e.word_count_rating,
  overall: e.overall_feedback, demand: toArray(e.demand_of_question), sectionMarks: e.section_marks,
  introduction: e.introduction, body: e.body, conclusion: e.conclusion,
  historians: Array.isArray(e.historians_to_cite) ? e.historians_to_cite : [], model: e.model_answer,
  evaluationId: e.evaluation_id,
});

export const fromEntry = (x: AnswerEntry): ReportData => ({
  question: x.question, allotted: x.marksOutOf, marks: x.marks, marksOutOf: x.marksOutOf, wordCount: x.wordCount, wordCountRating: x.wordCountRating,
  overall: x.overallFeedback, demand: toArray(x.demandOfQuestion), sectionMarks: x.sectionMarks as Evaluation['section_marks'],
  introduction: x.introduction, body: x.body, conclusion: x.conclusion,
  historians: x.historiansToCite ?? [], model: x.modelAnswer, date: x.date, evaluationId: x.evaluationId,
});

/** Back to the shape /api/generate-pdf expects, for the download. */
const toEvaluation = (r: ReportData) => ({
  demand_of_question: r.demand, introduction: r.introduction, body: r.body, conclusion: r.conclusion,
  historians_to_cite: r.historians, model_answer: r.model, overall_feedback: r.overall, section_marks: r.sectionMarks,
  marks: r.marks, marks_out_of: r.marksOutOf, word_count: r.wordCount, word_count_rating: r.wordCountRating,
});

async function downloadPdf(r: ReportData) {
  const res = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'eval', question: r.question, marks: r.allotted, evaluation: toEvaluation(r) }),
  });
  if (!res.ok) throw new Error('PDF generation failed');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = r.question.slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_') + '-model_answer (historyoptional.xyz).pdf';
  a.click();
  URL.revokeObjectURL(url);
}

/** Any field that should be a list of strings, whatever shape the model sent. */
function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (val && typeof val === 'object') return Object.values(val as object).map(String).filter(Boolean);
  if (typeof val === 'string' && val.trim()) return [val];
  return [];
}
/** The prompt's own instructions sometimes come back as items; they are not feedback. */
const clean = (val: unknown) => toArray(val).filter((s) => s && !s.startsWith('One sentence') && !s.startsWith('IMPORTANT') && !s.startsWith('Use ['));

function bodyParas(body: string | string[]): string[] {
  const strip = (t: string) => t.replace(/^#{1,4}\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/^[-•*]\s+/, '').trim();
  return (Array.isArray(body) ? body : body.split(/\n\n+/)).map(strip).filter(Boolean);
}

// Historians named in the feedback, set in bold so they stand out as the names to look up.
const HISTORIAN_NAMES = [
  'Vincent Smith', 'D.D. Kosambi', 'Kosambi', 'Romila Thapar', 'R.S. Sharma', 'R.C. Majumdar',
  'Upinder Singh', 'Irfan Habib', 'Satish Chandra', 'B.D. Chattopadhyaya', 'Hermann Kulke',
  'Burton Stein', 'Nicholas Dirks', 'Sumit Sarkar', 'Bipan Chandra', 'K.A. Nilakanta Sastri',
  'A.L. Basham', 'John Marshall', 'Niharranjan Ray', 'Eric Hobsbawm', 'Ranajit Guha',
  'Sheldon Pollock', 'Richard Eaton', 'David Ludden', 'Susan Bayly', 'Christopher Bayly',
  'Jadunath Sarkar', 'Tapan Raychaudhuri', 'Dietmar Rothermund', 'Percival Spear',
  'Stanley Wolpert', 'Sudipta Kaviraj', 'Partha Chatterjee', 'Gyan Prakash', 'Dipesh Chakrabarty',
  'Tanika Sarkar', 'Sumit Guha', 'Muzaffar Alam', 'Sanjay Subrahmanyam', 'Velcheru Narayana Rao',
  'Daud Ali', 'Cynthia Talbot', 'Phillip Wagoner', 'George Michell', 'Vasundhara Filliozat',
];
const NAMES_RE = new RegExp(`(${HISTORIAN_NAMES.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
function boldHistorians(text: string): ReactNode[] {
  return text.split(NAMES_RE).map((part, i) => (HISTORIAN_NAMES.includes(part) ? <strong key={i}>{part}</strong> : part));
}

/** "[missed demand]: the point" as a tag and the point. */
function Tagged({ text, tone }: { text: string; tone: 'good' | 'fix' }) {
  const m = text.match(/^\[([^\]]+)\]:\s*/);
  return <li>{m && <span className={`ev-tag ${tone}`}>{m[1]}</span>}{m ? text.slice(m[0].length) : text}</li>;
}

export const scoreTone = (pct: number) => (pct >= 0.7 ? 'var(--success-text)' : pct >= 0.5 ? 'var(--warning-text)' : 'var(--danger-text)');
const mood = (pct: number, hi: boolean) =>
  pct >= 0.75 ? (hi ? 'मज़बूत उत्तर। ऐसे ही लिखते रहें।' : 'A strong answer. Keep writing like this.')
  : pct >= 0.5 ? (hi ? 'ठीक प्रयास, कुछ कमियाँ भरनी हैं।' : 'A decent attempt, with a few gaps to close.')
  : pct >= 0.3 ? (hi ? 'अभी कुछ दूरी है। नीचे की प्रतिक्रिया रास्ता दिखाती है।' : 'Some way to go. The feedback below shows where.')
  : (hi ? 'इस पर काफ़ी काम चाहिए। नीचे की प्रतिक्रिया से शुरू करें।' : 'This needs real work. Start with the feedback below.');
/** About how long an answer of each size should run. The marked answer's own count is not shown: read off a photo, it was often wrong. */
export const IDEAL_WORDS: Record<number, number> = { 10: 150, 15: 200, 20: 250 };

function PartCard({ label, mark, part, model, modelLabel, hi }: { label: string; mark?: SectionMark; part?: Part; model?: string; modelLabel: string; hi: boolean }) {
  if (!part && !model) return null;
  const strengths = clean(part?.strengths), weaknesses = clean(part?.weaknesses), tries = clean(part?.suggestions);
  return (
    <section className="ev-block">
      <div className="ev-block-head">
        <h2>{label}</h2>
        {mark && <span className="ev-block-mark">{mark.awarded} / {mark.out_of}</span>}
      </div>
      {part?.what_was_written && (
        <div className="ev-wrote"><span>{hi ? 'आपने लिखा' : 'What you wrote'}</span><blockquote>{part.what_was_written}</blockquote></div>
      )}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="ev-cols">
          <div>
            <h3 className="ev-col-title good">{hi ? 'क्या अच्छा रहा' : 'What worked'}</h3>
            <ul className="ev-points good">{strengths.length ? strengths.map((s, i) => <Tagged key={i} text={s} tone="good" />) : <li className="none">{hi ? 'यहाँ कुछ ख़ास नहीं।' : 'Nothing stood out here yet.'}</li>}</ul>
          </div>
          <div>
            <h3 className="ev-col-title fix">{hi ? 'क्या सुधारें' : 'What to fix'}</h3>
            <ul className="ev-points fix">{weaknesses.length ? weaknesses.map((s, i) => <Tagged key={i} text={s} tone="fix" />) : <li className="none">{hi ? 'कोई बड़ी कमी नहीं।' : 'No major issues here.'}</li>}</ul>
          </div>
        </div>
      )}
      {part?.analysis && <p className="ev-analysis">{part.analysis}</p>}
      {tries.length > 0 && (
        <div className="ev-tries">
          <h3 className="ev-col-title">{hi ? 'अगली बार ऐसे लिखें' : 'Try this next time'}</h3>
          {tries.map((s, i) => <p key={i} className="ev-try">{boldHistorians(s)}</p>)}
        </div>
      )}
      {model && (
        <div className="ev-model-part"><span>{modelLabel}</span><p>{model}</p></div>
      )}
    </section>
  );
}

export default function Report({ data, tab, setTab, onAnother, onBack, chatHref, hi }: {
  data: ReportData;
  tab: 'eval' | 'model' | 'hist';
  setTab: (t: 'eval' | 'model' | 'hist') => void;
  onAnother: () => void;
  /** For a past evaluation: back to the form. */
  onBack?: () => void;
  chatHref: string;
  hi: boolean;
}) {
  const pct = data.marksOutOf ? data.marks / data.marksOutOf : 0;
  const ideal = IDEAL_WORDS[data.allotted];
  return (
    <div className="ds-container ev-results">
      {onBack && (
        <button type="button" className="ds-back ev-results-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          {hi ? 'वापस' : 'Back to evaluate'}
        </button>
      )}
      <div className="ev-qbar">
        <span>{data.date ? `${new Date(data.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · ` : ''}{hi ? 'प्रश्न' : 'Question'} · {data.allotted} {hi ? 'अंक' : 'marks'}</span>
        <p>{data.question}</p>
      </div>

      <div className="ev-res-grid">
        <aside className="ev-score">
          <div className="ev-score-card">
            <div className="ev-score-num" style={{ color: scoreTone(pct) }}>{data.marks}<span>/ {data.marksOutOf}</span></div>
            <div className="ev-score-pct">{mood(pct, hi)}</div>
            <div className="ev-score-bar"><span style={{ width: `${Math.min(100, pct * 100)}%`, background: scoreTone(pct) }} /></div>
            {ideal ? <div className="ev-wc">{hi ? `आदर्श लंबाई: लगभग ${ideal} शब्द` : `Ideal length: about ${ideal} words`}</div> : null}
            {data.sectionMarks && (
              <div className="ev-sections">
                {(['introduction', 'body', 'conclusion', 'presentation'] as const).map((k) => {
                  const s = data.sectionMarks![k];
                  if (!s) return null;
                  const p = s.out_of ? s.awarded / s.out_of : 0;
                  const name = hi ? { introduction: 'भूमिका', body: 'मुख्य भाग', conclusion: 'निष्कर्ष', presentation: 'प्रस्तुति' }[k] : k;
                  return (
                    <div key={k} className="ev-sec">
                      <div className="ev-sec-top"><span className="ev-sec-name">{name}</span><span className="ev-sec-score">{s.awarded} / {s.out_of}</span></div>
                      <div className="ev-sec-bar"><span style={{ width: `${Math.min(100, p * 100)}%`, background: scoreTone(p) }} /></div>
                      {s.reasoning && <p className="ev-sec-why">{s.reasoning}</p>}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="ev-score-actions">
              {data.model && <button type="button" className="ds-btn ds-btn-solid" onClick={() => setTab('model')}>{hi ? 'आदर्श उत्तर देखें' : 'See the model answer'}</button>}
              <PdfButton hi={hi} download={() => downloadEvaluationPdf([data], { hi })} label={hi ? 'मूल्यांकन की PDF डाउनलोड करें' : 'Download the evaluation (PDF)'} />
              {data.evaluationId && <ShareButton evaluationId={data.evaluationId} marks={data.marks} outOf={data.marksOutOf} hi={hi} />}
              <Link href={chatHref} className="ds-btn ds-btn-line">{hi ? 'AI से इस पर पूछें' : 'Ask the AI about it'}</Link>
              <button type="button" className="ds-btn ds-btn-ghost" onClick={onAnother}>{hi ? 'दूसरा उत्तर जाँचें' : 'Check another answer'}</button>
            </div>
          </div>
        </aside>

        <div className="ev-feedback">
          <ReportBody data={data} tab={tab} setTab={setTab} hi={hi} />
        </div>
      </div>
    </div>
  );
}

/**
 * The feedback itself, without the score card: the note on indicative marks,
 * the tabs and what is under them. Also used for each question of a full
 * paper (components/PDFTestEvaluator).
 */
export function ReportBody({ data, tab, setTab, hi, compact, pdf }: {
  data: ReportData;
  tab: 'eval' | 'model' | 'hist';
  setTab: (t: 'eval' | 'model' | 'hist') => void;
  hi: boolean;
  /** Leave out the note on indicative marks, said once for a whole paper. */
  compact?: boolean;
  /** Offer this answer's evaluation as a PDF, under its number in the paper if it has one. */
  pdf?: { label?: string };
}) {
  const tabs = [
    ['eval', hi ? 'प्रतिक्रिया' : 'Feedback'],
    ...(data.model ? [['model', hi ? 'आदर्श उत्तर' : 'Model answer']] : []),
    ...(data.historians.length ? [['hist', hi ? 'इतिहासकार' : 'Historians']] : []),
  ] as ['eval' | 'model' | 'hist', string][];
  return (
    <>
      {!compact && <p className="ev-note">
        {hi
          ? 'ये अंक संकेत हैं, सटीक नहीं: परीक्षक एक-दो अंक कम दे सकता है। अंक बढ़ाती है प्रतिक्रिया: छूटे बिंदु, उद्धृत करने लायक़ इतिहासकार, और उत्तर कितना विश्लेषणात्मक है।'
          : 'These marks are indicative: an examiner may give a mark or two less. What moves your score is the feedback, the points you missed, the historians you could cite, and how analytical the answer is.'}
      </p>}

      {(tabs.length > 1 || pdf) && (
        <div className="ev-tabs-row">
          {tabs.length > 1 && (
            <div className="ev-tabs" role="tablist">
              {tabs.map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={`ev-tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{label}</button>
              ))}
            </div>
          )}
          {pdf && <PdfButton hi={hi} className="ds-btn ds-btn-line ds-btn-sm ev-pdf" download={() => downloadEvaluationPdf([{ ...data, label: pdf.label }], { hi })} label={hi ? 'PDF डाउनलोड करें' : 'Download PDF'} />}
        </div>
      )}

      {tab === 'eval' && (
        <>
          {data.overall && (
            <section className="ev-block ev-overall">
              <h2>{hi ? 'कुल मिलाकर' : 'Overall'}</h2>
              <p>{data.overall}</p>
            </section>
          )}
          {data.demand.length > 0 && (
            <section className="ev-block">
              <h2>{hi ? 'प्रश्न क्या माँगता है' : 'What the question asks for'}</h2>
              <ul className="ev-demand">{data.demand.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </section>
          )}
          <PartCard label={hi ? 'भूमिका' : 'Introduction'} mark={data.sectionMarks?.introduction} part={data.introduction} model={data.model?.introduction} modelLabel={hi ? 'आदर्श भूमिका' : 'A model introduction'} hi={hi} />
          <PartCard label={hi ? 'मुख्य भाग' : 'Body'} mark={data.sectionMarks?.body} part={data.body} modelLabel="" hi={hi} />
          <PartCard label={hi ? 'निष्कर्ष' : 'Conclusion'} mark={data.sectionMarks?.conclusion} part={data.conclusion} model={data.model?.conclusion} modelLabel={hi ? 'आदर्श निष्कर्ष' : 'A model conclusion'} hi={hi} />
        </>
      )}

      {tab === 'model' && data.model && (
        <section className="ev-block ev-model">
          <div className="ev-block-head">
            <h2>{hi ? 'आदर्श उत्तर' : 'Model answer'} · {data.allotted} {hi ? 'अंक' : 'marks'}</h2>
            <button type="button" className="ds-btn ds-btn-line ds-btn-sm" onClick={() => downloadPdf(data).catch(() => toast(hi ? 'PDF नहीं बन सका। फिर कोशिश करें।' : 'The PDF could not be made. Try again in a moment.', 'error'))}>
              {hi ? 'आदर्श उत्तर की PDF' : 'Download the model answer'}
            </button>
          </div>
          <h3 className="ev-model-h">{hi ? 'भूमिका' : 'Introduction'}</h3>
          <p>{data.model.introduction}</p>
          <h3 className="ev-model-h">{hi ? 'मुख्य भाग' : 'Body'}</h3>
          <ul className="ev-model-body">{bodyParas(data.model.body).map((p, i) => <li key={i}>{p}</li>)}</ul>
          <h3 className="ev-model-h">{hi ? 'निष्कर्ष' : 'Conclusion'}</h3>
          <p>{data.model.conclusion}</p>
        </section>
      )}

      {tab === 'hist' && (
        <section className="ev-block">
          <h2>{hi ? 'इस विषय पर उद्धृत करने लायक़ इतिहासकार' : 'Historians to cite on this topic'}</h2>
          <div className="ev-thinkers">
            {data.historians.map((h, i) => (
              <div key={i} className="ev-thinker">
                <div className="ev-thinker-name">{typeof h === 'object' && h ? h.name : String(h)}</div>
                {typeof h === 'object' && h?.work && <div className="ev-thinker-work">{h.work}</div>}
                {typeof h === 'object' && h?.argument && <p>{h.argument}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** The report's styles, for any page that shows one (or its ReportBody). */
export const REPORT_CSS = `
.ev-results { padding-top: clamp(24px, 4vh, 40px); }
.ev-results-back { margin-bottom: var(--space-4); }
.ev-qbar { margin-bottom: var(--space-5); padding: var(--space-4) var(--space-5); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.ev-qbar span { display: block; margin-bottom: 4px; font-size: 0.84rem; font-weight: 600; color: var(--text3); }
.ev-qbar p { margin: 0; font-size: 1.08rem; font-weight: 600; line-height: 1.55; }
.ev-res-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: var(--space-6); align-items: start; }
.ev-score { grid-column: 2; grid-row: 1; position: sticky; top: 84px; }
.ev-feedback { grid-column: 1; grid-row: 1; display: flex; flex-direction: column; gap: var(--space-4); min-width: 0; }
.ev-score-card { padding: var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--elev-1); }
.ev-score-num { font-size: 3.6rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
.ev-score-num span { margin-left: 6px; font-size: 1.4rem; font-weight: 600; letter-spacing: 0; color: var(--text3); }
.ev-score-pct { margin-top: var(--space-2); font-size: 0.95rem; line-height: 1.45; color: var(--text2); }
.ev-score-bar, .ev-sec-bar { height: 6px; margin-top: var(--space-3); border-radius: var(--radius-full); background: var(--ds-soft); overflow: hidden; }
.ev-score-bar span, .ev-sec-bar span { display: block; height: 100%; border-radius: inherit; transition: width 0.8s ease; }
.ev-wc { display: inline-block; margin-top: var(--space-3); padding: 3px 12px; border-radius: var(--radius-full); background: var(--ds-soft); color: var(--text2); font-size: 0.86rem; font-weight: 600; }
.ev-sections { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-5); padding-top: var(--space-5); border-top: 1px solid var(--border); }
.ev-sec-top { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); }
.ev-sec-name { font-weight: 700; text-transform: capitalize; }
.ev-sec-score { font-weight: 700; font-variant-numeric: tabular-nums; }
.ev-sec-bar { height: 4px; margin-top: 6px; }
.ev-sec-why { margin: 6px 0 0; font-size: 0.84rem; line-height: 1.5; color: var(--text3); }
.ev-score-actions { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-6); }
.ev-score-actions .ds-btn { width: 100%; justify-content: center; min-height: 46px; }
.ev-share { display: flex; flex-direction: column; gap: var(--space-2); }
.ev-share-note { margin: 0; font-family: var(--font-ui); font-size: 0.8rem; line-height: 1.5; color: var(--text3); }
.ev-share-link { padding: 0; border: 0; background: none; font: inherit; color: var(--accent-text); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
.ev-note { margin: 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); font-size: 0.88rem; line-height: 1.55; color: var(--text2); }
.ev-tabs { display: flex; gap: 4px; padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); align-self: flex-start; }
.ev-tabs-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-2) var(--space-3); }
.ev-pdf { margin-left: auto; }
.ev-tab { padding: 8px 18px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.92rem; font-weight: 700; white-space: nowrap; cursor: pointer; }
.ev-tab.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.ev-block { padding: var(--space-5) var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.ev-block h2 { margin: 0 0 var(--space-3); font-size: 1.15rem; font-weight: 800; letter-spacing: -0.01em; }
.ev-block-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-3); }
.ev-block-head h2 { margin: 0; }
.ev-block-mark { padding: 2px 10px; border-radius: var(--radius-full); background: var(--ds-soft); font-size: 0.86rem; font-weight: 700; color: var(--text2); font-variant-numeric: tabular-nums; }
.ev-overall p { margin: 0; font-size: 1rem; line-height: 1.75; }
.ev-demand { margin: 0; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 6px; list-style: disc; }
.ev-demand li { line-height: 1.6; color: var(--text); }
.ev-demand li::marker { color: var(--accent); }
.ev-wrote { margin-bottom: var(--space-4); }
.ev-wrote span { display: block; margin-bottom: 4px; font-size: 0.82rem; font-weight: 700; color: var(--text3); }
.ev-wrote blockquote { margin: 0; padding: var(--space-3) var(--space-4); border-left: 3px solid var(--border3); background: var(--ds-soft); border-radius: 0 var(--radius-md) var(--radius-md) 0; font-style: italic; line-height: 1.65; color: var(--text2); }
.ev-cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-5); }
.ev-col-title { margin: 0 0 var(--space-2); font-size: 0.92rem; font-weight: 700; color: var(--text); }
.ev-col-title.good { color: var(--success-text); }
.ev-col-title.fix { color: var(--danger-text); }
.ev-points { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }
.ev-points li { position: relative; padding-left: 16px; line-height: 1.6; font-size: 0.95rem; }
.ev-points li::before { content: ''; position: absolute; left: 0; top: 0.62em; width: 6px; height: 6px; border-radius: 50%; }
.ev-points.good li::before { background: var(--success-text); }
.ev-points.fix li::before { background: var(--danger-text); }
.ev-points li.none { color: var(--text3); }
.ev-points li.none::before { background: var(--border3); }
.ev-tag { display: inline-block; margin-right: 6px; padding: 1px 8px; border-radius: var(--radius-full); font-size: 0.74rem; font-weight: 700; vertical-align: 1px; }
.ev-tag.good { background: var(--success-wash); color: var(--success-text); }
.ev-tag.fix { background: var(--danger-wash); color: var(--danger-text); }
.ev-analysis { margin: var(--space-4) 0 0; line-height: 1.7; color: var(--text2); }
.ev-tries { margin-top: var(--space-4); }
.ev-try { margin: 0 0 var(--space-2); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--accent-dim); line-height: 1.6; font-size: 0.95rem; }
.ev-model-part { margin-top: var(--space-4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--success-wash); }
.ev-model-part span { display: block; margin-bottom: 4px; font-size: 0.82rem; font-weight: 700; color: var(--success-text); }
.ev-model-part p { margin: 0; line-height: 1.7; }
.ev-model p { margin: 0 0 var(--space-3); line-height: 1.8; }
.ev-model-h { margin: var(--space-4) 0 var(--space-2); font-size: 0.95rem; font-weight: 800; color: var(--accent-text); }
.ev-model-body { margin: 0 0 var(--space-3); padding-left: 1.2rem; list-style: disc; display: flex; flex-direction: column; gap: var(--space-2); }
.ev-model-body li { line-height: 1.75; }
.ev-thinkers { display: flex; flex-direction: column; gap: var(--space-3); }
.ev-thinker { padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--bg); }
.ev-thinker-name { font-weight: 700; }
.ev-thinker-work { margin-top: 2px; font-size: 0.86rem; color: var(--text3); }
.ev-thinker p { margin: 6px 0 0; line-height: 1.6; color: var(--text2); }

@media (max-width: 960px) {
  .ev-res-grid { grid-template-columns: minmax(0, 1fr); }
  .ev-score { position: static; grid-column: 1; grid-row: 1; }
  .ev-feedback { grid-column: 1; grid-row: 2; }
}
@media (max-width: 640px) {
  .ev-block { padding: var(--space-4); }
  .ev-cols { grid-template-columns: minmax(0, 1fr); gap: var(--space-4); }
  .ev-score-card { padding: var(--space-5) var(--space-4); }
  .ev-score-num { font-size: 3rem; }
  .ev-qbar p { font-size: 1rem; }
  .ev-tabs { align-self: stretch; }
  .ev-tab { flex: 1 1 auto; padding: 8px 10px; font-size: 0.86rem; }
}
@media (prefers-reduced-motion: reduce) { .ev-score-bar span, .ev-sec-bar span { transition: none; } }
`;
