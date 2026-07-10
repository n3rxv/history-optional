"use client";
import { useLang } from '@/lib/i18n/LangContext';
import { useState, useRef } from "react";
import { saveToHistory } from "@/hooks/useAnswerHistory";

interface CheckedResult {
  number: string;
  clue: string;
  status: "correct" | "partial" | "wrong" | "blank";
  marks: number;
  maxMarks: number;
  studentSite: string | null;
  studentDescription: string | null;
  correctSite: string | null;
  correctLocation: string | null;
  siteMarks: number;
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

function scoreColor(pct: number) {
  if (pct >= 80) return "#10b981";
  if (pct >= 55) return "#f59e0b";
  return "#ef4444";
}

function dot(status: string) {
  if (status === "correct") return "#10b981";
  if (status === "partial") return "#f59e0b";
  if (status === "blank") return "#333";
  return "#ef4444";
}

export default function MapEvaluator({
  token,
  onLoginRequired,
}: {
  token: string | null;
  onLoginRequired: () => void;
}) {
  const [file, setFile]         = useState<File | null>(null);
  const [drag, setDrag]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const { langHi } = useLang();
  const [stage, setStage]       = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState("");
  const [results, setResults]   = useState<MapCheckResponse | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".pdf")) { setError("Please upload a PDF file."); return; }
    setFile(f); setError(""); setResults(null);
  };

  // Convert PDF to base64
  const toBase64 = (f: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1]);
      r.onerror = () => rej(new Error("Read failed"));
      r.readAsDataURL(f);
    });

  const handleSubmit = async () => {
    if (!token) { onLoginRequired(); return; }
    if (!file) { setError("Upload your answer booklet PDF first."); return; }

    setLoading(true); setError(""); setProgress(10);
    setStage("Reading PDF…");

    try {
      const pdfBase64 = await toBase64(file);
      setProgress(20); setStage("Opening payment…");

      // Step 1: Create Razorpay order
      const orderRes = await fetch("/api/razorpay/map-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": token },
      });
      const orderData = await orderRes.json();
      if (!orderData.orderId) throw new Error(orderData.error || "Order creation failed");

      setLoading(false); // pause loading while Razorpay modal is open

      // Step 2: Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key:      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount:   orderData.amount,
          currency: orderData.currency,
          order_id: orderData.orderId,
          name:     "History Optional",
          description: "Map Answer Evaluation — ₹49",
          image:    "/favicon.svg",
          theme:    { color: "#6366f1" },
          modal: {
            ondismiss: () => {
              setStage(""); setProgress(0);
              reject(new Error("Payment cancelled"));
            },
          },
          handler: async (resp: any) => {
            // Step 3: Verify payment + run evaluation server-side
            setLoading(true); setProgress(35); setStage("Verifying payment…");
            try {
              const vRes = await fetch("/api/razorpay/map-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-user-token": token },
                body: JSON.stringify({
                  ...resp,
                  pdfBase64,
                  lang: langHi ? "hi" : "en",
                }),
              });
              setProgress(90); setStage("Processing results…");
              const data = await vRes.json();
              if (!vRes.ok || data.error) throw new Error(data.error || "Evaluation failed");

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
                  body:         { awarded: 0, out_of: 0 },
                  conclusion:   { awarded: 0, out_of: 0 },
                  presentation: { awarded: 0, out_of: 0 },
                },
              });
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        });
        rzp.on("payment.failed", () => {
          setStage(""); setProgress(0);
          reject(new Error("Payment failed"));
        });
        rzp.open();
      });

    } catch (e: any) {
      if (e.message !== "Payment cancelled") setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setResults(null);
    setError(""); setProgress(0); setStage("");
  };

  // ── RESULTS VIEW ──────────────────────────────────────────────
  if (results) {
    const pct = Math.round(results.percentage);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* Score header */}
        <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12, padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:"#555", fontSize:12, marginBottom:4 }}>Total Score</div>
            <div style={{ fontSize:32, fontWeight:700, color: scoreColor(pct), fontFamily:"monospace" }}>
              {results.totalMarks}/{results.maxTotal}
            </div>
            <div style={{ color:"#444", fontSize:13, marginTop:2 }}>{pct}%</div>
          </div>
          <button onClick={reset} style={{ padding:"8px 16px", background:"#161616", border:"1px solid #222", borderRadius:8, color:"#888", fontSize:13, cursor:"pointer" }}>
            New PDF
          </button>
        </div>

        {/* Results list */}
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
                  <span style={{
                    color: r.status === "correct" ? "#10b981" : r.status === "partial" ? "#f59e0b" : r.status === "blank" ? "#444" : "#ef4444",
                    fontSize:13, fontFamily:"monospace", minWidth:44, textAlign:"right"
                  }}>
                    {r.status === "blank" ? "—" : `${r.marks}/${r.maxMarks}`}
                  </span>
                  <span style={{ color:"#444", fontSize:11 }}>{open ? "▲" : "▼"}</span>
                </button>

                {open && (
                  <div style={{ padding:"0 14px 12px", borderTop:"1px solid #1a1a1a" }}>

                    <div style={{ marginTop:10, padding:"7px 10px", background:"#141414", borderRadius:6, border:"1px solid #252525" }}>
                      <span style={{ color:"#666", fontSize:11, marginRight:6 }}>Clue:</span>
                      <span style={{ color:"#bbb", fontSize:12 }}>{r.clue || "—"}</span>
                    </div>

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
                            {r.status !== "blank" ? (r.siteMarks > 0 ? `✓ ${r.siteMarks} pts` : "✗ 0 pts") : ""}
                          </span>
                        </div>
                        <div style={{ color: r.status === "correct" || r.status === "partial" ? "#10b981" : "#ef4444", fontSize:13, fontWeight:500 }}>
                          {r.correctSite ?? "—"}
                        </div>
                        {r.correctLocation && (
                          <div style={{ color:"#444", fontSize:11, marginTop:3 }}>{r.correctLocation}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop:8, background:"#111", border:"1px solid #252525", borderRadius:8, overflow:"hidden" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"#161616", borderBottom:"1px solid #252525" }}>
                        <span style={{ color:"#777", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em" }}>Your description</span>
                        {r.status !== "blank" && (
                          <span style={{
                            fontSize:11, fontFamily:"monospace",
                            color: r.descriptionScore >= 1 ? "#10b981" : r.descriptionScore > 0 ? "#f59e0b" : "#ef4444"
                          }}>
                            {r.descriptionScore}/1 pts
                          </span>
                        )}
                      </div>
                      <div style={{ padding:"10px 12px", color: r.studentDescription ? "#ccc" : "#444", fontSize:13, lineHeight:1.8, fontStyle: r.studentDescription ? "normal" : "italic" }}>
                        {r.studentDescription ?? "Nothing written"}
                      </div>
                      {r.descriptionFeedback && (
                        <div style={{ padding:"10px 12px", borderTop:"1px solid #1e1e1e", background:"#0e0e0e", display:"flex", gap:8, alignItems:"flex-start" }}>
                          <span style={{ fontSize:14, flexShrink:0 }}>💬</span>
                          <span style={{ color:"#aaa", fontSize:12, lineHeight:1.7 }}>{r.descriptionFeedback}</span>
                        </div>
                      )}
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

  // ── UPLOAD VIEW ───────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Pricing badge */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.15)", borderRadius:8 }}>
        <span style={{ fontSize:16 }}>🗺️</span>
        <span style={{ color:"#a5b4fc", fontSize:13 }}>₹49 per evaluation · pay after upload</span>
      </div>

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
            <div style={{ color:"#555", fontSize:13 }}>Map + handwritten/digitally written answers in one PDF</div>
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
        {loading ? stage || "Evaluating…" : file ? "Pay ₹49 & Evaluate →" : "Upload PDF to evaluate"}
      </button>
    </div>
  );
}
