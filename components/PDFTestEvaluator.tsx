'use client';
import { useRef, useState } from 'react';
import { useLang } from '@/lib/i18n/LangContext';
import { saveToHistory } from '@/hooks/useAnswerHistory';
import { getFingerprint } from '@/lib/fingerprint';
import { useRefreshSafe } from '@/hooks/useRefreshSafe';
import { REPORT_CSS, ReportBody, fromEvaluation, scoreTone, type Evaluation } from '@/components/evaluate/Report';
import PdfButton, { downloadEvaluationPdf, type PdfAnswer } from '@/components/evaluate/PdfButton';

/**
 * A whole answer booklet marked from one PDF: the pages are read, the answers
 * found and numbered, the reader checks that split, and each answer is
 * marked in turn. Premium. Used by the evaluate page's "A full paper" mode
 * and by the test page, before a paper (one already written) and after it
 * (the paper just sat, whose questions it is given).
 */

/** `text` is what is sent for marking; `shown`, when set, is the question in the reader's language, for display only. */
interface PaperQuestion { id: string; marks: number; text: string; shown?: string }
interface QuestionResult { question: PaperQuestion; evaluation: Evaluation | null; error?: string }
interface Segment { questionNumber: string; marks: number; questionText: string; answerText: string }
type Stage = 'upload' | 'loading' | 'review' | 'evaluating' | 'done';

const PdfIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>;
const Chevron = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>;

const pageRender = (page: { render: (p: never) => { promise: Promise<void> } }, canvas: HTMLCanvasElement, viewport: unknown) =>
  // pdfjs's render types want fields the runtime does not need.
  page.render({ canvasContext: canvas.getContext('2d')!, canvas, viewport } as never).promise;

/** The paper for its PDF: every answer in order, one that failed listed as not marked. */
const paperPdf = (results: QuestionResult[]): PdfAnswer[] => results.map(({ question: q, evaluation: ev }) => {
  const text = q.text || `Question ${q.id}`;
  return ev
    ? { ...fromEvaluation(text, q.marks, ev), label: q.id }
    : { question: text, allotted: q.marks, marks: 0, marksOutOf: q.marks, overall: '', demand: [], historians: [], label: q.id, notMarked: true };
});

/** One marked question of the paper, folded until opened. */
function QuestionCard({ result, open, onToggle, onRetry, hi, shown }: { result: QuestionResult; open: boolean; onToggle: () => void; onRetry?: () => void; hi: boolean; shown?: string }) {
  const [tab, setTab] = useState<'eval' | 'model' | 'hist'>('eval');
  const [retrying, setRetrying] = useState(false);
  const { question, evaluation: ev, error } = result;
  const pct = ev && ev.marks_out_of ? ev.marks / ev.marks_out_of : 0;
  return (
    <section className={`pe-q${open ? ' open' : ''}`}>
      <button type="button" className="pe-q-head" onClick={onToggle} aria-expanded={open}>
        <span className="pe-q-id">{question.id}</span>
        <span className="pe-q-text">{shown || question.text || (hi ? `प्रश्न ${question.id}` : `Question ${question.id}`)}</span>
        {ev ? <span className="pe-q-score" style={{ color: scoreTone(pct) }}>{ev.marks} / {ev.marks_out_of}</span>
          : error ? <span className="pe-q-score err">{hi ? 'नहीं हुआ' : 'Not marked'}</span>
          : <span className="pe-q-score">…</span>}
        <span className="pe-q-chev"><Chevron /></span>
      </button>
      {open && (
        <div className="pe-q-body">
          {error && (
            <div className="pe-err">
              <span>{error}</span>
              {onRetry && (
                <button type="button" className="ds-btn ds-btn-line ds-btn-sm" disabled={retrying}
                  onClick={async () => { setRetrying(true); await onRetry(); setRetrying(false); }}>
                  {retrying ? (hi ? 'फिर से हो रहा है…' : 'Trying again…') : (hi ? 'फिर कोशिश करें' : 'Try again')}
                </button>
              )}
            </div>
          )}
          {ev && <ReportBody data={fromEvaluation(question.text, question.marks, ev)} tab={tab} setTab={setTab} hi={hi} compact pdf={{ label: question.id }} />}
        </div>
      )}
    </section>
  );
}

