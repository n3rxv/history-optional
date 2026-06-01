"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

interface PaperQuestion { id: string; marks: number; text: string; }

interface PDFTestEvaluatorProps {
  isPremium: boolean;
  onPaywall: () => void;
  token: string | null;
  paperQuestions?: PaperQuestion[];
  variant?: "evaluate" | "test";
}

export default function PDFTestEvaluator({
  isPremium, onPaywall, token, paperQuestions, variant = "evaluate",
}: PDFTestEvaluatorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState<File | null>(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<any>(null);
  const [error, setError]       = useState<string | null>(null);

  function handleFile(f: File) {
    if (!f.type.includes("pdf")) { setError("Please upload a PDF file."); return; }
    setFile(f); setError(null);
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }
  async function handleEvaluate() {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("pdf", file);
      if (paperQuestions) fd.append("questions", JSON.stringify(paperQuestions));
      const res = await fetch("/api/pdf-evaluate", {
        method: "POST", headers: { "x-user-token": token ?? "" }, body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Evaluation failed");
      setResult(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  const mono: React.CSSProperties = {
    fontFamily: "var(--font-mono)", letterSpacing: "0.18em",
    textTransform: "uppercase" as const, fontSize: "0.53rem",
  };
  const card: React.CSSProperties = {
    border: "1px solid #181818", borderRadius: 10,
    padding: "28px 26px 24px", background: "#0c0c0c",
  };

  /* ── PAYWALL ──────────────────────────────────────────── */
  if (!isPremium) return (
    <div style={card}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ ...mono, color:"#555" }}>AI Full Paper Evaluation</span>
        <span style={{ ...mono, fontSize:"0.42rem", color:"#8a7020", background:"#110e00",
          border:"1px solid #281e00", borderRadius:3, padding:"2px 7px", letterSpacing:"0.1em" }}>
          PREMIUM
        </span>
      </div>

      <p style={{ fontSize:"0.84rem", color:"#383838", lineHeight:1.7, margin:"0 0 6px", maxWidth:500 }}>
        Upload your complete answer script as a PDF. AI reads every page, identifies each answer,
        and gives marks&nbsp;+&nbsp;detailed feedback for the entire paper — all at once.
      </p>
      <p style={{ ...mono, color:"#252525", fontSize:"0.58rem", margin:"0 0 20px" }}>
        Works with: handwritten scripts&nbsp;·&nbsp;typed answers&nbsp;·&nbsp;self-contained PDFs
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:22 }}>
        {[
          { n:"01", t:"Write answers",    s:"On paper or digitally" },
          { n:"02", t:"Scan to PDF",      s:"All pages in one file" },
          { n:"03", t:"Upload & evaluate",s:"AI scores instantly"   },
        ].map(x => (
          <div key={x.n} style={{ padding:"11px 13px", background:"#090909", borderRadius:6, border:"1px solid #111" }}>
            <span style={{ ...mono, color:"#1e1e1e", display:"block", marginBottom:4 }}>{x.n}</span>
            <span style={{ fontSize:"0.68rem", color:"#3a3a3a", fontFamily:"var(--font-mono)", display:"block", marginBottom:2 }}>{x.t}</span>
            <span style={{ fontSize:"0.6rem", color:"#252525" }}>{x.s}</span>
          </div>
        ))}
      </div>

      <button onClick={onPaywall} style={{
        padding:"9px 22px", background:"transparent",
        border:"1px solid #222", borderRadius:5, color:"#444",
        fontFamily:"var(--font-mono)", fontSize:"0.56rem",
        letterSpacing:"0.14em", textTransform:"uppercase", cursor:"pointer",
      }}>🔒 &nbsp;Unlock with Premium →</button>
    </div>
  );

  /* ── RESULT ──────────────────────────────────────────── */
  if (result) {
    const total  = result.totalScore ?? result.total_score;
    const outOf  = result.totalMarks ?? result.total_marks;
    const qs: any[] = result.questions ?? result.results ?? [];
    return (
      <div style={card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <span style={{ ...mono, color:"#444" }}>Evaluation Complete</span>
            {total !== undefined && (
              <div style={{ display:"flex", alignItems:"flex-end", gap:5, marginTop:8 }}>
                <span style={{ fontSize:"2.8rem", fontFamily:"var(--font-mono)", fontWeight:700, color:"#f0f0f0", lineHeight:1, letterSpacing:"-0.04em" }}>{total}</span>
                {outOf && <span style={{ fontSize:"0.9rem", color:"#333", fontFamily:"var(--font-mono)", marginBottom:4 }}>/ {outOf}</span>}
              </div>
            )}
          </div>
          <button onClick={() => { setResult(null); setFile(null); }} style={{
            ...mono, color:"#3a3a3a", background:"none",
            border:"1px solid #181818", borderRadius:4, padding:"6px 12px", cursor:"pointer",
          }}>↩ Evaluate Another</button>
        </div>
        <div style={{ borderTop:"1px solid #111", paddingTop:16 }}>
          {qs.map((q:any, i:number) => (
            <div key={i} style={{ marginBottom:8, padding:"13px 15px", background:"#090909", borderRadius:6, borderLeft:"2px solid #181818" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom: q.feedback ? 7 : 0 }}>
                <span style={{ ...mono, color:"#444" }}>{q.id ?? q.question_id ?? `Q${i+1}`}</span>
                <span style={{ ...mono, color:"#777", letterSpacing:"0.12em" }}>
                  {q.score ?? q.marks_awarded} / {q.marks ?? q.total_marks}
                </span>
              </div>
              {q.feedback && <p style={{ fontSize:"0.77rem", color:"#4a4a4a", lineHeight:1.65, margin:0 }}>{q.feedback}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── UPLOAD ──────────────────────────────────────────── */
  return (
    <div style={card}>
      {/* Title row */}
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8 }}>
        <span style={{ ...mono, color:"#777" }}>AI Full Paper Evaluation</span>
        <span style={{ ...mono, fontSize:"0.42rem", color:"#8a7020", background:"#110e00",
          border:"1px solid #281e00", borderRadius:3, padding:"2px 7px", letterSpacing:"0.1em" }}>PREMIUM</span>
      </div>

      {/* Description */}
      <p style={{ fontSize:"0.84rem", color:"#454545", lineHeight:1.7, margin:"0 0 6px", maxWidth:540 }}>
        Upload your complete answer script as a PDF. AI will read every page, identify your answers,
        and evaluate each question — marks and detailed feedback for the whole paper at once.
      </p>
      <p style={{ ...mono, color:"#2a2a2a", fontSize:"0.56rem", margin:"0 0 22px" }}>
        Works with: handwritten scripts&nbsp;·&nbsp;typed answers&nbsp;·&nbsp;self-contained PDFs (question + answer on same page)
      </p>

      {/* Steps */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:20 }}>
        {[
          { n:"01", t:"Write your answers",   s:"On paper or digitally" },
          { n:"02", t:"Scan to a single PDF", s:"All pages in one file" },
          { n:"03", t:"Upload & evaluate",    s:"AI scores every question" },
        ].map(x => (
          <div key={x.n} style={{ padding:"12px 14px", background:"#090909", borderRadius:6, border:"1px solid #111" }}>
            <span style={{ ...mono, color:"#1e1e1e", display:"block", marginBottom:5 }}>{x.n}</span>
            <span style={{ fontSize:"0.7rem", color:"#555", fontFamily:"var(--font-mono)", display:"block", marginBottom:2 }}>{x.t}</span>
            <span style={{ fontSize:"0.6rem", color:"#2e2e2e" }}>{x.s}</span>
          </div>
        ))}
      </div>

      {/* Formats note */}
      <div style={{ marginBottom:18, padding:"10px 13px", background:"#090909", borderRadius:5, border:"1px solid #111" }}>
        <span style={{ ...mono, color:"#252525", display:"block", marginBottom:3 }}>What to upload</span>
        <span style={{ fontSize:"0.67rem", color:"#2e2e2e", fontFamily:"var(--font-mono)" }}>
          Your handwritten/typed answer script · Does not need to include the question paper ·
          If you wrote the question at the top of each answer, that works too
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border:`1px dashed ${dragging ? "#555" : file ? "#1d3a1d" : "#1c1c1c"}`,
          borderRadius:6, padding:"30px 20px", textAlign:"center", cursor:"pointer",
          background: dragging ? "#111" : file ? "#090f09" : "transparent",
          transition:"all 0.15s",
          marginBottom: error ? 10 : 16,
        }}
      >
        <input ref={inputRef} type="file" accept="application/pdf" style={{ display:"none" }}
          onChange={(e:ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(f) handleFile(f); }} />
        <div style={{ fontSize:"1.6rem", marginBottom:10, opacity: file ? 1 : 0.4 }}>📄</div>
        {file ? (
          <>
            <div style={{ fontSize:"0.74rem", color:"#777", fontFamily:"var(--font-mono)", marginBottom:3 }}>{file.name}</div>
            <div style={{ fontSize:"0.57rem", color:"#333", fontFamily:"var(--font-mono)" }}>
              {(file.size/1024/1024).toFixed(1)} MB · Click to change file
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize:"0.74rem", color:"#383838", fontFamily:"var(--font-mono)", marginBottom:4 }}>
              Drop your answer PDF here
            </div>
            <div style={{ fontSize:"0.58rem", color:"#242424", fontFamily:"var(--font-mono)" }}>
              or click to browse
            </div>
          </>
        )}
      </div>

      {error && (
        <div style={{ fontSize:"0.63rem", color:"#8a3030", fontFamily:"var(--font-mono)",
          marginBottom:12, padding:"8px 12px", background:"#0e0707", borderRadius:4 }}>
          {error}
        </div>
      )}

      {file && (
        <button onClick={handleEvaluate} disabled={loading} style={{
          width:"100%", padding:"12px 0",
          background: loading ? "#0e0e0e" : "#ebebeb",
          color: loading ? "#2e2e2e" : "#080808",
          border: loading ? "1px solid #181818" : "none",
          borderRadius:5, fontFamily:"var(--font-mono)",
          fontSize:"0.58rem", letterSpacing:"0.2em",
          textTransform:"uppercase", cursor: loading ? "not-allowed" : "pointer",
          transition:"all 0.15s",
        }}>
          {loading ? "Evaluating — this may take a minute…" : "Evaluate Full Paper →"}
        </button>
      )}
    </div>
  );
}
