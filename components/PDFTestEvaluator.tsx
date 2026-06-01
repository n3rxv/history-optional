"use client";
 
import { useState, useRef } from "react";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
interface SectionMark { awarded: number; out_of: number; reasoning: string; }
 
interface Evaluation {
  marks: number;
  marks_out_of: number;
  overall_feedback: string;
  body?: { strengths: string[]; weaknesses: string[]; suggestions: string[] };
  model_answer?: { introduction: string; body: string | string[]; conclusion: string };
  historians_to_cite?: { name: string; work?: string; argument: string }[];
  section_marks?: { introduction: SectionMark; body: SectionMark; conclusion: SectionMark; presentation: SectionMark };
}
 
interface QuestionResult {
  questionNumber: string;
  marks: number;
  questionText: string;
  evaluation: Evaluation | null;
  error?: string;
}
 
interface PDFEvalResult {
  results: QuestionResult[];
  summary: { questionsFound: number; questionsEvaluated: number; totalMarksScored: number; totalMarksOut: number };
}
 
interface Props {
  isPremium: boolean;
  onPaywall: () => void;
  token: string | null;
  paperQuestions?: { id: string; marks: number; text: string }[];
  variant?: "evaluate" | "test";
}
 
// ─── helpers ──────────────────────────────────────────────────────────────────
 
function toArr(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (val && typeof val === "object") return Object.values(val as object).map(String).filter(Boolean);
  if (typeof val === "string" && val.trim()) return [val];
  return [];
}
function scoreColor(pct: number) { return pct >= 70 ? "#4ade80" : pct >= 50 ? "#3b82f6" : "#f87171"; }
 
// ─── Per-question card ────────────────────────────────────────────────────────
 
