'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from '@/components/Link';
import dynamic from 'next/dynamic';
import { pyqs } from '@/lib/pyqData';
import { mapData, type MapEntry } from '@/lib/mapData';
import { auth } from '@/lib/firebase';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { useRefreshSafe } from '@/hooks/useRefreshSafe';
import { useLang } from '@/lib/i18n/LangContext';
import { usePyqHi } from '@/lib/pyqHi';
import { SECTION_HI } from '@/lib/notesHi';
import LoginPromptModal from '@/components/LoginPromptModal';
import OwlLoader from '@/components/OwlLoader';
import PDFTestEvaluator from '@/components/PDFTestEvaluator';
import { REPORT_CSS, ReportBody, fromEvaluation, scoreTone, type Evaluation } from '@/components/evaluate/Report';
import { SECTIONS, type SectionKey } from '@/components/notes/sections';
import { pyqSection, tintFor } from '@/components/pyq/sections';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false });

/**
 * A practice paper in the Mains format, against the clock. The reader writes
 * on paper, then marks each answer against the rubric, and can have answers
 * checked: one at a time from a photo, or the whole paper from one PDF
 * (Premium). Ancient India brings the map question as Question 1; other
 * sections give five short notes instead.
 */

type TestMode = 'sectional' | 'flt_sectional' | 'flt_combined';
type Phase = 'config' | 'test' | 'results';
type MapType = 'physical' | 'political';
interface TQ { id: number; section: string; topic: string; year: number; marks: number; source: string; question: string }
interface QGroup { qNum: number; section: 'A' | 'B'; parts: TQ[] }
interface MapQuestion { entries: MapEntry[]; year: number; mapType: MapType }
type Rubric = { intro: number; body: number; conc: number; pres: number };

const PART_NAME: Record<SectionKey, string> = { ancient: 'Ancient India', medieval: 'Medieval India', modern: 'Modern India', world: 'World History' };
const partName = (k: SectionKey, hi: boolean) => (hi ? SECTION_HI[PART_NAME[k]] : PART_NAME[k]);
/** Paper I or II and what it covers, in the reader's language. */
const paperName = (p: 'I' | 'II', hi: boolean) => (hi
  ? `प्रश्नपत्र ${p} · ${p === 'I' ? 'प्राचीन और मध्यकालीन भारत' : 'आधुनिक भारत और विश्व इतिहास'}`
  : `Paper ${p} · ${p === 'I' ? 'Ancient and Medieval India' : 'Modern India and World History'}`);
const keyOf = (section: string) => pyqSection(section)?.key;

function rubricOutOf(marks: number): Rubric {
  if (marks === 10) return { intro: 1.5, body: 5.5, conc: 1.5, pres: 1.5 };
  if (marks === 15) return { intro: 2, body: 8, conc: 2, pres: 3 };
  return { intro: 3, body: 11, conc: 3, pres: 3 };
}
const rubricTotal = (r: Rubric) => r.intro + r.body + r.conc + r.pres;
const idealWords = (marks: number) => (marks === 10 ? 150 : marks === 15 ? 200 : 250);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/**
 * Questions 2 to 4 (or 6 to 8). A sectional paper's are 20 + 15 + 15 and a
 * full-length paper's 20 + 20 + 10. Paper II has almost never set 15-mark
 * questions, so a pool without enough of them falls back to 20 + 20 + 10, as
 * Paper II is set. One set of used ids per section, so a question does not
 * turn up twice.
 */
function buildGroups(pool: TQ[], startQ: number, isFLT: boolean, sec: 'A' | 'B'): QGroup[] {
  const used = new Set<number>();
  const take = (marks: number, n: number) => { const c = shuffle(pool.filter((q) => q.marks === marks && !used.has(q.id))).slice(0, n); c.forEach((q) => used.add(q.id)); return c; };
  const groups: QGroup[] = [];
  if (isFLT || pool.filter((q) => q.marks === 15).length < 6) {
    const twenties = take(20, 6), tens = take(10, 3);
    for (let i = 0; i < 3; i++) { const parts = [twenties[i * 2], twenties[i * 2 + 1], tens[i]].filter(Boolean); if (parts.length) groups.push({ qNum: startQ + i, section: sec, parts }); }
  } else {
    const twenties = take(20, 3), fifteens = take(15, 6);
    for (let i = 0; i < 3; i++) { const parts = [twenties[i], fifteens[i * 2], fifteens[i * 2 + 1]].filter(Boolean); if (parts.length) groups.push({ qNum: startQ + i, section: sec, parts }); }
  }
  return groups;
}
function pickMap(): MapQuestion {
  const years = [...new Set(mapData.map((e) => e.year))];
  const yr = years[Math.floor(Math.random() * years.length)];
  return { entries: mapData.filter((e) => e.year === yr), year: yr, mapType: Math.random() > 0.5 ? 'political' : 'physical' };
}
/** Pools follow the notes' four parts: Medieval takes in Early Medieval, Modern takes in India since Independence. */
const poolFor = (keys: SectionKey[]): TQ[] => pyqs.filter((q) => keys.includes(keyOf(q.section) as SectionKey));
const pickShort = (keys: SectionKey[]) => shuffle(poolFor(keys).filter((q) => q.marks === 10)).slice(0, 5);

/** Counts down to a fixed end time, so a refresh carries on where the clock was. */
function useTimer(totalSec: number, deadline: number | null, endedAt: number | null, onEnd: () => void) {
  const [now, setNow] = useState(() => Date.now());
  const onEndRef = useRef(onEnd);
  useEffect(() => { onEndRef.current = onEnd; });
  const running = deadline !== null && endedAt === null;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);
  const rem = deadline === null ? totalSec : Math.max(0, Math.ceil((deadline - (endedAt ?? now)) / 1000));
  useEffect(() => { if (running && rem === 0) onEndRef.current(); }, [running, rem]);
  const h = Math.floor(rem / 3600), m = Math.floor((rem % 3600) / 60), s = rem % 60;
  const display = h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return { rem, display };
}

// ─── Self-marking ───
function RubricScorer({ marks, value, onChange, hi }: { marks: number; value?: Rubric; onChange: (r: Rubric) => void; hi: boolean }) {
  const out = rubricOutOf(marks);
  const cur = value ?? { intro: 0, body: 0, conc: 0, pres: 0 };
  const criteria = [
    { key: 'intro' as const, label: hi ? 'भूमिका' : 'Introduction', desc: hi ? 'इतिहास-लेखन का संदर्भ, किसी इतिहासकार का नाम' : 'A historiographical framing, a named historian', max: out.intro },
    { key: 'body' as const, label: hi ? 'मुख्य भाग' : 'Body', desc: hi ? 'तर्क, साक्ष्य, उद्धृत इतिहासकार' : 'Arguments, evidence, historians cited', max: out.body },
    { key: 'conc' as const, label: hi ? 'निष्कर्ष' : 'Conclusion', desc: hi ? 'सार और स्पष्ट मत' : 'A synthesis and a clear position', max: out.conc },
    { key: 'pres' as const, label: hi ? 'प्रस्तुति' : 'Presentation', desc: hi ? 'ढाँचा, लंबाई, पठनीयता' : 'Structure, length, legibility', max: out.pres },
  ];
  return (
    <div className="ts-rubric">
      <div className="ts-rubric-head"><span>{hi ? 'ख़ुद अंक दें' : 'Mark it yourself'}</span><span className="ts-rubric-total">{rubricTotal(cur).toFixed(1)} / {marks}</span></div>
      {criteria.map((c) => (
        <label key={c.key} className="ts-rubric-row">
          <span className="ts-rubric-label"><strong>{c.label}</strong><span>{c.desc}</span></span>
          <input type="range" min={0} max={c.max} step={0.5} value={cur[c.key]} onChange={(e) => onChange({ ...cur, [c.key]: parseFloat(e.target.value) })} aria-label={hi ? `${c.label}, ${c.max} में से` : `${c.label}, out of ${c.max}`} />
          <span className="ts-rubric-val">{cur[c.key].toFixed(1)} / {c.max}</span>
        </label>
      ))}
    </div>
  );
}

// ─── One answer checked from a photo (Premium) ───
type OcrStep = 'idle' | 'ocr' | 'transcript' | 'evaluating' | 'done' | 'error';

async function pdfToImages(file: File): Promise<File[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const images: File[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport, canvas }).promise;
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
    if (blob) images.push(new File([blob], `page-${i}.jpg`, { type: 'image/jpeg' }));
  }
  return images;
}

