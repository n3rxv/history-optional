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
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: "26px 24px 24px",
    background: "#111",
  };

  /* ── PAYWALL ──────────────────────────────────────────── */
  if (!isPremium) return (
    <div style={card}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <span style={{ ...mono, color:"#888" }}>AI Full Paper Evaluation</span>
        <span style={{ ...mono, fontSize:"0.42rem", color:"#c8a030", background:"#1c1500",
          border:"1px solid #3a2800", borderRadius:3, padding:"2px 7px", letterSpacing:"0.1em" }}>
          PREMIUM
        </span>
      </div>

      <p style={{ fontSize:"0.85rem", color:"#666", lineHeight:1.7, margin:"0 0 6px", maxWidth:500 }}>
        Upload your complete answer script as a PDF. AI reads every page, identifies each answer,
        and gives marks + detailed feedback for the entire paper — all at once.
      </p>
      <p style={{ ...mono, color:"#444", fontSize:"0.56rem", margin:"0 0 22px" }}>
        Works with: handwritten scripts · typed answers · self-contained PDFs
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:22 }}>
        {[
          { n:"01", t:"Write answers",     s:"On paper or digitally" },
          { n:"02", t:"Scan to PDF",       s:"All pages in one file" },
          { n:"03", t:"Upload & evaluate", s:"AI scores instantly"   },
        ].map(x => (
          <div key={x.n} style={{ padding:"11px 13px", background:"#161616", borderRadius:6, border:"1px solid #222" }}>
            <span style={{ ...mono, color:"#333", display:"block", marginBottom:4 }}>{x.n}</span>
            <span style={{ fontSize:"0.7rem", color:"#666", fontFamily:"var(--font-mono)", display:"block", marginBottom:2 }}>{x.t}</span>
            <span style={{ fontSize:"0.62rem", color:"#444" }}>{x.s}</span>
          </div>
        ))}
      </div>

      <button onClick={onPaywall} style={{
        padding:"9px 22px", background:"transparent",
        border:"1px solid #2a2a2a", borderRadius:5, color:"#666",
        fontFamily:"var(--font-mono)", fontSize:"0.56rem",
        letterSpacing:"0.14em", textTransform:"uppercase", cursor:"pointer",
      }}>🔒  Unlock with Premium →</button>
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
            <span style={{ ...mono, color:"#666" }}>Evaluation Complete</span>
            {total !== undefined && (
              <div style={{ display:"flex", alignItems:"flex-end", gap:5, marginTop:8 }}>
                <span style={{ fontSize:"2.8rem", fontFamily:"var(--font-mono)", fontWeight:700, color:"#f0f0f0", lineHeight:1, letterSpacing:"-0.04em" }}>{total}</span>
                {outOf && <span style={{ fontSize:"0.9rem", color:"#555", fontFamily:"var(--font-mono)", marginBottom:4 }}>/ {outOf}</span>}
              </div>
            )}
          </div>
          <button onClick={() => { setResult(null); setFile(null); }} style={{
            ...mono, color:"#555", background:"none",
            border:"1px solid #2a2a2a", borderRadius:4, padding:"6px 12px", cursor:"pointer",
          }}>↩ Evaluate Another</button>
        </div>
        <div style={{ borderTop:"1px solid #1e1e1e", paddingTop:16 }}>
          {qs.map((q:any, i:number) => (
            <div key={i} style={{ marginBottom:8, padding:"13px 15px", background:"#161616", borderRadius:6, borderLeft:"2px solid #2a2a2a" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom: q.feedback ? 7 : 0 }}>
                <span style={{ ...mono, color:"#666" }}>{q.id ?? q.question_id ?? `Q${i+1}`}</span>
                <span style={{ ...mono, color:"#888", letterSpacing:"0.12em" }}>
                  {q.score ?? q.marks_awarded} / {q.marks ?? q.total_marks}
                </span>
              </div>
              {q.feedback && <p style={{ fontSize:"0.78rem", color:"#666", lineHeight:1.65, margin:0 }}>{q.feedback}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── UPLOAD ──────────────────────────────────────────── */
  return (
    <div style={card}>
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10 }}>
        <span style={{ ...mono, color:"#999" }}>AI Full Paper Evaluation</span>
        <span style={{ ...mono, fontSize:"0.42rem", color:"#c8a030", background:"#1c1500",
          border:"1px solid #3a2800", borderRadius:3, padding:"2px 7px", letterSpacing:"0.1em" }}>PREMIUM</span>
      </div>

      <p style={{ fontSize:"0.85rem", color:"#777", lineHeight:1.7, margin:"0 0 6px", maxWidth:540 }}>
        Upload your complete answer script as a PDF. AI will read every page, identify your answers,
        and evaluate each question — marks and detailed feedback for the whole paper at once.
      </p>
      <p style={{ ...mono, color:"#444", fontSize:"0.55rem", margin:"0 0 22px" }}>
        Works with: handwritten scripts · typed answers · self-contained PDFs (question + answer on same page)
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:18 }}>
        {[
          { n:"01", t:"Write your answers",   s:"On paper or digitally" },
          { n:"02", t:"Scan to a single PDF", s:"All pages in one file" },
          { n:"03", t:"Upload & evaluate",    s:"AI scores every question" },
        ].map(x => (
          <div key={x.n} style={{ padding:"12px 14px", background:"#161616", borderRadius:6, border:"1px solid #222" }}>
            <span style={{ ...mono, color:"#333", display:"block", marginBottom:5 }}>{x.n}</span>
            <span style={{ fontSize:"0.7rem", color:"#777", fontFamily:"var(--font-mono)", display:"block", marginBottom:2 }}>{x.t}</span>
            <span style={{ fontSize:"0.62rem", color:"#555" }}>{x.s}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:18, padding:"10px 13px", background:"#161616", borderRadius:5, border:"1px solid #222" }}>
        <span style={{ ...mono, color:"#444", display:"block", marginBottom:3 }}>What to upload</span>
        <span style={{ fontSize:"0.67rem", color:"#555", fontFamily:"var(--font-mono)" }}>
          Your handwritten/typed answer script · Does not need to include the question paper ·
          If you wrote the question at the top of each answer, that works too
        </span>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border:`1px dashed ${dragging ? "#666" : file ? "#2a4a2a" : "#2a2a2a"}`,
          borderRadius:6, padding:"30px 20px", textAlign:"center", cursor:"pointer",
          background: dragging ? "#161616" : file ? "#0d150d" : "transparent",
          transition:"all 0.15s",
          marginBottom: error ? 10 : 16,
        }}
      >
        <input ref={inputRef} type="file" accept="application/pdf" style={{ display:"none" }}
          onChange={(e:ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(f) handleFile(f); }} />
        <div style={{ fontSize:"1.6rem", marginBottom:10, opacity: file ? 1 : 0.6 }}>📄</div>
        {file ? (
          <>
            <div style={{ fontSize:"0.75rem", color:"#888", fontFamily:"var(--font-mono)", marginBottom:3 }}>{file.name}</div>
            <div style={{ fontSize:"0.58rem", color:"#555", fontFamily:"var(--font-mono)" }}>
              {(file.size/1024/1024).toFixed(1)} MB · Click to change file
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize:"0.75rem", color:"#666", fontFamily:"var(--font-mono)", marginBottom:4 }}>
              Drop your answer PDF here
            </div>
            <div style={{ fontSize:"0.58rem", color:"#444", fontFamily:"var(--font-mono)" }}>
              or click to browse
            </div>
          </>
        )}
      </div>

      {error && (
        <div style={{ fontSize:"0.63rem", color:"#c0404a", fontFamily:"var(--font-mono)",
          marginBottom:12, padding:"8px 12px", background:"#180808", borderRadius:4, border:"1px solid #2a1010" }}>
          {error}
        </div>
      )}

      {file && (
        <button onClick={handleEvaluate} disabled={loading} style={{
          width:"100%", padding:"12px 0",
          background: loading ? "#161616" : "#e8e8e8",
          color: loading ? "#444" : "#0a0a0a",
          border: loading ? "1px solid #2a2a2a" : "none",
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