export default function PDFTestEvaluator({ isPremium, onPaywall, token, paperQuestions, variant }: {
  isPremium: boolean;
  onPaywall: () => void;
  token: string | null;
  paperQuestions?: PaperQuestion[];
  variant?: 'evaluate' | 'test';
}) {
  const { langHi: hi } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>('upload');
  const [stepLabel, setStepLabel] = useState('');
  const [evalCurrent, setEvalCurrent] = useState(0);
  const [evalTotal, setEvalTotal] = useState(0);
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [expandedAnswer, setExpandedAnswer] = useState<number | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const shownOf = (id: string) => paperQuestions?.find((q) => q.id === id)?.shown;

  // The transcript and the questions found (one paid read of the booklet)
  // and every result are kept for the tab; a step in flight falls back to
  // the one before it. Keyed by where this sits, so a new test paper does not
  // reopen the last one's results.
  useRefreshSafe(
    `ho_pdf_eval_v1:${variant ?? 'test'}:${(paperQuestions ?? []).map((q) => q.id).join('.').slice(0, 200)}`,
    { stage: stage === 'evaluating' ? 'review' : stage === 'loading' ? 'upload' : stage, transcript, segments, results, expanded, showTranscript: false },
    (saved) => {
      setStage(saved.stage as Stage); setTranscript(saved.transcript); setSegments(saved.segments);
      setResults(saved.results); setExpanded(saved.expanded);
    },
  );

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.includes('pdf')) { setError(hi ? 'एक PDF फ़ाइल अपलोड करें।' : 'Upload a PDF file.'); return; }
    setFile(f); setError(null);
  };
  const headers = async () => ({ 'x-user-token': token ?? '', 'x-fingerprint': await getFingerprint() });

  /** Read every page and find the answers, then stop for the reader to check. */
  async function handleDetect() {
    if (!file) return;
    setError(null); setStage('loading'); setProgress(5); setEvalTotal(0);
    try {
      setStepLabel(hi ? 'PDF खुल रहा है' : 'Opening the PDF');
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      setProgress(20);
      const BATCH = 8;
      const total = pdf.numPages;
      const batches = Math.ceil(total / BATCH);
      let text = '';
      for (let b = 0; b < batches; b++) {
        const start = b * BATCH + 1;
        const end = Math.min((b + 1) * BATCH, total);
        setStepLabel(hi ? `हस्तलिपि पढ़ी जा रही है, पेज ${start} से ${end}, कुल ${total}` : `Reading the handwriting, pages ${start} to ${end} of ${total}`);
        const fd = new FormData();
        for (let i = start; i <= end; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width; canvas.height = viewport.height;
          await pageRender(page as never, canvas, viewport);
          const blob = await new Promise<Blob>((res) => canvas.toBlob((bl) => res(bl!), 'image/jpeg', 0.85));
          fd.append('files', blob, `page-${i}.jpg`);
        }
        const res = await fetch('/api/ocr-pdf', { method: 'POST', headers: await headers(), body: fd });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error((hi ? `पेज ${start} से ${end} नहीं पढ़े जा सके: ` : `Pages ${start} to ${end} could not be read: `) + (e.error ?? res.status));
        }
        const data = await res.json();
        if (data.text) text += (text ? '\n\n' : '') + data.text;
        setProgress(20 + Math.round(((b + 1) / batches) * 35));
        if (b < batches - 1) await new Promise((r) => setTimeout(r, 500));
      }
      setTranscript(text);
      setProgress(55);
      if (!text.trim()) throw new Error(hi ? 'पेजों से कोई पाठ नहीं मिला। PDF शायद धुंधला है, साफ़ स्कैन के साथ फिर कोशिश करें।' : 'No text came off the pages. The PDF may be too faint or blurred; try a cleaner scan.');

      setStepLabel(hi ? 'उत्तर अलग किए जा रहे हैं' : 'Finding each answer');
      let found: Segment[];
      if (paperQuestions?.length) {
        found = paperQuestions.map((q) => ({ questionNumber: q.id, marks: q.marks, questionText: q.text, answerText: text }));
      } else {
        const res = await fetch('/api/detect-questions', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await headers()) }, body: JSON.stringify({ transcript: text }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? (hi ? 'उत्तर अलग नहीं हो सके' : 'The answers could not be separated'));
        found = data.segments ?? [];
        if (!found.length) throw new Error(hi ? 'कोई उत्तर नहीं मिला। PDF की गुणवत्ता देखकर फिर कोशिश करें।' : 'No answers were found. Check the scan and try again.');
      }
      setProgress(100);
      setSegments(found);
      setStage('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage('upload');
    }
  }

  /** Mark each checked answer in turn, and keep each in the past evaluations. */
  async function handleRunEvaluation() {
    if (!segments.length) return;
    setError(null); setStage('evaluating'); setProgress(5); setEvalCurrent(0); setEvalTotal(segments.length);
    const out: QuestionResult[] = [];
    try {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const q: PaperQuestion = { id: seg.questionNumber, marks: seg.marks, text: seg.questionText };
        setEvalCurrent(i + 1);
        setStepLabel(hi ? `${seg.questionNumber} जाँचा जा रहा है (${i + 1}/${segments.length})` : `Marking ${seg.questionNumber} (${i + 1} of ${segments.length})`);
        setProgress(5 + Math.round(((i + 1) / segments.length) * 90));
        try {
          const fd = new FormData();
          fd.append('question', q.text || `Question ${q.id}`);
          fd.append('marks', String(q.marks));
          fd.append('extractedText', seg.answerText || transcript);
          fd.append('lang', hi ? 'hi' : 'en');
          const res = await fetch('/api/evaluate', { method: 'POST', headers: await headers(), body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? (hi ? 'मूल्यांकन नहीं हुआ' : 'The evaluation failed'));
          out.push({ question: q, evaluation: data });
        } catch (err) {
          out.push({ question: q, evaluation: null, error: err instanceof Error ? err.message : String(err) });
        }
        if (i < segments.length - 1) await new Promise((r) => setTimeout(r, 800));
      }
      setProgress(100);
      setResults(out);
      setStage('done');
      if (out.length) setExpanded(out[0].question.id);
      // One id for the paper, so the past evaluations can show and download it whole.
      const paperId = `paper-${Date.now()}`;
      for (const r of out) {
        const ev = r.evaluation;
        if (!ev) continue;
        saveToHistory({
          question: r.question.text || `Question ${r.question.id}`,
          marks: ev.marks ?? 0, marksOutOf: ev.marks_out_of ?? r.question.marks,
          overallFeedback: ev.overall_feedback ?? '', wordCount: ev.word_count, wordCountRating: ev.word_count_rating,
          sectionMarks: {
            introduction: ev.section_marks?.introduction ?? { awarded: 0, out_of: 0 },
            body: ev.section_marks?.body ?? { awarded: 0, out_of: 0 },
            conclusion: ev.section_marks?.conclusion ?? { awarded: 0, out_of: 0 },
            presentation: ev.section_marks?.presentation ?? { awarded: 0, out_of: 0 },
          },
          demandOfQuestion: ev.demand_of_question ?? [],
          introduction: ev.introduction as never, body: ev.body as never, conclusion: ev.conclusion as never,
          historiansToCite: ev.historians_to_cite ?? [], modelAnswer: ev.model_answer,
          // A question marked from a full paper is filed under full papers;
          // without this they were all listed with the single answers.
          type: 'batch',
          paperId,
          label: r.question.id,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage('review');
    }
  }

  const retry = (r: QuestionResult) => async () => {
    const seg = segments.find((s) => s.questionNumber === r.question.id);
    if (!seg) return;
    setResults((prev) => prev.map((x) => (x.question.id === r.question.id ? { ...x, error: undefined, evaluation: null } : x)));
    try {
      const fd = new FormData();
      fd.append('question', seg.questionText || `Question ${seg.questionNumber}`);
      fd.append('marks', String(seg.marks));
      fd.append('extractedText', seg.answerText);
      fd.append('lang', hi ? 'hi' : 'en');
      const res = await fetch('/api/evaluate', { method: 'POST', headers: { ...(await headers()), 'x-internal': '1' }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? (hi ? 'मूल्यांकन नहीं हुआ' : 'Evaluation failed'));
      setResults((prev) => prev.map((x) => (x.question.id === r.question.id ? { ...x, evaluation: data } : x)));
    } catch (e) {
      setResults((prev) => prev.map((x) => (x.question.id === r.question.id ? { ...x, error: e instanceof Error ? e.message : String(e) } : x)));
    }
  };

  const updateSegment = (i: number, patch: Partial<Segment>) => setSegments((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const startOver = () => { setStage('upload'); setFile(null); setResults([]); setTranscript(''); setSegments([]); setError(null); };

  const steps = [
    [hi ? 'उत्तर लिखें' : 'Write the paper', hi ? 'कागज़ पर, जैसे परीक्षा हॉल में' : 'On paper, as in the hall'],
    [hi ? 'एक PDF में स्कैन करें' : 'Scan it to one PDF', hi ? 'सारे पेज एक फ़ाइल में' : 'Every page in one file'],
    [hi ? 'अपलोड करें, जँचवाएँ' : 'Upload and have it marked', hi ? 'हर उत्तर के अंक और प्रतिक्रिया' : 'Marks and feedback for each answer'],
  ];

  let content: React.ReactNode;

  if (!isPremium) {
    content = (
      <div className="pe-card">
        <div className="pe-head">
          <span className="pe-icon"><PdfIcon /></span>
          <div><h3>{hi ? 'पूरा पेपर जँचवाएँ' : 'Have a whole paper marked'}</h3><p>{hi ? 'पूरी उत्तर पुस्तिका की एक PDF: हर पेज पढ़ा जाता है, हर उत्तर अलग किया जाता है, और हर एक के अंक और प्रतिक्रिया मिलती है।' : 'One PDF of the whole answer booklet: every page is read, each answer found, and every one marked with feedback.'}</p></div>
          <span className="pe-premium">{hi ? 'प्रीमियम' : 'Premium'}</span>
        </div>
        <ol className="pe-steps">{steps.map(([t, s], i) => <li key={t}><span>{i + 1}</span><div><strong>{t}</strong><p>{s}</p></div></li>)}</ol>
        <button type="button" className="ds-btn ds-btn-premium ds-btn-block" onClick={onPaywall}>{hi ? 'प्रीमियम के साथ खोलें' : 'Unlock it with Premium'}</button>
      </div>
    );
  } else if (stage === 'loading' || stage === 'evaluating') {
    content = (
      <div className="pe-card pe-wait">
        <span className="pe-wait-label">{stage === 'loading' ? (hi ? 'पेपर पढ़ा जा रहा है' : 'Reading the paper') : (hi ? 'पेपर जाँचा जा रहा है' : 'Marking the paper')}</span>
        <span className="pe-wait-pct">{progress}%</span>
        <span className="pe-wait-bar"><span style={{ width: `${progress}%` }} /></span>
        {stage === 'evaluating' && evalTotal > 0 && (
          <span className="pe-dots">{Array.from({ length: evalTotal }, (_, i) => <span key={i} className={evalCurrent > i ? 'on' : ''} />)}</span>
        )}
        <span className="pe-wait-step">{stepLabel}</span>
      </div>
    );
  } else if (stage === 'review') {
    content = (
      <div className="pe-card">
        <h3 className="pe-title">{hi ? 'मिले हुए उत्तर जाँचें' : 'Check the answers we found'}</h3>
        <p className="pe-sub">
          {hi ? `आपकी पुस्तिका में ${segments.length} उत्तर मिले। जाँचने से पहले प्रश्न संख्या और अंक देख लें।` : `We found ${segments.length} ${segments.length === 1 ? 'answer' : 'answers'} in your booklet. Check each one's number and marks before it is marked.`}
        </p>
        {transcript && (
          <details className="pe-transcript">
            <summary>{hi ? 'पढ़ा गया पूरा पाठ' : 'Everything we read off the pages'}</summary>
            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} />
          </details>
        )}
        <div className="pe-segs">
          {segments.map((seg, i) => (
            <div key={i} className="pe-seg">
              <div className="pe-seg-head">
                <span className="pe-seg-id">{seg.questionNumber}</span>
                <div className="pe-seg-marks" role="radiogroup" aria-label={hi ? 'अंक' : 'Marks'}>
                  {[10, 15, 20].map((m) => (
                    <button key={m} type="button" role="radio" aria-checked={seg.marks === m} className={seg.marks === m ? 'on' : ''} onClick={() => updateSegment(i, { marks: m })}>{m}</button>
                  ))}
                </div>
                <button type="button" className="pe-link" onClick={() => setExpandedAnswer((p) => (p === i ? null : i))}>
                  {expandedAnswer === i ? (hi ? 'उत्तर छिपाएँ' : 'Hide the answer') : (hi ? 'उत्तर देखें' : 'See the answer')}
                </button>
                {segments.length > 1 && (
                  <button type="button" className="pe-x" onClick={() => setSegments((p) => p.filter((_, j) => j !== i))} aria-label={hi ? 'यह उत्तर हटाएँ' : 'Remove this answer'}>✕</button>
                )}
              </div>
              {shownOf(seg.questionNumber) ? (
                // The paper's own question, in the reader's language; the
                // English is what goes for marking.
                <div className="pe-field"><span>{hi ? 'प्रश्न' : 'The question'}</span><p className="pe-seg-q">{shownOf(seg.questionNumber)}</p></div>
              ) : (
                <label className="pe-field">
                  <span>{hi ? 'प्रश्न (अगर पता हो)' : 'The question, if you know it'}</span>
                  <input value={seg.questionText} onChange={(e) => updateSegment(i, { questionText: e.target.value })}
                    placeholder={hi ? 'जैसे: "15वीं सदी के भारत में भक्ति आंदोलन की भूमिका की समीक्षा करें।"' : 'e.g. "Examine the role of the Bhakti movement in fifteenth-century India."'} />
                </label>
              )}
              {expandedAnswer === i && seg.answerText && (
                <label className="pe-field">
                  <span>{hi ? 'इस प्रश्न का उत्तर' : 'The answer we found for it'}</span>
                  <textarea value={seg.answerText} onChange={(e) => updateSegment(i, { answerText: e.target.value })} rows={8} />
                </label>
              )}
            </div>
          ))}
        </div>
        {error && <div className="pe-err">{error}</div>}
        <div className="pe-actions">
          <button type="button" className="ds-btn ds-btn-line" onClick={() => { setStage('upload'); setSegments([]); setTranscript(''); }}>{hi ? 'वापस' : 'Back'}</button>
          <button type="button" className="ds-btn ds-btn-solid pe-go" onClick={handleRunEvaluation} disabled={!segments.length}>
            {hi ? `${segments.length} उत्तर जाँचें` : `Mark ${segments.length} ${segments.length === 1 ? 'answer' : 'answers'}`}
          </button>
        </div>
      </div>
    );
  } else if (stage === 'done') {
    const got = results.reduce((s, r) => s + (r.evaluation?.marks ?? 0), 0);
    const max = results.reduce((s, r) => s + (r.evaluation?.marks_out_of ?? r.question.marks), 0);
    const pct = max ? got / max : 0;
    content = (
      <>
        <div className="pe-card pe-summary">
          <div>
            <span className="pe-summary-label">{hi ? 'पूरे पेपर के अंक' : 'The whole paper'}</span>
            <span className="pe-summary-num" style={{ color: scoreTone(pct) }}>{got}<small> / {max}</small></span>
            <span className="pe-summary-sub">{hi ? `${results.length} उत्तर जाँचे गए` : `${results.length} ${results.length === 1 ? 'answer' : 'answers'} marked`}</span>
          </div>
          <span className="pe-wait-bar pe-summary-bar"><span style={{ width: `${Math.min(100, pct * 100)}%`, background: scoreTone(pct) }} /></span>
          <div className="pe-summary-actions">
            {results.some((r) => r.evaluation) && (
              <PdfButton hi={hi} className="ds-btn ds-btn-solid ds-btn-sm" download={() => downloadEvaluationPdf(paperPdf(results), { hi, paper: true })}
                label={hi ? 'पूरे पेपर की PDF' : 'Download the whole paper (PDF)'} />
            )}
            <button type="button" className="ds-btn ds-btn-line ds-btn-sm" onClick={startOver}>{hi ? 'दूसरा पेपर जँचवाएँ' : 'Mark another paper'}</button>
          </div>
        </div>
        <p className="pe-note">
          {hi ? 'ये अंक संकेत हैं: परीक्षक एक-दो अंक कम दे सकता है। हर उत्तर की प्रतिक्रिया ही असली काम की चीज़ है।' : 'These marks are indicative: an examiner may give a mark or two less. The feedback on each answer is the useful part.'}
        </p>
        {transcript && (
          <details className="pe-transcript">
            <summary>{hi ? 'पढ़ा गया पूरा पाठ' : 'Everything we read off the pages'}</summary>
            <textarea value={transcript} readOnly />
          </details>
        )}
        <div className="pe-qs">
          {results.map((r) => (
            <QuestionCard key={r.question.id} result={r} hi={hi} shown={shownOf(r.question.id)} open={expanded === r.question.id}
              onToggle={() => setExpanded((p) => (p === r.question.id ? null : r.question.id))}
              onRetry={r.error ? retry(r) : undefined} />
          ))}
        </div>
      </>
    );
  } else {
    content = (
      <div className="pe-card">
        <div className="pe-head">
          <span className="pe-icon"><PdfIcon /></span>
          <div>
            <h3>{hi ? 'पूरा पेपर जँचवाएँ' : 'Have a whole paper marked'}</h3>
            <p>
              {paperQuestions?.length
                ? (hi ? `इस पेपर के ${paperQuestions.length} प्रश्नों के आपके उत्तर, एक PDF में।` : `Your answers to this paper's ${paperQuestions.length} questions, in one PDF.`)
                : (hi ? 'पूरी उत्तर पुस्तिका की एक PDF। हर उत्तर अलग किया जाता है, आप जाँचते हैं, फिर हर एक के अंक मिलते हैं।' : 'One PDF of the whole answer booklet. Each answer is found, you check the split, then every one is marked.')}
            </p>
          </div>
          <span className="pe-premium">{hi ? 'प्रीमियम' : 'Premium'}</span>
        </div>
        {paperQuestions && paperQuestions.length > 0 && (
          <div className="pe-chips">{paperQuestions.map((q) => <span key={q.id}>{q.id} · {q.marks} {hi ? 'अंक' : 'marks'}</span>)}</div>
        )}
        <label className={`pe-drop${dragging ? ' drag' : ''}${file ? ' has' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}>
          <span className="pe-drop-icon"><PdfIcon /></span>
          {file ? (
            <><span className="pe-drop-title">{file.name}</span><span className="pe-drop-sub">{(file.size / 1024 / 1024).toFixed(1)} MB · {hi ? 'बदलने के लिए टैप करें' : 'tap to change'}</span></>
          ) : (
            <><span className="pe-drop-title">{hi ? <>उत्तर पुस्तिका की PDF यहाँ छोड़ें, या <u>चुनें</u></> : <>Drop the booklet&apos;s PDF here, or <u>choose it</u></>}</span><span className="pe-drop-sub">{hi ? 'एक PDF, सारे पेज' : 'One PDF with every page'}</span></>
          )}
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="pe-drop-input" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {error && <div className="pe-err">{error}</div>}
        {file && <button type="button" className="ds-btn ds-btn-solid ds-btn-block pe-go" onClick={handleDetect}>{hi ? 'पेपर पढ़ें' : 'Read the paper'}</button>}
      </div>
    );
  }

  return (
    <div className="pe ds">
      <style>{PE_CSS + REPORT_CSS}</style>
      {content}
    </div>
  );
}

const PE_CSS = `
.pe-card { padding: var(--space-5) var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--elev-1); }
.pe-head { display: flex; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-4); }
.pe-head h3 { margin: 0 0 4px; font-size: 1.15rem; font-weight: 800; letter-spacing: -0.01em; }
.pe-head p { margin: 0; font-size: 0.94rem; line-height: 1.55; color: var(--text2); }
.pe-head > div { flex: 1; min-width: 0; }
.pe-icon { width: 44px; height: 44px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--accent-dim); color: var(--accent-text); }
.pe-premium { flex-shrink: 0; padding: 2px 10px; border-radius: var(--radius-full); background: var(--premium-wash); color: var(--premium-text); font-size: 0.78rem; font-weight: 700; }
.pe-steps { list-style: none; margin: 0 0 var(--space-5); padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-2); }
.pe-steps li { display: flex; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-lg); background: var(--ds-soft); }
.pe-steps li > span { width: 24px; height: 24px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--ds-card); color: var(--accent-text); font-size: 0.8rem; font-weight: 800; }
.pe-steps strong { display: block; font-size: 0.9rem; }
.pe-steps p { margin: 2px 0 0; font-size: 0.82rem; color: var(--text3); }
.pe-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: var(--space-4); }
.pe-chips span { padding: 2px 10px; border-radius: var(--radius-full); background: var(--ds-soft); font-size: 0.8rem; color: var(--text2); }
.pe-drop { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: var(--space-8) var(--space-4); border: 1.5px dashed var(--border3); border-radius: var(--radius-xl); background: var(--bg); text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.pe-drop:hover, .pe-drop.drag { border-color: var(--accent); background: var(--accent-dim); }
.pe-drop.has { border-style: solid; border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.pe-drop-icon { width: 46px; height: 46px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: var(--space-2); border-radius: 14px; background: var(--accent-dim); color: var(--accent-text); }
.pe-drop-title { font-size: 1rem; font-weight: 600; color: var(--text); word-break: break-word; }
.pe-drop-title u { color: var(--accent-text); text-underline-offset: 3px; }
.pe-drop-sub { font-size: 0.88rem; color: var(--text3); }
.pe-drop-input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.pe-go { margin-top: var(--space-4); min-height: 48px; justify-content: center; }
.pe-err { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--danger-wash); color: var(--danger-text); font-size: 0.92rem; line-height: 1.5; }

.pe-wait { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-8) var(--space-5); text-align: center; }
.pe-wait-label { font-size: 0.95rem; font-weight: 700; color: var(--text2); }
.pe-wait-pct { font-size: 3rem; font-weight: 800; letter-spacing: -0.03em; color: var(--accent-text); font-variant-numeric: tabular-nums; }
.pe-wait-bar { display: block; width: 100%; max-width: 320px; height: 6px; border-radius: var(--radius-full); background: var(--ds-soft); overflow: hidden; }
.pe-wait-bar > span { display: block; height: 100%; border-radius: inherit; background: var(--accent); transition: width 0.8s cubic-bezier(.16,1,.3,1); }
.pe-dots { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.pe-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--ds-soft); border: 1px solid var(--border2); }
.pe-dots span.on { background: var(--accent); border-color: var(--accent); }
.pe-wait-step { font-size: 0.9rem; color: var(--text3); }