function AIMentorPanel({ question, marks, isPremium, onPaywall, hi }: { question: string; marks: number; isPremium: boolean; onPaywall: () => void; hi: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<OcrStep>('idle');
  const [images, setImages] = useState<File[]>([]);
  const [transcript, setTranscript] = useState('');
  const [evalData, setEvalData] = useState<Evaluation | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'eval' | 'model' | 'hist'>('eval');

  // A transcript or an evaluation is a paid step; a refresh keeps them.
  useRefreshSafe(
    `ho_test_mentor_v1:${marks}:${question.slice(0, 120)}`,
    { step: step === 'transcript' || step === 'done' ? step : 'idle' as OcrStep, transcript, evalData },
    (m) => { setStep(m.step); setTranscript(m.transcript); setEvalData(m.evalData); },
  );

  // The site signs in with Firebase; this read a Supabase session, which is
  // never there, so the token went empty.
  const token = async () => (auth.currentUser ? await auth.currentUser.getIdToken().catch(() => '') : '');

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    let arr: File[] = [];
    for (const f of Array.from(files)) arr = arr.concat(f.type === 'application/pdf' ? await pdfToImages(f) : [f]);
    setImages(arr); setStep('ocr'); setError(''); setTranscript(''); setEvalData(null);
    try {
      const fd = new FormData();
      arr.forEach((f) => fd.append('files', f));
      const r = await fetch('/api/ocr', { method: 'POST', headers: { 'x-user-token': await token() }, body: fd });
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error || (hi ? 'पेज पढ़ा नहीं जा सका।' : 'We could not read the page.'));
      setTranscript(data.text ?? ''); setStep('transcript');
    } catch (e) { setError(e instanceof Error ? e.message : (hi ? 'पेज पढ़ा नहीं जा सका।' : 'We could not read the page.')); setStep('error'); }
  }

  async function runEval() {
    if (!transcript.trim()) return;
    setStep('evaluating'); setError('');
    try {
      const fd = new FormData();
      images.forEach((f) => fd.append('files', f));
      fd.append('question', question); fd.append('marks', String(marks)); fd.append('extractedText', transcript);
      fd.append('lang', hi ? 'hi' : 'en');
      const r = await fetch('/api/evaluate', { method: 'POST', headers: { 'x-user-token': await token() }, body: fd });
      const data = await r.json();
      if (!r.ok || data.error) { setError(data.error === 'limit_reached' ? (hi ? 'आपका निःशुल्क मूल्यांकन इस्तेमाल हो चुका है। प्रीमियम में हर उत्तर जाँचा जाता है।' : 'Your free evaluation is used. Premium checks every answer.') : data.error || (hi ? 'मूल्यांकन नहीं हो सका।' : 'The evaluation failed.')); setStep('error'); return; }
      setEvalData(data); setTab('eval'); setStep('done');
    } catch { setError(hi ? 'कनेक्शन टूट गया। फिर कोशिश करें।' : 'The connection dropped. Please try again.'); setStep('error'); }
  }

  const reset = () => { setStep('idle'); setImages([]); setTranscript(''); setEvalData(null); setError(''); if (fileRef.current) fileRef.current.value = ''; };
  const pct = evalData && evalData.marks_out_of ? evalData.marks / evalData.marks_out_of : 0;

  return (
    <div className="ts-mentor">
      <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
      {step === 'idle' && (
        <button type="button" className="ds-btn ds-btn-sm ds-btn-line" onClick={() => (isPremium ? fileRef.current?.click() : onPaywall())}>
          {isPremium ? (hi ? 'यह उत्तर जँचवाएँ' : 'Have this answer checked') : (hi ? 'प्रीमियम के साथ जँचवाएँ' : 'Have it checked with Premium')}
        </button>
      )}
      {(step === 'ocr' || step === 'evaluating') && (
        <div className="ts-mentor-wait"><OwlLoader size="small" label={step === 'ocr' ? (hi ? 'आपका पेज पढ़ा जा रहा है' : 'Reading your page') : (hi ? 'आपका उत्तर जाँचा जा रहा है' : 'Marking your answer')} /><span>{step === 'ocr' ? (hi ? 'आपका पेज पढ़ा जा रहा है…' : 'Reading your page…') : (hi ? 'आपका उत्तर जाँचा जा रहा है, आमतौर पर एक मिनट से कम लगता है…' : 'Marking your answer, usually under a minute…')}</span></div>
      )}
      {(step === 'transcript' || (step === 'error' && transcript)) && (
        <div className="ts-mentor-card">
          {error && <p className="ts-err">{error}</p>}
          <div className="ts-mentor-title">{hi ? 'जो पढ़ा गया, उसे जाँचें' : 'Check what we read'}</div>
          <p className="ts-mentor-sub">{hi ? 'पढ़ने में कोई नाम या तारीख़ ग़लत हुई हो तो ठीक करें। यही पाठ जाँचा जाएगा।' : 'Fix any name or date the reader got wrong; this text is what gets marked.'}</p>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={8} className="ts-textarea" />
          <div className="ts-mentor-actions">
            <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={reset}>{hi ? 'फिर से अपलोड करें' : 'Upload again'}</button>
            <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={runEval}>{hi ? 'यह उत्तर जाँचें' : 'Mark this answer'}</button>
          </div>
        </div>
      )}
      {step === 'error' && !transcript && (
        <div className="ts-mentor-card"><p className="ts-err">{error}</p><button type="button" className="ds-btn ds-btn-line ds-btn-sm" onClick={reset}>{hi ? 'फिर कोशिश करें' : 'Try again'}</button></div>
      )}
      {step === 'done' && evalData && (
        <div className="ts-mentor-card">
          <div className="ts-mentor-score">
            <span><span className="ts-score-num" style={{ color: scoreTone(pct) }}>{evalData.marks}</span><span className="ts-score-of"> / {evalData.marks_out_of}</span></span>
            <span className="ts-mentor-note">{hi ? 'अंक केवल संकेत हैं, असली काम की चीज़ प्रतिक्रिया है।' : 'The number is a guide; the feedback is the useful part.'}</span>
          </div>
          <div className="ts-mentor-report"><ReportBody data={fromEvaluation(question, marks, evalData)} tab={tab} setTab={setTab} hi={hi} compact pdf={{}} /></div>
          <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={reset}>{hi ? 'दूसरा उत्तर जाँचें' : 'Check a different answer'}</button>
        </div>
      )}
    </div>
  );
}

// ─── The paper ───
const SectionChip = ({ section, hi }: { section: string; hi: boolean }) => {
  const m = pyqSection(section);
  return <span className="ts-sec" style={tintFor(m?.key)}>{(hi ? m?.shortHi : m?.short) ?? section}</span>;
};

