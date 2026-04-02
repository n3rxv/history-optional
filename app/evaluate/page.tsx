"use client";

import { useState, useRef } from "react";

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
  introduction: { what_was_written: string; analysis: string; suggestions: string[]; };
  body: { strengths: string[]; weaknesses: string[]; suggestions: string[]; };
  conclusion: { what_was_written: string; analysis: string; suggestions: string[]; };
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
  if (Array.isArray(body)) return body.filter(Boolean);
  return body.split(/\n\n+/).filter(Boolean);
}

async function downloadModelAnswerPDF(question: string, marks: number, evaluation: Evaluation) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const pageW = 210;
  const pageH = 297;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const BLUE  = [37, 99, 235] as [number, number, number];
  const BLACK = [17, 17, 17]  as [number, number, number];
  const GRAY  = [120, 120, 120] as [number, number, number];
  const LGRAY = [200, 200, 200] as [number, number, number];



  const drawFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.text("history-optional.vercel.app  ·  UPSC History Optional Evaluator", pageW / 2, pageH - 8, { align: "center" });
    doc.link(margin, pageH - 12, contentW, 6, { url: "https://history-optional.vercel.app" });
  };

  const checkPage = (needed: number) => {
    if (y + needed > pageH - margin - 8) {
      doc.addPage();
      drawFooter();
      y = margin;
    }
  };

  const writeLabel = (text: string) => {
    checkPage(8);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "bold");
    doc.text(text.toUpperCase(), margin, y);
    y += 3;
    doc.setDrawColor(...LGRAY);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
  };

  const writeBody = (text: string, size = 10, color: [number,number,number] = BLACK, bold = false) => {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, contentW) as string[];
    lines.forEach((line: string) => {
      checkPage(6);
      doc.text(line, margin, y);
      y += 5.5;
    });
    y += 2;
  };

  // ── Header ──
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pageW, 14, "F");
  // Footer on page 1
  drawFooter();
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("HISTORY-OPTIONAL.VERCEL.APP", margin, 9);
  doc.link(margin, 3, 80, 8, { url: "https://history-optional.vercel.app" });
  doc.setFont("helvetica", "normal");
  doc.text(`Model Answer  ·  ${marks}M Question  ·  UPSC Civil Services Mains`, pageW - margin, 9, { align: "right" });
  y = 22;

  // ── Question box ──
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin, y + 14);
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "bold");
  doc.text("QUESTION", margin + 3, y + 4);
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
  const qLines = doc.splitTextToSize(question, contentW - 4) as string[];
  qLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 3, y + 4 + (i + 1) * 5);
  });
  y += 6 + qLines.length * 5 + 8;

  // ── Score row ──
  const idealWC = marks === 10 ? "150 words" : marks === 15 ? "200 words" : "250 words";
  const boxes = [
    { label: "MARKS SCORED", val: `${evaluation.marks}/${evaluation.marks_out_of}` },
    { label: "IDEAL WORD COUNT", val: idealWC },
  ];
  boxes.forEach((b, i) => {
    const bx = margin + i * 65;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(bx, y, 60, 16, 2, 2, "F");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "bold");
    doc.text(b.label, bx + 4, y + 5);
    doc.setFontSize(i === 1 ? 11 : 14);
    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "bold");
    doc.text(b.val, bx + 4, y + 13);
  });
  y += 24;

  // ── Introduction ──
  writeLabel("Introduction");
  writeBody(evaluation.model_answer.introduction);

  // ── Body ──
  writeLabel("Body");
  const paras = bodyParas(evaluation.model_answer.body);
  paras.forEach((p, i) => {
    checkPage(10);
    // bullet marker
    doc.setFillColor(...BLUE);
    doc.circle(margin + 1.5, y - 1, 1.2, "F");
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "normal");
    const pLines = doc.splitTextToSize(p, contentW - 6) as string[];
    pLines.forEach((line: string) => {
      checkPage(6);
      doc.text(line, margin + 5, y);
      y += 5.5;
    });
    if (i < paras.length - 1) y += 3;
  });
  y += 4;

  // ── Conclusion ──
  writeLabel("Conclusion");
  writeBody(evaluation.model_answer.conclusion);

  // ── Historians ──
  writeLabel("Historians to Cite");
  evaluation.historians_to_cite.forEach((h) => {
    checkPage(14);
    writeBody(h.name, 10, BLUE, true);
    y -= 2;
    writeBody(h.argument, 9.5, [60, 60, 60]);
    doc.setDrawColor(...LGRAY);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
  });

  // ── Footer on last page ──
  drawFooter();

  doc.save(`model-answer-${marks}M.pdf`);
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
  const fileRef = useRef<HTMLInputElement>(null);