.pe-title { margin: 0 0 var(--space-2); font-size: 1.2rem; font-weight: 800; letter-spacing: -0.01em; }
.pe-sub { margin: 0 0 var(--space-4); font-size: 0.95rem; line-height: 1.55; color: var(--text2); }
.pe-transcript { margin-bottom: var(--space-4); }
.pe-transcript summary { cursor: pointer; font-size: 0.9rem; font-weight: 700; color: var(--accent-text); }
.pe-transcript textarea { width: 100%; box-sizing: border-box; min-height: 180px; margin-top: var(--space-2); padding: var(--space-3); border: 1px solid var(--border2); border-radius: var(--radius-lg); background: var(--bg); color: var(--text2); font: inherit; font-size: 0.88rem; line-height: 1.65; resize: vertical; }
.pe-segs { display: flex; flex-direction: column; gap: var(--space-3); }
.pe-seg { padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--bg); }
.pe-seg-head { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2) var(--space-3); margin-bottom: var(--space-3); }
.pe-seg-id { min-width: 40px; font-weight: 800; color: var(--accent-text); }
.pe-seg-marks { display: inline-flex; gap: 2px; padding: 3px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.pe-seg-marks button { padding: 4px 12px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.86rem; font-weight: 700; cursor: pointer; }
.pe-seg-marks button.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.pe-link { margin-left: auto; padding: 0; border: none; background: none; font: inherit; font-size: 0.88rem; font-weight: 600; color: var(--accent-text); cursor: pointer; }
.pe-x { width: 30px; height: 30px; border: none; border-radius: 50%; background: none; color: var(--text3); cursor: pointer; }
.pe-x:hover { color: var(--danger-text); background: var(--danger-wash); }
.pe-field { display: block; margin-top: var(--space-2); }
.pe-field > span { display: block; margin-bottom: 4px; font-size: 0.84rem; font-weight: 700; color: var(--text2); }
.pe-seg-q { margin: 0; font-size: 0.94rem; line-height: 1.55; color: var(--text); }
.pe-field input, .pe-field textarea { width: 100%; box-sizing: border-box; padding: var(--space-2) var(--space-3); border: 1.5px solid var(--border2); border-radius: var(--radius-md); background: var(--ds-card); color: var(--text); font: inherit; font-size: 0.94rem; line-height: 1.55; outline: none; resize: vertical; }
.pe-field input:focus, .pe-field textarea:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); box-shadow: 0 0 0 3px var(--accent-glow); }
.pe-actions { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-5); }
.pe-actions .pe-go { flex: 1; min-width: 220px; margin-top: 0; }

