"use client";
import { useState, useCallback, useRef } from "react";
import { mapData } from "@/lib/mapData";
import { saveToHistory } from "@/hooks/useAnswerHistory";

// ── helpers ────────────────────────────────────────────────────────────────
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
  if (pct >= 80) return "#22c55e";
  if (pct >= 55) return "#f59e0b";
  return "#ef4444";
}

// ── types ──────────────────────────────────────────────────────────────────
interface MapResult {
  number: number;
  roman: string;
  hint: string;
  correctAnswer: string;
  studentAnswer: string;
  studentNote: string;
  identificationMarks: number;
  noteMarks: number;
  total: number;
  feedback: string;
}
interface MapEvalResponse {
  results: MapResult[];
  grandTotal: number;
  outOf: number;
  overallFeedback: string;
}

// ── component ──────────────────────────────────────────────────────────────
export default function MapEvaluator({
  isPremium,
  onPaywall,
  token,
}: {
  isPremium: boolean;
  onPaywall: () => void;
  token: string | null;
}) {
  const [year, setYear] = useState<number>(AVAILABLE_YEARS[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [results, setResults] = useState<MapEvalResponse | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!files.length) { setError("Upload at least one image of your Q1 answer."); return; }
    if (!isPremium) { onPaywall(); return; }

    setLoading(true);
    setError("");
    setProgress(10);

    // Convert to base64 with type info
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

    setProgress(30);

    try {
      const resp = await fetch("/api/map-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ files: filePayload, year, token }),
      });
      setProgress(80);
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Evaluation failed");
      setResults(data);
      setProgress(100);

      // Save to history (each entry)
      for (const r of data.results) {
        saveToHistory({
          type: "map" as any,
          question: `[${year} Map Q1] (${r.roman}) ${r.hint}`,
          marks: r.total,
          marksOutOf: 2.5,
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

  const reset = () => {
    setFiles([]); setPreviews([]); setResults(null); setError(""); setProgress(0);
  };

  // ── RESULTS VIEW ──────────────────────────────────────────────────────────
  if (results) {
    const pct = Math.round((results.grandTotal / results.outOf) * 100);
    return (
      <div className="ev-fade">
        {/* header score */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.6rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"#555", marginBottom:6 }}>
              Q1 · Map · {year}
            </div>
            <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
              <span style={{ fontSize:"2.8rem", fontWeight:700, color: scoreColor(pct), fontFamily:"var(--font-mono)", lineHeight:1 }}>
                {results.grandTotal}
              </span>
              <span style={{ color:"#444", fontSize:"1.1rem", fontFamily:"var(--font-mono)" }}>/ {results.outOf}</span>
              <span style={{ color: scoreColor(pct), fontSize:"0.85rem", fontFamily:"var(--font-mono)", marginLeft:4 }}>({pct}%)</span>
            </div>
          </div>
          <button onClick={reset} style={{ padding:"8px 16px", borderRadius:6, border:"1px solid #2a2a2a", background:"transparent", color:"#666", fontFamily:"var(--font-mono)", fontSize:"0.6rem", letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer" }}>
            Evaluate Again
          </button>
        </div>

        {/* overall feedback */}
        <div style={{ marginBottom:20, padding:"14px 16px", borderRadius:8, background:"#0d0d0d", border:"1px solid #1e1e1e" }}>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.58rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#555", marginBottom:6 }}>Overall</div>
          <p style={{ fontFamily:"var(--font-ui)", fontSize:"0.82rem", color:"#aaa", lineHeight:1.6, margin:0 }}>{results.overallFeedback}</p>
        </div>

        {/* score bar */}
        <div style={{ marginBottom:24, height:4, borderRadius:2, background:"#1a1a1a", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background: scoreColor(pct), borderRadius:2, transition:"width 0.6s ease" }} />
        </div>

        {/* per-location table */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {results.results.map((r) => {
            const open = expandedRow === r.number;
            const rPct = Math.round((r.total / 2.5) * 100);
            return (
              <div key={r.number} style={{ border:"1px solid #1e1e1e", borderRadius:7, overflow:"hidden", background:"#0a0a0a" }}>
                <button
                  onClick={() => setExpandedRow(open ? null : r.number)}
                  style={{ width:"100%", padding:"12px 14px", display:"flex", alignItems:"center", gap:10, background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}
                >
                  {/* roman numeral badge */}
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.65rem", color:"#444", width:28, flexShrink:0 }}>({r.roman})</span>
                  {/* hint */}
                  <span style={{ fontFamily:"var(--font-ui)", fontSize:"0.76rem", color:"#888", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.hint}</span>
                  {/* marks chip */}
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.72rem", color: scoreColor(rPct), fontWeight:600, flexShrink:0 }}>{r.total}/2.5</span>
                  {/* chevron */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" style={{ transform: open?"rotate(180deg)":"none", transition:"0.15s", flexShrink:0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {open && (
                  <div style={{ padding:"0 14px 14px 14px", borderTop:"1px solid #151515" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10, marginTop:12 }}>
                      <div>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.56rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#444", marginBottom:4 }}>Student Answer</div>
                        <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.78rem", color:"#aaa" }}>{r.studentAnswer || <em style={{color:"#333"}}>blank</em>}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.56rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#444", marginBottom:4 }}>Correct Answer</div>
                        <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.78rem", color:"#22c55e" }}>{r.correctAnswer}</div>
                      </div>
                    </div>
                    {r.studentNote && (
                      <div style={{ marginBottom:10 }}>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.56rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#444", marginBottom:4 }}>Student Note (~30 words)</div>
                        <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.76rem", color:"#888", lineHeight:1.55 }}>{r.studentNote}</div>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:16, marginBottom:8 }}>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.66rem", color:"#555" }}>
                        ID <span style={{ color: r.identificationMarks>=1.5?"#22c55e":r.identificationMarks>0?"#f59e0b":"#ef4444" }}>{r.identificationMarks}/1.5</span>
                      </span>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.66rem", color:"#555" }}>
                        Note <span style={{ color: r.noteMarks>=1?"#22c55e":r.noteMarks>0?"#f59e0b":"#ef4444" }}>{r.noteMarks}/1</span>
                      </span>
                    </div>
                    <div style={{ fontFamily:"var(--font-ui)", fontSize:"0.74rem", color:"#666", lineHeight:1.5, borderLeft:"2px solid #222", paddingLeft:10 }}>{r.feedback}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="ev-fade">
      {/* paywall banner */}
      {!isPremium && (
        <div onClick={onPaywall} style={{ marginBottom:20, padding:"12px 16px", borderRadius:7,
          background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)",
          cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", letterSpacing:"0.14em",
            textTransform:"uppercase", color:"#fbbf24" }}>Premium feature — tap to upgrade</span>
        </div>
      )}
      {/* year selector */}
      <div style={{ marginBottom:24 }}>
        <label style={{ display:"block", fontFamily:"var(--font-mono)", fontSize:"0.62rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"#666", marginBottom:10 }}>
          Paper Year
        </label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {AVAILABLE_YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              style={{
                padding:"7px 14px", borderRadius:5, cursor:"pointer",
                background: year===y ? "rgba(59,130,246,0.1)" : "#0d0d0d",
                border: year===y ? "1px solid rgba(59,130,246,0.4)" : "1px solid #2a2a2a",
                color: year===y ? "#93c5fd" : "#555",
                fontFamily:"var(--font-mono)", fontSize:"0.68rem", letterSpacing:"0.08em",
                transition:"all 0.15s",
              }}
            >{y}</button>
          ))}
        </div>
      </div>

      {/* drop zone */}
      <div style={{ marginBottom:24 }}>
        <label style={{ display:"block", fontFamily:"var(--font-mono)", fontSize:"0.62rem", letterSpacing:"0.25em", textTransform:"uppercase", color:"#666", marginBottom:10 }}>
          Upload Q1 Answer Images (max 6)
        </label>
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border:"1.5px dashed #2a2a2a", borderRadius:8, padding:"28px 20px",
            textAlign:"center", background:"#090909", cursor:"pointer", transition:"border-color 0.15s",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" style={{ display:"none" }}
            onChange={(e) => e.target.files && addFiles(e.target.files)} />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.4" strokeLinecap="round" style={{ margin:"0 auto 10px" }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"#444", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>
            Drop images here or click to upload
          </p>
          <p style={{ fontFamily:"var(--font-ui)", fontSize:"0.7rem", color:"#333", marginTop:6, marginBottom:0 }}>
            Upload images or PDF of your Q1 answer
          </p>
        </div>
      </div>

      {/* previews */}
      {previews.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
          {previews.map((src, i) => (
            <div key={i} style={{ position:"relative", width:72, height:72 }}>
              {src === "__pdf__" ? (
                <div style={{ width:72, height:72, borderRadius:6, border:"1px solid #222", background:"#0d0d0d", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.48rem", color:"#444", letterSpacing:"0.08em" }}>PDF</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" style={{ width:72, height:72, objectFit:"cover", borderRadius:6, border:"1px solid #222" }} />
              )}
              <button
                onClick={() => removeFile(i)}
                style={{ position:"absolute", top:-6, right:-6, width:18, height:18, borderRadius:"50%", background:"#1a1a1a", border:"1px solid #333", color:"#666", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, fontSize:"0.7rem", lineHeight:1 }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* hint: year map preview */}
      <div style={{ marginBottom:24, padding:"12px 14px", borderRadius:7, background:"#0d0d0d", border:"1px solid #1a1a1a" }}>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.58rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"#444", marginBottom:8 }}>
          {year} Q1 — Locations to Identify
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {mapData.filter(e => e.year === year).sort((a,b)=>a.number-b.number).map((e) => (
            <div key={e.number} style={{ display:"flex", gap:10, alignItems:"baseline" }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.62rem", color:"#444", width:28, flexShrink:0 }}>({toRoman(e.number)})</span>
              <span style={{ fontFamily:"var(--font-ui)", fontSize:"0.73rem", color:"#555" }}>{e.hint}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom:16, padding:"10px 14px", borderRadius:6, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", fontFamily:"var(--font-ui)", fontSize:"0.78rem", color:"#f87171" }}>
          {error}
        </div>
      )}

      {/* loading bar */}
      {loading && (
        <div style={{ marginBottom:16 }}>
          <div style={{ height:2, background:"#1a1a1a", borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progress}%`, background:"#3b82f6", borderRadius:2, transition:"width 0.4s ease" }} />
          </div>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:"0.58rem", color:"#444", letterSpacing:"0.14em", textTransform:"uppercase", marginTop:8 }}>
            Analysing your map answer…
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width:"100%", padding:"14px", borderRadius:7, cursor: loading ? "not-allowed" : "pointer",
          background: loading ? "#111" : "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 100%)",
          border: loading ? "1px solid #1e1e1e" : "1px solid rgba(59,130,246,0.3)",
          color: loading ? "#333" : "#93c5fd",
          fontFamily:"var(--font-mono)", fontSize:"0.65rem", letterSpacing:"0.2em", textTransform:"uppercase",
          transition:"all 0.18s",
        }}
      >
        {loading ? "Evaluating…" : `Evaluate Q1 Map — ${year}`}
      </button>
    </div>
  );
}
