"use client";
import { useState, useCallback, useRef } from "react";
import { saveToHistory } from "@/hooks/useAnswerHistory";

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
}

function UploadZone({
  label, sublabel, file, onFile, color,
}: {
  label: string; sublabel: string;
  file: File | null; onFile: (f: File) => void; color: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const accept = (f: File) => {
    onFile(f);
    if (f.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = (e) => setPreview(e.target?.result as string);
      r.readAsDataURL(f);
    } else {
      setPreview("__pdf__");
    }
  };

  return (
    <div>
      <div style={{
        fontFamily:"var(--font-mono)", fontSize:"0.56rem", letterSpacing:"0.18em",
        textTransform:"uppercase", color:"#444", marginBottom:8,
      }}>{label}</div>
      <div
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) accept(f); }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onClick={() => ref.current?.click()}
        style={{
          border: drag ? `1.5px dashed ${color}88` : file ? `1.5px solid ${color}44` : "1.5px dashed #1e1e1e",
          borderRadius:10, padding: file ? "10px 12px" : "22px 16px",
          textAlign:"center", background: file ? `${color}06` : drag ? `${color}04` : "#080808",
          cursor:"pointer", transition:"all 0.18s", minHeight:72,
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        }}>
        <input ref={ref} type="file" accept="image/*,application/pdf" style={{ display:"none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f); }} />

        {file ? (
          preview === "__pdf__" ? (
            <>
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="1" width="12" height="16" rx="2" stroke={color} strokeWidth="1.2" opacity="0.6"/>
                <path d="M6 6H12M6 9H12M6 12H9" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
              </svg>
              <span style={{ fontFamily:"var(--font-ui)", fontSize:"0.73rem", color, opacity:0.8 }}>{file.name}</span>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview!} alt="" style={{ width:48, height:48, objectFit:"cover", borderRadius:6, border:`1px solid ${color}33` }} />
              <span style={{ fontFamily:"var(--font-ui)", fontSize:"0.73rem", color, opacity:0.8, textAlign:"left", flex:1 }}>{file.name}</span>
            </>
          )
        ) : (
          <div>
            <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.74rem", color:"#444", marginBottom:3 }}>
              {drag ? "Drop here" : sublabel}
            </div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.55rem", color:"#2a2a2a", letterSpacing:"0.08em" }}>
              JPG · PNG · PDF
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MapEvaluator({
  isPremium, onPaywall, token,
}: { isPremium: boolean; onPaywall: () => void; token: string | null; }) {

  const [mapFile, setMapFile]         = useState<File | null>(null);
  const [answerFile, setAnswerFile]   = useState<File | null>(null);
  const [loading, setLoading]         = useState(false);
  const [progress, setProgress]       = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError]             = useState("");
  const [results, setResults]         = useState<MapCheckResponse | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toBase64 = (f: File) => new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(f);
  });

  const handleSubmit = async () => {
    if (!isPremium) { onPaywall(); return; }
    if (!mapFile || !answerFile) { setError("Upload both the question map and the student answer sheet."); return; }
    setLoading(true); setError(""); setProgress(10);
    setProgressLabel("Reading question map…");

    try {
      const [mapB64, answerB64] = await Promise.all([toBase64(mapFile), toBase64(answerFile)]);
      setProgress(30); setProgressLabel("Identifying map locations…");

      const fd = new FormData();
      fd.append("mapFile", mapFile);
      fd.append("answerFile", answerFile);

      setProgress(55); setProgressLabel("Reading student answers…");

      const resp = await fetch("/api/check-map", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      setProgress(80); setProgressLabel("Scoring locations…");

      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Evaluation failed");

      setResults(data); setProgress(100); setProgressLabel("");

      const correct  = data.results.filter((r: CheckedResult) => r.status === "correct").length;
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
    setMapFile(null); setAnswerFile(null);
    setResults(null); setError(""); setProgress(0); setProgressLabel("");
  };

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (results) {
    const pct     = Math.round((results.totalMarks / results.maxTotal) * 100);
    const correct  = results.results.filter(r => r.status === "correct").length;
    const partial  = results.results.filter(r => r.status === "partial" || r.status === "wrong_state").length;
    const wrong    = results.results.filter(r => r.status === "wrong_site" || r.status === "blank").length;
    const review   = results.results.filter(r => r.status === "low_confidence").length;

    const statusDot = (s: CheckedResult["status"]) =>
      s === "correct" ? "#10b981" : s === "partial" || s === "wrong_state" ? "#f59e0b" : s === "low_confidence" ? "#818cf8" : "#ef4444";

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* Score card */}
        <div style={{ background:"#080808", border:"1px solid #1a1a1a", borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"20px 20px 16px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
              <div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#444", marginBottom:8 }}>
                  Q1 · Map · Vision Check
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"2.4rem", fontWeight:700, color:scoreColor(pct), lineHeight:1 }}>
                    {results.totalMarks.toFixed(1)}
                  </span>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.75rem", color:"#444" }}>/ {results.maxTotal}</span>
                  <span style={{
                    fontFamily:"var(--font-mono)", fontSize:"0.7rem", fontWeight:600,
                    color:scoreColor(pct), background:scoreBg(pct), border:`1px solid ${scoreBorder(pct)}`,
                    borderRadius:5, padding:"2px 7px",
                  }}>{pct}%</span>
                </div>
              </div>
              <button onClick={reset} style={{
                padding:"6px 13px", borderRadius:6, background:"#0f0f0f",
                border:"1px solid #1e1e1e", color:"#555", cursor:"pointer",
                fontFamily:"var(--font-mono)", fontSize:"0.6rem", letterSpacing:"0.15em",
              }}>↺ New</button>
            </div>
            <div style={{ height:4, background:"#111", borderRadius:2, overflow:"hidden", marginBottom:16 }}>
              <div style={{ height:"100%", width:`${pct}%`, background:scoreColor(pct), borderRadius:2, transition:"width 0.6s ease" }} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {[
                { label:"Correct", val:correct,  color:"#10b981", bg:"rgba(16,185,129,0.08)",  border:"rgba(16,185,129,0.2)" },
                { label:"Partial",  val:partial,  color:"#f59e0b", bg:"rgba(245,158,11,0.08)",  border:"rgba(245,158,11,0.2)" },
                { label:"Wrong",    val:wrong,    color:"#ef4444", bg:"rgba(239,68,68,0.08)",   border:"rgba(239,68,68,0.2)" },
                { label:"Review",   val:review,   color:"#818cf8", bg:"rgba(129,140,248,0.08)", border:"rgba(129,140,248,0.2)" },
              ].map(s => (
                <div key={s.label} style={{ flex:1, padding:"8px 10px", borderRadius:8, background:s.bg, border:`1px solid ${s.border}`, textAlign:"center" }}>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:"1.1rem", fontWeight:700, color:s.color }}>{s.val}</div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.48rem", letterSpacing:"0.12em", textTransform:"uppercase", color:s.color, opacity:0.7 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Per-location list */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {results.results.map((r) => {
            const open = expandedRow === r.number;
            const dot  = statusDot(r.status);
            return (
              <div key={r.number} style={{
                background:"#080808", border:`1px solid ${open?"#1e1e1e":"#141414"}`,
                borderRadius:10, overflow:"hidden",
              }}>
                <button
                  onClick={() => setExpandedRow(open ? null : r.number)}
                  style={{ width:"100%", padding:"11px 14px", display:"flex", alignItems:"center", gap:10, background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:dot, flexShrink:0 }} />
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"#444", flexShrink:0, width:28 }}>({r.number})</span>
                  <span style={{ fontFamily:"var(--font-ui)", fontSize:"0.75rem", color:"#777", flex:1 }}>
                    {r.studentSite || <span style={{ color:"#2a2a2a", fontStyle:"italic" }}>blank</span>}
                  </span>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.65rem", color:dot, flexShrink:0 }}>{r.marks}/{r.maxMarks}</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink:0, transition:"transform 0.2s", transform:open?"rotate(180deg)":"none" }}>
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </button>

                {open && (
                  <div style={{ padding:"0 14px 14px", borderTop:"1px solid #111" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, margin:"12px 0 10px" }}>
                      <div style={{ padding:"10px 12px", background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.12)", borderRadius:8 }}>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.52rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"#ef4444", opacity:0.6, marginBottom:5 }}>Student Wrote</div>
                        <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.73rem", color:"#bbb", lineHeight:1.4 }}>
                          {r.studentSite || <span style={{ color:"#444", fontStyle:"italic" }}>blank</span>}
                          {r.studentState && <span style={{ color:"#666" }}> · {r.studentState}</span>}
                        </div>
                      </div>
                      <div style={{ padding:"10px 12px", background:"rgba(16,185,129,0.04)", border:"1px solid rgba(16,185,129,0.12)", borderRadius:8 }}>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.52rem", letterSpacing:"0.15em", textTransform:"uppercase", color:"#10b981", opacity:0.6, marginBottom:5 }}>Correct</div>
                        <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.73rem", color:"#bbb", lineHeight:1.4 }}>
                          {r.correctSite || "—"}
                          {r.correctLocation && <span style={{ color:"#555" }}> · {r.correctLocation}</span>}
                        </div>
                      </div>
                    </div>
                    {r.status === "low_confidence" && (
                      <div style={{ padding:"8px 12px", background:"rgba(129,140,248,0.05)", border:"1px solid rgba(129,140,248,0.15)", borderRadius:7, marginBottom:10 }}>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.52rem", letterSpacing:"0.12em", textTransform:"uppercase", color:"#818cf8", marginBottom:4 }}>⚠ Teacher Review Needed</div>
                        {r.candidates.length > 0 && (
                          <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.7rem", color:"#666" }}>
                            Possible: {r.candidates.join(" · ")}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ display:"flex", gap:6 }}>
                      {[
                        { label:"Site", right:r.siteRight },
                        { label:"State/Region", right:r.stateRight },
                      ].map(m => (
                        <div key={m.label} style={{
                          flex:1, padding:"7px 10px", borderRadius:7, textAlign:"center",
                          background: m.right ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                          border: `1px solid ${m.right ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
                        }}>
                          <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.55rem", color: m.right ? "#10b981" : "#ef4444" }}>{m.label}</div>
                          <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.75rem", color: m.right ? "#10b981" : "#ef4444" }}>{m.right ? "✓" : "✗"}</div>
                        </div>
                      ))}
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

      <UploadZone
        label="Question Paper Map"
        sublabel="Upload the UPSC map with numbered dots"
        file={mapFile}
        onFile={setMapFile}
        color="#3b82f6"
      />

      <UploadZone
        label="Student Answer Sheet"
        sublabel="Upload the student's handwritten answers"
        file={answerFile}
        onFile={setAnswerFile}
        color="#10b981"
      />

      {error && (
        <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:8, fontFamily:"var(--font-ui)", fontSize:"0.73rem", color:"#ef4444" }}>
          {error}
        </div>
      )}

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

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width:"100%", padding:"13px 20px", borderRadius:9, cursor:loading?"not-allowed":"pointer",
          background: loading ? "#0a0a0a" : (mapFile && answerFile) ? "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(59,130,246,0.08))" : "#0a0a0a",
          border: loading ? "1px solid #141414" : (mapFile && answerFile) ? "1px solid rgba(16,185,129,0.3)" : "1px solid #1a1a1a",
          color: loading ? "#333" : (mapFile && answerFile) ? "#10b981" : "#333",
          fontFamily:"var(--font-mono)", fontSize:"0.64rem", letterSpacing:"0.22em",
          textTransform:"uppercase", transition:"all 0.2s",
        }}>
        {loading ? progressLabel || "Evaluating…" : (mapFile && answerFile) ? "Check Map Answers →" : "Upload both files to evaluate"}
      </button>
    </div>
  );
}