const handleOcr = async () => {
    if (!files || files.length === 0 || !question.trim()) { setError("Please upload at least one image and enter the question."); return; }
    setError(""); setOcrLoading(true);
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    try {
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR failed");
      setExtractedText(data.text);
      setStage("ocr");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OCR failed. Please try again.");
    } finally { setOcrLoading(false); }
  };

  const submit = async () => {
    setError(""); setLoading(true); setEvaluation(null);
    const fd = new FormData();
    fd.append("question", question); fd.append("marks", marks.toString());
    fd.append("extractedText", extractedText);
    if (files) files.forEach(f => fd.append("files", f));
    try {
      const res  = await fetch("/api/evaluate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      setSubmittedQ(question);
      setSubmittedM(marks);
      setEvaluation(data);
      setStage("result");
      setTab("eval");
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
          resize:vertical; line-height:1.75; transition:border-color 0.2s; outline:none; }
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
        .ev-tabs { display:flex; border-bottom:1px solid #2a2a2a; margin-bottom:28px; gap:4px; }
        .ev-tab { padding:11px 24px; cursor:pointer; font-size:0.66rem; letter-spacing:0.22em;
          text-transform:uppercase; font-family:var(--font-mono); color:#666;
          border-bottom:2px solid transparent; transition:all 0.15s;
          background:none; border-top:none; border-left:none; border-right:none; margin-bottom:-1px; }
        .ev-tab.active { color:#3b82f6; border-bottom-color:#3b82f6; }
        .ev-tab:hover:not(.active) { color:#aaa; }
        .ev-card { background:#1a1a1a; border:1px solid #2e2e2e; border-radius:6px; padding:26px 28px; margin-bottom:12px; }
        .ev-card-gold { border-color:rgba(234,179,8,0.22); }
        .ev-card-green { border-color:rgba(74,222,128,0.14); }
        .ev-ct { font-family:var(--font-mono); font-size:0.6rem; letter-spacing:0.32em;
          text-transform:uppercase; color:#1d4ed8; margin-bottom:20px; }
        .ev-sl { font-family:var(--font-mono); font-size:0.58rem; letter-spacing:0.2em;
          text-transform:uppercase; color:#555; margin-top:18px; margin-bottom:10px; }
        .ev-sl.g { color:rgba(74,222,128,0.5); }
        .ev-sl.r { color:rgba(248,113,113,0.45); }
        .ev-wrote { background:#111; border-left:3px solid #333;
          padding:14px 18px; border-radius:0 4px 4px 0; margin-bottom:16px; }
        .ev-wrote-lbl { font-family:var(--font-mono); font-size:0.55rem;
          letter-spacing:0.2em; text-transform:uppercase; color:#444; margin-bottom:8px; }
        .ev-wrote-txt { font-size:0.9rem; color:#999; line-height:1.75; }
        ul.ev-list { list-style:none; padding:0; margin:0; }
        ul.ev-list li { padding:9px 0 9px 16px; border-left:2px solid #2e2e2e;
          font-size:0.92rem; line-height:1.72; color:#ccc; margin-bottom:6px; }
        ul.ev-list li.g { border-left-color:rgba(74,222,128,0.4); color:#86efac; }
        ul.ev-list li.r { border-left-color:rgba(248,113,113,0.35); color:#fca5a5; }
        .ev-qbox { background:#0d1b3e; border:1px solid rgba(59,130,246,0.2);
          border-left:3px solid #3b82f6; border-radius:0 6px 6px 0;
          padding:16px 20px; margin-bottom:28px; }
        .ev-qlabel { font-family:var(--font-mono); font-size:0.58rem; letter-spacing:0.22em;
          text-transform:uppercase; color:#1d4ed8; margin-bottom:8px; }
        .ev-qtext { font-size:0.95rem; color:#e2e8f0; line-height:1.75; }
        .ev-ml { font-family:var(--font-mono); font-size:0.58rem; letter-spacing:0.25em;
          text-transform:uppercase; color:rgba(74,222,128,0.45);
          display:flex; align-items:center; gap:12px; margin:22px 0 12px; }
        .ev-ml::after { content:''; flex:1; height:1px; background:rgba(74,222,128,0.08); }
        .ev-ml:first-child { margin-top:0; }
        .ev-mp { font-size:0.95rem; line-height:1.9; color:#d4d4d4; margin-bottom:16px; font-family:var(--font-body); }
        .ev-hist { padding:20px 0; border-bottom:1px solid #222; }
        .ev-hist:last-child { border-bottom:none; padding-bottom:0; }
        .ev-hist-name { font-family:var(--font-display); font-size:1.05rem; font-weight:700; color:#3b82f6; margin-bottom:4px; }
        .ev-hist-work { font-family:var(--font-mono); font-size:0.72rem; color:#666; margin-bottom:8px; }
        .ev-hist-arg { font-size:0.92rem; color:#bbb; line-height:1.72; }
        .ev-spinner { width:38px; height:38px; border:2px solid #222;
          border-top-color:#3b82f6; border-radius:50%; animation:ev-spin 0.9s linear infinite; }
        @keyframes ev-spin { to { transform:rotate(360deg); } }
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
              style={{ minHeight:320, marginBottom:20 }}
              value={extractedText}
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
                  onChange={e => setFiles(Array.from(e.target.files || []))} />
                {files && files.length > 0 ? (
                  <>
                    <div style={{ fontSize:"2rem", marginBottom:10 }}>🖼️</div>
                    <div style={{ color:"#3b82f6", fontFamily:"var(--font-mono)", fontSize:"0.85rem" }}>{files.length} image{files.length > 1 ? "s" : ""} selected</div>
                    <div style={{ color:"#555", fontSize:"0.78rem", marginTop:6 }}>Click to change</div>
                  </>
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
            <button className="ev-btn" onClick={handleOcr} disabled={ocrLoading}>{ocrLoading ? "Reading handwriting…" : "Evaluate Answer →"}</button>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"90px 0", gap:22 }}>
            <div className="ev-spinner" />
            <div style={{ color:"#555", fontSize:"0.7rem", fontFamily:"var(--font-mono)", letterSpacing:"0.22em", textTransform:"uppercase" }}>Reading your answer…</div>
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
            <div className="ev-tabs">
              {(["eval","model","hist"] as const).map(t => (
                <button key={t} className={`ev-tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>
                  {t==="eval"?"Evaluation":t==="model"?"Model Answer":"Historians"}
                </button>
              ))}
            </div>

            {/* EVALUATION TAB */}
            {tab==="eval" && (
              <div className="ev-fade">
                <div className="ev-card">
                  <div className="ev-ct">Demand of the Question</div>
                  <ul className="ev-list">{evaluation.demand_of_question.map((d,i) => <li key={i}>{d}</li>)}</ul>
                </div>
                <div className="ev-card">
                  <div className="ev-ct">Introduction</div>
                  <div className="ev-wrote">
                    <div className="ev-wrote-lbl">What you wrote</div>
                    <div className="ev-wrote-txt">{evaluation.introduction.what_was_written}</div>
                  </div>
                  <div style={{ fontSize:"0.95rem", color:"#ccc", lineHeight:1.8, marginBottom:14 }}>{evaluation.introduction.analysis}</div>
                  {evaluation.introduction.suggestions.length > 0 && (<>
                    <div className="ev-sl">Suggestions</div>
                    <ul className="ev-list">{evaluation.introduction.suggestions.map((s,i) => <li key={i}>{s}</li>)}</ul>
                  </>)}
                </div>
                <div className="ev-card">
                  <div className="ev-ct">Body</div>
                  <div className="ev-sl g" style={{ marginTop:0 }}>Strengths</div>
                  <ul className="ev-list" style={{ marginBottom:16 }}>{evaluation.body.strengths.map((s,i) => <li key={i} className="g">{s}</li>)}</ul>
                  <div className="ev-sl r">Weaknesses</div>
                  <ul className="ev-list" style={{ marginBottom:16 }}>{evaluation.body.weaknesses.map((w,i) => <li key={i} className="r">{w}</li>)}</ul>
                  <div className="ev-sl">Suggestions</div>
                  <ul className="ev-list">{evaluation.body.suggestions.map((s,i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div className="ev-card">
                  <div className="ev-ct">Conclusion</div>
                  <div className="ev-wrote">
                    <div className="ev-wrote-lbl">What you wrote</div>
                    <div className="ev-wrote-txt">{evaluation.conclusion.what_was_written}</div>
                  </div>
                  <div style={{ fontSize:"0.95rem", color:"#ccc", lineHeight:1.8, marginBottom:14 }}>{evaluation.conclusion.analysis}</div>
                  {evaluation.conclusion.suggestions.length > 0 && (<>
                    <div className="ev-sl">Suggestions</div>
                    <ul className="ev-list">{evaluation.conclusion.suggestions.map((s,i) => <li key={i}>{s}</li>)}</ul>
                  </>)}
                </div>
                <div className="ev-card ev-card-gold">
                  <div className="ev-ct">Overall Feedback</div>
                  <p style={{ fontSize:"0.95rem", lineHeight:1.85, color:"#d4d4d4" }}>{evaluation.overall_feedback}</p>
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
                  {evaluation.historians_to_cite.map((h,i) => (
                    <div key={i} className="ev-hist">
                      <div className="ev-hist-name">{h.name}</div>
                      {h.work && <div className="ev-hist-work">{h.work}</div>}
                      <div className="ev-hist-arg">{h.argument}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="ev-btn" style={{ marginTop:28 }}
              onClick={() => { setEvaluation(null); setFiles([]); setQuestion(""); setSubmittedQ(""); setExtractedText(""); setError(""); setStage("form"); }}>
              ← Evaluate Another Answer
            </button>
          </div>
        )}
      </div>
    </>
  );
}