function PaperHeader({ mode, paper, keys, maxMarks, totalMins, hi }: { mode: TestMode; paper: 'I' | 'II'; keys: SectionKey[]; maxMarks: number; totalMins: number; hi: boolean }) {
  const names = keys.map((k) => partName(k, hi)).join(hi ? ' और ' : ' and ');
  const title = mode === 'sectional' ? `${hi ? 'सेक्शनल टेस्ट' : 'Sectional test'} · ${names}` : mode === 'flt_sectional' ? `${hi ? 'फ़ुल-लेंथ सेक्शनल' : 'Full-length sectional'} · ${names}` : paperName(paper, hi);
  const isFLT = mode !== 'sectional';
  const h = Math.floor(totalMins / 60), m = totalMins % 60;
  const time = hi
    ? (h > 0 ? `${h} ${h > 1 ? 'घंटे' : 'घंटा'}${m ? ` ${m} मिनट` : ''}` : `${totalMins} मिनट`)
    : (h > 0 ? `${h} hour${h > 1 ? 's' : ''}${m ? ` ${m} minutes` : ''}` : `${totalMins} minutes`);
  return (
    <div className="ts-paper">
      <div className="ts-paper-title">{title}</div>
      <div className="ts-paper-facts"><span>{hi ? 'निर्धारित समय' : 'Time allowed'}: <strong>{time}</strong></span><span>{hi ? 'अधिकतम अंक' : 'Maximum marks'}: <strong>{maxMarks}</strong></span></div>
      {hi ? (
        <ul className="ts-paper-rules">
          {isFLT ? (
            <>
              <li><strong>दो खंडों</strong> में <strong>आठ</strong> प्रश्न हैं। कुल <strong>पाँच</strong> प्रश्नों के उत्तर दें।</li>
              <li><strong>प्रश्न 1 और 5 अनिवार्य</strong> हैं। बाक़ी में से <strong>तीन</strong> के उत्तर दें, हर खंड से कम से कम एक।</li>
            </>
          ) : (
            <>
              <li>कुल <strong>चार</strong> प्रश्न हैं। <strong>तीन</strong> प्रश्नों के उत्तर दें।</li>
              <li><strong>प्रश्न 1 अनिवार्य</strong> है। बाक़ी में से <strong>दो</strong> के उत्तर दें।</li>
            </>
          )}
          <li>हर प्रश्न या उसके भाग के अंक उसके सामने दिए हैं। शब्द-सीमा का ध्यान रखें।</li>
          <li className="muted">उत्तरों की गिनती क्रम से होगी। आंशिक रूप से दिया गया उत्तर भी गिना जाएगा, जब तक उसे काटा न गया हो। ख़ाली छोड़ा गया हर पेज काट दें।</li>
        </ul>
      ) : (
      <ul className="ts-paper-rules">
        {isFLT ? (
          <>
            <li>There are <strong>eight</strong> questions in <strong>two sections</strong>. Attempt <strong>five</strong> in all.</li>
            <li>Questions <strong>1 and 5 are compulsory</strong>. Of the rest, attempt <strong>three</strong>, at least one from each section.</li>
          </>
        ) : (
          <>
            <li>There are <strong>four</strong> questions. Attempt <strong>three</strong> in all.</li>
            <li>Question <strong>1 is compulsory</strong>. Of the rest, attempt <strong>two</strong>.</li>
          </>
        )}
        <li>The marks for each question or part are shown against it. Keep to the word limits.</li>
        <li className="muted">Attempts are counted in order. A question attempted in part still counts unless struck off; strike off any page left blank.</li>
      </ul>
      )}
    </div>
  );
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const matches = (entry: MapEntry, val: string) => entry.answer.split('/').map((p) => normalize(p.trim())).includes(normalize(val)) || normalize(val) === normalize(entry.answer);

type Rec<T> = Record<number, T>;
function MapBlock({ qNum, mapQ, selectedDot, onDotClick, answers, setAnswers, revealed, setRevealed, correct, setCorrect, isResults, hi }: {
  qNum: number; mapQ: MapQuestion; selectedDot: number | null; onDotClick: (n: number) => void;
  answers: Rec<string>; setAnswers: (fn: (p: Rec<string>) => Rec<string>) => void;
  revealed: Rec<boolean>; setRevealed: (fn: (p: Rec<boolean>) => Rec<boolean>) => void;
  correct: Rec<boolean>; setCorrect: (fn: (p: Rec<boolean>) => Rec<boolean>) => void;
  isResults: boolean; hi: boolean;
}) {
  const entry = selectedDot !== null ? mapQ.entries.find((e) => e.number === selectedDot) : undefined;
  const got = Object.values(correct).filter(Boolean).length * 2.5;
  const canvasRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  // On a phone the answer card sits under the map. If picking a dot leaves
  // the card below the fold, bring the map to the top so both are in view.
  const pick = (n: number) => {
    onDotClick(n);
    if (window.innerWidth > 960) return;
    requestAnimationFrame(() => {
      const card = sideRef.current?.querySelector('.ts-dot-card');
      if (card && card.getBoundingClientRect().bottom > window.innerHeight - 80) canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  return (
    <section className="ts-block">
      <div className="ts-block-head">
        <h3>{hi ? 'प्रश्न' : 'Question'} {qNum}</h3>
        <span className="ts-chip">{hi ? 'अनिवार्य' : 'Compulsory'}</span>
        <span className="ts-block-sub">{hi ? `मैप · ${mapQ.year} · ${mapQ.mapType === 'political' ? 'राजनीतिक' : 'भौतिक'}` : <>Map · {mapQ.year} · {mapQ.mapType === 'political' ? 'political' : 'physical'}</>}</span>
        <span className="ts-block-marks">{isResults ? `${got} / ${mapQ.entries.length * 2.5}` : hi ? `${mapQ.entries.length} में से ${Object.keys(answers).length} के उत्तर · ${mapQ.entries.length * 2.5} अंक` : `${Object.keys(answers).length} of ${mapQ.entries.length} answered · ${mapQ.entries.length * 2.5} marks`}</span>
      </div>
      <p className="ts-block-lead">
        {hi
          ? `मैप पर चिह्नित स्थलों को पहचानें और हर एक पर लगभग 30 शब्दों की संक्षिप्त टिप्पणी अपनी उत्तर पुस्तिका में लिखें। हर स्थल के संकेत नीचे क्रम से दिए हैं। (${mapQ.entries.length} × 2.5 = ${mapQ.entries.length * 2.5} अंक)`
          : <>Identify the places marked on the map and write a short note of about 30 words on each in your answer booklet. The hints for each place are given below, in order. ({mapQ.entries.length} × 2.5 = {mapQ.entries.length * 2.5} marks)</>}
      </p>
      <div className="ts-map">
        <div className="ts-map-canvas" ref={canvasRef}>
          <LeafletMap entries={mapQ.entries} selectedDot={isResults ? null : selectedDot} onDotClick={isResults ? () => {} : pick} answered={answers} revealed={revealed} correct={correct} />
        </div>
        <div className="ts-map-side" ref={sideRef}>
          {!isResults && (entry ? (
            <div className="ts-dot-card">
              <div className="ts-dot-title">{hi ? 'स्थल' : 'Place'} {selectedDot}</div>
              <p>{entry.hint}</p>
              <input className="ts-input" value={answers[entry.number] ?? ''} placeholder={hi ? 'स्थल का नाम अंग्रेज़ी में लिखें' : "Type the place's name"}
                onChange={(e) => {
                  const val = e.target.value;
                  setAnswers((p) => ({ ...p, [entry.number]: val }));
                  if (matches(entry, val)) { setCorrect((p) => ({ ...p, [entry.number]: true })); setRevealed((p) => ({ ...p, [entry.number]: true })); }
                  else setCorrect((p) => { const n = { ...p }; delete n[entry.number]; return n; });
                }} />
              {answers[entry.number]?.trim() && correct[entry.number] === undefined && (
                <button type="button" className="ds-btn ds-btn-solid ds-btn-sm ds-btn-block" onClick={() => {
                  setCorrect((p) => ({ ...p, [entry.number]: matches(entry, answers[entry.number]) }));
                  setRevealed((p) => ({ ...p, [entry.number]: true }));
                }}>{hi ? 'जाँचें' : 'Check it'}</button>
              )}
              {correct[entry.number] === true && <div className="ts-dot-ok">{hi ? 'सही।' : 'Right.'} {entry.hint}</div>}
              {correct[entry.number] === false && revealed[entry.number] && <div className="ts-dot-no">{hi ? <>सही नहीं। यह <strong>{entry.answer}</strong> है।</> : <>Not quite. It is <strong>{entry.answer}</strong>.</>}</div>}
            </div>
          ) : <div className="ts-dot-empty">{hi ? 'उत्तर देने के लिए मैप पर किसी बिंदु को टैप करें।' : 'Tap a dot on the map to answer it.'}</div>)}
          <div className="ts-dots">
            {mapQ.entries.map((e) => {
              const state = correct[e.number] === true ? 'ok' : correct[e.number] === false ? 'no' : revealed[e.number] ? 'shown' : answers[e.number] ? 'done' : '';
              return (
                <div key={e.number} className="ts-dotrow-wrap">
                  <div className={`ts-dotrow${!isResults && selectedDot === e.number ? ' on' : ''}`} onClick={() => !isResults && pick(e.number)} role={isResults ? undefined : 'button'}>
                    <span className={`ts-dotn ${state}`}>{e.number}</span>
                    <span className="ts-dot-hint">({String.fromCharCode(96 + e.number)}) {e.hint}</span>
                    {isResults && !revealed[e.number] && (answers[e.number]?.trim()
                      ? <button type="button" className="ts-mini" onClick={() => setRevealed((p) => ({ ...p, [e.number]: true }))}>{hi ? 'दिखाएँ' : 'Show'}</button>
                      : <span className="ts-dot-none">{hi ? 'उत्तर नहीं दिया' : 'Not answered'}</span>)}
                    {isResults && revealed[e.number] && correct[e.number] === undefined && (
                      <span className="ts-judge">
                        <button type="button" className="ts-mini ok" onClick={() => setCorrect((p) => ({ ...p, [e.number]: true }))} aria-label={hi ? 'सही मानें' : 'Mark right'}>✓</button>
                        <button type="button" className="ts-mini no" onClick={() => setCorrect((p) => ({ ...p, [e.number]: false }))} aria-label={hi ? 'ग़लत मानें' : 'Mark wrong'}>✕</button>
                      </span>
                    )}
                    {isResults && correct[e.number] !== undefined && (
                      <button type="button" className="ts-undo" onClick={() => setCorrect((p) => { const n = { ...p }; delete n[e.number]; return n; })}>{hi ? 'वापस लें' : 'undo'}</button>
                    )}
                  </div>
                  {isResults && answers[e.number]?.trim() && <div className="ts-dot-your">{hi ? 'आपने लिखा' : 'You wrote'} <em>{answers[e.number]}</em></div>}
                  {isResults && revealed[e.number] && <div className="ts-dot-answer">{hi ? 'उत्तर' : 'The answer'}: <strong>{e.answer}</strong>{correct[e.number] === true ? (hi ? ' · सही माना' : ' · marked right') : correct[e.number] === false ? (hi ? ' · ग़लत माना' : ' · marked wrong') : ''}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShortNotesBlock({ qNum, questions, isResults, rubrics, onRubric, hi }: { qNum: number; questions: TQ[]; isResults: boolean; rubrics: Rec<Rubric>; onRubric: (id: number, r: Rubric) => void; hi: boolean }) {
  const qHi = usePyqHi(hi);
  const total = questions.length * 10;
  const got = questions.reduce((s, q) => s + (rubrics[q.id] ? rubricTotal(rubrics[q.id]) : 0), 0);
  return (
    <section className="ts-block">
      <div className="ts-block-head">
        <h3>{hi ? 'प्रश्न' : 'Question'} {qNum}</h3>
        <span className="ts-chip">{hi ? 'अनिवार्य' : 'Compulsory'}</span>
        <span className="ts-block-marks">{isResults ? `${got.toFixed(1)} / ${total}` : `${total} ${hi ? 'अंक' : 'marks'}`}</span>
      </div>
      <p className="ts-block-lead">{hi ? 'निम्नलिखित पर लगभग 150 शब्दों में संक्षिप्त टिप्पणियाँ लिखें:' : 'Write short notes on the following in about 150 words each:'}</p>
      {questions.map((q, i) => (
        <div key={q.id} className="ts-q">
          <div className="ts-q-top">
            <span className="ts-q-label">({String.fromCharCode(97 + i)})</span>
            <SectionChip section={q.section} hi={hi} />
            <span className="ts-q-year">{q.year}</span>
            <span className="ts-q-marks">10 {hi ? 'अंक' : 'marks'}</span>
          </div>
          <p className="ts-q-text">{qHi?.q[q.id] ?? q.question}</p>
          {!isResults && <p className="ts-q-hint">{hi ? 'कागज़ पर, लगभग 150 शब्द' : 'On paper, about 150 words'}</p>}
          {isResults && <RubricScorer marks={10} value={rubrics[q.id]} onChange={(r) => onRubric(q.id, r)} hi={hi} />}
        </div>
      ))}
    </section>
  );
}

function GroupBlock({ group, isResults, rubrics, onRubric, isPremium, onPaywall, hi }: { group: QGroup; isResults: boolean; rubrics: Rec<Rubric>; onRubric: (id: number, r: Rubric) => void; isPremium: boolean; onPaywall: () => void; hi: boolean }) {
  const qHi = usePyqHi(hi);
  const total = group.parts.reduce((s, p) => s + p.marks, 0);
  const got = group.parts.reduce((s, q) => s + (rubrics[q.id] ? rubricTotal(rubrics[q.id]) : 0), 0);
  return (
    <section className="ts-block">
      <div className="ts-block-head">
        <h3>{hi ? 'प्रश्न' : 'Question'} {group.qNum}</h3>
        <span className="ts-block-marks">{isResults ? `${got.toFixed(1)} / ${total}` : `${total} ${hi ? 'अंक' : 'marks'}`}</span>
      </div>
      {group.parts.map((q, i) => (
        <div key={q.id} className="ts-q">
          <div className="ts-q-top">
            <span className="ts-q-label">({String.fromCharCode(97 + i)})</span>
            <SectionChip section={q.section} hi={hi} />
            <span className="ts-q-year">{q.year}</span>
            <span className="ts-q-marks">{q.marks} {hi ? 'अंक' : 'marks'}</span>
          </div>
          <p className="ts-q-text">{qHi?.q[q.id] ?? q.question}</p>
          {!isResults && <p className="ts-q-hint">{hi ? `कागज़ पर, लगभग ${idealWords(q.marks)} शब्द` : `On paper, about ${idealWords(q.marks)} words`}</p>}
          {isResults && (
            <>
              <RubricScorer marks={q.marks} value={rubrics[q.id]} onChange={(r) => onRubric(q.id, r)} hi={hi} />
              <AIMentorPanel question={q.question} marks={q.marks} isPremium={isPremium} onPaywall={onPaywall} hi={hi} />
            </>
          )}
        </div>
      ))}
    </section>
  );
}

// ─── Main ───
export default function TestPage() {
  const { langHi: hi } = useLang();
  const pyqHi = usePyqHi(hi);
  const [phase, setPhase] = useState<Phase>('config');
  const [mode, setMode] = useState<TestMode>('sectional');
  const [keys, setKeys] = useState<SectionKey[]>([]);
  const [paper, setPaper] = useState<'I' | 'II'>('I');
  const [groupsA, setGroupsA] = useState<QGroup[]>([]);
  const [groupsB, setGroupsB] = useState<QGroup[]>([]);
  const [mapQ1, setMapQ1] = useState<MapQuestion | null>(null);
  const [mapQ5, setMapQ5] = useState<MapQuestion | null>(null);
  const [shortQ1, setShortQ1] = useState<TQ[]>([]);
  const [shortQ5, setShortQ5] = useState<TQ[]>([]);
  const [rubrics, setRubrics] = useState<Rec<Rubric>>({});
  const [mapAns1, setMapAns1] = useState<Rec<string>>({});
  const [mapRev1, setMapRev1] = useState<Rec<boolean>>({});
  const [mapCor1, setMapCor1] = useState<Rec<boolean>>({});
  const [mapAns5, setMapAns5] = useState<Rec<string>>({});
  const [mapRev5, setMapRev5] = useState<Rec<boolean>>({});
  const [mapCor5, setMapCor5] = useState<Rec<boolean>>({});
  const [dot1, setDot1] = useState<number | null>(null);
  const [dot5, setDot5] = useState<number | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [wholePaper, setWholePaper] = useState(false);

  // The whole test is kept for the tab, deadline included, so a refresh
  // neither loses the randomly drawn paper nor restarts the clock.
  useRefreshSafe(
    'ho_test_v2',
    { phase, mode, keys, paper, groupsA, groupsB, mapQ1, mapQ5, shortQ1, shortQ5, rubrics, mapAns1, mapRev1, mapCor1, mapAns5, mapRev5, mapCor5, dot1, dot5, deadline, endedAt, wholePaper },
    (t) => {
      setPhase(t.phase); setMode(t.mode); setKeys(t.keys); setPaper(t.paper);
      setGroupsA(t.groupsA); setGroupsB(t.groupsB); setMapQ1(t.mapQ1); setMapQ5(t.mapQ5); setShortQ1(t.shortQ1); setShortQ5(t.shortQ5);
      setRubrics(t.rubrics); setMapAns1(t.mapAns1); setMapRev1(t.mapRev1); setMapCor1(t.mapCor1);
      setMapAns5(t.mapAns5); setMapRev5(t.mapRev5); setMapCor5(t.mapCor5); setDot1(t.dot1); setDot5(t.dot5);
      setDeadline(t.deadline); setEndedAt(t.endedAt); setWholePaper(t.wholePaper);
    },
  );

  const { usage, GateModals, showChatLimitModal } = useSubscriptionGate(() => {});
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();
  const isPremium = Boolean(usage?.subscribed);

  const isFLT = mode !== 'sectional';
  const totalMins = isFLT ? 180 : 105;
  const maxMarks = isFLT ? 250 : 150;
  const handleSubmit = useCallback(() => { setEndedAt(Date.now()); setPhase('results'); }, []);
  const { rem, display } = useTimer(totalMins * 60, deadline, endedAt, handleSubmit);
  const urgency = rem < 300;

  useEffect(() => { window.scrollTo(0, 0); }, [phase]);

  const effective = (): { secA: SectionKey[]; secB: SectionKey[] } => {
    if (mode === 'sectional') return { secA: keys, secB: [] };
    if (mode === 'flt_sectional') return { secA: [keys[0]], secB: [keys[1] ?? keys[0]] };
    return paper === 'I' ? { secA: ['ancient'], secB: ['medieval'] } : { secA: ['modern'], secB: ['world'] };
  };

  function startTest() {
    const { secA, secB } = effective();
    setGroupsA(buildGroups(poolFor(secA), 2, isFLT, 'A'));
    setGroupsB(isFLT ? buildGroups(poolFor(secB), 6, true, 'B') : []);
    setMapQ1(secA.includes('ancient') ? pickMap() : null);
    setShortQ1(!secA.includes('ancient') ? pickShort(secA) : []);
    setMapQ5(isFLT && secB.includes('ancient') ? pickMap() : null);
    setShortQ5(isFLT && !secB.includes('ancient') ? pickShort(secB) : []);
    setRubrics({}); setMapAns1({}); setMapRev1({}); setMapCor1({}); setMapAns5({}); setMapRev5({}); setMapCor5({});
    setDot1(null); setDot5(null); setWholePaper(false);
    setDeadline(Date.now() + totalMins * 60 * 1000); setEndedAt(null);
    setPhase('test');
  }

  const onRubric = (id: number, r: Rubric) => setRubrics((p) => ({ ...p, [id]: r }));
  const allKeys: SectionKey[] = mode === 'flt_combined' ? (paper === 'I' ? ['ancient', 'medieval'] : ['modern', 'world']) : keys;

  const renderPaper = (isResults: boolean) => {
    const q1 = mapQ1
      ? <MapBlock qNum={1} mapQ={mapQ1} selectedDot={isResults ? null : dot1} onDotClick={setDot1} answers={mapAns1} setAnswers={setMapAns1} revealed={mapRev1} setRevealed={setMapRev1} correct={mapCor1} setCorrect={setMapCor1} isResults={isResults} hi={hi} />
      : <ShortNotesBlock qNum={1} questions={shortQ1} isResults={isResults} rubrics={rubrics} onRubric={onRubric} hi={hi} />;
    const q5 = mapQ5
      ? <MapBlock qNum={5} mapQ={mapQ5} selectedDot={isResults ? null : dot5} onDotClick={setDot5} answers={mapAns5} setAnswers={setMapAns5} revealed={mapRev5} setRevealed={setMapRev5} correct={mapCor5} setCorrect={setMapCor5} isResults={isResults} hi={hi} />
      : <ShortNotesBlock qNum={5} questions={shortQ5} isResults={isResults} rubrics={rubrics} onRubric={onRubric} hi={hi} />;
    return (
      <>
        {isFLT && <h2 className="ts-section first">{hi ? 'खंड A' : 'Section A'}</h2>}
        {q1}
        {groupsA.map((g) => <GroupBlock key={g.qNum} group={g} isResults={isResults} rubrics={rubrics} onRubric={onRubric} isPremium={isPremium} onPaywall={showChatLimitModal} hi={hi} />)}
        {isFLT && (
          <>
            <h2 className="ts-section">{hi ? 'खंड B' : 'Section B'}</h2>
            {q5}
            {groupsB.map((g) => <GroupBlock key={g.qNum} group={g} isResults={isResults} rubrics={rubrics} onRubric={onRubric} isPremium={isPremium} onPaywall={showChatLimitModal} hi={hi} />)}
          </>
        )}
      </>
    );
  };

  const shell = (children: React.ReactNode) => (
    <div className="ts ds">
      <style dangerouslySetInnerHTML={{ __html: CSS + REPORT_CSS }} />
      {children}
      <GateModals />
      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );

  // ── Setting up ──
  if (phase === 'config') {
    const canStart = mode === 'flt_combined' ? true : mode === 'flt_sectional' ? keys.length === 2 : keys.length > 0;
    return shell(
      <>
        <header className="ts-hero">
          <div className="ds-container">
            <h1 className="ds-h1 ts-h1">{hi ? 'टेस्ट पेपर हल करें' : 'Attempt test papers'}</h1>
            <p className="ds-lede ts-lede">{hi ? 'टाइमर के साथ मुख्य परीक्षा के पिछले प्रश्न। कागज़ पर वैसे ही लिखें जैसे परीक्षा हॉल में लिखते हैं, फिर ख़ुद अंक दें या उत्तर जँचवाएँ।' : 'Past Mains questions with a timer running. Write on paper the way you would in the hall, then mark it yourself or get it checked.'}</p>
          </div>
        </header>
        <div className="ds-container ts-grid">
          <section className="ts-card">
            <div className="ts-field">
              <span className="ts-label">{hi ? 'प्रारूप' : 'Format'}</span>
              <div className="ts-formats" role="radiogroup" aria-label={hi ? 'प्रारूप' : 'Format'}>
                {((hi ? [
                  { id: 'sectional', title: 'सेक्शनल', facts: '1 घंटा 45 मिनट · 150 अंक', desc: 'चार प्रश्न, तीन के उत्तर दें। जिन खंडों से प्रश्न चाहिए, उन्हें चुनें।' },
                  { id: 'flt_sectional', title: 'फ़ुल-लेंथ सेक्शनल', facts: '3 घंटे · 250 अंक', desc: 'दो खंड, आठ प्रश्न, पाँच के उत्तर दें। दो खंड चुनें।' },
                  { id: 'flt_combined', title: 'पूरा प्रश्नपत्र', facts: '3 घंटे · 250 अंक', desc: 'प्रश्नपत्र I या प्रश्नपत्र II, परीक्षा की तरह।' },
                ] : [
                  { id: 'sectional', title: 'Sectional', facts: '1 hr 45 min · 150 marks', desc: 'Four questions, attempt three. Pick the sections to draw from.' },
                  { id: 'flt_sectional', title: 'Full-length sectional', facts: '3 hours · 250 marks', desc: 'Two sections, eight questions, attempt five. Pick two sections.' },
                  { id: 'flt_combined', title: 'Full paper', facts: '3 hours · 250 marks', desc: 'Paper I or Paper II, as in the exam.' },
                ]) as { id: TestMode; title: string; facts: string; desc: string }[]).map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={`ts-format${mode === m.id ? ' on' : ''}`} onClick={() => setMode(m.id)}>
                    <span className="ts-format-title">{m.title}</span>
                    <span className="ts-format-facts">{m.facts}</span>
                    <span className="ts-format-desc">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {mode === 'flt_combined' ? (
              <div className="ts-field">
                <span className="ts-label">{hi ? 'प्रश्नपत्र' : 'Paper'}</span>
                <div className="ts-seg ts-seg-wide" role="radiogroup" aria-label={hi ? 'प्रश्नपत्र' : 'Paper'}>
                  {(['I', 'II'] as const).map((p) => (
                    <button key={p} type="button" role="radio" aria-checked={paper === p} className={`ts-seg-btn${paper === p ? ' on' : ''}`} onClick={() => setPaper(p)}>
                      {hi ? 'प्रश्नपत्र' : 'Paper'} {p}<span>{hi ? (p === 'I' ? 'प्राचीन और मध्यकालीन भारत' : 'आधुनिक भारत और विश्व इतिहास') : (p === 'I' ? 'Ancient and Medieval India' : 'Modern India and World History')}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ts-field">
                <span className="ts-label">{hi ? 'खंड' : 'Sections'}</span>
                <p className="ts-hint">{mode === 'flt_sectional' ? (hi ? 'दो चुनें: पहला खंड A बनेगा, दूसरा खंड B।' : 'Pick two: the first becomes Section A, the second Section B.') : (hi ? 'एक या ज़्यादा चुनें।' : 'Pick one or more.')}</p>
                <div className="ts-pills">
                  {SECTIONS.map((s) => {
                    const on = keys.includes(s.key);
                    const disabled = mode === 'flt_sectional' && keys.length >= 2 && !on;
                    const order = mode === 'flt_sectional' && on ? (keys.indexOf(s.key) === 0 ? 'A' : 'B') : null;
                    return (
                      <button key={s.key} type="button" aria-pressed={on} disabled={disabled} style={tintFor(s.key)} className={`ts-pill${on ? ' on' : ''}`}
                        onClick={() => setKeys((p) => (on ? p.filter((x) => x !== s.key) : [...p, s.key]))}>
                        {order && <span className="ts-pill-order">{order}</span>}{hi ? SECTION_HI[s.name] ?? s.name : s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="ts-note">{hi ? 'प्राचीन भारत में प्रश्न 1 इंटरैक्टिव मैप प्रश्न होता है, 50 अंकों का। बाक़ी खंडों में इसकी जगह 10-10 अंकों की पाँच संक्षिप्त टिप्पणियाँ आती हैं।' : 'Ancient India brings the interactive map question, 50 marks, as Question 1. The other sections give five short notes of 10 marks instead.'}</p>

            <button type="button" className="ds-btn ds-btn-solid ts-start" disabled={!canStart}
              onClick={() => { if (!usage?.firebase_uid) { requireLogin(hi ? 'टेस्ट पेपर बनाने के लिए निःशुल्क साइन इन करें।' : 'Sign in free to generate a test paper.'); return; } if (canStart) startTest(); }}>
              {hi
                ? (canStart ? 'पेपर शुरू करें' : mode === 'flt_sectional' ? 'शुरू करने के लिए दो खंड चुनें' : 'शुरू करने के लिए खंड चुनें')
                : (canStart ? 'Start the paper' : mode === 'flt_sectional' ? 'Pick two sections to start' : 'Pick a section to start')}
            </button>
          </section>

          <aside className="ts-aside">
            <div className="ts-side">
              <h2>{hi ? 'यह कैसे काम करता है' : 'How it works'}</h2>
              <ol className="ts-how">
                {(hi ? [
                  ['कागज़ पर लिखें', 'प्रश्न टाइमर के साथ आते हैं। हाथ से उत्तर लिखें, जैसे परीक्षा हॉल में।'],
                  ['अंक दें', 'समय पूरा होने पर, या लिख लेने पर, हर उत्तर को रूब्रिक के हिसाब से अंक दें।'],
                  ['उत्तर जँचवाएँ', 'किसी भी उत्तर की फ़ोटो, या पूरा पेपर एक PDF में अपलोड करें, और AI उसे जाँचेगा। यह हिस्सा प्रीमियम है।'],
                ] : [
                  ['Write on paper', 'The questions appear with a timer. Answer by hand, as in the hall.'],
                  ['Mark it', 'When time is up, or you finish, mark each answer against the rubric.'],
                  ['Have answers checked', 'Upload a photo of any answer, or the whole paper as one PDF, and the AI marks it. That part is Premium.'],
                ]).map(([title, body], i) => (
                  <li key={i}><span>{i + 1}</span><div><strong>{title}</strong><p>{body}</p></div></li>
                ))}
              </ol>
            </div>
          </aside>
        </div>

        <section className="ds-container ts-written">
          <h2>{hi ? 'पेपर पहले ही लिख चुके हैं?' : 'Already written a paper?'}</h2>
          <p>{hi ? 'टाइमर छोड़ें: पूरी उत्तर पुस्तिका एक PDF में अपलोड करें और हर उत्तर जँचवाएँ।' : 'Skip the timer: upload the whole answer booklet as one PDF and have every answer marked.'}</p>
          <PDFTestEvaluator isPremium={isPremium} onPaywall={showChatLimitModal} token={usage.token ?? null} variant="test" />
        </section>
      </>,
    );
  }

  // ── The paper ──
  if (phase === 'test') {
    const progressPct = ((totalMins * 60 - rem) / (totalMins * 60)) * 100;
    return shell(
      <>
        <div className="ts-bar">
          <div className="ds-container ts-bar-in">
            <span className="ts-bar-what">{hi
              ? `${mode === 'sectional' ? 'सेक्शनल' : mode === 'flt_sectional' ? 'फ़ुल-लेंथ सेक्शनल' : `प्रश्नपत्र ${paper}`} · ${maxMarks} अंक`
              : `${mode === 'sectional' ? 'Sectional' : mode === 'flt_sectional' ? 'Full-length sectional' : `Paper ${paper}`} · ${maxMarks} marks`}</span>
            <span className={`ts-clock${urgency ? ' late' : ''}`}>{display}</span>
            <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={handleSubmit}>{hi ? 'हो गया' : 'I’m done'}</button>
          </div>
          <div className="ts-bar-progress"><span style={{ width: `${progressPct}%` }} className={urgency ? 'late' : ''} /></div>
        </div>
        <div className="ds-container ts-paper-wrap">
          <PaperHeader mode={mode} paper={paper} keys={allKeys} maxMarks={maxMarks} totalMins={totalMins} hi={hi} />
          {renderPaper(false)}
          <div className="ts-end"><button type="button" className="ds-btn ds-btn-solid" onClick={handleSubmit}>{hi ? 'हो गया, अब पेपर जाँचें' : 'I’m done, mark my paper'}</button></div>
        </div>
      </>,
    );
  }

  // ── Marking ──
  const mapScore = (Object.values(mapCor1).filter(Boolean).length + Object.values(mapCor5).filter(Boolean).length) * 2.5;
  const marked = [...groupsA, ...groupsB].flatMap((g) => g.parts).concat(shortQ1, shortQ5);
  const total = mapScore + marked.reduce((s, q) => s + (rubrics[q.id] ? rubricTotal(rubrics[q.id]) : 0), 0);
  const pct = Math.round((total / maxMarks) * 100);
  const used = Math.floor((totalMins * 60 - rem) / 60);
  const pdfQs = [
    ...shortQ1.map((q, i) => ({ id: `Q1(${String.fromCharCode(97 + i)})`, marks: q.marks, text: q.question, shown: pyqHi?.q[q.id] })),
    ...groupsA.flatMap((g) => g.parts.map((q, i) => ({ id: `Q${g.qNum}(${String.fromCharCode(97 + i)})`, marks: q.marks, text: q.question, shown: pyqHi?.q[q.id] }))),
    ...shortQ5.map((q, i) => ({ id: `Q5(${String.fromCharCode(97 + i)})`, marks: q.marks, text: q.question, shown: pyqHi?.q[q.id] })),
    ...groupsB.flatMap((g) => g.parts.map((q, i) => ({ id: `Q${g.qNum}(${String.fromCharCode(97 + i)})`, marks: q.marks, text: q.question, shown: pyqHi?.q[q.id] }))),
  ];

  return shell(
    <div className="ds-container ts-paper-wrap ts-results">
      <h1 className="ts-results-title">{hi ? 'अपना पेपर जाँचें' : 'Mark your paper'}</h1>
      <p className="ts-results-lede">{hi ? 'केवल उन्हीं प्रश्नों को अंक दें जिनके उत्तर आपने लिखे। रूब्रिक के हर हिस्से को उतना खिसकाएँ जितने अंक आपके उत्तर ने कमाए, और मैप पर बताए स्थलों को परखें।' : 'Mark only the questions you attempted. Slide each part of the rubric to what your answer earned, and judge the map places you named.'}</p>

      <div className="ts-summary">
        <div><span className="ts-summary-label">{hi ? 'आपके अंक' : 'Your mark'}</span><span className="ts-summary-num">{total.toFixed(1)}<small> / {maxMarks}</small></span></div>
        <div><span className="ts-summary-label">{hi ? 'लगा समय' : 'Time used'}</span><span className="ts-summary-num">{used}<small> {hi ? 'मिनट' : 'min'}</small></span></div>
        <div className="ts-summary-bar">
          <span className="ts-summary-label">{hi ? `कुल अंकों का ${Math.min(pct, 100)}%` : `${Math.min(pct, 100)}% of the marks`}</span>
          <div className="ts-meter"><span style={{ width: `${Math.min(pct, 100)}%` }} /></div>
        </div>
      </div>

      <div className={`ts-whole${wholePaper ? ' open' : ''}`}>
        <button type="button" className="ts-whole-head" onClick={() => setWholePaper((o) => !o)} aria-expanded={wholePaper}>
          <span><strong>{hi ? 'पूरा पेपर जँचवाएँ' : 'Have the whole paper marked'}</strong><span>{hi ? `अपनी उत्तर पुस्तिका एक PDF में स्कैन करें और हर उत्तर जँचवाएँ${isPremium ? '।' : ', प्रीमियम के साथ।'}` : `Scan your answer booklet into one PDF and every answer is marked${isPremium ? '.' : ', with Premium.'}`}</span></span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        {wholePaper && <div className="ts-whole-body"><PDFTestEvaluator isPremium={isPremium} onPaywall={showChatLimitModal} token={usage.token ?? null} paperQuestions={pdfQs} variant="test" /></div>}
      </div>

      {renderPaper(true)}

      <div className="ts-end">
        <button type="button" className="ds-btn ds-btn-solid" onClick={() => { setDeadline(null); setEndedAt(null); setPhase('config'); }}>{hi ? 'दूसरा पेपर हल करें' : 'Sit another paper'}</button>
        <Link href="/pyqs" className="ds-btn ds-btn-line">{hi ? 'पिछले प्रश्न देखें' : 'Browse the PYQs'}</Link>
      </div>
    </div>,
  );
}

const CSS = `
.ts { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.ts-hero { padding: clamp(28px, 5vh, 52px) 0 clamp(16px, 3vh, 28px); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-dim) 60%, var(--bg)) 0%, var(--bg) 100%); }
.ts-h1 { font-size: clamp(2rem, 4.4vw, 3rem); margin: 0 0 var(--space-2); }
.ts-lede { max-width: 660px; }
.ts-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: var(--space-6); align-items: start; }
.ts-card { padding: var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--elev-1); min-width: 0; }
.ts-field { margin-bottom: var(--space-5); }
.ts-label { display: block; margin-bottom: var(--space-2); font-size: 0.92rem; font-weight: 700; }
.ts-hint { margin: -4px 0 var(--space-2); font-size: 0.86rem; color: var(--text3); }
.ts-formats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-2); }
.ts-format { display: flex; flex-direction: column; gap: 3px; padding: var(--space-4); border: 1.5px solid var(--border2); border-radius: var(--radius-lg); background: var(--bg); color: var(--text); font: inherit; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.ts-format:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.ts-format.on { border-color: var(--accent); background: var(--accent-dim); }
.ts-format-title { font-size: 1rem; font-weight: 800; }
.ts-format.on .ts-format-title { color: var(--accent-text); }
.ts-format-facts { font-size: 0.86rem; font-weight: 600; color: var(--text2); }
.ts-format-desc { font-size: 0.84rem; color: var(--text3); line-height: 1.5; }
.ts-seg { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--radius-xl); background: var(--ds-soft); border: 1px solid var(--border); }
.ts-seg-wide { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; }
.ts-seg-btn { display: flex; flex-direction: column; gap: 2px; padding: 10px 16px; border: none; border-radius: var(--radius-lg); background: none; color: var(--text2); font: inherit; font-size: 0.95rem; font-weight: 800; text-align: left; cursor: pointer; }
.ts-seg-btn span { font-size: 0.82rem; font-weight: 500; color: var(--text3); }
.ts-seg-btn.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.ts-pills { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.ts-pill { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 var(--space-4); border: 1.5px solid var(--border2); border-radius: var(--radius-full); background: var(--bg); color: var(--text); font: inherit; font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.ts-pill:hover:not(:disabled) { border-color: color-mix(in srgb, var(--t) 50%, transparent); }
.ts-pill.on { border-color: var(--t); background: var(--w); color: var(--t); }
.ts-pill:disabled { opacity: 0.4; cursor: not-allowed; }
.ts-pill-order { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--t); color: var(--bg); font-size: 0.74rem; font-weight: 800; }
.ts-note { margin: 0 0 var(--space-5); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); font-size: 0.88rem; line-height: 1.55; color: var(--text2); }
.ts-start { width: 100%; justify-content: center; min-height: 50px; font-size: 1rem; }
.ts-start:disabled { opacity: 0.55; cursor: not-allowed; }
.ts-aside { position: sticky; top: 84px; }
.ts-side { padding: var(--space-5); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.ts-side h2 { margin: 0 0 var(--space-3); font-size: 1rem; font-weight: 800; }
.ts-how { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-4); }
.ts-how li { display: flex; gap: var(--space-3); }
.ts-how li > span { width: 26px; height: 26px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--accent-dim); color: var(--accent-text); font-size: 0.82rem; font-weight: 800; }
.ts-how strong { display: block; font-size: 0.94rem; margin-bottom: 2px; }
.ts-how p { margin: 0; font-size: 0.88rem; line-height: 1.55; color: var(--text2); }
.ts-written { margin-top: var(--space-10); padding-top: var(--space-8); border-top: 1px solid var(--border); }
.ts-written > h2 { margin: 0 0 var(--space-2); font-size: 1.3rem; font-weight: 800; letter-spacing: -0.01em; }
.ts-written > p { margin: 0 0 var(--space-4); color: var(--text2); line-height: 1.6; }
.ts-written .pe { max-width: 900px; }

/* The paper */
.ts-bar { position: sticky; top: 60px; z-index: 40; background: color-mix(in srgb, var(--bg) 94%, transparent); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); }
.ts-bar-in { max-width: 920px; display: flex; align-items: center; gap: var(--space-4); padding-top: var(--space-2); padding-bottom: var(--space-2); }
.ts-bar-what { flex: 1; min-width: 0; font-size: 0.92rem; font-weight: 600; color: var(--text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ts-clock { font-size: 1.4rem; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
.ts-clock.late { color: var(--danger-text); }
.ts-bar-progress { height: 3px; background: var(--ds-soft); }
.ts-bar-progress span { display: block; height: 100%; background: var(--accent); transition: width 1s linear; }
.ts-bar-progress span.late { background: var(--danger-text); }
.ts-paper-wrap { max-width: 920px; padding-top: var(--space-6); }
.ts-paper { margin-bottom: var(--space-6); padding: var(--space-5) var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.ts-paper-title { font-size: 1.15rem; font-weight: 800; text-align: center; }
.ts-paper-facts { display: flex; justify-content: center; flex-wrap: wrap; gap: var(--space-2) var(--space-6); margin: var(--space-2) 0 var(--space-4); padding-bottom: var(--space-4); border-bottom: 1px solid var(--border); font-size: 0.92rem; color: var(--text2); }
.ts-paper-rules { margin: 0; padding-left: 1.2rem; list-style: disc; display: flex; flex-direction: column; gap: 6px; font-size: 0.94rem; line-height: 1.6; color: var(--text2); }
.ts-paper-rules strong { color: var(--text); }
.ts-paper-rules .muted { font-size: 0.86rem; color: var(--text3); }
.ts-section { margin: var(--space-8) 0 var(--space-3); font-size: 1.2rem; font-weight: 800; letter-spacing: -0.01em; }
.ts-section.first { margin-top: 0; }
.ts-block { margin-bottom: var(--space-5); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; }
.ts-block-head { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); padding: var(--space-3) var(--space-5); background: var(--ds-soft); border-bottom: 1px solid var(--border); }
.ts-block-head h3 { margin: 0; font-size: 1.02rem; font-weight: 800; }
.ts-chip { padding: 2px 10px; border-radius: var(--radius-full); background: var(--accent-dim); color: var(--accent-text); font-size: 0.78rem; font-weight: 700; }
.ts-block-sub { font-size: 0.84rem; color: var(--text3); }
.ts-block-marks { margin-left: auto; font-size: 0.9rem; font-weight: 700; color: var(--text2); font-variant-numeric: tabular-nums; }
.ts-block-lead { margin: var(--space-4) var(--space-5) var(--space-2); font-weight: 600; line-height: 1.55; }
.ts-q { padding: var(--space-4) var(--space-5); border-top: 1px solid var(--border); }
.ts-block-head + .ts-q, .ts-block-lead + .ts-q { border-top: none; }
.ts-q-top { display: flex; align-items: center; flex-wrap: wrap; gap: 4px var(--space-2); margin-bottom: 6px; }
.ts-q-label { font-weight: 800; color: var(--text); }
.ts-sec { padding: 1px 9px; border-radius: var(--radius-full); background: var(--w); color: var(--t); font-size: 0.78rem; font-weight: 700; }
.ts-q-year { font-size: 0.84rem; color: var(--text3); }
.ts-q-marks { margin-left: auto; font-size: 0.86rem; font-weight: 700; color: var(--text2); white-space: nowrap; }
.ts-q-text { margin: 0 0 var(--space-2); font-size: 1.02rem; line-height: 1.65; }
.ts-q-hint { margin: 0; font-size: 0.86rem; color: var(--text3); }
.ts-end { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-2); margin-top: var(--space-8); }

/* The map question */
.ts-map { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); align-items: start; gap: var(--space-4); padding: var(--space-2) var(--space-5) var(--space-5); }
.ts-map-canvas { position: relative; z-index: 0; isolation: isolate; min-width: 0; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border); scroll-margin-top: 128px; }
.ts-map-side { min-width: 0; }
.ts-dot-card { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-3); padding: var(--space-4); border: 1.5px solid color-mix(in srgb, var(--accent) 45%, transparent); border-radius: var(--radius-lg); background: var(--bg); }
.ts-dot-title { font-weight: 800; color: var(--accent-text); }
.ts-dot-card p { margin: 0; font-size: 0.9rem; line-height: 1.5; color: var(--text2); }
.ts-input { width: 100%; box-sizing: border-box; height: 42px; padding: 0 var(--space-3); border: 1.5px solid var(--border2); border-radius: var(--radius-md); background: var(--ds-card); color: var(--text); font: inherit; outline: none; }
.ts-input:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); box-shadow: 0 0 0 3px var(--accent-glow); }
.ts-dot-ok { padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); background: var(--success-wash); color: var(--success-text); font-size: 0.88rem; }
.ts-dot-no { padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); background: var(--danger-wash); color: var(--danger-text); font-size: 0.88rem; }
.ts-dot-empty { margin-bottom: var(--space-3); padding: var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); text-align: center; font-size: 0.9rem; color: var(--text3); }
.ts-dots { max-height: 360px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.ts-dotrow { display: flex; align-items: center; gap: var(--space-2); padding: 6px 8px; border-radius: var(--radius-md); cursor: pointer; }
.ts-dotrow[role="button"]:hover, .ts-dotrow.on { background: var(--accent-dim); }
.ts-dotn { width: 22px; height: 22px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid var(--border2); background: var(--ds-soft); color: var(--text3); font-size: 0.72rem; font-weight: 800; }
.ts-dotn.done { background: var(--accent); border-color: var(--accent); color: #fff; }
.ts-dotn.shown { background: var(--warning-text); border-color: var(--warning-text); color: #fff; }
.ts-dotn.ok { background: var(--success-text); border-color: var(--success-text); color: #fff; }
.ts-dotn.no { background: var(--danger-text); border-color: var(--danger-text); color: #fff; }
.ts-dot-hint { flex: 1; min-width: 0; font-size: 0.86rem; line-height: 1.45; color: var(--text2); }
.ts-dot-none { font-size: 0.78rem; color: var(--text3); }
.ts-judge { display: inline-flex; gap: 4px; }
.ts-mini { padding: 2px 10px; border: 1px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
.ts-mini.ok { border-color: color-mix(in srgb, var(--success-text) 40%, transparent); color: var(--success-text); background: var(--success-wash); }
.ts-mini.no { border-color: color-mix(in srgb, var(--danger-text) 40%, transparent); color: var(--danger-text); background: var(--danger-wash); }
.ts-undo { padding: 0; border: none; background: none; font: inherit; font-size: 0.78rem; color: var(--text3); cursor: pointer; }
.ts-dot-your, .ts-dot-answer { padding-left: 38px; font-size: 0.82rem; color: var(--text3); }
.ts-dot-answer strong { color: var(--text); }

/* Marking */
.ts-results-title { margin: 0 0 var(--space-2); font-size: clamp(1.8rem, 3.6vw, 2.4rem); font-weight: 800; letter-spacing: -0.02em; }
.ts-results-lede { margin: 0 0 var(--space-5); color: var(--text2); line-height: 1.6; max-width: 720px; }
.ts-summary { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-4) var(--space-8); margin-bottom: var(--space-4); padding: var(--space-5) var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--elev-1); }
.ts-summary > div { display: flex; flex-direction: column; gap: 2px; }
.ts-summary-label { font-size: 0.86rem; color: var(--text3); }
.ts-summary-num { font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.ts-summary-num small { font-size: 1rem; font-weight: 600; color: var(--text3); }
.ts-summary-bar { flex: 1; min-width: 200px; }
.ts-meter { height: 8px; border-radius: var(--radius-full); background: var(--ds-soft); overflow: hidden; }
.ts-meter span { display: block; height: 100%; background: var(--accent); border-radius: inherit; transition: width 0.6s ease; }
.ts-whole { margin-bottom: var(--space-6); border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--ds-card); overflow: hidden; }
.ts-whole-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; padding: var(--space-4) var(--space-5); border: none; background: none; font: inherit; text-align: left; cursor: pointer; color: var(--text); }
.ts-whole-head > span { display: flex; flex-direction: column; gap: 2px; }
.ts-whole-head span span { font-size: 0.9rem; color: var(--text2); }
.ts-whole-head svg { flex-shrink: 0; color: var(--text3); transition: transform 0.2s; }
.ts-whole.open .ts-whole-head svg { transform: rotate(180deg); }
.ts-whole-body { padding: 0 var(--space-5) var(--space-5); }
.ts-whole-body .pe-card { box-shadow: none; background: var(--bg); }
.ts-rubric { margin-top: var(--space-3); padding: var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); }
.ts-rubric-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--space-2); font-weight: 700; font-size: 0.92rem; }
.ts-rubric-total { font-size: 1.05rem; color: var(--accent-text); font-variant-numeric: tabular-nums; }
.ts-rubric-row { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) 76px; align-items: center; gap: var(--space-3); padding: 6px 0; }
.ts-rubric-label { display: flex; flex-direction: column; min-width: 0; }
.ts-rubric-label strong { font-size: 0.9rem; }
.ts-rubric-label span { font-size: 0.8rem; color: var(--text3); }
.ts-rubric-row input { width: 100%; accent-color: var(--accent); cursor: pointer; }
.ts-rubric-val { text-align: right; font-size: 0.86rem; font-weight: 600; color: var(--text2); font-variant-numeric: tabular-nums; }
.ts-mentor { margin-top: var(--space-3); }
.ts-mentor-wait { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); color: var(--text2); font-size: 0.92rem; }
.ts-mentor-card { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-2); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--bg); }
.ts-mentor-card > .ds-btn { align-self: flex-start; }
.ts-mentor-title { font-weight: 800; }
.ts-mentor-sub { margin: -8px 0 0; font-size: 0.88rem; color: var(--text2); }
.ts-textarea { width: 100%; box-sizing: border-box; resize: vertical; padding: var(--space-3); border: 1.5px solid var(--border2); border-radius: var(--radius-md); background: var(--ds-card); color: var(--text); font: inherit; font-size: 0.94rem; line-height: 1.6; outline: none; }
.ts-textarea:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); }
.ts-mentor-actions { display: flex; justify-content: flex-end; gap: var(--space-2); }
.ts-err { margin: 0; color: var(--danger-text); font-size: 0.9rem; }
.ts-mentor-score { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--space-2) var(--space-4); }
.ts-score-num { font-size: 1.8rem; font-weight: 800; }
.ts-score-of { color: var(--text3); font-weight: 600; }
.ts-mentor-note { font-size: 0.84rem; color: var(--text3); }
.ts-mentor-report { display: flex; flex-direction: column; gap: var(--space-3); }
.ts-mentor-report .ev-block { padding: var(--space-4); }

@media (max-width: 960px) {
  .ts-grid { grid-template-columns: minmax(0, 1fr); }
  .ts-aside { position: static; }
  .ts-formats { grid-template-columns: minmax(0, 1fr); }
  .ts-map { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .ts-card { padding: var(--space-5) var(--space-4); }
  .ts-bar-what { display: none; }
  .ts-bar-in { justify-content: space-between; }
  .ts-paper { padding: var(--space-4); }
  .ts-block-head { padding: var(--space-3) var(--space-4); }
  .ts-block-lead { margin: var(--space-4) var(--space-4) var(--space-2); }
  .ts-q { padding: var(--space-4); }
  .ts-map { padding: var(--space-2) var(--space-4) var(--space-4); }
  .ts-dots { max-height: none; overflow: visible; }
  .ts-block-lead { font-size: 0.95rem; }
  /* The formats as a compact list: the description only for the one picked. */
  .ts-format { flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: var(--space-2); padding: var(--space-3) var(--space-4); }
  .ts-format-desc { display: none; flex-basis: 100%; margin-top: 2px; }
  .ts-format.on .ts-format-desc { display: block; }
  .ts-rubric-row { grid-template-columns: minmax(0, 1fr) 70px; }
  .ts-rubric-row input { grid-column: 1 / -1; grid-row: 2; }
  .ts-summary { padding: var(--space-4); gap: var(--space-4); }
  .ts-end .ds-btn { width: 100%; justify-content: center; }
  .ts-whole-head { padding: var(--space-4); }
  .ts-whole-body { padding: 0 var(--space-3) var(--space-4); }
}
@media (prefers-reduced-motion: reduce) { .ts-bar-progress span, .ts-meter span { transition: none; } }
`;
