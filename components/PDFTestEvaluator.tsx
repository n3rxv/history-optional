"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

interface PaperQuestion { id: string; marks: number; text: string; }

interface QuestionResult {
  question: PaperQuestion;
  evaluation: any | null;
  error?: string;
}

interface PDFTestEvaluatorProps {
  isPremium: boolean;
  onPaywall: () => void;
  token: string | null;
  paperQuestions?: PaperQuestion[];
  variant?: "evaluate" | "test";
}

async function pdfToImages(file: File): Promise<File[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const images: File[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, canvas, viewport } as any).promise;
    const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/jpeg", 0.9));
    images.push(new File([blob], `page-${i}.jpg`, { type: "image/jpeg" }));
  }
  return images;
}

const BLUE = "var(--accent, #4f8ef7)";
const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)", letterSpacing: "0.18em",
  textTransform: "uppercase", fontSize: "0.53rem",
};

function ScoreBar({ awarded, outOf }: { awarded: number; outOf: number }) {
  const pct = outOf > 0 ? (awarded / outOf) * 100 : 0;
  const col = pct >= 70 ? "#4ade80" : pct >= 50 ? "#3b82f6" : "#f87171";
  return (
    <div style={{ height: 3, background: "#222", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 2, transition: "width 0.5s" }} />
    </div>
  );
}

function SectionMark({ label, awarded, outOf }: { label: string; awarded: number; outOf: number }) {
  return (
    <div style={{ background: "#0e0e0e", border: "1px solid #1e1e1e", borderRadius: 6, padding: "8px 12px" }}>
      <div style={{ ...mono, color: "#555", fontSize: "0.44rem", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "#ddd" }}>
        {awarded}<span style={{ color: "#444", fontSize: "0.7rem" }}>/{outOf}</span>
      </div>
      <ScoreBar awarded={awarded} outOf={outOf} />
    </div>
  );
}

