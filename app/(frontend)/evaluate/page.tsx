'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useLang } from '@/lib/i18n/LangContext';
import { saveToHistory, loadHistory, type AnswerEntry } from '@/hooks/useAnswerHistory';
import { auth } from '@/lib/firebase';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { useRefreshSafe } from '@/hooks/useRefreshSafe';
import PDFTestEvaluator from '@/components/PDFTestEvaluator';
import MapEvaluator from '@/components/MapEvaluator';
import EvalProgress, { ReadProgress, applyEvalStage, applyReadStage, type EvalStages, type ReadStages } from '@/components/EvalProgress';
import { readProgress } from '@/lib/progressStream';
import Report, { fromEntry, fromEvaluation, scoreTone, type Evaluation } from '@/components/evaluate/Report';

/**
 * Get an answer marked. One answer goes through three steps: upload the
 * pages, check what was read off them (the text is what gets marked), and the
 * report. A full paper and a map question have evaluators of their own,
 * behind the switch at the top. Past evaluations are kept in this browser.
 */

type Mode = 'single' | 'batch' | 'map';
type Marks = 10 | 15 | 20;

async function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<File> {
  if (file.type === 'application/pdf') return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/** A PDF's pages as images, so the reader is sent pictures, not the file. */
async function pdfToImages(file: File): Promise<File[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const images: File[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width; canvas.height = viewport.height;
    // pdfjs's render types want a canvas field the runtime does not need.
    await page.render({ canvasContext: canvas.getContext('2d')!, canvas, viewport } as Parameters<typeof page.render>[0]).promise;
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9));
    images.push(new File([blob], `page-${i}.jpg`, { type: 'image/jpeg' }));
  }
  return images;
}

const countWords = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

const UploadIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>;
const PdfIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>;
const MODE_ICON: Record<Mode, React.ReactNode> = {
  single: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></svg>,
  batch: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 4h11a1 1 0 0 1 1 1v14" /><rect x="4" y="7" width="12" height="14" rx="1.5" /><path d="M7 12h6M7 16h4" /></svg>,
  map: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15M15 6v15" /></svg>,
};

