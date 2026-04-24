"use client";
import { saveToHistory } from "@/hooks/useAnswerHistory";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";

interface Historian {
  name: string;
  work?: string;
  argument: string;
}

interface SectionMark {
  awarded: number;
  out_of: number;
  reasoning: string;
}

interface Evaluation {
  demand_of_question: string[];
  introduction: { what_was_written: string; strengths: string[]; analysis: string; suggestions: string[]; };
  body: { strengths: string[]; weaknesses: string[]; suggestions: string[]; };
  conclusion: { what_was_written: string; strengths: string[]; analysis: string; suggestions: string[]; };
  historians_to_cite: Historian[];
  model_answer: { introduction: string; body: string | string[]; conclusion: string; };
  overall_feedback: string;
  section_marks: {
    introduction: SectionMark;
    body: SectionMark;
    conclusion: SectionMark;
    presentation: SectionMark;
  };
  marks: number;
  marks_out_of: number;
  word_count: number;
  word_count_rating: "LOW" | "GOOD" | "HIGH";
}

function bodyParas(body: string | string[]): string[] {
  const stripMd = (t: string) => t
    .replace(/^#{1,4}\s+/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[-•*]\s+/, '')
    .trim();
  if (Array.isArray(body)) return body.map(stripMd).filter(Boolean);
  return body.split(/\n\n+/).map(stripMd).filter(Boolean);
}
// Safely convert any AI field that should be string[] but might come back as object/string
function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (val && typeof val === 'object') return Object.values(val as object).map(String).filter(Boolean);
  if (typeof val === 'string' && val.trim()) return [val];
  return [];
}



