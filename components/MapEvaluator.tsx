"use client";
import { useState, useRef } from "react";
import { saveToHistory } from "@/hooks/useAnswerHistory";

interface CheckedResult {
  number: string;
  clue: string;
  status: "correct" | "partial" | "wrong" | "blank" | "review";
  marks: number;
  maxMarks: number;
  studentSite: string | null;
  studentDescription: string | null;
  correctSite: string | null;
  correctLocation: string | null;
  descriptionScore: number;
  descriptionFeedback: string;
  confidence: number;
}
interface MapCheckResponse {
  results: CheckedResult[];
  totalMarks: number;
  maxTotal: number;
  percentage: number;
}

// ── render a PDF page to base64 PNG via canvas ────────────────
async function pdfPageToBase64(pdf: any, pageNum: number): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png").split(",")[1];
}

async function renderPage(pdf: any, pageNum: number, scale: number): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

async function pdfToImages(file: File): Promise<{mapPage: string, cluesPage: string, answersPage: string}> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  // Page 1 = map, pages 2-3 = clues, pages 4+ = student answers
  const mapCanvas = await renderPage(pdf, 1, 1.0);
  const mapPage = mapCanvas.toDataURL("image/jpeg", 0.85).split(",")[1];

  // Combine clue pages (2-3) into one image
  const clueCanvases: HTMLCanvasElement[] = [];
  for (let i = 2; i <= Math.min(3, pdf.numPages); i++) {
    clueCanvases.push(await renderPage(pdf, i, 1.0));
  }
  const clueHeight = clueCanvases.reduce((s, c) => s + c.height, 0);
  const clueWidth = Math.max(...clueCanvases.map(c => c.width));
  const clueCanvas = document.createElement("canvas");
  clueCanvas.width = clueWidth; clueCanvas.height = clueHeight || 1;
  const clueCtx = clueCanvas.getContext("2d")!;
  let cy = 0;
  for (const c of clueCanvases) { clueCtx.drawImage(c, 0, cy); cy += c.height; }
  const cluesPage = clueCanvas.toDataURL("image/jpeg", 0.90).split(",")[1];

  // Combine answer pages (4+) into one image
  const answerCanvases: HTMLCanvasElement[] = [];
  for (let i = 4; i <= pdf.numPages; i++) {
    answerCanvases.push(await renderPage(pdf, i, 0.9));
  }
  const totalHeight = answerCanvases.reduce((s, c) => s + c.height, 0);
  const maxWidth = Math.max(...answerCanvases.map(c => c.width));
  const combined = document.createElement("canvas");
  combined.width = maxWidth;
  combined.height = totalHeight || 1;
  const ctx = combined.getContext("2d")!;
  let y = 0;
  for (const c of answerCanvases) { ctx.drawImage(c, 0, y); y += c.height; }
  const answersPage = combined.toDataURL("image/jpeg", 0.82).split(",")[1];

  return { mapPage, cluesPage, answersPage };
}

// ── score colour helpers ──────────────────────────────────────
function scoreColor(pct: number) {
  if (pct >= 80) return "#10b981";
  if (pct >= 55) return "#f59e0b";
  return "#ef4444";
}

