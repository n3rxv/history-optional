"use client";
import { useState, useCallback, useRef } from "react";
import { mapData } from "@/lib/mapData";
import { saveToHistory } from "@/hooks/useAnswerHistory";

const AVAILABLE_YEARS = [...new Set(mapData.map((e) => e.year))].sort((a, b) => b - a);

function toRoman(n: number): string {
  const map: [number, string][] = [
    [20,"xx"],[19,"xix"],[18,"xviii"],[17,"xvii"],[16,"xvi"],
    [15,"xv"],[14,"xiv"],[13,"xiii"],[12,"xii"],[11,"xi"],
    [10,"x"],[9,"ix"],[8,"viii"],[7,"vii"],[6,"vi"],
    [5,"v"],[4,"iv"],[3,"iii"],[2,"ii"],[1,"i"],
  ];
  return map.find(([v]) => v === n)?.[1] ?? String(n);
}

function scoreColor(pct: number) {
  if (pct >= 80) return "#10b981";
  if (pct >= 55) return "#f59e0b";
  return "#ef4444";
}

function scoreBg(pct: number) {
  if (pct >= 80) return "rgba(16,185,129,0.08)";
  if (pct >= 55) return "rgba(245,158,11,0.08)";
  return "rgba(239,68,68,0.08)";
}

function scoreBorder(pct: number) {
  if (pct >= 80) return "rgba(16,185,129,0.2)";
  if (pct >= 55) return "rgba(245,158,11,0.2)";
  return "rgba(239,68,68,0.2)";
}

interface MapResult {
  number: number; roman: string; hint: string;
  correctAnswer: string; studentAnswer: string; studentNote: string;
  identificationMarks: number; noteMarks: number; total: number; feedback: string;
}
interface MapEvalResponse {
  results: MapResult[]; grandTotal: number; outOf: number; overallFeedback: string;
}