export default function EvaluatePage() {
  const { langHi: hi } = useLang();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [marks, setMarks] = useState<Marks>(15);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [submittedQ, setSubmittedQ] = useState('');
  const [submittedM, setSubmittedM] = useState<Marks>(15);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'eval' | 'model' | 'hist'>('eval');
  const [stage, setStage] = useState<'form' | 'ocr' | 'result'>('form');
  const [evalMode, setEvalMode] = useState<Mode>('single');
  const [extractedText, setExtractedText] = useState('');
  const [processedImageFiles, setProcessedImageFiles] = useState<File[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [readStages, setReadStages] = useState<ReadStages>({});
  const [readStartedAt, setReadStartedAt] = useState(0);
  const [evalStages, setEvalStages] = useState<EvalStages>({});
  const [evalStartedAt, setEvalStartedAt] = useState(0);
  const [drag, setDrag] = useState(false);

  // ── Past evaluations, kept in this browser ──
  const [history, setHistory] = useState<AnswerEntry[]>([]);
  const [openEntry, setOpenEntry] = useState<AnswerEntry | null>(null);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    // localStorage, so only in the browser.
     
    setHistory(loadHistory());
  }, []);
  const modeHistory = history.filter((e) => (evalMode === 'single' ? !e.type || e.type === 'single' : e.type === evalMode));
  const openDrawer = () => { setHistory(loadHistory()); setDrawer(true); };

  // Another page can open this one on a mode: the pricing card reaches map
  // evaluation with ?mode=map.
  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get('mode');
     
    if (mode === 'map' || mode === 'batch' || mode === 'single') setEvalMode(mode);
  }, []);

  // A refresh keeps the step, the transcript and the report; photos cannot
  // be kept, so a refresh on the review step marks from the transcript alone.
  useRefreshSafe(
    'ho_evaluate_v1',
    { stage, question, marks, extractedText, evaluation, submittedQ, submittedM, tab, evalMode, openEntryId: openEntry?.id ?? null },
    (saved) => {
      setStage(saved.stage);
      setQuestion(saved.question);
      setMarks(saved.marks);
      setExtractedText(saved.extractedText);
      setEvaluation(saved.evaluation);
      setSubmittedQ(saved.submittedQ);
      setSubmittedM(saved.submittedM);
      setTab(saved.tab);
      setEvalMode(saved.evalMode);
      if (saved.openEntryId) setOpenEntry(loadHistory().find((e) => e.id === saved.openEntryId) ?? null);
    },
  );

  // A question opened from the PYQs arrives as ?question=&marks=. It starts a
  // fresh answer, and leaves the address so a refresh does not wipe it later.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get('question');
    if (!q) return;
     
    setEvalMode('single'); setStage('form'); setEvaluation(null); setExtractedText(''); setOpenEntry(null);
    setQuestion(q.slice(0, 2000));
    const m = Number(p.get('marks'));
    if (m) setMarks(m <= 10 ? 10 : m <= 15 ? 15 : 20);
     
    p.delete('question'); p.delete('marks');
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${p.size ? `?${p}` : ''}`);
  }, []);

  // Each new step starts at its top.
  useEffect(() => { window.scrollTo(0, 0); }, [stage, openEntry]);

  const tokenRef = useRef<string | null>(null);

  const handleOcr = useCallback(async () => {
    if (!files.length) { setError(hi ? 'कम से कम एक पेज अपलोड करें।' : 'Upload at least one page first.'); return; }
    const hasPdf = files.some((f) => f.type === 'application/pdf');
    setError(''); setOcrLoading(true);
    setReadStages({ preparing: { files: files.length, pdf: hasPdf }, askQuestion: !question.trim() });
    setReadStartedAt(Date.now());
    let processed = [...files];
    if (hasPdf) {
      try {
        const expanded: File[] = [];
        for (const f of files) expanded.push(...(f.type === 'application/pdf' ? await pdfToImages(f) : [f]));
        processed = expanded;
      } catch (e) {
        setError((hi ? 'PDF नहीं खुल सका: ' : 'The PDF could not be opened: ') + (e instanceof Error ? e.message : ''));
        setOcrLoading(false);
        return;
      }
    }
    setProcessedImageFiles(processed);
    const compressed = await Promise.all(processed.map((f) => compressImage(f)));
    setReadStages((prev) => ({ ...prev, prepared: { pages: compressed.length } }));
    const fd = new FormData();
    fd.append('question', question);
    compressed.forEach((f) => fd.append('files', f));
    try {
      const res = await fetch('/api/ocr', { method: 'POST', headers: { 'x-user-token': tokenRef.current ?? '', 'x-ocr-stages': '1' }, body: fd });
      const { status, body } = await readProgress(res, (e) => setReadStages((prev) => applyReadStage(prev, e)));
      const data = (body ?? {}) as { text?: string; detectedQuestion?: string; error?: string };
      if (status >= 400) throw new Error(data.error || (hi ? 'पढ़ा नहीं जा सका' : 'The pages could not be read'));
      setExtractedText(data.text ?? '');
      if (data.detectedQuestion && !question.trim()) {
        setQuestion(data.detectedQuestion);
        // A sheet headed "(15 marks)" is marked out of 15 without being told.
        const m = data.detectedQuestion.match(/\b(10|15|20)\s*marks?\b/i);
        if (m) setMarks(Number(m[1]) as Marks);
      }
      setStage('ocr');
    } catch (e) {
      setError(e instanceof Error ? e.message : (hi ? 'फिर कोशिश करें।' : 'Please try again.'));
    } finally { setOcrLoading(false); }
  }, [files, question, hi]);

  // The free allowance and sign-in are checked before reading starts.
  const { GateModals, handleEvaluate, usage, showChatLimitModal, showLoginModal } = useSubscriptionGate(handleOcr);
  useEffect(() => {
    const u = auth.currentUser;
    if (u) u.getIdToken().then((tk) => { tokenRef.current = tk ?? usage.token ?? null; });
    else tokenRef.current = usage.token ?? null;
  }, [usage.token]);

  const submit = async () => {
    if (!question.trim()) { setError(hi ? 'पहले प्रश्न लिखें।' : 'Add the question first.'); return; }
    setError(''); setLoading(true); setEvaluation(null);
    setEvalStages({}); setEvalStartedAt(Date.now());
    const fd = new FormData();
    fd.append('question', question); fd.append('marks', marks.toString());
    fd.append('extractedText', extractedText);
    const evalFiles = processedImageFiles.length ? processedImageFiles : files;
    if (evalFiles.length) (await Promise.all(evalFiles.map((f) => compressImage(f)))).forEach((f) => fd.append('files', f));
    fd.append('lang', hi ? 'hi' : 'en');
    try {
      const res = await fetch('/api/evaluate', { method: 'POST', headers: { 'x-user-token': tokenRef.current ?? '', 'x-eval-stages': '1' }, body: fd });
      const { status, body } = await readProgress(res, (e) => setEvalStages((prev) => applyEvalStage(prev, e)));
      const data = body as (Evaluation & { error?: string }) | null;
      if (status >= 400 || !data) throw new Error(data?.error || (hi ? 'मूल्यांकन नहीं हो सका' : 'The evaluation failed'));
      saveToHistory({
        question, marks: data.marks, marksOutOf: data.marks_out_of, wordCount: data.word_count, wordCountRating: data.word_count_rating,
        overallFeedback: data.overall_feedback,
        sectionMarks: { introduction: data.section_marks.introduction, body: data.section_marks.body, conclusion: data.section_marks.conclusion, presentation: data.section_marks.presentation },
        demandOfQuestion: data.demand_of_question,
        introduction: data.introduction as AnswerEntry['introduction'], body: data.body as AnswerEntry['body'], conclusion: data.conclusion as AnswerEntry['conclusion'],
        historiansToCite: data.historians_to_cite, modelAnswer: data.model_answer,
      });
      setHistory(loadHistory());
      setSubmittedQ(question); setSubmittedM(marks);
      setEvaluation(data); setStage('result'); setTab('eval');
    } catch (e) {
      setError(e instanceof Error ? e.message : (hi ? 'कुछ गड़बड़ हुई।' : 'Something went wrong.'));
    } finally { setLoading(false); }
  };

  // ── Pages ──
  const addFiles = (added: File[]) => {
    if (!added.length) return;
    setFiles((f) => [...f, ...added].slice(0, 20));
    setPreviews((p) => [...p, ...added.map((f) => (f.type === 'application/pdf' ? '__pdf__' : URL.createObjectURL(f)))].slice(0, 20));
    setError('');
  };
  const removePage = (i: number) => { setFiles((f) => f.filter((_, j) => j !== i)); setPreviews((p) => p.filter((_, j) => j !== i)); };
  const movePage = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= files.length) return;
    const swap = <T,>(arr: T[]) => { const a = [...arr]; [a[i], a[j]] = [a[j], a[i]]; return a; };
    setFiles(swap); setPreviews(swap);
  };

  const reset = () => {
    setEvaluation(null); setFiles([]); setPreviews([]); setQuestion(''); setSubmittedQ(''); setExtractedText(''); setError('');
    setProcessedImageFiles([]); setStage('form'); setOpenEntry(null);
  };
  const pickMode = (m: Mode) => { setEvalMode(m); setOpenEntry(null); if (stage === 'result') reset(); };

  const signedOut = !usage.loading && !usage.fingerprint;
  const freeLeft = usage.subscribed ? null : Math.max(0, 1 - (usage.eval_count ?? 0));

  const thumbs = (editable: boolean) => previews.length > 0 && (
    <div className="ev-thumbs">
      {previews.map((src, i) => (
        <div key={i} className="ev-thumb">
          {src === '__pdf__'
            ? <div className="ev-thumb-pdf"><PdfIcon /><span>{files[i]?.name ?? 'PDF'}</span></div>
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={src} alt={`Page ${i + 1}`} />}
          <span className="ev-thumb-n">{i + 1}</span>
          {editable && (
            <>
              <button type="button" className="ev-thumb-rm" onClick={() => removePage(i)} aria-label={`Remove page ${i + 1}`}>×</button>
              <span className="ev-thumb-move">
                <button type="button" onClick={() => movePage(i, -1)} disabled={i === 0} aria-label={`Move page ${i + 1} earlier`}>‹</button>
                <button type="button" onClick={() => movePage(i, 1)} disabled={i === files.length - 1} aria-label={`Move page ${i + 1} later`}>›</button>
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );

  const marksPicker = (
    <div className="ev-marks" role="radiogroup" aria-label={hi ? 'अंक' : 'Marks'}>
      {([10, 15, 20] as const).map((m) => (
        <button key={m} type="button" role="radio" aria-checked={marks === m} className={`ev-mark${marks === m ? ' on' : ''}`} onClick={() => setMarks(m)}>
          {m} {hi ? 'अंक' : 'marks'}
        </button>
      ))}
    </div>
  );

  const chatHref = (q: string) => `/chat?q=${encodeURIComponent(q)}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ev ds">
        {ocrLoading && <ReadProgress stages={readStages} startedAt={readStartedAt} langHi={hi} />}
        {loading && <EvalProgress stages={evalStages} startedAt={evalStartedAt} langHi={hi} />}

        {openEntry ? (
          <Report data={fromEntry(openEntry)} tab={tab} setTab={setTab} onAnother={reset} onBack={() => setOpenEntry(null)} chatHref={chatHref(openEntry.question)} hi={hi} />
        ) : evaluation && stage === 'result' ? (
          <Report data={fromEvaluation(submittedQ, submittedM, evaluation)} tab={tab} setTab={setTab} onAnother={reset} chatHref={chatHref(submittedQ)} hi={hi} />
        ) : stage === 'ocr' ? (
          /* ── Check what was read ── */
          <div className="ds-container ev-grid ev-top">
            <section className="ev-card">
              <div className="ev-step">{hi ? 'चरण 2 में से 2' : 'Step 2 of 2'}</div>
              <h1 className="ev-card-title">{hi ? 'जो पढ़ा गया, उसे जाँचें' : 'Check what we read'}</h1>
              <p className="ev-card-lede">{hi ? 'यही पाठ जाँचा जाएगा। एक बार पढ़ लें और कोई भी नाम, तारीख या शब्द ठीक कर दें।' : 'This text is what gets marked. Read it through once and fix any name, date or term the reader got wrong.'}</p>
              {error && <div className="ev-err" role="alert">{error}</div>}
              <label className="ev-field">
                <span className="ev-label">{hi ? 'प्रश्न' : 'Question'}{!question.trim() && <em className="ev-missing">{hi ? ' (पढ़ा नहीं गया, लिख दें)' : ' (we could not read it; type it in)'}</em>}</span>
                <textarea className={`ev-input${!question.trim() ? ' missing' : ''}`} value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder={hi ? 'प्रश्न लिखें या चिपकाएँ' : 'Type or paste the question'} />
              </label>
              <div className="ev-field"><span className="ev-label">{hi ? 'अंक' : 'Marks'}</span>{marksPicker}</div>
              <label className="ev-field">
                <span className="ev-label-row"><span className="ev-label">{hi ? 'आपका उत्तर' : 'Your answer'}</span><span className="ev-count">{countWords(extractedText)} {hi ? 'शब्द' : 'words'}</span></span>
                <textarea className="ev-input ev-tall" value={extractedText.replace(/--- PAGE BREAK ---/g, ' ')} onChange={(e) => setExtractedText(e.target.value)} />
              </label>
              <div className="ev-actions">
                <button type="button" className="ds-btn ds-btn-line" onClick={() => setStage('form')}>{hi ? 'फिर से अपलोड करें' : 'Upload again'}</button>
                <button type="button" className="ds-btn ds-btn-solid ev-go" onClick={submit} disabled={loading || !question.trim()}>{hi ? 'मेरा उत्तर जाँचें' : 'Mark my answer'}</button>
              </div>
            </section>
            <aside className="ev-aside">
              {previews.length > 0 && <div className="ev-side"><h2>{hi ? 'आपके पेज' : 'Your pages'}</h2>{thumbs(false)}</div>}
              <div className="ev-side">
                <h2>{hi ? 'क्या जाँचें' : 'What to check'}</h2>
                <p>{hi ? 'हस्तलिपि पढ़ने में सबसे ज़्यादा गलती नामों में होती है, इसलिए पहले हर इतिहासकार और शासक का नाम देखें। फिर तारीखें और संख्याएँ।' : 'Names are where handwriting readers slip most, so look at every historian and ruler first. Then dates and numbers, whose digits can swap, and the terms particular to history.'}</p>
              </div>
            </aside>
          </div>
        ) : (
          /* ── Upload ── */
          <>
            <header className="ev-hero">
              <div className="ds-container">
                <div className="ev-hero-row">
                  <div>
                    <h1 className="ds-h1 ev-h1">{hi ? 'अपना उत्तर जँचवाएँ' : 'Get your answer checked'}</h1>
                    <p className="ds-lede ev-lede">
                      {hi
                        ? 'हस्तलिखित उत्तर की फोटो या PDF अपलोड करें। हर भाग के अंक, क्या अच्छा रहा, क्या सुधारें, उद्धृत करने लायक इतिहासकार, और एक आदर्श उत्तर मिलता है।'
                        : 'Upload a photo or PDF of a handwritten answer. You get marks for each part, what worked, what to fix, the historians it could have cited, and a model answer.'}
                    </p>
                  </div>
                  <button type="button" className="ds-btn ds-btn-line ev-past-btn" onClick={openDrawer}>
                    {hi ? 'पिछले मूल्यांकन' : 'Past evaluations'}{history.length > 0 && <span>{history.length}</span>}
                  </button>
                </div>
                <div className="ev-modes" role="tablist" aria-label={hi ? 'क्या जाँचना है' : 'What to mark'}>
                  {([
                    ['single', hi ? 'एक उत्तर' : 'One answer', hi ? 'एक प्रश्न, फोटो या PDF' : 'One question, photos or a PDF'],
                    ['batch', hi ? 'पूरा पेपर' : 'A full paper', hi ? 'सेक्शनल, FLT या पूरी पुस्तिका' : 'A sectional, an FLT or a whole booklet'],
                    ['map', hi ? 'मानचित्र प्रश्न' : 'The map question', hi ? '20 स्थान, लगभग 30 शब्द हर एक, 50 अंक' : '20 places, about 30 words each, 50 marks'],
                  ] as [Mode, string, string][]).map(([m, label, sub]) => (
                    <button key={m} type="button" role="tab" aria-selected={evalMode === m} className={`ev-mode${evalMode === m ? ' on' : ''}`} onClick={() => pickMode(m)}>
                      <span className="ev-mode-icon">{MODE_ICON[m]}</span>
                      <span className="ev-mode-text"><strong>{label}</strong><span>{sub}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            </header>

            {evalMode === 'map' ? (
              <div className="ds-container ev-tool"><MapEvaluator token={tokenRef.current} onLoginRequired={showLoginModal} /></div>
            ) : evalMode === 'batch' ? (
              <div className="ds-container ev-tool"><PDFTestEvaluator isPremium={!!usage.subscribed} onPaywall={showChatLimitModal} token={tokenRef.current} variant="evaluate" /></div>
            ) : (
              <div className="ds-container ev-grid">
                <section className="ev-card">
                  <div className="ev-step">{hi ? 'चरण 1 में से 2' : 'Step 1 of 2'}</div>
                  <div className="ev-field">
                    <span className="ev-label">{hi ? 'आपका उत्तर' : 'Your answer'}</span>
                    <label className={`ev-drop${drag ? ' drag' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                      onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/') || f.type === 'application/pdf')); }}>
                      <span className="ev-drop-icon"><UploadIcon /></span>
                      <span className="ev-drop-title">{previews.length ? (hi ? 'और पेज जोड़ें' : 'Add more pages') : (hi ? <>पेज यहाँ छोड़ें, या <u>फ़ाइलें चुनें</u></> : <>Drop your pages here, or <u>choose files</u></>)}</span>
                      <span className="ev-drop-sub">{hi ? 'फोटो या PDF, कई पेज चल सकते हैं' : 'Photos or a PDF, several pages at once'}</span>
                      <input type="file" accept="image/*,application/pdf" multiple className="ev-drop-input" onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
                    </label>
                  </div>
                  {thumbs(true)}
                  {previews.length > 1 && <p className="ev-hint">{hi ? 'तीरों से पेजों का क्रम ठीक करें।' : 'Put the pages in order with the arrows.'}</p>}

                  <label className="ev-field">
                    <span className="ev-label">{hi ? 'प्रश्न' : 'Question'}</span>
                    <textarea className="ev-input" value={question} onChange={(e) => setQuestion(e.target.value)} rows={3}
                      placeholder={hi ? 'प्रश्न लिखें या चिपकाएँ। खाली छोड़ें तो हम आपके पेज के ऊपर से पढ़ लेंगे।' : "Type or paste the question. Leave it empty and we'll read it off the top of your page."} />
                  </label>
                  <div className="ev-field"><span className="ev-label">{hi ? 'अंक' : 'Marks'}</span>{marksPicker}</div>

                  {error && <div className="ev-err" role="alert">{error}</div>}
                  {!usage.loading && (
                    <p className={`ev-usage${freeLeft === 0 ? ' out' : ''}`}>
                      {usage.subscribed ? (hi ? 'असीमित मूल्यांकन, आपके Premium के साथ' : 'Unlimited evaluations with your Premium')
                        : signedOut ? (hi ? 'पहला मूल्यांकन निःशुल्क है, साइन इन के साथ' : 'Your first evaluation is free with an account')
                        : freeLeft ? (hi ? 'आपका एक निःशुल्क मूल्यांकन बाकी है' : 'You have one free evaluation left')
                        : (hi ? 'निःशुल्क मूल्यांकन पूरा हुआ, आगे के लिए Premium लें' : 'Your free evaluation is used; Premium marks every answer')}
                    </p>
                  )}
                  <button type="button" className="ds-btn ds-btn-solid ev-go ev-go-full" onClick={handleEvaluate} disabled={ocrLoading || !files.length}>
                    {hi ? 'मेरा उत्तर पढ़ें' : 'Read my answer'}
                  </button>
                </section>

                <aside className="ev-aside">
                  <div className="ev-side">
                    <h2>{hi ? 'यह कैसे काम करता है' : 'How it works'}</h2>
                    <ol className="ev-how">
                      <li><span>1</span><div><strong>{hi ? 'पेज अपलोड करें' : 'Upload your pages'}</strong><p>{hi ? 'फोटो या स्कैन किया PDF।' : 'Photos or a scanned PDF.'}</p></div></li>
                      <li><span>2</span><div><strong>{hi ? 'जो पढ़ा गया, जाँचें' : 'Check what we read'}</strong><p>{hi ? 'हम हस्तलिपि पढ़ते हैं, आप गलतियाँ ठीक करते हैं।' : 'We transcribe the handwriting, and you fix anything it got wrong.'}</p></div></li>
                      <li><span>3</span><div><strong>{hi ? 'अंक और प्रतिक्रिया' : 'Get it marked'}</strong><p>{hi ? 'भूमिका, मुख्य भाग, निष्कर्ष और प्रस्तुति के अंक, हर भाग पर प्रतिक्रिया, और आदर्श उत्तर।' : 'Marks for the introduction, body, conclusion and presentation, feedback on each, and a model answer.'}</p></div></li>
                    </ol>
                  </div>
                  <div className="ev-side">
                    <h2>{hi ? 'साफ़ पढ़ाई के लिए' : 'For a clean read'}</h2>
                    <p>{hi ? 'दिन की रोशनी में, ठीक ऊपर से फोटो लें, एक फोटो में एक पेज, पूरा पेज फ्रेम में। धुंधलापन और छाया में नाम गलत पढ़े जाते हैं।' : 'Shoot in daylight from straight above, one page to a photo, with the whole page in frame. Blur and shadows are where names get misread.'}</p>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Past evaluations ── */}
      {drawer && (
        <div className="ev-drawer-scrim" onClick={() => setDrawer(false)}>
          <aside className="ev-drawer ds" role="dialog" aria-label={hi ? 'पिछले मूल्यांकन' : 'Past evaluations'} onClick={(e) => e.stopPropagation()}>
            <div className="ev-drawer-head">
              <h2>{hi ? 'पिछले मूल्यांकन' : 'Past evaluations'}</h2>
              <button type="button" className="ds-x" onClick={() => setDrawer(false)} aria-label={hi ? 'बंद करें' : 'Close'}>✕</button>
            </div>
            <p className="ev-drawer-note">
              {evalMode === 'single' ? (hi ? 'एक-एक उत्तर' : 'Single answers') : evalMode === 'batch' ? (hi ? 'पूरे पेपर' : 'Full papers') : (hi ? 'मानचित्र प्रश्न' : 'Map questions')}
              {hi ? ', इसी ब्राउज़र में रखे गए' : ', kept in this browser'}
            </p>
            {modeHistory.length === 0 ? (
              <p className="ev-drawer-empty">{hi ? 'अभी कुछ नहीं जाँचा गया। आपका पहला मूल्यांकन यहाँ रहेगा।' : 'Nothing marked yet. Your evaluations will be kept here.'}</p>
            ) : (
              <div className="ev-drawer-list">
                {modeHistory.map((e) => {
                  const p = e.marksOutOf ? e.marks / e.marksOutOf : 0;
                  return (
                    <button key={e.id} type="button" className={`ev-past${openEntry?.id === e.id ? ' on' : ''}`} onClick={() => { setOpenEntry(e); setTab('eval'); setDrawer(false); }}>
                      <span className="ev-past-top">
                        <strong style={{ color: scoreTone(p) }}>{e.marks} / {e.marksOutOf}</strong>
                        <span>{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </span>
                      <span className="ev-past-q">{e.question}</span>
                      <span className="ev-past-bar"><span style={{ width: `${Math.min(100, p * 100)}%`, background: scoreTone(p) }} /></span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      )}
      <GateModals />
    </>
  );
}

const CSS = `
.ev { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.ev-hero { padding: clamp(24px, 4.5vh, 52px) 0 var(--space-6); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-dim) 60%, var(--bg)) 0%, var(--bg) 100%); }
.ev-hero-row { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-6); }
.ev-h1 { font-size: clamp(2rem, 4.4vw, 3rem); margin: 0 0 var(--space-2); }
.ev-lede { max-width: 680px; }
.ev-past-btn { flex-shrink: 0; gap: var(--space-2); }
.ev-past-btn span { min-width: 22px; padding: 1px 8px; border-radius: var(--radius-full); background: var(--accent-dim); color: var(--accent-text); font-size: 0.8rem; }
.ev-modes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-2); margin-top: var(--space-5); padding: 4px; border-radius: var(--radius-xl); background: var(--ds-soft); border: 1px solid var(--border); }
.ev-mode { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border: none; border-radius: var(--radius-lg); background: none; color: var(--text2); font: inherit; text-align: left; cursor: pointer; transition: background 0.18s, box-shadow 0.18s; }
.ev-mode:hover { color: var(--text); }
.ev-mode.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.ev-mode-icon { width: 36px; height: 36px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: var(--ds-card); color: var(--text3); border: 1px solid var(--border); }
.ev-mode.on .ev-mode-icon { background: var(--accent-dim); color: var(--accent-text); border-color: transparent; }
.ev-mode-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.ev-mode-text strong { font-size: 0.96rem; }
.ev-mode-text span { font-size: 0.8rem; color: var(--text3); }
.ev-tool { padding-top: var(--space-2); }

.ev-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: var(--space-6); align-items: start; }
.ev-top { padding-top: clamp(24px, 4vh, 40px); }
.ev-card { padding: var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--elev-1); min-width: 0; }
.ev-step { margin-bottom: var(--space-3); font-size: 0.84rem; font-weight: 700; color: var(--accent-text); }
.ev-card-title { margin: 0 0 var(--space-2); font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; }
.ev-card-lede { margin: 0 0 var(--space-5); color: var(--text2); line-height: 1.6; }
.ev-field { display: block; margin-bottom: var(--space-5); }
.ev-label { display: block; margin-bottom: var(--space-2); font-size: 0.92rem; font-weight: 700; color: var(--text); }
.ev-missing { font-style: normal; font-weight: 600; color: var(--danger-text); }
.ev-label-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); }
.ev-count { font-size: 0.84rem; color: var(--text3); font-variant-numeric: tabular-nums; }
.ev-input { width: 100%; box-sizing: border-box; resize: vertical; padding: var(--space-3) var(--space-4); background: var(--bg); border: 1.5px solid var(--border2); border-radius: var(--radius-lg); color: var(--text); font: inherit; font-size: 0.98rem; line-height: 1.6; outline: none; transition: border-color 0.15s, box-shadow 0.15s; white-space: pre-wrap; }
.ev-input:focus { border-color: color-mix(in srgb, var(--accent) 65%, transparent); box-shadow: 0 0 0 4px var(--accent-glow); }
.ev-input.missing { border-color: color-mix(in srgb, var(--danger-text) 55%, transparent); }
.ev-input::placeholder { color: var(--text3); }
.ev-tall { min-height: 340px; }
.ev-marks { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.ev-mark { padding: 8px 18px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.92rem; font-weight: 700; cursor: pointer; }
.ev-mark.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.ev-drop { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: var(--space-8) var(--space-4); border: 1.5px dashed var(--border3); border-radius: var(--radius-xl); background: var(--bg); text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.ev-drop:hover, .ev-drop.drag { border-color: var(--accent); background: var(--accent-dim); }
.ev-drop:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
.ev-drop-icon { width: 48px; height: 48px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: var(--space-2); border-radius: 14px; background: var(--accent-dim); color: var(--accent-text); }
.ev-drop-title { font-size: 1rem; font-weight: 600; color: var(--text); }
.ev-drop-title u { color: var(--accent-text); text-underline-offset: 3px; }
.ev-drop-sub { font-size: 0.88rem; color: var(--text3); }
.ev-drop-input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.ev-thumbs { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: calc(-1 * var(--space-2)) 0 var(--space-3); }
.ev-thumb { position: relative; width: 84px; height: 108px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border2); background: var(--ds-soft); }
.ev-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ev-thumb-pdf { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 6px; color: var(--text3); }
.ev-thumb-pdf span { max-width: 100%; font-size: 0.66rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ev-thumb-n { position: absolute; left: 5px; top: 5px; min-width: 18px; padding: 0 5px; border-radius: var(--radius-full); background: color-mix(in srgb, var(--bg) 85%, transparent); font-size: 0.7rem; font-weight: 700; text-align: center; color: var(--text); }
.ev-thumb-rm { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 50%; background: color-mix(in srgb, var(--bg) 85%, transparent); color: var(--text); font-size: 0.95rem; line-height: 1; cursor: pointer; }
.ev-thumb-move { position: absolute; left: 4px; right: 4px; bottom: 4px; display: flex; justify-content: space-between; }
.ev-thumb-move button { width: 26px; height: 22px; border: none; border-radius: var(--radius-full); background: color-mix(in srgb, var(--bg) 85%, transparent); color: var(--text); font-size: 0.95rem; line-height: 1; cursor: pointer; }
.ev-thumb-move button:disabled { opacity: 0.3; cursor: default; }
.ev-side .ev-thumbs { margin: 0; }
.ev-side .ev-thumb { width: 64px; height: 82px; }
.ev-hint { margin: 0 0 var(--space-5); font-size: 0.86rem; color: var(--text3); }
.ev-err { margin: 0 0 var(--space-4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--danger-wash); border: 1px solid color-mix(in srgb, var(--danger-text) 30%, transparent); color: var(--danger-text); font-size: 0.92rem; line-height: 1.5; }
.ev-usage { margin: 0 0 var(--space-3); font-size: 0.9rem; font-weight: 600; color: var(--text2); }
.ev-usage.out { color: var(--danger-text); }
.ev-go { min-height: 50px; padding: 0 var(--space-6); font-size: 1rem; justify-content: center; }
.ev-go-full { width: 100%; }
.ev-go:disabled { opacity: 0.5; cursor: not-allowed; }
.ev-actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }
.ev-actions .ds-btn-line { min-height: 50px; flex-shrink: 0; }
.ev-actions .ev-go { flex: 1; min-width: 220px; }
.ev-aside { display: flex; flex-direction: column; gap: var(--space-4); position: sticky; top: 84px; }
.ev-side { padding: var(--space-5); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.ev-side h2 { margin: 0 0 var(--space-3); font-size: 1rem; font-weight: 800; }
.ev-side p { margin: 0; font-size: 0.92rem; line-height: 1.6; color: var(--text2); }
.ev-how { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-4); }
.ev-how li { display: flex; gap: var(--space-3); }
.ev-how li > span { width: 26px; height: 26px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--accent-dim); color: var(--accent-text); font-size: 0.82rem; font-weight: 800; }
.ev-how strong { display: block; font-size: 0.94rem; margin-bottom: 2px; }
.ev-how p { font-size: 0.88rem; }

