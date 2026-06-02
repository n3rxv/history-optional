"use client";
import { useState, useRef } from "react";
import { saveToHistory } from "@/hooks/useAnswerHistory";

interface CheckedResult {
  number: string;
  status: "correct" | "partial" | "wrong_site" | "wrong_state" | "blank" | "low_confidence";
  marks: number;
  maxMarks: number;
  siteRight: boolean;
  stateRight: boolean;
  studentSite: string | null;
  studentState: string | null;
  correctSite: string | null;
  correctLocation: string | null;
  confidence: number;
  candidates: string[];
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

async function pdfToPages(file: File): Promise<string[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    pages.push(await pdfPageToBase64(pdf, i));
  }
  return pages;
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
    setStage("Reading PDF pages…");

    try {
      const pages = await pdfToPages(file);
      if (pages.length < 2) throw new Error("PDF needs at least 2 pages (map + answers).");

      setProgress(30); setStage("Reading question map…");
      const [mapPage, ...answerPages] = pages;

      setProgress(55); setStage("Reading student answers…");
      // small delay so UI updates
      await new Promise(r => setTimeout(r, 50));

      setProgress(75); setStage("Scoring answers…");

      const resp = await fetch("/api/check-map", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mapPage, answerPages }),
      });

      setProgress(95);
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
    const partial = results.results.filter(r => r.status === "partial" || r.status === "wrong_state").length;
    const wrong   = results.results.filter(r => r.status === "wrong_site" || r.status === "blank").length;
    const review  = results.results.filter(r => r.status === "low_confidence").length;

    const dot = (s: CheckedResult["status"]) =>
      s === "correct" ? "#10b981"
      : s === "partial" || s === "wrong_state" ? "#f59e0b"
      : s === "low_confidence" ? "#818cf8"
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

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {[
              { label:"Correct", val:correct,  c:"#10b981" },
              { label:"Partial",  val:partial,  c:"#f59e0b" },
              { label:"Wrong",    val:wrong,    c:"#ef4444" },
              { label:"Review",   val:review,   c:"#818cf8" },
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
                  <span style={{ color: r.marks === r.maxMarks ? "#10b981" : r.marks > 0 ? "#f59e0b" : "#ef4444", fontSize:13, fontFamily:"monospace" }}>
                    {r.marks}/{r.maxMarks}
                  </span>
                  <span style={{ color:"#444", fontSize:11 }}>{open ? "▲" : "▼"}</span>
                </button>

                {open && (
                  <div style={{ padding:"0 14px 12px", borderTop:"1px solid #1a1a1a" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
                      {[
                        { label:"Student wrote", name: r.studentSite, loc: r.studentState },
                        { label:"Correct answer", name: r.correctSite, loc: r.correctLocation },
                      ].map(col => (
                        <div key={col.label} style={{ background:"#111", borderRadius:8, padding:"10px 12px" }}>
                          <div style={{ color:"#555", fontSize:11, marginBottom:5 }}>{col.label}</div>
                          <div style={{ color:"#e0e0e0", fontSize:13, fontWeight:500 }}>{col.name ?? "—"}</div>
                          {col.loc && <div style={{ color:"#666", fontSize:12, marginTop:3 }}>{col.loc}</div>}
                        </div>
                      ))}
                    </div>

                    <div style={{ display:"flex", gap:8, marginTop:10 }}>
                      {[{ label:"Site", right:r.siteRight }, { label:"State/Region", right:r.stateRight }].map(m => (
                        <div key={m.label} style={{
                          flex:1, padding:"6px 10px", borderRadius:6, textAlign:"center", fontSize:12,
                          background: m.right ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                          border: `1px solid ${m.right ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                          color: m.right ? "#10b981" : "#ef4444",
                        }}>
                          {m.right ? "✓" : "✗"} {m.label}
                        </div>
                      ))}
                    </div>

                    {r.status === "low_confidence" && (
                      <div style={{ marginTop:10, padding:"8px 10px", background:"rgba(129,140,248,0.06)", border:"1px solid rgba(129,140,248,0.2)", borderRadius:6, fontSize:12, color:"#818cf8" }}>
                        ⚠ Teacher review needed
                        {r.candidates.length > 0 && (
                          <span style={{ color:"#555", marginLeft:8 }}>Possible: {r.candidates.join(" · ")}</span>
                        )}
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