export default function MapEvaluator({
  isPremium, onPaywall, token,
}: { isPremium: boolean; onPaywall: () => void; token: string | null; }) {

  const [year, setYear]         = useState(AVAILABLE_YEARS[0]);
  const [files, setFiles]       = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError]       = useState("");
  const [results, setResults]   = useState<MapEvalResponse | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef            = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    setFiles((prev) => [...prev, ...arr].slice(0, 6));
    arr.forEach((f) => {
      if (f.type === "application/pdf") {
        setPreviews((prev) => [...prev, "__pdf__"]);
      } else {
        const r = new FileReader();
        r.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
        r.readAsDataURL(f);
      }
    });
  }, []);

  const removeFile = (i: number) => {
    setFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!isPremium) { onPaywall(); return; }
    if (!files.length) { setError("Upload at least one image of your Q1 answer."); return; }
    setLoading(true); setError(""); setProgress(10);
    setProgressLabel("Reading your answer sheet…");

    const filePayload: { data: string; type: string }[] = [];
    for (const f of files) {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(f);
      });
      filePayload.push({ data: b64, type: f.type });
    }

    setProgress(35); setProgressLabel("OCR in progress…");

    try {
      const resp = await fetch("/api/map-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ files: filePayload, year, token }),
      });
      setProgress(80); setProgressLabel("Scoring 20 locations…");
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Evaluation failed");
      setResults(data); setProgress(100); setProgressLabel("");

      for (const r of data.results) {
        saveToHistory({
          type: "map" as any,
          question: `[${year} Map Q1] (${r.roman}) ${r.hint}`,
          marks: r.total, marksOutOf: 2.5,
          overallFeedback: r.feedback,
          sectionMarks: {
            introduction: { awarded: r.identificationMarks, out_of: 1.5 },
            body: { awarded: r.noteMarks, out_of: 1 },
            conclusion: { awarded: 0, out_of: 0 },
            presentation: { awarded: 0, out_of: 0 },
          },
        });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setFiles([]); setPreviews([]); setResults(null); setError(""); setProgress(0); setProgressLabel(""); };

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (results) {
    const pct = Math.round((results.grandTotal / results.outOf) * 100);
    const correct   = results.results.filter(r => r.identificationMarks >= 1.5).length;
    const partial   = results.results.filter(r => r.identificationMarks > 0 && r.identificationMarks < 1.5).length;
    const incorrect = results.results.filter(r => r.identificationMarks === 0).length;

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* ── Score card ── */}
        <div style={{
          background:"#080808", border:"1px solid #1a1a1a", borderRadius:14,
          overflow:"hidden",
        }}>
          <div style={{ padding:"20px 20px 16px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
              <div>
                <div style={{
                  fontFamily:"var(--font-mono)", fontSize:"0.6rem", letterSpacing:"0.2em",
                  textTransform:"uppercase", color:"#444", marginBottom:8,
                }}>
                  Q1 · Map · {year}
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                  <span style={{
                    fontFamily:"var(--font-mono)", fontSize:"2.4rem", fontWeight:700,
                    color: scoreColor(pct), lineHeight:1,
                  }}>
                    {results.grandTotal}
                  </span>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.75rem", color:"#444" }}>
                    / {results.outOf}
                  </span>
                  <span style={{
                    fontFamily:"var(--font-mono)", fontSize:"0.7rem", fontWeight:600,
                    color: scoreColor(pct),
                    background: scoreBg(pct),
                    border: `1px solid ${scoreBorder(pct)}`,
                    borderRadius:5, padding:"2px 7px",
                  }}>{pct}%</span>
                </div>
              </div>
              <button onClick={reset} style={{
                padding:"6px 13px", borderRadius:6, background:"#0f0f0f",
                border:"1px solid #1e1e1e", color:"#555", cursor:"pointer",
                fontFamily:"var(--font-mono)", fontSize:"0.6rem", letterSpacing:"0.15em",
              }}>
                ↺ New
              </button>
            </div>

            {/* progress bar */}
            <div style={{ height:4, background:"#111", borderRadius:2, overflow:"hidden", marginBottom:16 }}>
              <div style={{
                height:"100%", width:`${pct}%`,
                background: pct >= 80 ? "#10b981" : pct >= 55 ? "#f59e0b" : "#ef4444",
                borderRadius:2, transition:"width 0.6s ease",
              }} />
            </div>

            {/* stat pills */}
            <div style={{ display:"flex", gap:8 }}>
              {[
                { label:"Correct", val:correct, color:"#10b981", bg:"rgba(16,185,129,0.08)", border:"rgba(16,185,129,0.2)" },
                { label:"Partial", val:partial, color:"#f59e0b", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.2)" },
                { label:"Wrong", val:incorrect, color:"#ef4444", bg:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.2)" },
              ].map(s => (
                <div key={s.label} style={{
                  flex:1, padding:"8px 10px", borderRadius:8,
                  background:s.bg, border:`1px solid ${s.border}`, textAlign:"center",
                }}>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:"1.1rem", fontWeight:700, color:s.color }}>{s.val}</div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.55rem", letterSpacing:"0.15em", textTransform:"uppercase", color:s.color, opacity:0.7 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* overall feedback */}
          <div style={{ padding:"14px 20px", borderTop:"1px solid #111", background:"#050505" }}>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.55rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#333", marginBottom:6 }}>Overall Feedback</div>
            <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.78rem", color:"#888", lineHeight:1.6 }}>{results.overallFeedback}</div>
          </div>
        </div>

        {/* ── Per-location list ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {results.results.map((r) => {
            const open = expandedRow === r.number;
            const rPct = Math.round((r.total / 2.5) * 100);
            const idStatus = r.identificationMarks >= 1.5 ? "correct"
              : r.identificationMarks > 0 ? "partial" : "wrong";
            const idDot = idStatus === "correct" ? "#10b981" : idStatus === "partial" ? "#f59e0b" : "#ef4444";

            return (
              <div key={r.number} style={{
                background:"#080808", border:`1px solid ${open ? "#1e1e1e" : "#141414"}`,
                borderRadius:10, overflow:"hidden", transition:"border-color 0.15s",
              }}>
                <button
                  onClick={() => setExpandedRow(open ? null : r.number)}
                  style={{ width:"100%", padding:"11px 14px", display:"flex",
                    alignItems:"center", gap:10, background:"transparent",
                    border:"none", cursor:"pointer", textAlign:"left" }}>

                  {/* status dot */}
                  <div style={{ width:7, height:7, borderRadius:"50%", background:idDot, flexShrink:0 }} />

                  {/* roman */}
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"#444", flexShrink:0, width:28 }}>({r.roman})</span>

                  {/* hint */}
                  <span style={{ fontFamily:"var(--font-ui)", fontSize:"0.75rem", color:"#777", flex:1, textAlign:"left" }}>{r.hint}</span>

                  {/* marks */}
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.65rem", color:idDot, flexShrink:0 }}>{r.total}/2.5</span>

                  {/* chevron */}
                  <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink:0, transition:"transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </button>

                {open && (
                  <div style={{ padding:"0 14px 14px", borderTop:"1px solid #111" }}>

                    {/* answer comparison */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, margin:"12px 0 10px" }}>
                      <div style={{ padding:"10px 12px", background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.12)", borderRadius:8 }}>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.52rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"#ef4444", opacity:0.6, marginBottom:5 }}>Your Answer</div>
                        <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.73rem", color:"#bbb", lineHeight:1.4 }}>
                          {r.studentAnswer || <span style={{color:"#444",fontStyle:"italic"}}>blank</span>}
                        </div>
                      </div>
                      <div style={{ padding:"10px 12px", background:"rgba(16,185,129,0.04)", border:"1px solid rgba(16,185,129,0.12)", borderRadius:8 }}>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.52rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"#10b981", opacity:0.6, marginBottom:5 }}>Correct</div>
                        <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.73rem", color:"#bbb", lineHeight:1.4 }}>
                          {r.correctAnswer}
                        </div>
                      </div>
                    </div>

                    {/* note */}
                    {r.studentNote && (
                      <div style={{ padding:"8px 12px", background:"#050505", border:"1px solid #141414", borderRadius:7, marginBottom:10 }}>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.52rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"#333", marginBottom:4 }}>Your Note</div>
                        <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.72rem", color:"#666", lineHeight:1.5 }}>{r.studentNote}</div>
                      </div>
                    )}

                    {/* marks breakdown */}
                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
                      {[
                        { label:"Identification", val:r.identificationMarks, max:1.5 },
                        { label:"Note Quality",   val:r.noteMarks,           max:1   },
                      ].map(m => {
                        const mPct = Math.round((m.val / m.max) * 100);
                        return (
                          <div key={m.label}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.58rem", color:"#444" }}>{m.label}</span>
                              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.58rem", color: scoreColor(mPct) }}>{m.val}/{m.max}</span>
                            </div>
                            <div style={{ height:3, background:"#111", borderRadius:2, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${mPct}%`, background: scoreColor(mPct), borderRadius:2 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* feedback */}
                    <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:"0.7rem", marginTop:1 }}>💬</span>
                      <span style={{ fontFamily:"var(--font-ui)", fontSize:"0.72rem", color:"#666", lineHeight:1.5 }}>{r.feedback}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── FORM ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      {/* paywall banner */}
      {!isPremium && (
        <div onClick={onPaywall} style={{
          display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
          background:"rgba(234,179,8,0.06)", border:"1px solid rgba(234,179,8,0.18)",
          borderRadius:8, cursor:"pointer",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L9 5H13L10 8L11 12L7 10L3 12L4 8L1 5H5L7 1Z" fill="#eab308" opacity="0.8"/>
          </svg>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"#eab308", letterSpacing:"0.08em" }}>Premium feature — tap to upgrade</span>
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ marginLeft:"auto" }}>
            <path d="M3.5 2L6.5 5L3.5 8" stroke="#eab308" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
      )}

      {/* year selector */}
      <div>
        <div style={{
          fontFamily:"var(--font-mono)", fontSize:"0.58rem", letterSpacing:"0.2em",
          textTransform:"uppercase", color:"#444", marginBottom:10,
        }}>
          Paper Year
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {AVAILABLE_YEARS.map((y) => (
            <button key={y} onClick={() => setYear(y)} style={{
              padding:"6px 13px", borderRadius:5, cursor:"pointer",
              background: year===y ? "rgba(16,185,129,0.08)" : "#0a0a0a",
              border: year===y ? "1px solid rgba(16,185,129,0.35)" : "1px solid #1e1e1e",
              color: year===y ? "#10b981" : "#444",
              fontFamily:"var(--font-mono)", fontSize:"0.66rem", letterSpacing:"0.06em",
              transition:"all 0.15s", fontWeight: year===y ? 600 : 400,
            }}>{y}
            </button>
          ))}
        </div>
      </div>

      {/* upload zone */}
      <div>
        <div style={{
          fontFamily:"var(--font-mono)", fontSize:"0.58rem", letterSpacing:"0.2em",
          textTransform:"uppercase", color:"#444", marginBottom:10,
        }}>
          Upload Q1 Answer · max 6 files
        </div>
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragOver ? "1.5px dashed rgba(16,185,129,0.5)" : "1.5px dashed #1e1e1e",
            borderRadius:10, padding:"32px 20px", textAlign:"center",
            background: dragOver ? "rgba(16,185,129,0.03)" : "#080808",
            cursor:"pointer", transition:"all 0.18s",
          }}>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple style={{ display:"none" }}
            onChange={(e) => e.target.files && addFiles(e.target.files)} />

          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="#111"/>
              <path d="M14 8V18M14 8L10 12M14 8L18 12" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M8 20H20" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.76rem", color:"#444", marginBottom:4 }}>
            {dragOver ? "Drop to upload" : "Drop files or click to browse"}
          </div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.58rem", color:"#2a2a2a", letterSpacing:"0.1em" }}>
            JPG · PNG · PDF · up to 6 files
          </div>
        </div>
      </div>

      {/* file previews */}
      {previews.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {previews.map((src, i) => (
            <div key={i} style={{ position:"relative" }}>
              {src === "__pdf__" ? (
                <div style={{
                  width:60, height:60, borderRadius:7, background:"#0f0f0f",
                  border:"1px solid #1a1a1a", display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:3,
                }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="3" y="1" width="12" height="16" rx="2" stroke="#444" strokeWidth="1.2"/>
                    <path d="M6 6H12M6 9H12M6 12H9" stroke="#444" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.48rem", color:"#333", letterSpacing:"0.1em" }}>PDF</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" style={{ width:60, height:60, objectFit:"cover", borderRadius:7, border:"1px solid #1a1a1a" }} />
              )}
              <button onClick={() => removeFile(i)} style={{
                position:"absolute", top:-5, right:-5, width:17, height:17,
                borderRadius:"50%", background:"#1a1a1a", border:"1px solid #333",
                color:"#777", cursor:"pointer", display:"flex", alignItems:"center",
                justifyContent:"center", padding:0, fontSize:"0.65rem", lineHeight:1 }}>×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* hints accordion */}
      <div style={{ background:"#080808", border:"1px solid #141414", borderRadius:10, overflow:"hidden" }}>
        <div style={{
          padding:"11px 14px", display:"flex", alignItems:"center",
          justifyContent:"space-between", borderBottom:"1px solid #111",
        }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"#444", letterSpacing:"0.1em" }}>{year} Q1 — Locations to Identify</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.58rem", color:"#2a2a2a" }}>20 items</span>
        </div>
        <div style={{ maxHeight:220, overflowY:"auto" }}>
          {mapData.filter(e => e.year === year).sort((a,b)=>a.number-b.number).map((e) => (
            <div key={e.number} style={{
              display:"flex", gap:10, padding:"8px 14px",
              borderBottom:"1px solid #0d0d0d", alignItems:"flex-start",
            }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.6rem", color:"#2a2a2a", flexShrink:0, width:30, paddingTop:1 }}>({toRoman(e.number)})</span>
              <span style={{ fontFamily:"var(--font-ui)", fontSize:"0.73rem", color:"#555", lineHeight:1.5 }}>{e.hint}</span>
            </div>
          ))}
        </div>
      </div>

      {/* error */}
      {error && (
        <div style={{
          padding:"10px 14px", background:"rgba(239,68,68,0.06)",
          border:"1px solid rgba(239,68,68,0.15)", borderRadius:8,
          fontFamily:"var(--font-ui)", fontSize:"0.73rem", color:"#ef4444",
        }}>
          {error}
        </div>
      )}

      {/* loading */}
      {loading && (
        <div style={{ padding:"12px 14px", background:"#080808", border:"1px solid #141414", borderRadius:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"#444" }}>{progressLabel}</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"#2a2a2a" }}>{progress}%</span>
          </div>
          <div style={{ height:3, background:"#111", borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progress}%`, background:"#10b981", borderRadius:2, transition:"width 0.4s ease" }} />
          </div>
        </div>
      )}

      {/* submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width:"100%", padding:"13px 20px", borderRadius:9, cursor: loading ? "not-allowed" : "pointer",
          background: loading ? "#0a0a0a"
            : files.length > 0
              ? "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(59,130,246,0.08) 100%)"
              : "#0a0a0a",
          border: loading ? "1px solid #141414"
            : files.length > 0
              ? "1px solid rgba(16,185,129,0.3)"
              : "1px solid #1a1a1a",
          color: loading ? "#333" : files.length > 0 ? "#10b981" : "#333",
          fontFamily:"var(--font-mono)", fontSize:"0.64rem", letterSpacing:"0.22em",
          textTransform:"uppercase", transition:"all 0.2s",
        }}>
        {loading ? progressLabel || "Evaluating…" : files.length > 0 ? `Evaluate Q1 Map — ${year}` : "Upload answer to evaluate"}
      </button>
    </div>
  );
}