function QuestionCard({ result }: { result: QuestionResult }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<"eval"|"model"|"hist">("eval");
  const ev  = result.evaluation;
  const pct = ev ? Math.round((ev.marks / ev.marks_out_of) * 100) : 0;
  const col = scoreColor(pct);
 
  return (
    <div style={{ border:"1px solid #1e1e1e", borderRadius:10, overflow:"hidden", marginBottom:10 }}>
      {/* Header */}
      <div onClick={() => setOpen(o => !o)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 16px", cursor:"pointer", background: open ? "#161616" : "#111", gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.65rem", color:"#818cf8", letterSpacing:"0.12em", marginRight:10 }}>
            Q{result.questionNumber}
          </span>
          <span style={{ fontSize:"0.8rem", color:"#aaa", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {result.questionText ? result.questionText.slice(0,80)+(result.questionText.length>80?"…":"") : `${result.marks}M question`}
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          {ev ? (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.8rem", color:col, fontWeight:700 }}>
                {ev.marks}/{ev.marks_out_of}
              </span>
              <div style={{ width:40, height:5, background:"#1e1e1e", borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${pct}%`, height:"100%", background:col, borderRadius:3 }} />
              </div>
            </div>
          ) : (
            <span style={{ fontSize:"0.7rem", color:"#555", fontFamily:"var(--font-mono)" }}>{result.error ? "Error" : "Skipped"}</span>
          )}
          <span style={{ color:"#444", fontSize:"0.75rem" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
 
      {/* Detail */}
      {open && (
        <div style={{ padding:"16px", background:"#0d0d0d", borderTop:"1px solid #1e1e1e" }}>
          {result.error && !ev && (
            <div style={{ color:"#f87171", fontSize:"0.8rem", fontFamily:"var(--font-mono)" }}>
              {result.error}
            </div>
          )}
          {ev && (
            <div>
              {/* Section marks */}
              {ev.section_marks && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginBottom:16 }}>
                  {(["introduction","body","conclusion","presentation"] as const).map(sec => {
                    const s = ev.section_marks![sec];
                    const sp = Math.round((s.awarded/s.out_of)*100);
                    const sc = scoreColor(sp);
                    return (
                      <div key={sec} style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:8, padding:"10px 12px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:"0.6rem", color:"#666", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"var(--font-mono)" }}>{sec}</span>
                          <span style={{ fontSize:"0.75rem", color:sc, fontFamily:"var(--font-mono)", fontWeight:700 }}>
                            {s.awarded}/{s.out_of}
                          </span>
                        </div>
                        <div style={{ width:"100%", height:3, background:"#1e1e1e", borderRadius:2, marginBottom:8, overflow:"hidden" }}>
                          <div style={{ width:`${sp}%`, height:"100%", background:sc, borderRadius:2 }} />
                        </div>
                        <p style={{ fontSize:"0.72rem", color:"#777", margin:0, lineHeight:1.5 }}>{s.reasoning}</p>
                      </div>
                    );
                  })}
                </div>
              )}
 
              {/* Tabs */}
              <div style={{ display:"flex", borderBottom:"1px solid #1e1e1e", marginBottom:14 }}>
                {(["eval","model","hist"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{ padding:"9px 18px", background:"none", border:"none", borderBottom:`2px solid ${tab===t?"#3b82f6":"transparent"}`, color: tab===t?"#e2e8f0":"#444", cursor:"pointer", fontSize:"0.6rem", fontFamily:"var(--font-mono)", letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:-1, transition:"all 0.15s" }}>
                    {t==="eval"?"Evaluation":t==="model"?"Model Answer":"Historians"}
                  </button>
                ))}
              </div>
 
              {/* EVAL */}
              {tab==="eval" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {ev.overall_feedback && (
                    <div>
                      <div style={{ fontSize:"0.6rem", color:"#555", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"var(--font-mono)", marginBottom:6 }}>Overall Feedback</div>
                      <p style={{ fontSize:"0.82rem", color:"#bbb", lineHeight:1.65, margin:0 }}>{ev.overall_feedback}</p>
                    </div>
                  )}
                  {ev.body && toArr(ev.body.strengths).length > 0 && (
                    <div>
                      <div style={{ fontSize:"0.6rem", color:"#4ade80", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"var(--font-mono)", marginBottom:8 }}>What Worked</div>
                      {toArr(ev.body.strengths).map((s,i) => (
                        <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
                          <span style={{ color:"#4ade80", fontSize:"0.75rem", marginTop:2 }}>✓</span>
                          <p style={{ fontSize:"0.8rem", color:"#aaa", margin:0, lineHeight:1.55 }}>{s}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {ev.body && toArr(ev.body.weaknesses).length > 0 && (
                    <div>
                      <div style={{ fontSize:"0.6rem", color:"#f87171", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"var(--font-mono)", marginBottom:8 }}>Areas to Improve</div>
                      {toArr(ev.body.weaknesses).map((w,i) => (
                        <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
                          <span style={{ color:"#f87171", fontSize:"0.75rem", marginTop:2 }}>×</span>
                          <p style={{ fontSize:"0.8rem", color:"#aaa", margin:0, lineHeight:1.55 }}>{w}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {ev.body && toArr(ev.body.suggestions).length > 0 && (
                    <div>
                      <div style={{ fontSize:"0.6rem", color:"#3b82f6", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"var(--font-mono)", marginBottom:8 }}>How to Improve</div>
                      {toArr(ev.body.suggestions).map((s,i) => (
                        <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
                          <span style={{ color:"#3b82f6", fontSize:"0.75rem", marginTop:2 }}>→</span>
                          <p style={{ fontSize:"0.8rem", color:"#aaa", margin:0, lineHeight:1.55 }}>{s}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
 
              {/* MODEL */}
              {tab==="model" && ev.model_answer && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {(["introduction","conclusion"] as const).map(part => (
                    <div key={part}>
                      <div style={{ fontSize:"0.6rem", color:"#555", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"var(--font-mono)", marginBottom:6 }}>{part}</div>
                      <p style={{ fontSize:"0.8rem", color:"#bbb", lineHeight:1.65, margin:0 }}>{ev.model_answer![part]}</p>
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize:"0.6rem", color:"#555", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"var(--font-mono)", marginBottom:6 }}>Body</div>
                    {(Array.isArray(ev.model_answer.body) ? ev.model_answer.body : [ev.model_answer.body]).map((p,i) => (
                      <p key={i} style={{ fontSize:"0.8rem", color:"#bbb", lineHeight:1.65, margin:"0 0 10px" }}>{p}</p>
                    ))}
                  </div>
                </div>
              )}
 
              {/* HISTORIANS */}
              {tab==="hist" && ev.historians_to_cite && (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {ev.historians_to_cite.map((h,i) => (
                    <div key={i} style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:8, padding:"12px 14px" }}>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.72rem", color:"#818cf8", marginBottom:4 }}>{h.name}</div>
                      {h.work && <div style={{ fontSize:"0.7rem", color:"#555", fontStyle:"italic", marginBottom:6 }}>{h.work}</div>}
                      <p style={{ fontSize:"0.8rem", color:"#aaa", margin:0, lineHeight:1.55 }}>{h.argument}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
 
// ─── Main component ───────────────────────────────────────────────────────────
 
export default function PDFTestEvaluator({ isPremium, onPaywall, token, paperQuestions = [], variant = "test" }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [stage,   setStage]   = useState<"idle"|"loading"|"done"|"error">("idle");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [result,  setResult]  = useState<PDFEvalResult | null>(null);
  const [error,   setError]   = useState("");
  const [expanded, setExpanded] = useState(false);
 
  const pCol  = "#818cf8";
 
  // Non-premium: show teaser that calls onPaywall (opens existing LimitModal)
  if (!isPremium) {
    return (
      <div style={{ border:"1px dashed rgba(129,140,248,0.25)", borderRadius:12, padding:"22px 24px", background:"rgba(99,102,241,0.04)", textAlign:"center" }}>
        <div style={{ fontSize:"1.5rem", marginBottom:8 }}>📄</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:10 }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.75rem", color:"#e2e8f0", letterSpacing:"0.1em" }}>Full Test PDF Evaluation</span>
          <span style={{ fontSize:"0.55rem", background:"rgba(129,140,248,0.15)", color:pCol, padding:"2px 7px", borderRadius:20, fontFamily:"var(--font-mono)", letterSpacing:"0.1em" }}>Premium</span>
        </div>
        <p style={{ fontSize:"0.78rem", color:"#666", lineHeight:1.6, margin:"0 0 16px", maxWidth:360, marginLeft:"auto", marginRight:"auto" }}>
          Upload your full handwritten test PDF and get every question evaluated at once — scores, feedback, model answers, and historians for your entire paper in one go.
        </p>
        <button onClick={onPaywall} style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(129,140,248,0.3)", borderRadius:8, padding:"10px 22px", color:pCol, fontSize:"0.72rem", fontFamily:"var(--font-mono)", letterSpacing:"0.12em", cursor:"pointer" }}>
          🔒 Unlock — Subscribe
        </button>
      </div>
    );
  }
 
  // Premium flow ──────────────────────────────────────────────────────────────
 
  function handleUploadClick() { fileRef.current?.click(); }
 
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") { setError("Please select a PDF file."); return; }
    setPdfFile(f); setError(""); setResult(null); setStage("idle"); setExpanded(false);
  }
 
  async function runEvaluation() {
    if (!pdfFile || !token) return;
    setError(""); setResult(null); setStage("loading"); setProgress(8);
    setStatusMsg("Reading PDF and identifying question boundaries…");
 
    let tick = 8;
    const interval = setInterval(() => { tick = Math.min(tick + 2, 84); setProgress(tick); }, 2000);
 
    try {
      const fd = new FormData();
      fd.append("pdf", pdfFile);
      if (paperQuestions.length > 0) fd.append("questions", JSON.stringify(paperQuestions));
 
      setStatusMsg("Evaluating each question…");
 
      const res  = await fetch("/api/pdf-evaluate", { method:"POST", headers:{ "x-user-token": token }, body: fd });
      clearInterval(interval);
      setProgress(96); setStatusMsg("Compiling results…");
 
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "premium_required") { onPaywall(); setStage("idle"); return; }
        throw new Error(data.error ?? "Evaluation failed.");
      }
 
      setProgress(100); setStage("done"); setResult(data as PDFEvalResult);
    } catch (err) {
      clearInterval(interval);
      setStage("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }
 
  function reset() { setPdfFile(null); setStage("idle"); setResult(null); setError(""); setProgress(0); setExpanded(false); if (fileRef.current) fileRef.current.value = ""; }
 
  const loading = stage === "loading";
 
  return (
    <div style={{ marginTop:24 }}>
      <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFileChange} style={{ display:"none" }} />
 
      {/* Upload CTA — shown when no file chosen yet */}
      {stage === "idle" && !pdfFile && (
        <button onClick={handleUploadClick} style={{ width:"100%", padding:"18px", background:"rgba(99,102,241,0.08)", border:"1px dashed rgba(129,140,248,0.25)", borderRadius:12, color:pCol, cursor:"pointer", fontFamily:"var(--font-mono)", fontSize:"0.72rem", letterSpacing:"0.12em", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"background 0.2s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(99,102,241,0.14)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(99,102,241,0.08)"; }}>
          <span>📄</span>
          <span>Upload Full Test PDF</span>
          <span style={{ fontSize:"0.55rem", background:"rgba(129,140,248,0.15)", color:pCol, padding:"2px 7px", borderRadius:20, letterSpacing:"0.1em" }}>✦ Premium</span>
        </button>
      )}
 
      {/* Panel */}
      {(pdfFile || stage !== "idle") && (
        <div style={{ border:"1px solid #1e1e1e", borderRadius:12, overflow:"hidden", background:"#0d0d0d" }}>
 
          {/* Panel header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid #1a1a1a", background:"#111" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:"1.1rem" }}>📄</span>
              <div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.68rem", color:pCol, letterSpacing:"0.12em" }}>Full Test PDF Evaluation</div>
                {pdfFile && <div style={{ fontSize:"0.68rem", color:"#444", marginTop:2 }}>{pdfFile.name} · {(pdfFile.size/1024).toFixed(0)}KB</div>}
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {stage === "done" && <button onClick={() => setExpanded(o=>!o)} style={{ background:"none", border:"1px solid #2a2a2a", borderRadius:5, padding:"4px 9px", color:"#666", fontSize:"0.7rem", cursor:"pointer" }}>{expanded?"Collapse ▲":"Expand ▼"}</button>}
              {!loading && <button onClick={reset} style={{ background:"none", border:"1px solid #2a2a2a", borderRadius:5, padding:"4px 9px", color:"#666", fontSize:"0.7rem", cursor:"pointer", fontFamily:"var(--font-mono)" }}>↺ Reset</button>}
            </div>
          </div>
 
          {/* Body */}
          <div style={{ padding:"18px" }}>
            {error && <div style={{ color:"#f87171", fontSize:"0.78rem", fontFamily:"var(--font-mono)", marginBottom:14, padding:"10px 14px", background:"rgba(248,113,113,0.06)", borderRadius:8, border:"1px solid rgba(248,113,113,0.15)" }}>{error}</div>}
 
            {/* Loading */}
            {loading && (
              <div style={{ textAlign:"center", padding:"28px 0" }}>
                <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:2, marginBottom:16 }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"2.2rem", color:pCol, fontWeight:700 }}>{String(Math.round(progress)).padStart(2,"0")}</span>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"1rem", color:"#333" }}>%</span>
                </div>
                <div style={{ width:"100%", height:4, background:"#1a1a1a", borderRadius:2, marginBottom:16, overflow:"hidden" }}>
                  <div style={{ width:`${progress}%`, height:"100%", background:pCol, borderRadius:2, transition:"width 2s ease" }} />
                </div>
                <div style={{ fontSize:"0.78rem", color:"#666", fontFamily:"var(--font-mono)" }}>{statusMsg}</div>
                <div style={{ fontSize:"0.72rem", color:"#333", marginTop:8 }}>Evaluating every question in your paper — takes 1–3 minutes.</div>
              </div>
            )}
 
            {/* Ready */}
            {pdfFile && stage === "idle" && (
              <div style={{ textAlign:"center", padding:"18px 0" }}>
                <p style={{ fontSize:"0.8rem", color:"#666", marginBottom:18 }}>PDF loaded. The evaluator will identify every question, transcribe each answer, and evaluate them one by one.</p>
                <button onClick={runEvaluation} style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(129,140,248,0.3)", borderRadius:9, padding:"12px 28px", color:pCol, fontSize:"0.72rem", fontFamily:"var(--font-mono)", letterSpacing:"0.12em", cursor:"pointer" }}>
                  ✦ Evaluate Full Test →
                </button>
              </div>
            )}
 
            {/* Results */}
            {stage === "done" && result && (
              <div>
                {/* Summary strip */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr auto", gap:0, background:"#111", border:"1px solid #1e1e1e", borderRadius:10, padding:"14px 18px", marginBottom:18, alignItems:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"0.55rem", color:"#555", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"var(--font-mono)", marginBottom:4 }}>Total Score</div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:2, justifyContent:"center" }}>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"1.6rem", fontWeight:700, color: scoreColor(result.summary.totalMarksOut > 0 ? Math.round((result.summary.totalMarksScored/result.summary.totalMarksOut)*100) : 0) }}>{result.summary.totalMarksScored}</span>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.85rem", color:"#333" }}>/{result.summary.totalMarksOut}</span>
                    </div>
                  </div>
                  <div style={{ width:1, height:40, background:"#1e1e1e", margin:"0 18px" }} />
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"0.55rem", color:"#555", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"var(--font-mono)", marginBottom:4 }}>Questions</div>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:"1.4rem", fontWeight:700, color:"#e2e8f0" }}>{result.summary.questionsEvaluated}/{result.summary.questionsFound}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginLeft:18 }}>
                    <div style={{ width:120, height:6, background:"#1a1a1a", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width: result.summary.totalMarksOut > 0 ? `${Math.min(100,(result.summary.totalMarksScored/result.summary.totalMarksOut)*100)}%` : "0%", height:"100%", background: scoreColor(result.summary.totalMarksOut > 0 ? Math.round((result.summary.totalMarksScored/result.summary.totalMarksOut)*100) : 0), borderRadius:3, transition:"width 1s" }} />
                    </div>
                    <div style={{ fontSize:"0.65rem", color:"#555", fontFamily:"var(--font-mono)" }}>
                      {result.summary.totalMarksOut > 0 ? `${Math.round((result.summary.totalMarksScored/result.summary.totalMarksOut)*100)}% of attempted marks` : "—"}
                    </div>
                    <button onClick={() => fileRef.current?.click()} style={{ background:"none", border:"1px solid rgba(99,102,241,0.22)", borderRadius:5, padding:"5px 11px", color:pCol, fontSize:"0.7rem", cursor:"pointer", fontFamily:"var(--font-mono)", whiteSpace:"nowrap" }}>+ Upload another</button>
                  </div>
                </div>
 
                {/* Disclaimer */}
                <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 14px", background:"rgba(251,191,36,0.04)", border:"1px solid rgba(251,191,36,0.1)", borderRadius:8, marginBottom:16 }}>
                  <span style={{ fontSize:"0.75rem" }}>⚠️</span>
                  <p style={{ fontSize:"0.72rem", color:"#666", margin:0, lineHeight:1.5 }}>AI scores are indicative, not definitive. Focus on the qualitative feedback for each question.</p>
                </div>
 
                {/* Question cards */}
                {(expanded || result.results.length <= 3) && result.results.map((r, i) => <QuestionCard key={i} result={r} />)}
                {!expanded && result.results.length > 3 && (
                  <>
                    {result.results.slice(0,3).map((r, i) => <QuestionCard key={i} result={r} />)}
                    <button onClick={() => setExpanded(true)} style={{ width:"100%", padding:"11px", background:"none", border:"1px dashed #2a2a2a", borderRadius:8, color:"#666", fontSize:"0.75rem", cursor:"pointer", fontFamily:"var(--font-mono)", letterSpacing:"0.1em" }}>
                      Show all {result.results.length} questions ▼
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