function EvalCard({ result, isOpen, onToggle }: {
  result: QuestionResult;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [tab, setTab] = useState<"feedback" | "model">("feedback");
  const { question, evaluation, error } = result;

  const pct = evaluation
    ? (evaluation.marks / evaluation.marks_out_of) * 100
    : 0;
  const scoreCol = pct >= 70 ? "#4ade80" : pct >= 50 ? "#3b82f6" : "#f87171";

  return (
    <div style={{
      border: `1px solid ${isOpen ? BLUE + "44" : "#1e1e1e"}`,
      borderRadius: 8,
      overflow: "hidden",
      marginBottom: 8,
      transition: "border-color 0.15s",
    }}>
      {/* Header — always visible */}
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 16px", cursor: "pointer",
          background: isOpen ? `${BLUE}0c` : "transparent",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            ...mono, fontSize: "0.48rem", color: BLUE,
            background: `${BLUE}18`, border: `1px solid ${BLUE}44`,
            borderRadius: 4, padding: "3px 9px",
          }}>
            {question.id}
          </div>
          <span style={{ fontSize: "0.72rem", color: "#ccc", fontFamily: "var(--font-mono)" }}>
            {question.marks}M
          </span>
          <span style={{ fontSize: "0.7rem", color: "#666", maxWidth: 340,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {question.text}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {evaluation && (
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "1rem",
              fontWeight: 700, color: scoreCol,
            }}>
              {evaluation.marks}
              <span style={{ color: "#444", fontSize: "0.65rem", fontWeight: 400 }}>
                /{evaluation.marks_out_of}
              </span>
            </span>
          )}
          {error && <span style={{ ...mono, color: "#f47070" }}>Error</span>}
          <span style={{ color: "#444", fontSize: "0.9rem", transition: "transform 0.15s",
            display: "block", transform: isOpen ? "rotate(180deg)" : "none" }}>▾</span>
        </div>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div style={{ borderTop: `1px solid ${BLUE}22`, padding: "18px 18px 20px" }}>

          {error && (
            <div style={{ padding: "10px 14px", background: "#1a0808", borderRadius: 6,
              border: "1px solid #3a1515", color: "#f47070", fontSize: "0.72rem",
              fontFamily: "var(--font-mono)" }}>
              {error}
            </div>
          )}

          {evaluation && (
            <>
              {/* Score + section marks */}
              <div style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                <div style={{ background: "#0e0e0e", border: `1px solid ${scoreCol}33`,
                  borderRadius: 8, padding: "14px 20px", minWidth: 90, textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "2.8rem",
                    fontWeight: 700, color: scoreCol, lineHeight: 1, letterSpacing: "-0.04em" }}>
                    {evaluation.marks}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#555", marginTop: 2 }}>
                    / {evaluation.marks_out_of}
                  </div>
                  {evaluation.word_count && (
                    <div style={{
                      ...mono, fontSize: "0.42rem", marginTop: 8,
                      color: evaluation.word_count_rating === "GOOD" ? "#4ade80"
                           : evaluation.word_count_rating === "LOW" ? "#f87171" : "#facc15",
                    }}>
                      {evaluation.word_count}w · {evaluation.word_count_rating}
                    </div>
                  )}
                </div>
                {evaluation.section_marks && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6, flex: 1 }}>
                    {(["introduction","body","conclusion","presentation"] as const).map(sec => (
                      evaluation.section_marks[sec] && (
                        <SectionMark
                          key={sec}
                          label={sec}
                          awarded={evaluation.section_marks[sec].awarded}
                          outOf={evaluation.section_marks[sec].out_of}
                        />
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #1a1a1a", paddingBottom: 0 }}>
                {(["feedback", "model"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    ...mono, fontSize: "0.46rem", padding: "7px 14px",
                    background: "none", border: "none", cursor: "pointer",
                    color: tab === t ? "#fff" : "#555",
                    borderBottom: tab === t ? `2px solid ${BLUE}` : "2px solid transparent",
                    marginBottom: -1,
                  }}>
                    {t === "feedback" ? "Feedback" : "Model Answer"}
                  </button>
                ))}
              </div>

              {/* Feedback tab */}
              {tab === "feedback" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* Overall */}
                  {evaluation.overall_feedback && (
                    <div style={{ background: "#0e0e0e", borderRadius: 7, padding: "13px 15px",
                      border: `1px solid ${BLUE}22`, borderLeft: `3px solid ${BLUE}` }}>
                      <div style={{ ...mono, color: BLUE, marginBottom: 6 }}>Overall</div>
                      <p style={{ fontSize: "0.78rem", color: "#bbb", lineHeight: 1.75, margin: 0 }}>
                        {evaluation.overall_feedback}
                      </p>
                    </div>
                  )}

                  {/* Section marks reasoning */}
                  {evaluation.section_marks && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(["introduction","body","conclusion","presentation"] as const).map(sec => {
                        const sm = evaluation.section_marks[sec];
                        if (!sm?.reasoning) return null;
                        return (
                          <div key={sec} style={{ background: "#0e0e0e", borderRadius: 6,
                            padding: "10px 14px", border: "1px solid #1a1a1a" }}>
                            <div style={{ ...mono, color: "#555", marginBottom: 4, fontSize: "0.45rem" }}>
                              {sec} · {sm.awarded}/{sm.out_of}
                            </div>
                            <p style={{ fontSize: "0.72rem", color: "#888", lineHeight: 1.65, margin: 0 }}>
                              {sm.reasoning}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Body strengths / weaknesses */}
                  {evaluation.body && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {evaluation.body.strengths?.length > 0 && (
                        <div style={{ background: "#0a1a0a", borderRadius: 7, padding: "12px 14px",
                          border: "1px solid #1a2a1a" }}>
                          <div style={{ ...mono, color: "#4ade80", marginBottom: 8, fontSize: "0.45rem" }}>Strengths</div>
                          {evaluation.body.strengths.map((s: string, i: number) => (
                            <p key={i} style={{ fontSize: "0.7rem", color: "#aaa", lineHeight: 1.65, margin: "0 0 6px",
                              paddingLeft: 10, borderLeft: "2px solid #4ade8044" }}>
                              {s}
                            </p>
                          ))}
                        </div>
                      )}
                      {evaluation.body.weaknesses?.length > 0 && (
                        <div style={{ background: "#1a0a0a", borderRadius: 7, padding: "12px 14px",
                          border: "1px solid #2a1a1a" }}>
                          <div style={{ ...mono, color: "#f87171", marginBottom: 8, fontSize: "0.45rem" }}>Gaps</div>
                          {evaluation.body.weaknesses.map((w: string, i: number) => (
                            <p key={i} style={{ fontSize: "0.7rem", color: "#aaa", lineHeight: 1.65, margin: "0 0 6px",
                              paddingLeft: 10, borderLeft: "2px solid #f8717144" }}>
                              {w}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggestions */}
                  {evaluation.body?.suggestions?.length > 0 && (
                    <div style={{ background: "#0e0e0e", borderRadius: 7, padding: "12px 14px",
                      border: "1px solid #1a1a1a" }}>
                      <div style={{ ...mono, color: "#facc15", marginBottom: 8, fontSize: "0.45rem" }}>Suggestions</div>
                      {evaluation.body.suggestions.map((s: string, i: number) => (
                        <p key={i} style={{ fontSize: "0.7rem", color: "#aaa", lineHeight: 1.65, margin: "0 0 6px",
                          paddingLeft: 10, borderLeft: "2px solid #facc1544" }}>
                          {s}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Historians */}
                  {evaluation.historians_to_cite?.length > 0 && (
                    <div style={{ background: "#0e0e0e", borderRadius: 7, padding: "12px 14px",
                      border: `1px solid ${BLUE}1a` }}>
                      <div style={{ ...mono, color: BLUE, marginBottom: 10, fontSize: "0.45rem" }}>Historians to Use</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {evaluation.historians_to_cite.map((h: any, i: number) => (
                          <div key={i} style={{ paddingLeft: 10, borderLeft: `2px solid ${BLUE}44` }}>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ddd", marginBottom: 2 }}>
                              {h.name}
                              {h.work && <span style={{ color: "#555" }}> · {h.work}</span>}
                            </div>
                            <div style={{ fontSize: "0.68rem", color: "#777", lineHeight: 1.6 }}>{h.argument}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Model Answer tab */}
              {tab === "model" && evaluation.model_answer && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {evaluation.model_answer.introduction && (
                    <div style={{ background: "#0e0e0e", borderRadius: 7, padding: "12px 15px",
                      border: "1px solid #1a1a1a", borderLeft: `3px solid ${BLUE}` }}>
                      <div style={{ ...mono, color: BLUE, marginBottom: 6, fontSize: "0.45rem" }}>Introduction</div>
                      <p style={{ fontSize: "0.75rem", color: "#bbb", lineHeight: 1.75, margin: 0 }}>
                        {evaluation.model_answer.introduction}
                      </p>
                    </div>
                  )}
                  {Array.isArray(evaluation.model_answer.body) && evaluation.model_answer.body.map((pt: string, i: number) => (
                    <div key={i} style={{ background: "#0e0e0e", borderRadius: 7, padding: "12px 15px",
                      border: "1px solid #1a1a1a", borderLeft: "3px solid #333" }}>
                      <div style={{ ...mono, color: "#555", marginBottom: 6, fontSize: "0.42rem" }}>
                        Point {i + 1}
                      </div>
                      <p style={{ fontSize: "0.72rem", color: "#aaa", lineHeight: 1.75, margin: 0 }}>{pt}</p>
                    </div>
                  ))}
                  {evaluation.model_answer.conclusion && (
                    <div style={{ background: "#0e0e0e", borderRadius: 7, padding: "12px 15px",
                      border: "1px solid #1a1a1a", borderLeft: "3px solid #4ade8044" }}>
                      <div style={{ ...mono, color: "#4ade80", marginBottom: 6, fontSize: "0.45rem" }}>Conclusion</div>
                      <p style={{ fontSize: "0.75rem", color: "#bbb", lineHeight: 1.75, margin: 0 }}>
                        {evaluation.model_answer.conclusion}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PDFTestEvaluator({
  isPremium, onPaywall, token, paperQuestions,
}: PDFTestEvaluatorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"upload" | "loading" | "done">("upload");
  const [stepLabel, setStepLabel] = useState("");
  const [evalCurrent, setEvalCurrent] = useState(0);
  const [evalTotal, setEvalTotal] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

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
    if (!paperQuestions || paperQuestions.length === 0) {
      setError("No questions configured for this paper."); return;
    }
    setError(null);
    setStage("loading");

    try {
      // 1 — Convert PDF to images
      setStepLabel("Converting PDF to images…");
      const images = await pdfToImages(file);

      // 2 — OCR
      setStepLabel(`Extracting handwriting (${images.length} page${images.length > 1 ? "s" : ""})…`);
      const fd = new FormData();
      images.forEach(img => fd.append("files", img));
      let ocrText = "";
      const ocrRes = await fetch("/api/ocr", {
        method: "POST", headers: { "x-user-token": token ?? "" }, body: fd,
      });
      if (ocrRes.ok) {
        const d = await ocrRes.json();
        ocrText = d.text || d.extracted_text || d.transcript || "";
      }
      setTranscript(ocrText);

      // 3 — Evaluate each question sequentially
      setEvalTotal(paperQuestions.length);
      const questionResults: QuestionResult[] = [];

      for (let i = 0; i < paperQuestions.length; i++) {
        const q = paperQuestions[i];
        setEvalCurrent(i + 1);
        setStepLabel(`Evaluating ${q.id} (${q.marks}M)…`);

        try {
          const evalFd = new FormData();
          evalFd.append("question", q.text);
          evalFd.append("marks", q.marks.toString());
          if (ocrText) evalFd.append("extractedText", ocrText);
          images.forEach(img => evalFd.append("files", img));

          const evalRes = await fetch("/api/evaluate", {
            method: "POST", headers: { "x-user-token": token ?? "" }, body: evalFd,
          });
          const evalData = await evalRes.json();
          if (!evalRes.ok) throw new Error(evalData.error ?? "Evaluation failed");
          questionResults.push({ question: q, evaluation: evalData });
        } catch (qErr: any) {
          questionResults.push({ question: q, evaluation: null, error: qErr.message });
        }

        // Small delay to avoid rate limits
        if (i < paperQuestions.length - 1) {
          await new Promise(r => setTimeout(r, 800));
        }
      }

      setResults(questionResults);
      setStage("done");
      if (questionResults.length > 0) setExpanded(questionResults[0].question.id);
    } catch (e: any) {
      setError(e.message);
      setStage("upload");
    }
  }

  // ── PAYWALL ───────────────────────────────────────────────────────────
  if (!isPremium) return (
    <div style={{ border: `1px solid ${BLUE}33`, borderRadius: 10, background: "#111", overflow: "hidden" }}>
      <div style={{ background: `linear-gradient(135deg,${BLUE}18 0%,transparent 60%)`,
        borderBottom: `1px solid ${BLUE}22`, padding: "22px 24px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: `${BLUE}22`,
              border: `1px solid ${BLUE}44`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "1rem" }}>📄</div>
            <div>
              <div style={{ ...mono, color: "#fff", fontSize: "0.56rem" }}>AI Full Paper Evaluation</div>
              <div style={{ fontSize: "0.6rem", color: BLUE, fontFamily: "var(--font-mono)", marginTop: 2 }}>Premium Feature</div>
            </div>
          </div>
          <div style={{ ...mono, fontSize: "0.42rem", color: BLUE, background: `${BLUE}15`,
            border: `1px solid ${BLUE}33`, borderRadius: 4, padding: "3px 9px" }}>PREMIUM</div>
        </div>
        <p style={{ fontSize: "0.86rem", color: "#ccc", lineHeight: 1.7, margin: "0 0 6px" }}>
          Upload your complete answer script as a PDF. AI reads every page, identifies each answer,
          and gives marks + detailed feedback for the entire paper — all at once.
        </p>
        <p style={{ ...mono, color: "#555", fontSize: "0.54rem", margin: 0 }}>
          Handwritten scripts · Typed answers · Self-contained PDFs
        </p>
      </div>
      <div style={{ padding: "18px 24px 22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { n: "01", t: "Write answers",     s: "On paper or digitally" },
            { n: "02", t: "Scan to PDF",        s: "All pages in one file"  },
            { n: "03", t: "Upload & evaluate",  s: "AI scores instantly"    },
          ].map(x => (
            <div key={x.n} style={{ padding: "12px 13px", background: "#161616",
              borderRadius: 6, border: `1px solid ${BLUE}1a` }}>
              <span style={{ ...mono, color: BLUE, opacity: 0.5, display: "block", marginBottom: 5 }}>{x.n}</span>
              <span style={{ fontSize: "0.7rem", color: "#ddd", fontFamily: "var(--font-mono)", display: "block", marginBottom: 2 }}>{x.t}</span>
              <span style={{ fontSize: "0.62rem", color: "#666" }}>{x.s}</span>
            </div>
          ))}
        </div>
        <button onClick={onPaywall} style={{ width: "100%", padding: "11px 0", background: `${BLUE}18`,
          border: `1px solid ${BLUE}44`, borderRadius: 6, color: "#fff",
          fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em",
          textTransform: "uppercase", cursor: "pointer" }}>
          🔒 &nbsp;Unlock with Premium →
        </button>
      </div>
    </div>
  );

  // ── LOADING ───────────────────────────────────────────────────────────
  if (stage === "loading") {
    const progress = evalTotal > 0 ? (evalCurrent / evalTotal) * 100 : 0;
    return (
      <div style={{ border: `1px solid ${BLUE}33`, borderRadius: 10, background: "#111",
        padding: "36px 28px", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: 18 }}>📄</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "#ddd", marginBottom: 8 }}>
          {stepLabel}
        </div>
        {evalTotal > 0 && (
          <div style={{ ...mono, color: "#555", marginBottom: 16, fontSize: "0.47rem" }}>
            Question {evalCurrent} of {evalTotal}
          </div>
        )}
        <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden", maxWidth: 300, margin: "0 auto" }}>
          <div style={{
            height: "100%", borderRadius: 2, background: BLUE,
            width: evalTotal > 0 ? `${progress}%` : "40%",
            transition: "width 0.4s",
            animation: evalTotal === 0 ? "pulse 1.5s ease-in-out infinite" : undefined,
          }} />
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────
  if (stage === "done") {
    const totalAwarded = results.reduce((sum, r) => sum + (r.evaluation?.marks ?? 0), 0);
    const totalMax = results.reduce((sum, r) => sum + (r.evaluation?.marks_out_of ?? r.question.marks), 0);
    const overallPct = totalMax > 0 ? (totalAwarded / totalMax) * 100 : 0;
    const overallCol = overallPct >= 70 ? "#4ade80" : overallPct >= 50 ? "#3b82f6" : "#f87171";

    return (
      <div style={{ border: `1px solid ${BLUE}33`, borderRadius: 10, background: "#111", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${BLUE}18 0%,transparent 60%)`,
          borderBottom: `1px solid ${BLUE}22`, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ ...mono, color: "#fff" }}>Evaluation Complete</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: "2.8rem", fontFamily: "var(--font-mono)",
                  fontWeight: 700, color: overallCol, lineHeight: 1, letterSpacing: "-0.04em" }}>
                  {totalAwarded}
                </span>
                <span style={{ fontSize: "0.9rem", color: "#555", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
                  / {totalMax}
                </span>
              </div>
              <div style={{ ...mono, color: "#555", fontSize: "0.44rem", marginTop: 4 }}>
                {results.length} question{results.length > 1 ? "s" : ""} evaluated
              </div>
            </div>
            <button onClick={() => { setStage("upload"); setFile(null); setResults([]); setTranscript(""); }} style={{
              ...mono, color: "#888", background: "none",
              border: "1px solid #2a2a2a", borderRadius: 4, padding: "7px 13px", cursor: "pointer",
            }}>↩ Evaluate Another</button>
          </div>
        </div>

        <div style={{ padding: "16px 18px 20px" }}>
          {/* Transcript toggle */}
          {transcript && (
            <div style={{ marginBottom: 14 }}>
              <button onClick={() => setShowTranscript(p => !p)} style={{
                ...mono, fontSize: "0.46rem", color: "#555", background: "none",
                border: "1px solid #1e1e1e", borderRadius: 4, padding: "6px 12px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ transform: showTranscript ? "rotate(90deg)" : "none", display: "inline-block" }}>▶</span>
                {showTranscript ? "Hide Transcript" : "Show OCR Transcript"}
              </button>
              {showTranscript && (
                <div style={{ marginTop: 8, background: "#0a0a0a", border: "1px solid #1a1a1a",
                  borderRadius: 7, padding: "14px 16px", maxHeight: 260, overflowY: "auto" }}>
                  <pre style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#777",
                    lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {transcript}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Question cards */}
          {results.map(r => (
            <EvalCard
              key={r.question.id}
              result={r}
              isOpen={expanded === r.question.id}
              onToggle={() => setExpanded(p => p === r.question.id ? null : r.question.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── UPLOAD ────────────────────────────────────────────────────────────
  return (
    <div style={{ border: `1px solid ${BLUE}33`, borderRadius: 10, overflow: "hidden", background: "#111" }}>
      <div style={{ background: `linear-gradient(135deg,${BLUE}18 0%,transparent 60%)`,
        borderBottom: `1px solid ${BLUE}22`, padding: "22px 24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `${BLUE}20`,
              border: `1px solid ${BLUE}44`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "1.1rem" }}>📄</div>
            <div>
              <div style={{ ...mono, color: "#fff", fontSize: "0.56rem" }}>AI Full Paper Evaluation</div>
              <div style={{ fontSize: "0.6rem", color: BLUE, fontFamily: "var(--font-mono)", marginTop: 2 }}>
                {paperQuestions?.length
                  ? `${paperQuestions.length} question${paperQuestions.length > 1 ? "s" : ""} · Upload your script`
                  : "Upload · Evaluate · Get Feedback"}
              </div>
            </div>
          </div>
          <div style={{ ...mono, fontSize: "0.42rem", color: BLUE, background: `${BLUE}15`,
            border: `1px solid ${BLUE}44`, borderRadius: 4, padding: "3px 9px" }}>PREMIUM</div>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#ccc", lineHeight: 1.7, margin: "0 0 5px" }}>
          Upload your complete answer script as a PDF. AI reads every page and evaluates
          each question separately — marks and detailed feedback for the whole paper at once.
        </p>
      </div>

      <div style={{ padding: "20px 24px 22px" }}>
        {paperQuestions && paperQuestions.length > 0 && (
          <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {paperQuestions.map(q => (
              <div key={q.id} style={{ ...mono, fontSize: "0.43rem", color: "#666",
                background: "#111", border: "1px solid #222", borderRadius: 4, padding: "4px 9px" }}>
                {q.id} · {q.marks}M
              </div>
            ))}
          </div>
        )}

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1px dashed ${dragging ? BLUE : file ? BLUE + "88" : "#2a2a2a"}`,
            borderRadius: 6, padding: "28px 20px", textAlign: "center", cursor: "pointer",
            background: dragging ? `${BLUE}10` : file ? `${BLUE}08` : "transparent",
            transition: "all 0.15s", marginBottom: error ? 10 : 16,
          }}
        >
          <input ref={inputRef} type="file" accept="application/pdf" style={{ display: "none" }}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div style={{ fontSize: "1.6rem", marginBottom: 10 }}>📄</div>
          {file ? (
            <>
              <div style={{ fontSize: "0.75rem", color: "#ddd", fontFamily: "var(--font-mono)", marginBottom: 3 }}>{file.name}</div>
              <div style={{ fontSize: "0.58rem", color: "#666", fontFamily: "var(--font-mono)" }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB · Click to change
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "0.75rem", color: "#aaa", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
                Drop your answer PDF here
              </div>
              <div style={{ fontSize: "0.58rem", color: "#555", fontFamily: "var(--font-mono)" }}>or click to browse</div>
            </>
          )}
        </div>

        {error && (
          <div style={{ fontSize: "0.63rem", color: "#f47070", fontFamily: "var(--font-mono)",
            marginBottom: 12, padding: "8px 12px", background: "#1a0808",
            borderRadius: 4, border: "1px solid #3a1515" }}>
            {error}
          </div>
        )}

        {file && (
          <button onClick={handleEvaluate} style={{
            width: "100%", padding: "12px 0", background: BLUE, color: "#fff",
            border: "none", borderRadius: 6, fontFamily: "var(--font-mono)",
            fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
          }}>
            Evaluate Full Paper →
          </button>
        )}
      </div>
    </div>
  );
}