/* The report (components/evaluate/Report) */
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
.ev-wc { display: inline-block; margin-top: var(--space-3); padding: 3px 12px; border-radius: var(--radius-full); background: var(--warning-wash); color: var(--warning-text); font-size: 0.86rem; font-weight: 600; }
.ev-wc.good { background: var(--success-wash); color: var(--success-text); }
.ev-sections { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-5); padding-top: var(--space-5); border-top: 1px solid var(--border); }
.ev-sec-top { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); }
.ev-sec-name { font-weight: 700; text-transform: capitalize; }
.ev-sec-score { font-weight: 700; font-variant-numeric: tabular-nums; }
.ev-sec-bar { height: 4px; margin-top: 6px; }
.ev-sec-why { margin: 6px 0 0; font-size: 0.84rem; line-height: 1.5; color: var(--text3); }
.ev-score-actions { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-6); }
.ev-score-actions .ds-btn { width: 100%; justify-content: center; min-height: 46px; }
.ev-note { margin: 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); font-size: 0.88rem; line-height: 1.55; color: var(--text2); }
.ev-tabs { display: flex; gap: 4px; padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); align-self: flex-start; }
.ev-tab { padding: 8px 18px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.92rem; font-weight: 700; cursor: pointer; }
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

/* Past evaluations */
.ev-drawer-scrim { position: fixed; inset: 0; z-index: 2000; background: color-mix(in srgb, #000 45%, transparent); }
.ev-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: min(420px, 92vw); display: flex; flex-direction: column; background: var(--bg); border-left: 1px solid var(--border); box-shadow: var(--elev-3); }
.ev-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5) var(--space-2); }
.ev-drawer-head h2 { margin: 0; font-size: 1.2rem; font-weight: 800; }
.ev-drawer-note { margin: 0; padding: 0 var(--space-5) var(--space-3); font-size: 0.86rem; color: var(--text3); border-bottom: 1px solid var(--border); }
.ev-drawer-empty { padding: var(--space-6) var(--space-5); color: var(--text2); }
.ev-drawer-list { flex: 1; overflow-y: auto; padding: var(--space-2) var(--space-3) calc(var(--space-6) + env(safe-area-inset-bottom, 0px)); }
.ev-past { display: flex; flex-direction: column; gap: 4px; width: 100%; padding: var(--space-3); border: none; border-radius: var(--radius-lg); background: none; font: inherit; text-align: left; cursor: pointer; }
.ev-past:hover, .ev-past.on { background: var(--ds-card); }
.ev-past-top { display: flex; align-items: baseline; justify-content: space-between; font-size: 0.86rem; color: var(--text3); }
.ev-past-top strong { font-size: 0.95rem; }
.ev-past-q { font-size: 0.9rem; line-height: 1.45; color: var(--text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ev-past-bar { height: 3px; border-radius: var(--radius-full); background: var(--ds-soft); overflow: hidden; }
.ev-past-bar span { display: block; height: 100%; }

@media (max-width: 960px) {
  .ev-grid, .ev-res-grid { grid-template-columns: minmax(0, 1fr); }
  .ev-aside, .ev-score { position: static; }
  .ev-score { grid-column: 1; grid-row: 1; }
  .ev-feedback { grid-column: 1; grid-row: 2; }
}
/* On a phone the switch is one compact row, so the upload is on the first screen. */
@media (max-width: 760px) {
  .ev-hero-row { flex-direction: column; gap: var(--space-3); }
  .ev-lede { font-size: 1rem; }
  .ev-past-btn { min-height: 38px; padding: 0 var(--space-4); font-size: 0.9rem; }
  .ev-modes { margin-top: var(--space-4); gap: 2px; }
  .ev-mode { flex-direction: column; justify-content: center; gap: 6px; padding: var(--space-2) 4px; text-align: center; }
  .ev-mode-icon { width: 30px; height: 30px; }
  .ev-mode-text strong { font-size: 0.84rem; line-height: 1.25; }
  .ev-mode-text span { display: none; }
}
@media (max-width: 640px) {
  .ev-card { padding: var(--space-5) var(--space-4); }
  .ev-marks { display: flex; }
  .ev-mark { flex: 1; padding: 8px 6px; }
  .ev-drop { padding: var(--space-6) var(--space-3); }
  .ev-tall { min-height: 260px; }
  .ev-actions { flex-direction: column-reverse; }
  .ev-actions .ds-btn { width: 100%; justify-content: center; }
  .ev-block { padding: var(--space-4); }
  .ev-cols { grid-template-columns: minmax(0, 1fr); gap: var(--space-4); }
  .ev-score-card { padding: var(--space-5) var(--space-4); }
  .ev-score-num { font-size: 3rem; }
  .ev-qbar p { font-size: 1rem; }
  .ev-tabs { align-self: stretch; }
  .ev-tab { flex: 1; padding: 8px 6px; }
}
@media (prefers-reduced-motion: reduce) { .ev-score-bar span, .ev-sec-bar span { transition: none; } }
`;