export default function MapEvaluator({
  isPremium, onPaywall, token,
}: { isPremium: boolean; onPaywall: () => void; token: string | null }) {

  const [file, setFile]               = useState<File | null>(null);
  const [drag, setDrag]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const [stage, setStage]             = useState("");
  const [progress, setProgress]       = useState(0);
  const [error, setError]             = useState("");
  const [results, setResults]         = useState<MapCheckResponse | null>(null);
  const [expanded, setExpanded]       = useState<string | null>(null);
  const inputRef                      = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".pdf")) { setError("Please upload a PDF file."); return; }
    setFile(f); setError(""); setResults(null);
  };

  const handleSubmit = async () => {
    if (!isPremium) { onPaywall(); return; }
    if (!file) { setError("Upload your answer booklet PDF first."); return; }
    setLoading(true); setError(""); setProgress(10);
    setStage("Uploading PDF…");

    try {
      setProgress(25); setStage("Rendering pages…");
      const { mapPage, cluesPage, answersPage } = await pdfToImages(file);
      setProgress(50); setStage("Analysing map & answers…");
      const resp = await fetch("/api/check-map", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mapPage, cluesPage, answersPage }),
      });
      setProgress(90);
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Evaluation failed");
      setResults(data);
      setProgress(100);
      setStage("");

      const correct = data.results.filter((r: CheckedResult) => r.status === "correct").length;
      saveToHistory({
        type: "map",
        question: `Map Q1 — Vision Check (${data.results.length} locations)`,
        marks: data.totalMarks,
        marksOutOf: data.maxTotal,
        overallFeedback: `${correct}/${data.results.length} locations correct`,
        sectionMarks: {
          introduction: { awarded: correct, out_of: data.results.length },
          body: { awarded: 0, out_of: 0 },
          conclusion: { awarded: 0, out_of: 0 },
          presentation: { awarded: 0, out_of: 0 },
        },
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setResults(null);
    setError(""); setProgress(0); setStage("");
  };

  // ── RESULTS VIEW ─────────────────────────────────────────────
  if (results) {
    const pct     = results.percentage;
    const color   = scoreColor(pct);
    const correct = results.results.filter(r => r.status === "correct").length;
    const partial = results.results.filter(r => r.status === "partial").length;
    const wrong   = results.results.filter(r => r.status === "wrong").length;
    const blank   = results.results.filter(r => r.status === "blank").length;
    const review  = results.results.filter(r => r.status === "review").length;

    const dot = (s: CheckedResult["status"]) =>
      s === "correct" ? "#10b981"
      : s === "partial" ? "#f59e0b"
      : s === "review" ? "#818cf8"
      : s === "blank" ? "#444"
      : "#ef4444";

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* Score card */}
        <div style={{ background:"#0d0d0d", border:"1px solid #1e1e1e", borderRadius:12, padding:"16px 18px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <span style={{ color:"#888", fontSize:12, fontFamily:"monospace" }}>Q1 · Map · Vision Check</span>
            <button onClick={reset} style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:6, color:"#888", fontSize:12, padding:"4px 10px", cursor:"pointer" }}>
              ↺ New
            </button>
          </div>

          <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:14 }}>
            <span style={{ fontSize:36, fontWeight:700, color, fontVariantNumeric:"tabular-nums" }}>
              {results.totalMarks.toFixed(1)}
            </span>
            <span style={{ color:"#555", fontSize:16 }}>/ {results.maxTotal}</span>
            <span style={{ marginLeft:"auto", fontSize:22, fontWeight:600, color }}>{pct}%</span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
            {[
              { label:"Correct", val:correct,  c:"#10b981" },
              { label:"Partial", val:partial,  c:"#f59e0b" },
              { label:"Wrong",   val:wrong,    c:"#ef4444" },
              { label:"Blank",   val:blank,    c:"#555" },
              { label:"Review",  val:review,   c:"#818cf8" },
            ].map(s => (
              <div key={s.label} style={{ background:`${s.c}0d`, border:`1px solid ${s.c}33`, borderRadius:8, padding:"8px 0", textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:700, color:s.c }}>{s.val}</div>
                <div style={{ fontSize:11, color:"#666", marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-location rows */}
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {results.results.map(r => {
            const open = expanded === r.number;
            return (
              <div key={r.number} style={{ background:"#0d0d0d", border:`1px solid ${open ? "#2a2a2a" : "#161616"}`, borderRadius:8, overflow:"hidden" }}>
                <button
                  onClick={() => setExpanded(open ? null : r.number)}
                  style={{ width:"100%", padding:"10px 14px", display:"flex", alignItems:"center", gap:10, background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}
                >
                  <span style={{ width:8, height:8, borderRadius:"50%", background:dot(r.status), flexShrink:0 }} />
                  <span style={{ color:"#555", fontSize:12, fontFamily:"monospace", width:28 }}>({r.number})</span>
                  <span style={{ flex:1, color: r.studentSite ? "#e0e0e0" : "#444", fontSize:13 }}>
                    {r.studentSite ?? "—"}
                  </span>
                  <span style={{ color: r.status === "correct" ? "#10b981" : r.status === "partial" ? "#f59e0b" : r.status === "review" ? "#818cf8" : r.status === "blank" ? "#444" : "#ef4444", fontSize:13, fontFamily:"monospace", minWidth:40, textAlign:"right" }}>
                    {r.status === "blank" ? "—" : r.status === "review" ? "?" : `${r.marks}/${r.maxMarks}`}
                  </span>
                  <span style={{ color:"#444", fontSize:11 }}>{open ? "▲" : "▼"}</span>
                </button>

                {open && (
                  <div style={{ padding:"0 14px 12px", borderTop:"1px solid #1a1a1a" }}>

                    {/* Clue */}
                    <div style={{ marginTop:10, color:"#666", fontSize:12 }}>
                      <span style={{ color:"#3a3a3a", marginRight:6 }}>Clue:</span>
                      {r.clue || "—"}
                    </div>

                    {/* Student wrote vs Correct answer */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
                      <div style={{ background:"#111", borderRadius:8, padding:"10px 12px" }}>
                        <div style={{ color:"#444", fontSize:11, marginBottom:4 }}>You wrote</div>
                        <div style={{ color: r.studentSite ? "#e0e0e0" : "#444", fontSize:13, fontWeight:500 }}>
                          {r.studentSite ?? "—"}
                        </div>
                      </div>
                      <div style={{
                        background: r.status === "correct" || r.status === "partial" ? "rgba(16,185,129,0.06)" : r.status === "blank" ? "#111" : "rgba(239,68,68,0.06)",
                        border: `1px solid ${r.status === "correct" || r.status === "partial" ? "rgba(16,185,129,0.2)" : r.status === "blank" ? "#1a1a1a" : "rgba(239,68,68,0.15)"}`,
                        borderRadius:8, padding:"10px 12px"
                      }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                          <span style={{ color:"#444", fontSize:11 }}>Correct answer</span>
                          <span style={{ fontSize:11, fontFamily:"monospace", color: r.status === "correct" || r.status === "partial" ? "#10b981" : "#ef4444" }}>
                            {r.status === "blank" || r.status === "review" ? "" : r.status === "correct" || r.status === "partial" ? "✓ 1.5 pts" : "✗ 0 pts"}
                          </span>
                        </div>
                        <div style={{ color: r.status === "correct" || r.status === "partial" ? "#10b981" : "#ef4444", fontSize:13, fontWeight:500 }}>
                          {r.correctSite ?? "—"}
                        </div>
                      </div>
                    </div>

                    {/* Student description + score */}
                    <div style={{ marginTop:8, background:"#0a0a0a", border:"1px solid #1a1a1a", borderRadius:8, overflow:"hidden" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderBottom:"1px solid #141414" }}>
                        <span style={{ color:"#444", fontSize:11 }}>Your description</span>
                        {r.status !== "blank" && r.status !== "review" && (
                          <span style={{
                            fontSize:11, fontFamily:"monospace",
                            color: r.descriptionScore >= 1 ? "#10b981" : r.descriptionScore > 0 ? "#f59e0b" : "#ef4444"
                          }}>
                            {r.descriptionScore}/1 pts
                          </span>
                        )}
                      </div>
                      <div style={{ padding:"10px 12px", color: r.studentDescription ? "#888" : "#333", fontSize:12, lineHeight:1.7, fontStyle: r.studentDescription ? "normal" : "italic" }}>
                        {r.studentDescription ?? "Nothing written"}
                      </div>
                      {r.descriptionFeedback && (
                        <div style={{ padding:"8px 12px", borderTop:"1px solid #141414", background:"#070707", color:"#555", fontSize:11, lineHeight:1.6 }}>
                          💬 {r.descriptionFeedback}
                        </div>
                      )}
                    </div>

                    {r.status === "review" && (
                      <div style={{ marginTop:8, padding:"8px 10px", background:"rgba(129,140,248,0.06)", border:"1px solid rgba(129,140,248,0.2)", borderRadius:6, fontSize:12, color:"#818cf8" }}>
                        ⚠ Needs teacher review
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── UPLOAD VIEW ───────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {!isPremium && (
        <div onClick={onPaywall} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:8, cursor:"pointer" }}>
          <span style={{ fontSize:16 }}>⭐</span>
          <span style={{ color:"#f59e0b", fontSize:13 }}>Premium feature — tap to upgrade</span>
        </div>
      )}

      {/* Single upload zone */}
      <div
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          border: drag ? "1.5px dashed #6366f188" : file ? "1.5px solid #6366f144" : "1.5px dashed #1e1e1e",
          borderRadius:12, padding: file ? "16px 18px" : "32px 18px",
          textAlign:"center", background: file ? "#6366f108" : drag ? "#6366f106" : "#080808",
          cursor:"pointer", transition:"all 0.18s",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8,
        }}
      >
        <input ref={inputRef} type="file" accept=".pdf" style={{ display:"none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        {file ? (
          <>
            <div style={{ fontSize:28 }}>📄</div>
            <div style={{ color:"#e0e0e0", fontSize:14, fontWeight:500 }}>{file.name}</div>
            <div style={{ color:"#555", fontSize:12 }}>{(file.size / 1024).toFixed(0)} KB · tap to change</div>
          </>
        ) : (
          <>
            <div style={{ fontSize:32 }}>📋</div>
            <div style={{ color:"#e0e0e0", fontSize:15, fontWeight:500 }}>Upload answer booklet PDF</div>
            <div style={{ color:"#555", fontSize:13 }}>Map + handwritten answers in one PDF</div>
            <div style={{ color:"#333", fontSize:12, marginTop:4 }}>PDF only</div>
          </>
        )}
      </div>

      {error && (
        <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, color:"#ef4444", fontSize:13 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ color:"#666", fontSize:13 }}>{stage}</span>
            <span style={{ color:"#555", fontSize:12, fontFamily:"monospace" }}>{progress}%</span>
          </div>
          <div style={{ height:3, background:"#1a1a1a", borderRadius:2 }}>
            <div style={{ height:"100%", width:`${progress}%`, background:"#6366f1", borderRadius:2, transition:"width 0.4s ease" }} />
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !file}
        style={{
          padding:"13px 0", borderRadius:10, border:"none", cursor: loading || !file ? "not-allowed" : "pointer",
          background: loading || !file ? "#1a1a1a" : "#6366f1",
          color: loading || !file ? "#444" : "#fff",
          fontSize:15, fontWeight:600, transition:"all 0.2s",
        }}
      >
        {loading ? stage || "Evaluating…" : file ? "Check Map Answers →" : "Upload PDF to evaluate"}
      </button>
    </div>
  );
}
