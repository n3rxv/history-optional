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

  const BLUE = "var(--accent, #4f8ef7)";

  const mono: React.CSSProperties = {
    fontFamily: "var(--font-mono)", letterSpacing: "0.18em",
    textTransform: "uppercase" as const, fontSize: "0.53rem",
  };

  /* ── PAYWALL ──────────────────────────────────────────── */
  if (!isPremium) return (
    <div style={{
      border: `1px solid ${BLUE}33`,
      borderRadius: 10,
      background: "#111",
      overflow: "hidden",
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${BLUE}18 0%, transparent 60%)`,
        borderBottom: `1px solid ${BLUE}22`,
        padding: "22px 24px 18px",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 7,
              background: `${BLUE}22`, border: `1px solid ${BLUE}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem",
            }}>📄</div>
            <div>
              <div style={{ ...mono, color:"#fff", fontSize:"0.56rem" }}>AI Full Paper Evaluation</div>
              <div style={{ fontSize:"0.6rem", color: BLUE, fontFamily:"var(--font-mono)", marginTop:2 }}>Premium Feature</div>
            </div>
          </div>
          <div style={{
            ...mono, fontSize:"0.42rem", color: BLUE,
            background: `${BLUE}15`, border: `1px solid ${BLUE}33`,
            borderRadius: 4, padding: "3px 9px",
          }}>PREMIUM</div>
        </div>
        <p style={{ fontSize:"0.86rem", color:"#ccc", lineHeight:1.7, margin:"0 0 6px" }}>
          Upload your complete answer script as a PDF. AI reads every page, identifies each answer,
          and gives marks + detailed feedback for the entire paper — all at once.
        </p>
        <p style={{ ...mono, color:"#555", fontSize:"0.54rem", margin:0 }}>
          Handwritten scripts · Typed answers · Self-contained PDFs
        </p>
      </div>

      <div style={{ padding: "18px 24px 22px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:20 }}>
          {[
            { n:"01", t:"Write answers",     s:"On paper or digitally" },
            { n:"02", t:"Scan to PDF",       s:"All pages in one file" },
            { n:"03", t:"Upload & evaluate", s:"AI scores instantly"   },
          ].map(x => (
            <div key={x.n} style={{
              padding:"12px 13px", background:"#161616",
              borderRadius:6, border:`1px solid ${BLUE}1a`,
            }}>
              <span style={{ ...mono, color: BLUE, opacity:0.5, display:"block", marginBottom:5 }}>{x.n}</span>
              <span style={{ fontSize:"0.7rem", color:"#ddd", fontFamily:"var(--font-mono)", display:"block", marginBottom:2 }}>{x.t}</span>
              <span style={{ fontSize:"0.62rem", color:"#666" }}>{x.s}</span>
            </div>
          ))}
        </div>

        <button onClick={onPaywall} style={{
          width: "100%", padding:"11px 0", background: `${BLUE}18`,
          border: `1px solid ${BLUE}44`, borderRadius:6, color:"#fff",
          fontFamily:"var(--font-mono)", fontSize:"0.58rem",
          letterSpacing:"0.14em", textTransform:"uppercase", cursor:"pointer",
        }}>🔒 &nbsp;Unlock with Premium →</button>
      </div>
    </div>
  );

  /* ── RESULT ──────────────────────────────────────────── */
  if (result) {
    const total  = result.totalScore ?? result.total_score;
    const outOf  = result.totalMarks ?? result.total_marks;
    const qs: any[] = result.questions ?? result.results ?? [];
    return (
      <div style={{ border:`1px solid ${BLUE}33`, borderRadius:10, overflow:"hidden", background:"#111" }}>
        <div style={{ background:`linear-gradient(135deg,${BLUE}18 0%,transparent 60%)`, borderBottom:`1px solid ${BLUE}22`, padding:"20px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <span style={{ ...mono, color:"#fff" }}>Evaluation Complete</span>
              {total !== undefined && (
                <div style={{ display:"flex", alignItems:"flex-end", gap:5, marginTop:8 }}>
                  <span style={{ fontSize:"2.8rem", fontFamily:"var(--font-mono)", fontWeight:700, color:"#fff", lineHeight:1, letterSpacing:"-0.04em" }}>{total}</span>
                  {outOf && <span style={{ fontSize:"0.9rem", color:"#666", fontFamily:"var(--font-mono)", marginBottom:4 }}>/ {outOf}</span>}
                </div>
              )}
            </div>
            <button onClick={() => { setResult(null); setFile(null); }} style={{
              ...mono, color:"#888", background:"none",
              border:"1px solid #2a2a2a", borderRadius:4, padding:"7px 13px", cursor:"pointer",
            }}>↩ Evaluate Another</button>
          </div>
        </div>
        <div style={{ padding:"16px 24px" }}>
          {qs.map((q:any, i:number) => (
            <div key={i} style={{ marginBottom:8, padding:"13px 15px", background:"#161616", borderRadius:6, borderLeft:`2px solid ${BLUE}66` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom: q.feedback ? 7 : 0 }}>
                <span style={{ ...mono, color:"#aaa" }}>{q.id ?? q.question_id ?? `Q${i+1}`}</span>
                <span style={{ ...mono, color: BLUE, letterSpacing:"0.12em" }}>{q.score ?? q.marks_awarded} / {q.marks ?? q.total_marks}</span>
              </div>
              {q.feedback && <p style={{ fontSize:"0.78rem", color:"#888", lineHeight:1.65, margin:0 }}>{q.feedback}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── UPLOAD ──────────────────────────────────────────── */
  return (
    <div style={{
      border: `1px solid ${BLUE}33`,
      borderRadius: 10,
      overflow: "hidden",
      background: "#111",
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${BLUE}18 0%, transparent 60%)`,
        borderBottom: `1px solid ${BLUE}22`,
        padding: "22px 24px 20px",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: `${BLUE}20`, border: `1px solid ${BLUE}44`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem",
            }}>📄</div>
            <div>
              <div style={{ ...mono, color:"#fff", fontSize:"0.56rem" }}>AI Full Paper Evaluation</div>
              <div style={{ fontSize:"0.6rem", color: BLUE, fontFamily:"var(--font-mono)", marginTop:2 }}>
                Upload · Evaluate · Get Feedback
              </div>
            </div>
          </div>
          <div style={{
            ...mono, fontSize:"0.42rem", color: BLUE,
            background: `${BLUE}15`, border: `1px solid ${BLUE}44`,
            borderRadius: 4, padding: "3px 9px",
          }}>PREMIUM</div>
        </div>
        <p style={{ fontSize:"0.85rem", color:"#ccc", lineHeight:1.7, margin:"0 0 5px" }}>
          Upload your complete answer script as a PDF. AI reads every page, identifies your answers,
          and evaluates each question — marks and feedback for the whole paper at once.
        </p>
        <p style={{ ...mono, color:"#555", fontSize:"0.54rem", margin:0 }}>
          Handwritten scripts · Typed answers · Self-contained PDFs (question + answer on same page)
        </p>
      </div>

      <div style={{ padding:"20px 24px 22px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
          {[
            { n:"01", t:"Write your answers",   s:"On paper or digitally" },
            { n:"02", t:"Scan to a single PDF", s:"All pages in one file" },
            { n:"03", t:"Upload & evaluate",    s:"AI scores every question" },
          ].map(x => (
            <div key={x.n} style={{
              padding:"12px 13px", background:"#161616",
              borderRadius:6, border:`1px solid ${BLUE}1a`,
            }}>
              <span style={{ ...mono, color: BLUE, opacity:0.6, display:"block", marginBottom:5 }}>{x.n}</span>
              <span style={{ fontSize:"0.7rem", color:"#ddd", fontFamily:"var(--font-mono)", display:"block", marginBottom:2 }}>{x.t}</span>
              <span style={{ fontSize:"0.62rem", color:"#666" }}>{x.s}</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:16, padding:"10px 13px", background:"#161616", borderRadius:5, border:`1px solid ${BLUE}1a` }}>
          <span style={{ ...mono, color:"#555", display:"block", marginBottom:3 }}>What to upload</span>
          <span style={{ fontSize:"0.67rem", color:"#666", fontFamily:"var(--font-mono)" }}>
            Your answer script · No need to include the question paper ·
            Self-contained format (question written at top of answer) works too
          </span>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1px dashed ${dragging ? BLUE : file ? BLUE+"88" : "#2a2a2a"}`,
            borderRadius:6, padding:"28px 20px", textAlign:"center", cursor:"pointer",
            background: dragging ? `${BLUE}10` : file ? `${BLUE}08` : "transparent",
            transition:"all 0.15s",
            marginBottom: error ? 10 : 16,
          }}
        >
          <input ref={inputRef} type="file" accept="application/pdf" style={{ display:"none" }}
            onChange={(e:ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(f) handleFile(f); }} />
          <div style={{ fontSize:"1.6rem", marginBottom:10 }}>📄</div>
          {file ? (
            <>
              <div style={{ fontSize:"0.75rem", color:"#ddd", fontFamily:"var(--font-mono)", marginBottom:3 }}>{file.name}</div>
              <div style={{ fontSize:"0.58rem", color:"#666", fontFamily:"var(--font-mono)" }}>
                {(file.size/1024/1024).toFixed(1)} MB · Click to change file
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:"0.75rem", color:"#aaa", fontFamily:"var(--font-mono)", marginBottom:4 }}>
                Drop your answer PDF here
              </div>
              <div style={{ fontSize:"0.58rem", color:"#555", fontFamily:"var(--font-mono)" }}>
                or click to browse
              </div>
            </>
          )}
        </div>

        {error && (
          <div style={{ fontSize:"0.63rem", color:"#f47070", fontFamily:"var(--font-mono)",
            marginBottom:12, padding:"8px 12px", background:"#1a0808", borderRadius:4, border:"1px solid #3a1515" }}>
            {error}
          </div>
        )}

        {file && (
          <button onClick={handleEvaluate} disabled={loading} style={{
            width:"100%", padding:"12px 0",
            background: loading ? "#161616" : BLUE,
            color: "#fff",
            border: loading ? "1px solid #2a2a2a" : "none",
            borderRadius:6, fontFamily:"var(--font-mono)",
            fontSize:"0.58rem", letterSpacing:"0.2em",
            textTransform:"uppercase", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
            transition:"all 0.15s",
          }}>
            {loading ? "Evaluating — this may take a minute…" : "Evaluate Full Paper →"}
          </button>
        )}
      </div>
    </div>
  );
}