.pe-summary { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-4) var(--space-6); }
.pe-summary > div { display: flex; flex-direction: column; gap: 2px; }
.pe-summary-label { font-size: 0.86rem; color: var(--text3); }
.pe-summary-num { font-size: 2.4rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.pe-summary-num small { font-size: 1.1rem; font-weight: 600; color: var(--text3); }
.pe-summary-sub { font-size: 0.88rem; color: var(--text2); }
.pe-summary-bar { flex: 1; min-width: 160px; max-width: none; }
.pe-summary-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.pe-note { margin: var(--space-3) 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); font-size: 0.88rem; line-height: 1.55; color: var(--text2); }
.pe-qs { display: flex; flex-direction: column; gap: var(--space-3); }
.pe-q { border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--ds-card); overflow: hidden; }
.pe-q-head { display: flex; align-items: center; gap: var(--space-3); width: 100%; padding: var(--space-4) var(--space-5); border: none; background: none; font: inherit; text-align: left; cursor: pointer; }
.pe-q-id { flex-shrink: 0; min-width: 44px; font-weight: 800; color: var(--accent-text); }
.pe-q-text { flex: 1; min-width: 0; font-size: 0.95rem; line-height: 1.5; color: var(--text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pe-q.open .pe-q-text { -webkit-line-clamp: unset; }
.pe-q-score { flex-shrink: 0; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--text2); }
.pe-q-score.err { color: var(--danger-text); font-weight: 700; font-size: 0.88rem; }
.pe-q-chev { flex-shrink: 0; color: var(--text3); transition: transform 0.2s; }
.pe-q.open .pe-q-chev { transform: rotate(180deg); }
.pe-q-body { display: flex; flex-direction: column; gap: var(--space-4); padding: 0 var(--space-5) var(--space-5); }
.pe-q-body .ev-block { background: var(--bg); }

@media (max-width: 640px) {
  .pe-card { padding: var(--space-4); }
  /* The icon and the Premium tag share a row, so the text gets the full width. */
  .pe-head { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: var(--space-3); }
  .pe-head > div { grid-column: 1 / -1; grid-row: 2; }
  .pe-head .pe-premium { grid-column: 3; grid-row: 1; align-self: center; }
  .pe-icon { width: 40px; height: 40px; }
  .pe-steps { grid-template-columns: minmax(0, 1fr); }
  /* Number, marks and remove on one row; the answer link on its own. */
  .pe-seg-head { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; }
  .pe-seg-marks { justify-self: start; }
  .pe-seg-head .pe-x { grid-column: 3; grid-row: 1; }
  .pe-seg-head .pe-link { grid-column: 1 / -1; grid-row: 2; justify-self: start; margin-left: 0; }
  .pe-actions { flex-direction: column-reverse; }
  .pe-actions .ds-btn { width: 100%; justify-content: center; }
  .pe-q-head { padding: var(--space-3) var(--space-4); }
  .pe-q-body { padding: 0 var(--space-3) var(--space-4); }
  .pe-summary-actions { width: 100%; flex-direction: column; }
  .pe-summary-actions .ds-btn { width: 100%; justify-content: center; }
}
`;