async function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg", quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function downloadModelAnswerPDF(question: string, marks: number, evaluation: Evaluation) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    

  const pageW = 210, pageH = 297, M = 18, contentW = 174;

  const INK    : [number,number,number] = [10,  10,  10];
  const INK2   : [number,number,number] = [40,  40,  40];
  const INK3   : [number,number,number] = [90,  90,  90];
  const GOLD   : [number,number,number] = [37,  99, 235];
  const RULE   : [number,number,number] = [220, 220, 220];
  const BGSOFT : [number,number,number] = [245, 248, 255];
  const GREEN  : [number,number,number] = [30, 140,  70];
  const DOMAIN = 'www.historyoptional.xyz';
  const URL    = 'https://www.historyoptional.xyz';

  let pg = 1, y = 0;

  const clean = (t: string) => {
    if (!t) return '';
    const map: Record<string,string> = {
      '\u0101':'a','\u0100':'A','\u012b':'i','\u012a':'I','\u016b':'u','\u016a':'U',
      '\u1e0d':'d','\u1e0c':'D','\u1e6d':'t','\u1e6c':'T','\u1e47':'n','\u1e46':'N',
      '\u1e63':'s','\u1e62':'S','\u015b':'s','\u015a':'S','\u1e25':'h','\u1e24':'H',
      '\u1e45':'n','\u1e44':'N','\u1e37':'l','\u1e36':'L','\u1e5b':'r','\u1e5a':'R',
      '\u1e43':'m','\u1e42':'M','\u1e41':'m','\u1e40':'M',
      '\u0107':'c','\u0106':'C','\u010d':'c','\u010c':'C',
      '\u2013':'--','\u2014':'--','\u2018':"'",'\u2019':"'",
      '\u201c':'"','\u201d':'"','\u2026':'...','\u00d7':'x','\u00f7':'/',
      '\u00e9':'e','\u00e8':'e','\u00ea':'e','\u00e0':'a','\u00e2':'a',
      '\u00e4':'a','\u00f6':'o','\u00fc':'u','\u00fb':'u','\u00f1':'n',
      '\u00e7':'c','\u00df':'ss','\u00e6':'ae',
    };
    let result = '';
    for (const ch of t) {
      if (ch.charCodeAt(0) < 128) { result += ch; continue; }
      if (map[ch]) { result += map[ch]; continue; }
      const decomposed = ch.normalize('NFD');
      const b = decomposed[0];
      if (b.charCodeAt(0) < 128) { result += b; continue; }
    }
    return result;
  };

  const drawBg = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, 'F');
  };

  const drawHeader = () => {
    doc.setFillColor(...GOLD);
    doc.rect(0, 0, pageW, 0.8, 'F');
    doc.setFillColor(...BGSOFT);
    doc.rect(0, 0.8, pageW, 13, 'F');
    doc.setFillColor(...RULE);
    doc.rect(0, 13.8, pageW, 0.3, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GOLD);
    doc.text('HISTORY OPTIONAL', M, 9);
    doc.link(M, 2, 52, 10, { url: URL });

    doc.setFont('times', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...INK3);
    doc.text(DOMAIN, M + 55, 9);
    doc.text('Model Answer  ·  ' + marks + 'M  ·  UPSC CSM', pageW - M, 9, { align: 'right' });
  };

  const drawFooter = () => {
    doc.setFillColor(...RULE);
    doc.rect(0, pageH - 11, pageW, 0.3, 'F');
    doc.setFillColor(...BGSOFT);
    doc.rect(0, pageH - 10.7, pageW, 10.7, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(0, pageH - 0.6, pageW, 0.6, 'F');

    doc.setFont('times', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...INK3);
    doc.text(DOMAIN, M, pageH - 4.5);
    doc.link(M, pageH - 9, 50, 7, { url: URL });
    doc.text('UPSC History Optional  ·  Model Answer Evaluator', pageW / 2, pageH - 4.5, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.setTextColor(...GOLD);
    doc.text(String(pg), pageW - M, pageH - 4.5, { align: 'right' });
  };

  const nextPage = () => {
    doc.addPage(); pg++;
    drawBg(); drawHeader(); drawFooter(); y = 26;
  };

  const chk = (n: number) => { if (y + n > pageH - 14) nextPage(); };

  const secLabel = (txt: string) => {
    chk(14); y += 6;
    doc.setFont('times', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...GOLD);
    doc.text(txt.toUpperCase(), M, y);
    y += 2;
    doc.setFillColor(...GOLD);
    doc.rect(M, y, contentW, 0.4, 'F');
    y += 5;
  };

  const writeText = (text: string, size = 9.5, color: [number,number,number] = INK2) => {
    doc.setFont('times', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const ls = doc.splitTextToSize(clean(text), contentW) as string[];
    ls.forEach((l: string) => { chk(7); doc.text(l, M, y); y += 6.8; });
  };

  drawBg(); drawHeader(); drawFooter(); y = 26;

  // ── Title bar ──
  doc.setFillColor(...BGSOFT);
  doc.rect(M, y, contentW, 12, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y, 2, 12, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text('MODEL ANSWER', M + 7, y + 8);
  const idealWC = marks === 10 ? '150 words' : marks === 15 ? '200 words' : '250 words';
  doc.setFont('times', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...INK3);
  doc.text(idealWC + '  ·  ' + marks + ' Marks', pageW - M, y + 8, { align: 'right' });
  y += 18;

  // ── Score ──
  const scoreStr = evaluation.marks + ' / ' + evaluation.marks_out_of;
  const scoreW = 48;
  doc.setFillColor(...BGSOFT);
  doc.rect(M, y, scoreW, 14, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y, scoreW, 1.2, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(scoreStr, M + scoreW / 2, y + 10, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...INK3);
  doc.text('MARKS SCORED', M + scoreW / 2, y + 13.5, { align: 'center' });
  y += 20;

  // ── Question ──
  doc.setFont('times', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...GOLD);
  doc.text('QUESTION', M, y);
  y += 3.5;
  const qLines = doc.splitTextToSize(clean(question), contentW - 14) as string[];
  const qH = qLines.length * 7.5 + 14;
  doc.setFillColor(...BGSOFT);
  doc.rect(M, y, contentW, qH, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(M, y, 2, qH, 'F');
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  qLines.forEach((l: string, i: number) => { doc.text(l, M + 6, y + 8 + i * 7.5); });
  y += qH + 10;

  // ── Introduction ──
  secLabel('Introduction');
  writeText(evaluation.model_answer.introduction);
  y += 4;

  // ── Body ──
  secLabel('Body');
  const paras = bodyParas(evaluation.model_answer.body);
  paras.forEach((p: string, i: number) => {
    chk(12);
    doc.setFillColor(...GOLD);
    doc.rect(M, y - 1, 1.5, 1.5, 'F');
    writeText(p, 9.5, INK2);
    if (i < paras.length - 1) {
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.2);
      doc.line(M + 5, y + 1, pageW - M, y + 1);
      y += 4;
    }
  });
  y += 6;

  // ── Conclusion ──
  secLabel('Conclusion');
  writeText(evaluation.model_answer.conclusion);
  y += 4;

  // ── Historians ──
  secLabel('Historians to Cite');
  evaluation.historians_to_cite.forEach((h: any) => {
    const argLines = doc.splitTextToSize(clean(h.argument), contentW - 8) as string[];
    const hH = argLines.length * 5.3 + (h.work ? 20 : 16);
    chk(hH + 5);
    doc.setFillColor(...BGSOFT);
    doc.rect(M, y, contentW, hH, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(M, y, 2, hH, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(clean(h.name), M + 6, y + 7);

    if (h.work) {
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...INK3);
      doc.text(clean(h.work), M + 6, y + 13);
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...INK2);
    const tY = y + (h.work ? 18 : 13);
    argLines.forEach((l: string, li: number) => { doc.text(l, M + 6, tY + li * 6.8); });
    y += hH + 5;
  });

  // ── Watermark ──
  for (let p = 1; p <= pg; p++) {
    doc.setPage(p);
    doc.saveGraphicsState();
    // @ts-ignore
    doc.setGState(doc.GState({ opacity: 0.025 }));
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...GOLD);
    doc.text(DOMAIN, pageW / 2, pageH / 2, { align: 'center', angle: 30 });
    doc.restoreGraphicsState();
  }

  doc.save('model-answer-' + marks + 'M.pdf');
}

export default function EvaluatePage() {
  const [files, setFiles]           = useState<File[]>();
  const [question, setQuestion]     = useState("");
  const [marks, setMarks]           = useState<10 | 15 | 20>(15);
  const [loading, setLoading]       = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [submittedQ, setSubmittedQ] = useState("");
  const [submittedM, setSubmittedM] = useState<10|15|20>(15);
  const [error, setError]           = useState("");
  const [tab, setTab]               = useState<"eval"|"model"|"hist">("eval");
  const [stage, setStage]           = useState<"form"|"ocr"|"result">("form");
  const [extractedText, setExtractedText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress]   = useState(0);
  const [evalProgress, setEvalProgress] = useState(0);
  const [evalPhase, setEvalPhase]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const addFileRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [swapIdx, setDragIdx] = useState<number | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

const handleOcr = useCallback(async () => {
    if (!files || files.length === 0 || !question.trim()) { setError("Please upload at least one image and enter the question."); return; }
    setError(""); setOcrLoading(true); setOcrProgress(0);
    // Animate OCR progress
    let ocrTimer: ReturnType<typeof setTimeout> | undefined;
    const ocrSteps = [
      { pct: 12, label: "Compressing images…" },
      { pct: 30, label: "Sending to vision model…" },
      { pct: 55, label: "Reading handwriting…" },
      { pct: 78, label: "Parsing text…" },
      { pct: 92, label: "Almost there…" },
    ];
    const runOcrStep = (idx: number) => {
      if (idx >= ocrSteps.length) return;
      setOcrProgress(ocrSteps[idx].pct);
      ocrTimer = setTimeout(() => runOcrStep(idx + 1), 900 + Math.random() * 600);
    };
    runOcrStep(0);
    const compressed = await Promise.all(files.map(f => compressImage(f)));
    const fd = new FormData();
    fd.append("question", question);
    compressed.forEach(f => fd.append("files", f));
    try {
      const res = await fetch("/api/ocr", { method: "POST", headers: { "x-user-token": tokenRef.current ?? "" }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR failed");
      setOcrProgress(100);
      clearTimeout(ocrTimer);
      setTimeout(() => { setExtractedText(data.text); setStage("ocr"); }, 400);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OCR failed. Please try again.");
    } finally { setOcrLoading(false); }
  }, [files, question]);

  // ── Subscription gate — must come after handleOcr is defined ──────────────
  const { UsagePill, GateModals, handleEvaluate, usage, increment, slots } = useSubscriptionGate(handleOcr);
  const tokenRef = useRef<string | null>(null);
  useEffect(() => { tokenRef.current = usage.token; }, [usage.token]);

  const submit = async () => {
    setError(""); setLoading(true); setEvaluation(null); setEvalProgress(0); setEvalPhase("");
    let evalTimer: ReturnType<typeof setTimeout> | undefined;
    const evalSteps = [
      { pct: 8,  label: "Loading answer into context…" },
      { pct: 18, label: "Checking demand of question…" },
      { pct: 32, label: "Evaluating introduction…" },
      { pct: 48, label: "Analysing body paragraphs…" },
      { pct: 62, label: "Checking historiography…" },
      { pct: 74, label: "Evaluating conclusion…" },
      { pct: 84, label: "Scoring against UPSC rubric…" },
      { pct: 93, label: "Compiling feedback…" },
    ];
    const runEvalStep = (idx: number) => {
      if (idx >= evalSteps.length) return;
      setEvalProgress(evalSteps[idx].pct);
      setEvalPhase(evalSteps[idx].label);
      evalTimer = setTimeout(() => runEvalStep(idx + 1), 1800 + Math.random() * 1200);
    };
    runEvalStep(0);
    const fd = new FormData();
    fd.append("question", question); fd.append("marks", marks.toString());
    fd.append("extractedText", extractedText);
    if (files) { const compEval = await Promise.all(files.map(f => compressImage(f))); compEval.forEach(f => fd.append("files", f)); }
    try {
      const res  = await fetch("/api/evaluate", { method: "POST", headers: { "x-user-token": tokenRef.current ?? "" }, body: fd });
      const rawText = await res.text();
      console.log("Evaluate raw response:", rawText.slice(0, 500));
      if (!rawText) throw new Error("Empty response from server");
      const data = JSON.parse(rawText);
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      setEvalProgress(100);
      setEvalPhase("Complete.");
      clearTimeout(evalTimer);
      setSubmittedQ(question);
      // Save to answer history
      if (data) {
        saveToHistory({
          question,
          marks: data.marks,
          marksOutOf: data.marks_out_of,
          overallFeedback: data.overall_feedback,
          sectionMarks: {
            introduction: data.section_marks.introduction,
            body: data.section_marks.body,
            conclusion: data.section_marks.conclusion,
            presentation: data.section_marks.presentation,
          },
        });
      }
      setSubmittedM(marks);
      setTimeout(() => setEvaluation(data), 500);
      setStage("result");
      setTab("eval");
      // Increment daily usage counter via hook
      if (usage.token) increment(usage.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setLoading(false); }
  };

  const pct      = evaluation ? (evaluation.marks / evaluation.marks_out_of) * 100 : 0;
  const scoreCol = pct >= 70 ? "#4ade80" : pct >= 50 ? "#3b82f6" : "#f87171";

  return (
    <>
      <style>{`
        .ev-wrap * { box-sizing: border-box; }
        .ev-upload { border: 1.5px dashed #333; border-radius:6px; padding:44px 24px;
          text-align:center; cursor:pointer; background:#161616; transition:all 0.2s; }
        .ev-upload:hover, .ev-upload.has { border-color:#3b82f6; background:#0d1b3e; }
        .ev-ta { width:100%; background:#161616; border:1.5px solid #333; border-radius:6px;
          color:#f0f0f0; padding:14px 16px; font-family:var(--font-body); font-size:0.95rem;
          resize:vertical; line-height:1.75; transition:border-color 0.2s; outline:none; text-align:justify; }
        .ev-ta:focus { border-color:#3b82f6; }
        .ev-ta::placeholder { color:#555; }
        .ev-mchip { padding:9px 26px; border-radius:4px; cursor:pointer;
          border:1.5px solid #333; background:#161616; color:#888;
          font-family:var(--font-mono); font-size:0.82rem; letter-spacing:0.06em; transition:all 0.15s; }
        .ev-mchip.active { background:#0d1b3e; border-color:#3b82f6; color:#3b82f6; }
        .ev-mchip:hover:not(.active) { border-color:#555; color:#ccc; }
        .ev-btn { width:100%; padding:16px; border:1.5px solid rgba(59,130,246,0.5);
          background:rgba(59,130,246,0.1); color:#3b82f6; font-size:0.78rem;
          font-family:var(--font-mono); cursor:pointer; transition:all 0.2s;
          letter-spacing:0.2em; text-transform:uppercase; border-radius:4px; }
        .ev-btn:hover:not(:disabled) { background:rgba(59,130,246,0.18); border-color:#3b82f6; }
        .ev-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .ev-btn-sm { padding:10px 20px; width:auto; font-size:0.7rem; }
        .ev-err { background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.3);
          border-radius:4px; padding:12px 16px; color:#f87171;
          font-size:0.85rem; margin-bottom:20px; font-family:var(--font-ui); }
        .ev-score-row { display:flex; justify-content:space-between;
          align-items:flex-end; padding-bottom:36px;
          border-bottom:1px solid #2e2e2e; margin-bottom:32px; }
        .ev-score-num { font-family:var(--font-mono); font-size:5.5rem; font-weight:700; line-height:1; }
        .ev-score-denom { font-family:var(--font-mono); font-size:1.8rem; color:#444; }
        .ev-bar-bg { background:#222; border-radius:2px; height:4px; overflow:hidden; margin-top:14px; width:260px; }
        .ev-bar-fill { height:100%; border-radius:2px; transition:width 1.2s cubic-bezier(.16,1,.3,1); }
        .ev-wc { font-family:var(--font-mono); font-size:2.8rem; font-weight:700; color:#f0f0f0; line-height:1; }
        .ev-pill { display:inline-block; padding:3px 12px; border-radius:3px;
          font-family:var(--font-mono); font-size:0.64rem; letter-spacing:0.12em;
          text-transform:uppercase; margin-top:10px; font-weight:600; }
        .pill-g { background:rgba(74,222,128,0.1); color:#4ade80; border:1px solid rgba(74,222,128,0.3); }
        .pill-r { background:rgba(248,113,113,0.1); color:#f87171; border:1px solid rgba(248,113,113,0.3); }
        .pill-y { background:rgba(59,130,246,0.1); color:#3b82f6; border:1px solid rgba(59,130,246,0.3); }
        /* ── TABS ── */
        .ev-tabs { display:flex; gap:0; margin-bottom:32px; border-bottom:1px solid rgba(255,255,255,0.07); }
        .ev-tab { padding:13px 28px; cursor:pointer; font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; font-family:var(--font-mono); background:none; border:none; color:#444; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all 0.2s; }
        .ev-tab.active { color:#e2e8f0; border-bottom-color:#3b82f6; }
        .ev-tab:hover:not(.active) { color:#888; }

        /* ── BASE CARD ── */
        .ev-card { background:linear-gradient(135deg,#161616,#111); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:28px 30px; margin-bottom:16px; position:relative; overflow:hidden; }
        .ev-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.02),transparent 60%); pointer-events:none; }
        .ev-card-gold { border-color:rgba(234,179,8,0.18); background:linear-gradient(135deg,#161410,#111); }
        .ev-card-gold::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(234,179,8,0.4),transparent); }
        .ev-card-green { border-color:rgba(74,222,128,0.12); background:linear-gradient(135deg,#101610,#111); }
        .ev-card-green::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(74,222,128,0.35),transparent); }

        /* ── SECTION TITLE ── */
        .ev-ct { font-family:var(--font-mono); font-size:0.58rem; letter-spacing:0.32em; text-transform:uppercase; color:#3b82f6; margin-bottom:18px; display:flex; align-items:center; gap:10px; }
        .ev-ct::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,rgba(59,130,246,0.25),transparent); }

        /* ── DEMAND LIST ── */
        .ev-demand-item { display:flex; gap:14px; padding:13px 0; border-bottom:1px solid rgba(255,255,255,0.04); align-items:flex-start; }
        .ev-demand-item:last-child { border-bottom:none; padding-bottom:0; }
        .ev-demand-bullet { width:6px; height:6px; border-radius:50%; background:#3b82f6; margin-top:7px; flex-shrink:0; box-shadow:0 0 8px rgba(59,130,246,0.5); }
        .ev-demand-txt { font-size:0.9rem; color:#c4c4c4; line-height:1.75; font-family:var(--font-body); }

        /* ── WHAT YOU WROTE ── */
        .ev-wrote { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07); border-radius:8px; padding:16px 18px; margin-bottom:18px; position:relative; }
        .ev-wrote::before { content:''; position:absolute; left:0; top:12px; bottom:12px; width:3px; background:linear-gradient(180deg,#3b82f6,rgba(59,130,246,0.2)); border-radius:0 2px 2px 0; }
        .ev-wrote-lbl { font-family:var(--font-mono); font-size:0.52rem; letter-spacing:0.25em; text-transform:uppercase; color:#3b82f6; margin-bottom:8px; padding-left:14px; }
        .ev-wrote-txt { font-size:0.88rem; color:#888; line-height:1.75; font-style:normal; padding-left:14px; text-align:justify; }

        /* ── ANALYSIS TEXT ── */
        .ev-analysis { font-size:0.92rem; color:#c8c8c8; line-height:1.85; margin-bottom:18px; font-family:var(--font-body); }

        /* ── SUBLABELS (Strengths / Weaknesses / Suggestions) ── */
        .ev-sl { font-family:var(--font-mono); font-size:0.55rem; letter-spacing:0.22em; text-transform:uppercase; color:#555; margin:18px 0 10px; display:flex; align-items:center; gap:8px; }
        .ev-sl::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.05); }
        .ev-sl.g { color:rgba(74,222,128,0.6); }
        .ev-sl.r { color:rgba(248,113,113,0.5); }

        /* ── LISTS ── */
        ul.ev-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:6px; }
        ul.ev-list li { padding:10px 14px 10px 16px; background:rgba(255,255,255,0.02); border-radius:6px; border-left:2px solid rgba(255,255,255,0.08); font-size:0.88rem; color:#b0b0b0; line-height:1.7; font-family:var(--font-body); }
        ul.ev-list li.g { border-left-color:rgba(74,222,128,0.45); color:#a7f3c0; background:rgba(74,222,128,0.04); }
        ul.ev-list li.r { border-left-color:rgba(248,113,113,0.4); color:#fecaca; background:rgba(248,113,113,0.04); }

        /* ── QUESTION BOX ── */
        .ev-qbox { background:linear-gradient(135deg,#0d1b3e,#091530); border:1px solid rgba(59,130,246,0.2); border-radius:10px; padding:20px 24px; margin-bottom:20px; }
        .ev-qlabel { font-family:var(--font-mono); font-size:0.55rem; letter-spacing:0.25em; text-transform:uppercase; color:#3b82f6; margin-bottom:10px; }
        .ev-qtext { font-size:1.05rem; color:#e2e8f0; line-height:1.65; font-family:var(--font-body); }

        /* ── MODEL ANSWER ── */
        .ev-ml { font-family:var(--font-mono); font-size:0.55rem; letter-spacing:0.25em; text-transform:uppercase; color:rgba(74,222,128,0.55); margin:22px 0 12px; display:flex; align-items:center; gap:8px; }
        .ev-ml::after { content:''; flex:1; height:1px; background:rgba(74,222,128,0.08); }
        .ev-ml:first-of-type { margin-top:0; }
        .ev-mp { font-size:0.93rem; line-height:1.9; color:#d4d4d4; margin-bottom:0; font-family:var(--font-body); }

        /* ── HISTORIANS ── */
        .ev-hist { padding:22px 0; border-bottom:1px solid rgba(255,255,255,0.05); display:grid; gap:6px; }
        .ev-hist:first-child { padding-top:0; }
        .ev-hist:last-child { border-bottom:none; padding-bottom:0; }
        .ev-hist-name { font-family:var(--font-display); font-size:1.0rem; font-weight:700; color:#60a5fa; letter-spacing:0.01em; }
        .ev-hist-work { font-family:var(--font-mono); font-size:0.68rem; color:#555; letter-spacing:0.05em; }
        .ev-hist-arg { font-size:0.88rem; color:#aaa; line-height:1.75; font-family:var(--font-body); }

        /* ── OVERALL FEEDBACK ── */
        .ev-overall-txt { font-size:0.93rem; line-height:1.9; color:#d4d4d4; font-family:var(--font-body); }

        .ev-fade { animation:ev-fi 0.4s ease; }
        @keyframes ev-fi { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .ev-dl-btn { display:flex; align-items:center; gap:8px; padding:10px 20px;
          border:1.5px solid rgba(74,222,128,0.3); background:rgba(74,222,128,0.06);
          color:#4ade80; font-family:var(--font-mono); font-size:0.68rem;
          letter-spacing:0.15em; text-transform:uppercase; border-radius:4px;
          cursor:pointer; transition:all 0.2s; }
        .ev-dl-btn:hover { background:rgba(74,222,128,0.12); border-color:rgba(74,222,128,0.5); }
        .ev-sec-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:32px; }
        @media(max-width:620px){ .ev-sec-grid { grid-template-columns:repeat(2,1fr); } }
        .ev-sec-card { background:#161616; border:1px solid #2a2a2a; border-radius:6px; padding:16px 14px; }
        .ev-sec-lbl { font-family:var(--font-mono); font-size:0.52rem; letter-spacing:0.22em;
          text-transform:uppercase; color:#555; margin-bottom:10px; }
        .ev-sec-num { font-family:var(--font-mono); font-size:1.85rem; font-weight:700; line-height:1; }
        .ev-sec-den { font-size:0.9rem; color:#444; }
        .ev-sec-bar-bg { background:#222; border-radius:2px; height:3px; overflow:hidden; margin:10px 0 8px; }
        .ev-sec-bar-fill { height:100%; border-radius:2px; transition:width 1.2s cubic-bezier(.16,1,.3,1); }
        .ev-sec-rsn { font-size:0.76rem; color:#666; line-height:1.5; font-family:var(--font-ui); }
        .ev-pages { display:flex; flex-wrap:wrap; gap:10px; margin-top:14px; }
        .ev-page-item { position:relative; width:80px; user-select:none; -webkit-user-select:none; }
        .ev-page-arrows { display:flex; justify-content:center; gap:4px; margin-top:5px; }
        .ev-page-item img { width:80px; height:100px; object-fit:cover; border-radius:4px; border:2px solid #333; display:block; transition:border-color 0.15s; }
        .ev-page-arrow { background:#222; border:1px solid #333; color:#aaa; border-radius:3px; width:34px; height:22px; font-size:0.75rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
        .ev-page-arrow:hover { background:#333; color:#fff; border-color:#555; } .ev-page-arrow:disabled { opacity:0.2; cursor:default; }
        .ev-page-num { position:absolute; top:4px; left:4px; background:rgba(0,0,0,0.75); color:#fff; font-family:var(--font-mono); font-size:0.6rem; padding:2px 6px; border-radius:3px; }
        .ev-page-del { position:absolute; top:4px; right:4px; background:rgba(248,113,113,0.85); color:#fff; font-size:0.65rem; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; line-height:1; }
        .ev-page-add { width:80px; height:100px; border:1.5px dashed #333; border-radius:4px; background:#161616; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; color:#555; font-size:1.4rem; transition:all 0.15s; }
        .ev-page-add:hover { border-color:#3b82f6; color:#3b82f6; background:#0d1b3e; }

      `}</style>

      <div className="ev-wrap" style={{ maxWidth:820, margin:"0 auto", padding:"48px 28px 96px", background:"#111", minHeight:"calc(100vh - 60px)" }}>

        {/* Hero */}
        <div style={{ paddingBottom:40, borderBottom:"1px solid #2a2a2a", marginBottom:44 }} className="ev-fade">
          <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.65rem", letterSpacing:"0.28em", textTransform:"uppercase", color:"#666", marginBottom:14 }}>History Optional · UPSC Civil Services Mains</div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"2.6rem", fontWeight:700, color:"#f0f0f0", lineHeight:1.12, letterSpacing:"-0.02em" }}>
            Evaluate Your <span style={{ color:"#3b82f6" }}>Answer</span>
          </h1>
          <p style={{ marginTop:14, color:"#888", fontSize:"0.88rem", fontFamily:"var(--font-ui)", lineHeight:1.6 }}>
            Upload your handwritten answer sheet for expert evaluation against UPSC standards.
          </p>
        </div>

        {/* ── OCR CONFIRMATION ── */}
        {stage === "ocr" && !evaluation && (
          <div className="ev-fade">
            <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"#666", marginBottom:12 }}>Step 2 — Review Transcription</div>
            <p style={{ color:"#888", fontSize:"0.88rem", fontFamily:"var(--font-ui)", lineHeight:1.6, marginBottom:20 }}>
              The model has read your handwriting. Fix any errors below, then evaluate.
            </p>
            {error && <div className="ev-err">{error}</div>}
            <textarea
              className="ev-ta"
              style={{ minHeight:320, marginBottom:20, textAlign:"justify" }}
              value={extractedText.replace(/--- PAGE BREAK ---/g, " ")}
              onChange={e => setExtractedText(e.target.value)}
            />
            <div style={{ display:"flex", gap:12 }}>
              <button className="ev-btn ev-btn-sm" onClick={() => setStage("form")} style={{ background:"transparent", color:"#666", borderColor:"#333" }}>
                ← Re-upload
              </button>
              <button className="ev-btn" onClick={submit} disabled={loading}>
                {loading ? "Evaluating…" : "Looks good — Evaluate →"}
              </button>
            </div>
          </div>
        )}

        {/* ── FORM ── */}
        {stage === "form" && !evaluation && !loading && (
          <div className="ev-fade">
            <div style={{ marginBottom:28 }}>
              <label style={{ display:"block", fontFamily:"var(--font-mono)", fontSize:"0.62rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"#666", marginBottom:10 }}>Answer Images</label>
              <div className={`ev-upload ${files && files.length > 0 ? "has" : ""}`} onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }}
                  onChange={e => {
                    const newFiles = Array.from(e.target.files || []);
                    setFiles(newFiles);
                    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
                  }} />
                {files && files.length > 0 ? (
                  <div onClick={e => e.stopPropagation()} style={{ textAlign:"left" }}>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#3b82f6", marginBottom:8 }}>
                      `${files.length} page${files.length > 1 ? "s" : ""} — use arrows to reorder`
                    </div>
                    <div className="ev-pages">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className={`ev-page-item${swapIdx === i ? " dragging" : ""}`}
                          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragIdx(i); }}
                          onPointerEnter={() => {
                            if (swapIdx === null || swapIdx === i) return;
                            const newFiles = [...files];
                            const newPrev = [...previews];
                            newFiles.splice(i, 0, newFiles.splice(swapIdx, 1)[0]);
                            newPrev.splice(i, 0, newPrev.splice(swapIdx, 1)[0]);
                            setFiles(newFiles);
                            setPreviews(newPrev);
                            setDragIdx(i < swapIdx ? i : i);
                          }}
                          onPointerUp={() => setDragIdx(null)}
                          onPointerCancel={() => setDragIdx(null)}
                        >
                          <img src={previews[i] || ""} alt={`page ${i+1}`} />
                          <div className="ev-page-num">pg {i+1}</div>
                          <button className="ev-page-del" onClick={() => {
                            const nf = files.filter((_,j) => j !== i);
                            const np = previews.filter((_,j) => j !== i);
                            setFiles(nf.length ? nf : undefined as any);
                            setPreviews(np);
                          }}>×</button>
                          <div className="ev-page-arrows">
                            <button className="ev-page-arrow" disabled={i === 0} onClick={() => {
                              const nf = [...files]; const np = [...previews];
                              [nf[i-1], nf[i]] = [nf[i], nf[i-1]];
                              [np[i-1], np[i]] = [np[i], np[i-1]];
                              setFiles(nf); setPreviews(np);
                            }}>←</button>
                            <button className="ev-page-arrow" disabled={i === files.length - 1} onClick={() => {
                              const nf = [...files]; const np = [...previews];
                              [nf[i+1], nf[i]] = [nf[i], nf[i+1]];
                              [np[i+1], np[i]] = [np[i], np[i+1]];
                              setFiles(nf); setPreviews(np);
                            }}>→</button>
                          </div>
                        </div>
                      ))}
                      <div className="ev-page-add" onClick={() => addFileRef.current?.click()}>
                        <input ref={addFileRef} type="file" accept="image/*" multiple style={{ display:"none" }}
                          onChange={e => {
                            const added = Array.from(e.target.files || []);
                            const nf = [...(files||[]), ...added];
                            const np = [...previews, ...added.map(f => URL.createObjectURL(f))];
                            setFiles(nf);
                            setPreviews(np);
                          }} />
                        <span>+</span>
                        <span style={{ fontSize:"0.55rem", fontFamily:"var(--font-mono)", marginTop:4 }}>add</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:"2rem", marginBottom:12, opacity:0.35 }}>⬆</div>
                    <div style={{ color:"#888", fontSize:"0.95rem" }}>Upload photos of your answer sheet</div>
                    <div style={{ color:"#555", fontSize:"0.78rem", marginTop:6, fontFamily:"var(--font-mono)" }}>JPG / PNG · Multiple pages supported</div>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginBottom:28 }}>
              <label style={{ display:"block", fontFamily:"var(--font-mono)", fontSize:"0.62rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"#666", marginBottom:10 }}>Question</label>
              <textarea className="ev-ta" rows={3} placeholder="Write the exact question here..."
                value={question} onChange={e => setQuestion(e.target.value)} />
            </div>

            <div style={{ marginBottom:32 }}>
              <label style={{ display:"block", fontFamily:"var(--font-mono)", fontSize:"0.62rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"#666", marginBottom:10 }}>Marks Allotted</label>
              <div style={{ display:"flex", gap:10 }}>
                {([10,15,20] as const).map(m => (
                  <button key={m} className={`ev-mchip ${marks===m?"active":""}`} onClick={() => setMarks(m)}>{m}M</button>
                ))}
              </div>
            </div>

            {error && <div className="ev-err">{error}</div>}
            <UsagePill />
            <button className="ev-btn" onClick={handleEvaluate} disabled={ocrLoading}>{ocrLoading ? "Reading handwriting…" : "Evaluate Answer →"}</button>
            <GateModals slots={slots} />
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ padding:"80px 0 60px", maxWidth:520, margin:"0 auto" }}>
            {/* Title */}
            <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.58rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"#444", marginBottom:32, textAlign:"center" }}>
              Evaluating Answer
            </div>
            {/* Big progress number */}
            <div style={{ display:"flex", alignItems:"flex-end", gap:6, marginBottom:18 }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"4.5rem", fontWeight:700, lineHeight:1, color:"#f0f0f0", letterSpacing:"-0.04em" }}>{String(evalProgress).padStart(2,"0")}</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"1.2rem", color:"#333", marginBottom:10 }}>%</span>
            </div>
            {/* Main bar */}
            <div style={{ height:4, background:"#181818", borderRadius:2, overflow:"hidden", marginBottom:12 }}>
              <div style={{
                height:"100%",
                width:`${evalProgress}%`,
                background:"linear-gradient(90deg,#1e3a8a 0%,#2563eb 50%,#3b82f6 80%,#93c5fd 100%)",
                borderRadius:2,
                transition:"width 1.2s cubic-bezier(.16,1,.3,1)",
                boxShadow:"0 0 18px rgba(59,130,246,0.4)"
              }} />
            </div>
            {/* Checkpoint dots */}
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:28 }}>
              {[8,18,32,48,62,74,84,93,100].map((p,i) => (
                <div key={p} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                  <div style={{
                    width: evalProgress >= p ? 8 : 5,
                    height: evalProgress >= p ? 8 : 5,
                    borderRadius:"50%",
                    background: evalProgress >= p ? "#3b82f6" : "#222",
                    border: evalProgress >= p ? "none" : "1px solid #333",
                    boxShadow: evalProgress >= p ? "0 0 8px #3b82f6" : "none",
                    transition:"all 0.5s"
                  }} />
                </div>
              ))}
            </div>
            {/* Phase label */}
            <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.65rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#3b82f6", minHeight:20, transition:"opacity 0.4s" }}>
              {evalPhase}
            </div>
            {/* Thin sub-bar (flicker effect) */}
            <div style={{ height:1, background:"#1a1a1a", borderRadius:1, overflow:"hidden", marginTop:20 }}>
              <div style={{ height:"100%", width:`${evalProgress}%`, background:"rgba(147,197,253,0.15)", transition:"width 1.2s cubic-bezier(.16,1,.3,1)" }} />
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {evaluation && (
          <div className="ev-fade">

            {/* Question box */}
            <div className="ev-qbox">
              <div className="ev-qlabel">Question · {submittedM}M</div>
              <div className="ev-qtext">{submittedQ}</div>
            </div>

            {/* Score row */}
            <div className="ev-score-row">
              <div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"#666", marginBottom:10 }}>Marks Scored</div>
                <div>
                  <span className="ev-score-num" style={{ color:scoreCol }}>{evaluation.marks}</span>
                  <span className="ev-score-denom"> /{evaluation.marks_out_of}</span>
                </div>
                <div className="ev-bar-bg">
                  <div className="ev-bar-fill" style={{ width:`${pct}%`, background:scoreCol }} />
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"#666", marginBottom:10 }}>Ideal Word Count</div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:"2.2rem", fontWeight:700, color:"#f0f0f0", lineHeight:1 }}>
                  {submittedM === 10 ? "150" : submittedM === 15 ? "200" : "250"}
                </div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.7rem", color:"#555", marginTop:4 }}>words</div>
              </div>
            </div>

            {/* Disclaimer note */}
            <div style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "6px",
              padding: "12px 16px",
              marginBottom: "28px",
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
            }}>
              <span style={{ color: "#3b82f6", fontSize: "0.85rem", marginTop: "1px", flexShrink: 0 }}>ℹ</span>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "#888", lineHeight: 1.65, margin: 0 }}>
                These marks are <span style={{ color: "#aaa" }}>indicative, not exact</span> — expect a 1–2 mark variance from what an actual UPSC examiner may award (usually on the lower side). Focus on the <span style={{ color: "#aaa" }}>qualitative feedback</span>: weak areas, missing historians, and the analytical depth of your answer. That is what moves the needle.
              </p>
            </div>

            {/* Section marks grid */}
            {evaluation.section_marks && (
              <div className="ev-sec-grid">
                {(["introduction","body","conclusion","presentation"] as const).map(sec => {
                  const s = evaluation.section_marks![sec];
                  const sp = s ? Math.round((s.awarded / s.out_of) * 100) : 0;
                  const sc = sp >= 75 ? "#4ade80" : sp >= 50 ? "#3b82f6" : "#f87171";
                  return (
                    <div key={sec} className="ev-sec-card">
                      <div className="ev-sec-lbl">{sec}</div>
                      <div className="ev-sec-num" style={{ color: sc }}>
                        {s.awarded}<span className="ev-sec-den">/{s.out_of}</span>
                      </div>
                      <div className="ev-sec-bar-bg">
                        <div className="ev-sec-bar-fill" style={{ width:`${sp}%`, background: sc }} />
                      </div>
                      <div className="ev-sec-rsn">{s.reasoning}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tabs */}
            <div className="ev-tabs" ref={tabsRef}>
              {(["eval","model","hist"] as const).map(t => (
                <button key={t} className={`ev-tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>
                  {t==="eval"?"Evaluation":t==="model"?"Model Answer":"Historians"}
                </button>
              ))}
            </div>

            {/* EVALUATION TAB */}
            {tab==="eval" && (
              <div className="ev-fade">
                {/* Demand of Question — minimal pill row */}
                <div className="ev-card" style={{ padding:"16px 20px" }}>
                  <div className="ev-ct" style={{ marginBottom:12 }}>Demand of the Question</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {toArray(evaluation.demand_of_question).map((d,i) => (
                      <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                        <div style={{ width:4, height:4, borderRadius:"50%", background:"#555", marginTop:8, flexShrink:0 }} />
                        <div style={{ fontSize:"0.87rem", color:"#b0b0b0", lineHeight:1.7, fontFamily:"var(--font-body)" }}>{d}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section evaluator — Introduction */}
                <div className="ev-card" style={{ padding:0, overflow:"hidden" }}>
                  <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.6rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#888" }}>Introduction</span>
                    {evaluation.section_marks?.introduction && (
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.72rem", color:"#e0e0e0" }}>
                        {evaluation.section_marks.introduction.awarded}<span style={{ color:"#555" }}>/{evaluation.section_marks.introduction.out_of}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)", background:"rgba(255,255,255,0.015)" }}>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.5rem", letterSpacing:"0.15em", color:"#555", textTransform:"uppercase", marginBottom:6 }}>What you wrote</div>
                    <div style={{ fontSize:"0.87rem", color:"#999", lineHeight:1.7, fontFamily:"var(--font-body)" }}>{evaluation.introduction.what_was_written}</div>
                  </div>
                  {toArray(evaluation.introduction.strengths).filter(s => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT")).length > 0 && (
                    <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      {toArray(evaluation.introduction.strengths).filter(s => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT")).map((s,i) => (
                        <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom: i < toArray(evaluation.introduction.strengths).length - 1 ? 6 : 0 }}>
                          <div style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", marginTop:7, flexShrink:0 }} />
                          <div style={{ fontSize:"0.87rem", color:"#c0c0c0", lineHeight:1.7, fontFamily:"var(--font-body)" }}>{s}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize:"0.87rem", color:"#999", lineHeight:1.7, fontFamily:"var(--font-body)" }}>{evaluation.introduction.analysis}</div>
                  </div>
                  {toArray(evaluation.introduction.suggestions).filter(s => s).length > 0 && (
                    <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.5rem", letterSpacing:"0.15em", color:"#555", textTransform:"uppercase", marginBottom:8 }}>How to improve</div>
                      {toArray(evaluation.introduction.suggestions).map((s,i) => (
                        <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom: i < toArray(evaluation.introduction.suggestions).length - 1 ? 8 : 0 }}>
                          <div style={{ width:4, height:4, borderRadius:"50%", background:"#3b82f6", marginTop:8, flexShrink:0 }} />
                          <div style={{ fontSize:"0.87rem", color:"#b0b0b0", lineHeight:1.7, fontFamily:"var(--font-body)" }}>{s}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ padding:"12px 20px", background:"rgba(59,130,246,0.03)" }}>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.5rem", letterSpacing:"0.15em", color:"#3b82f6", textTransform:"uppercase", marginBottom:8 }}>Model introduction</div>
                    <div style={{ fontSize:"0.87rem", color:"#c0c0c0", lineHeight:1.8, fontFamily:"var(--font-body)" }}>{evaluation.model_answer.introduction}</div>
                  </div>
                </div>

                {/* Section evaluator — Body */}
                <div className="ev-card" style={{ padding:0, overflow:"hidden" }}>
                  <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.6rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#888" }}>Body</span>
                    {evaluation.section_marks?.body && (
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.72rem", color:"#e0e0e0" }}>
                        {evaluation.section_marks.body.awarded}<span style={{ color:"#555" }}>/{evaluation.section_marks.body.out_of}</span>
                      </span>
                    )}
                  </div>
                  {toArray(evaluation.body.strengths).filter(s => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT") && !s.startsWith("Use [")).length > 0 && (
                    <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.5rem", letterSpacing:"0.15em", color:"#4ade80", textTransform:"uppercase", marginBottom:8 }}>What worked</div>
                      {toArray(evaluation.body.strengths).filter(s => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT") && !s.startsWith("Use [")).map((s,i) => {
                        const tagMatch = s.match(/^\[([^\]]+)\]:\s*/);
                        const tag = tagMatch ? tagMatch[1] : null;
                        const text = tagMatch ? s.slice(tagMatch[0].length) : s;
                        return (
                          <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                            <div style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", marginTop:7, flexShrink:0 }} />
                            <div style={{ fontSize:"0.87rem", color:"#c0c0c0", lineHeight:1.7, fontFamily:"var(--font-body)" }}>
                              {tag && <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.48rem", letterSpacing:"0.12em", color:"#4ade80", textTransform:"uppercase", background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:4, padding:"2px 6px", marginRight:8, display:"inline-block", verticalAlign:"middle" }}>{tag}</span>}
                              {text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {toArray(evaluation.body.weaknesses).filter(w => w && !w.startsWith("IMPORTANT") && !w.startsWith("Use [")).length > 0 && (
                    <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.5rem", letterSpacing:"0.15em", color:"#f87171", textTransform:"uppercase", marginBottom:8 }}>What fell short</div>
                      {toArray(evaluation.body.weaknesses).filter(w => w && !w.startsWith("IMPORTANT") && !w.startsWith("Use [")).map((w,i) => {
                        const tagMatch = w.match(/^\[([^\]]+)\]:\s*/);
                        const tag = tagMatch ? tagMatch[1] : null;
                        const text = tagMatch ? w.slice(tagMatch[0].length) : w;
                        const tagColors: Record<string,string> = {
                          "missed demand": "#fbbf24",
                          "needs historian": "#f87171",
                          "too descriptive": "#a78bfa",
                          "check this": "#f87171",
                          "structure": "#818cf8",
                        };
                        const dotColor = tag && tagColors[tag] ? tagColors[tag] : "#f87171";
                        return (
                          <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                            <div style={{ width:5, height:5, borderRadius:"50%", background:dotColor, marginTop:7, flexShrink:0 }} />
                            <div style={{ fontSize:"0.87rem", color:"#c0c0c0", lineHeight:1.7, fontFamily:"var(--font-body)" }}>
                              {tag && <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.48rem", letterSpacing:"0.12em", color:dotColor, textTransform:"uppercase", background:`rgba(${dotColor === "#fbbf24" ? "251,191,36" : dotColor === "#a78bfa" ? "167,139,250" : dotColor === "#818cf8" ? "99,102,241" : "248,113,113"},0.08)`, border:`1px solid ${dotColor}33`, borderRadius:4, padding:"2px 6px", marginRight:8, display:"inline-block", verticalAlign:"middle" }}>{tag}</span>}
                              {text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {toArray(evaluation.body.suggestions).filter(s => s).length > 0 && (
                    <div style={{ padding:"12px 20px" }}>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.5rem", letterSpacing:"0.15em", color:"#555", textTransform:"uppercase", marginBottom:8 }}>How to improve</div>
                      {toArray(evaluation.body.suggestions).map((s,i) => (
                        <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom: i < toArray(evaluation.body.suggestions).length - 1 ? 10 : 0 }}>
                          <div style={{ width:4, height:4, borderRadius:"50%", background:"#3b82f6", marginTop:8, flexShrink:0 }} />
                          <div style={{ fontSize:"0.87rem", color:"#b0b0b0", lineHeight:1.7, fontFamily:"var(--font-body)" }}>{s}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section evaluator — Conclusion */}
                <div className="ev-card" style={{ padding:0, overflow:"hidden" }}>
                  <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.6rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#888" }}>Conclusion</span>
                    {evaluation.section_marks?.conclusion && (
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.72rem", color:"#e0e0e0" }}>
                        {evaluation.section_marks.conclusion.awarded}<span style={{ color:"#555" }}>/{evaluation.section_marks.conclusion.out_of}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)", background:"rgba(255,255,255,0.015)" }}>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.5rem", letterSpacing:"0.15em", color:"#555", textTransform:"uppercase", marginBottom:6 }}>What you wrote</div>
                    <div style={{ fontSize:"0.87rem", color:"#999", lineHeight:1.7, fontFamily:"var(--font-body)" }}>{evaluation.conclusion.what_was_written}</div>
                  </div>
                  {toArray(evaluation.conclusion.strengths).filter(s => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT")).length > 0 && (
                    <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      {toArray(evaluation.conclusion.strengths).filter(s => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT")).map((s,i) => (
                        <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                          <div style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", marginTop:7, flexShrink:0 }} />
                          <div style={{ fontSize:"0.87rem", color:"#c0c0c0", lineHeight:1.7, fontFamily:"var(--font-body)" }}>{s}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize:"0.87rem", color:"#999", lineHeight:1.7, fontFamily:"var(--font-body)" }}>{evaluation.conclusion.analysis}</div>
                  </div>
                  {toArray(evaluation.conclusion.suggestions).filter(s => s).length > 0 && (
                    <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.5rem", letterSpacing:"0.15em", color:"#555", textTransform:"uppercase", marginBottom:8 }}>How to improve</div>
                      {toArray(evaluation.conclusion.suggestions).map((s,i) => (
                        <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom: i < toArray(evaluation.conclusion.suggestions).length - 1 ? 8 : 0 }}>
                          <div style={{ width:4, height:4, borderRadius:"50%", background:"#3b82f6", marginTop:8, flexShrink:0 }} />
                          <div style={{ fontSize:"0.87rem", color:"#b0b0b0", lineHeight:1.7, fontFamily:"var(--font-body)" }}>{s}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ padding:"12px 20px", background:"rgba(74,222,128,0.02)" }}>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.5rem", letterSpacing:"0.15em", color:"rgba(74,222,128,0.5)", textTransform:"uppercase", marginBottom:8 }}>Model conclusion</div>
                    <div style={{ fontSize:"0.87rem", color:"#c0c0c0", lineHeight:1.8, fontFamily:"var(--font-body)" }}>{evaluation.model_answer.conclusion}</div>
                  </div>
                </div>

                {/* Overall feedback */}
                <div className="ev-card ev-card-gold" style={{ padding:"16px 20px" }}>
                  <div className="ev-ct" style={{ marginBottom:10 }}>Overall Feedback</div>
                  <p className="ev-overall-txt" style={{ margin:0, lineHeight:1.8 }}>{evaluation.overall_feedback}</p>
                </div>
              </div>
            )}

            {/* MODEL ANSWER TAB */}
            {tab==="model" && (
              <div className="ev-fade">
                {/* Question reminder */}
                <div className="ev-qbox" style={{ marginBottom:20 }}>
                  <div className="ev-qlabel">Question · {submittedM}M</div>
                  <div className="ev-qtext">{submittedQ}</div>
                </div>

                <div className="ev-card ev-card-green">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                    <div className="ev-ct" style={{ marginBottom:0 }}>Model Answer · {evaluation.marks_out_of}M</div>
                    <button className="ev-dl-btn" onClick={() => downloadModelAnswerPDF(submittedQ, submittedM, evaluation)}>
                      ↓ Download PDF
                    </button>
                  </div>
                  <div className="ev-ml">Introduction</div>
                  <p className="ev-mp">{evaluation.model_answer.introduction}</p>
                  <div className="ev-ml">Body</div>
                  <ul className="ev-list" style={{ marginBottom:16 }}>
                    {bodyParas(evaluation.model_answer.body).map((p,i) => (
                      <li key={i} style={{ color:'#ccc', fontSize:'0.93rem', lineHeight:1.75, marginBottom:8 }}>{p}</li>
                    ))}
                  </ul>
                  <div className="ev-ml">Conclusion</div>
                  <p className="ev-mp" style={{ marginBottom:0 }}>{evaluation.model_answer.conclusion}</p>
                </div>
              </div>
            )}

            {/* HISTORIANS TAB */}
            {tab==="hist" && (
              <div className="ev-fade">
                <div className="ev-card">
                  <div className="ev-ct">Historians to Cite for This Topic</div>
                  {(Array.isArray(evaluation.historians_to_cite) ? evaluation.historians_to_cite : []).map((h,i) => (
                    <div key={i} className="ev-hist">
                      <div className="ev-hist-name">{typeof h === 'object' && h !== null ? (h as any).name : String(h)}</div>
                      {typeof h === 'object' && h !== null && (h as any).work && <div className="ev-hist-work">{(h as any).work}</div>}
                      <div className="ev-hist-arg">{typeof h === 'object' && h !== null ? (h as any).argument : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="ev-btn" style={{ marginTop:28 }}
              onClick={() => {
                const next = tab === "eval" ? "model" : "eval";
                setTab(next);
                setTimeout(() => tabsRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 50);
              }}>
              {tab === "eval" ? "View Model Answer →" : "← View Answer Evaluation"}
            </button>
            <button className="ev-btn" style={{ marginTop:12, background:"transparent", color:"#555", borderColor:"#2a2a2a" }}
              onClick={() => { setEvaluation(null); setFiles(undefined as any); setPreviews([]); setQuestion(""); setSubmittedQ(""); setExtractedText(""); setError(""); setStage("form"); }}>
              ← Evaluate Another Answer
            </button>
          </div>
        )}
      </div>
    </>
  );
}
