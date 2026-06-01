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
interface Segment {
  questionNumber: string;
  marks: number;
  questionText: string;
  answerText: string;
}

function toArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return [val];
  return [];
}
function bodyParas(body: any): string[] {
  if (!body) return [];
  if (Array.isArray(body)) return body.filter(Boolean);
  if (typeof body === "string") return body.split("\n").filter(Boolean);
  return [];
}

async function pdfToImages(file: File): Promise<File[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs", import.meta.url
  ).toString();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const images: File[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, canvas, viewport: vp } as any).promise;
    const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/jpeg", 0.9));
    images.push(new File([blob], `page-${i}.jpg`, { type: "image/jpeg" }));
  }
  return images;
}

/* ── Per-question result card ── */
function EvalCard({ result, isOpen, onToggle }: {
  result: QuestionResult; isOpen: boolean; onToggle: () => void;
}) {
  const [tab, setTab] = useState("eval");
  const { question, evaluation: ev, error } = result;
  const pct      = ev ? (ev.marks / ev.marks_out_of) * 100 : 0;
  const scoreCol = pct >= 70 ? "#4ade80" : pct >= 50 ? "#3b82f6" : "#f87171";

  return (
    <div style={{ marginBottom: 12 }}>
      <div onClick={onToggle} style={{
        background: "#161616", border: "1px solid #2a2a2a", borderRadius: isOpen ? "8px 8px 0 0" : 8,
        padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#3b82f6", flexShrink: 0 }}>{question.id}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#555",
            background: "#222", borderRadius: 4, padding: "2px 7px", flexShrink: 0 }}>
            {question.marks}M
          </span>
          <span style={{ fontSize: "0.85rem", color: "#aaa", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{question.text || `Question ${question.id}`}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {ev && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: scoreCol }}>
              {ev.marks}/{ev.marks_out_of}
            </span>
          )}
          {error && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>Error</span>}
          <span style={{ color: "#444", fontSize: "0.8rem", transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.2s" }}>▾</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ background: "#111", border: "1px solid #2a2a2a", borderTop: "none",
          borderRadius: "0 0 8px 8px", padding: "28px 30px" }}>
          {error && (
            <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 6, padding: "14px 18px", color: "#f87171", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          {ev && (<>
            <div className="pdf-ev-qbox">
              <div className="pdf-ev-qlabel">Question · {question.marks}M</div>
              <div className="pdf-ev-qtext">{question.text || `Question ${question.id}`}</div>
            </div>

            <div className="pdf-ev-score-row">
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.53rem", letterSpacing: "0.28em",
                  textTransform: "uppercase", color: "#555", marginBottom: 14 }}>Marks Scored</div>
                <div>
                  <span className="pdf-ev-score-num" style={{ color: scoreCol }}>{ev.marks}</span>
                  <span className="pdf-ev-score-denom"> /{ev.marks_out_of}</span>
                </div>
                <div className="pdf-ev-bar-bg">
                  <div className="pdf-ev-bar-fill" style={{ width: `${pct}%`, background: scoreCol }} />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.53rem", letterSpacing: "0.28em",
                  textTransform: "uppercase", color: "#555", marginBottom: 14 }}>Ideal Word Count</div>
                <div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "2.2rem", fontWeight: 700 }}>
                    {question.marks === 10 ? "150" : question.marks === 15 ? "200" : "250"}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "#444" }}> words</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, padding: "14px 18px", background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6, marginBottom: 32 }}>
              <span style={{ color: "#555", flexShrink: 0, fontSize: "0.8rem" }}>ℹ</span>
              <p style={{ fontSize: "0.78rem", color: "#555", lineHeight: 1.7, margin: 0, fontFamily: "var(--font-body)" }}>
                These marks are indicative, not exact — expect a 1–2 mark variance from what an actual UPSC examiner may award.
              </p>
            </div>

            {ev.section_marks && (
              <div className="pdf-ev-sec-grid">
                {(["introduction","body","conclusion","presentation"] as const).map(sec => {
                  const s = ev.section_marks[sec];
                  if (!s) return null;
                  const sp = Math.round((s.awarded / s.out_of) * 100);
                  const sc = sp >= 75 ? "#4ade80" : sp >= 50 ? "#3b82f6" : "#f87171";
                  return (
                    <div key={sec} className="pdf-ev-sec-card">
                      <div className="pdf-ev-sec-lbl">{sec}</div>
                      <div>
                        <span className="pdf-ev-sec-num" style={{ color: sc }}>{s.awarded}</span>
                        <span className="pdf-ev-sec-den">/{s.out_of}</span>
                      </div>
                      <div className="pdf-ev-sec-bar-bg">
                        <div className="pdf-ev-sec-bar-fill" style={{ width: `${sp}%`, background: sc }} />
                      </div>
                      <div className="pdf-ev-sec-rsn">{s.reasoning}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pdf-ev-tabs">
              {(["eval","model","hist"] as const).map(t => (
                <button key={t} className={`pdf-ev-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                  {t === "eval" ? "Evaluation" : t === "model" ? "Model Answer" : "Historians"}
                </button>
              ))}
            </div>

            {tab === "eval" && (
              <div className="pdf-ev-fade">
                {toArray(ev.demand_of_question).length > 0 && (
                  <div className="pdf-ev-card" style={{ marginBottom: 16 }}>
                    <div className="pdf-ev-ct">Demand of the Question</div>
                    <ul className="pdf-ev-list">
                      {toArray(ev.demand_of_question).map((d: string, i: number) => (
                        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ color: "#3b82f6", flexShrink: 0, marginTop: 3 }}>◆</span>{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ev.introduction && (
                  <div className="pdf-ev-card" style={{ marginBottom: 16 }}>
                    <div className="pdf-ev-ct" style={{ justifyContent: "space-between" }}>
                      <span>Introduction</span>
                      {ev.section_marks?.introduction && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#888" }}>
                          {ev.section_marks.introduction.awarded}/{ev.section_marks.introduction.out_of}
                        </span>
                      )}
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.2em",
                        textTransform: "uppercase", color: "#555", marginBottom: 6 }}>What you wrote</div>
                      <div style={{ fontSize: "0.9rem", color: "#aaa", lineHeight: 1.7, fontStyle: "italic",
                        fontFamily: "var(--font-body)" }}>{ev.introduction.what_was_written}</div>
                    </div>
                    {toArray(ev.introduction.strengths).filter((s: string) => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT")).length > 0 && (
                      <ul className="pdf-ev-list" style={{ marginBottom: 14 }}>
                        {toArray(ev.introduction.strengths).filter((s: string) => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT")).map((s: string, i: number) => (
                          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span style={{ color: "#4ade80", flexShrink: 0, marginTop: 3 }}>✓</span>{s}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div style={{ fontSize: "0.88rem", color: "#b0b0b0", lineHeight: 1.75,
                      fontFamily: "var(--font-body)", marginBottom: 14 }}>
                      {ev.introduction.analysis}
                    </div>
                    {toArray(ev.introduction.suggestions).filter((s: string) => s).length > 0 && (
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.2em",
                          textTransform: "uppercase", color: "#555", marginBottom: 8 }}>How to improve</div>
                        <ul className="pdf-ev-list">
                          {toArray(ev.introduction.suggestions).map((s: string, i: number) => (
                            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <span style={{ color: "#f59e0b", flexShrink: 0, marginTop: 3 }}>→</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ev.model_answer?.introduction && (
                      <div style={{ marginTop: 16, padding: "14px 18px",
                        background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.08)", borderRadius: 6 }}>
                        <div className="pdf-ev-ml">Model introduction</div>
                        <div className="pdf-ev-mp">{ev.model_answer.introduction}</div>
                      </div>
                    )}
                  </div>
                )}

                {ev.body && (
                  <div className="pdf-ev-card" style={{ marginBottom: 16 }}>
                    <div className="pdf-ev-ct" style={{ justifyContent: "space-between" }}>
                      <span>Body</span>
                      {ev.section_marks?.body && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#888" }}>
                          {ev.section_marks.body.awarded}/{ev.section_marks.body.out_of}
                        </span>
                      )}
                    </div>
                    {toArray(ev.body.strengths).filter((s: string) => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT") && !s.startsWith("Use [")).length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.2em",
                          textTransform: "uppercase", color: "#4ade80", marginBottom: 8, opacity: 0.7 }}>What worked</div>
                        <ul className="pdf-ev-list">
                          {toArray(ev.body.strengths).filter((s: string) => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT") && !s.startsWith("Use [")).map((s: string, i: number) => {
                            const tagMatch = s.match(/^\[([^\]]+)\]:\s*/);
                            const tag = tagMatch ? tagMatch[1] : null;
                            const text = tagMatch ? s.slice(tagMatch[0].length) : s;
                            return (
                              <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                <span style={{ color: "#4ade80", flexShrink: 0, marginTop: 3 }}>✓</span>
                                <span>
                                  {tag && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem",
                                    background: "rgba(74,222,128,0.1)", color: "#4ade80", borderRadius: 3,
                                    padding: "1px 6px", marginRight: 6 }}>{tag}</span>}
                                  {text}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {toArray(ev.body.weaknesses).filter((w: string) => w && !w.startsWith("IMPORTANT") && !w.startsWith("Use [")).length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.2em",
                          textTransform: "uppercase", color: "#f87171", marginBottom: 8, opacity: 0.7 }}>What fell short</div>
                        <ul className="pdf-ev-list">
                          {toArray(ev.body.weaknesses).filter((w: string) => w && !w.startsWith("IMPORTANT") && !w.startsWith("Use [")).map((w: string, i: number) => {
                            const tagMatch = w.match(/^\[([^\]]+)\]:\s*/);
                            const tag = tagMatch ? tagMatch[1].toLowerCase() : null;
                            const text = tagMatch ? w.slice(tagMatch[0].length) : w;
                            const tagColors: Record<string, string> = { "missed demand": "#fbbf24", "needs historian": "#f87171", "too descriptive": "#a78bfa", "check this": "#f87171", "structure": "#818cf8" };
                            const dotColor = tag && tagColors[tag] ? tagColors[tag] : "#f87171";
                            return (
                              <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                <span style={{ color: dotColor, flexShrink: 0, marginTop: 3 }}>✗</span>
                                <span>
                                  {tag && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem",
                                    background: `${dotColor}18`, color: dotColor, borderRadius: 3,
                                    padding: "1px 6px", marginRight: 6 }}>{tag}</span>}
                                  {text}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {toArray(ev.body.suggestions).filter((s: string) => s).length > 0 && (
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.2em",
                          textTransform: "uppercase", color: "#555", marginBottom: 8 }}>How to improve</div>
                        <ul className="pdf-ev-list">
                          {toArray(ev.body.suggestions).map((s: string, i: number) => (
                            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <span style={{ color: "#f59e0b", flexShrink: 0, marginTop: 3 }}>→</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {ev.conclusion && (
                  <div className="pdf-ev-card" style={{ marginBottom: 16 }}>
                    <div className="pdf-ev-ct" style={{ justifyContent: "space-between" }}>
                      <span>Conclusion</span>
                      {ev.section_marks?.conclusion && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#888" }}>
                          {ev.section_marks.conclusion.awarded}/{ev.section_marks.conclusion.out_of}
                        </span>
                      )}
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.2em",
                        textTransform: "uppercase", color: "#555", marginBottom: 6 }}>What you wrote</div>
                      <div style={{ fontSize: "0.9rem", color: "#aaa", lineHeight: 1.7, fontStyle: "italic",
                        fontFamily: "var(--font-body)" }}>{ev.conclusion.what_was_written}</div>
                    </div>
                    {toArray(ev.conclusion.strengths).filter((s: string) => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT")).length > 0 && (
                      <ul className="pdf-ev-list" style={{ marginBottom: 14 }}>
                        {toArray(ev.conclusion.strengths).filter((s: string) => s && !s.startsWith("One sentence") && !s.startsWith("IMPORTANT")).map((s: string, i: number) => (
                          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span style={{ color: "#4ade80", flexShrink: 0, marginTop: 3 }}>✓</span>{s}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div style={{ fontSize: "0.88rem", color: "#b0b0b0", lineHeight: 1.75,
                      fontFamily: "var(--font-body)", marginBottom: 14 }}>
                      {ev.conclusion.analysis}
                    </div>
                    {toArray(ev.conclusion.suggestions).filter((s: string) => s).length > 0 && (
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.2em",
                          textTransform: "uppercase", color: "#555", marginBottom: 8 }}>How to improve</div>
                        <ul className="pdf-ev-list">
                          {toArray(ev.conclusion.suggestions).map((s: string, i: number) => (
                            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <span style={{ color: "#f59e0b", flexShrink: 0, marginTop: 3 }}>→</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ev.model_answer?.conclusion && (
                      <div style={{ marginTop: 16, padding: "14px 18px",
                        background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.08)", borderRadius: 6 }}>
                        <div className="pdf-ev-ml">Model conclusion</div>
                        <div className="pdf-ev-mp">{ev.model_answer.conclusion}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pdf-ev-card pdf-ev-card-gold" style={{ marginBottom: 16 }}>
                  <div className="pdf-ev-ct">Overall Feedback</div>
                  <div style={{ fontSize: "0.93rem", color: "#d4d4d4", lineHeight: 1.9, fontFamily: "var(--font-body)" }}>
                    {ev.overall_feedback}
                  </div>
                </div>

                <button className="pdf-ev-btn" onClick={() => setTab("model")}>
                  View Model Answer →
                </button>
              </div>
            )}

            {tab === "model" && ev.model_answer && (
              <div className="pdf-ev-fade">
                <div className="pdf-ev-qbox">
                  <div className="pdf-ev-qlabel">Question · {question.marks}M</div>
                  <div className="pdf-ev-qtext">{question.text || `Question ${question.id}`}</div>
                </div>
                <div className="pdf-ev-card pdf-ev-card-green">
                  <div className="pdf-ev-ct">Model Answer · {question.marks}M</div>
                  <div className="pdf-ev-ml">Introduction</div>
                  <div className="pdf-ev-mp">{ev.model_answer.introduction}</div>
                  <div className="pdf-ev-ml">Body</div>
                  <ul className="pdf-ev-list">
                    {bodyParas(ev.model_answer.body).map((p: string, i: number) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                  <div className="pdf-ev-ml">Conclusion</div>
                  <div className="pdf-ev-mp">{ev.model_answer.conclusion}</div>
                </div>
                <button className="pdf-ev-btn" onClick={() => setTab("eval")}>← View Evaluation</button>
              </div>
            )}

            {tab === "hist" && (
              <div className="pdf-ev-fade">
                <div className="pdf-ev-card">
                  <div className="pdf-ev-ct">Historians to Cite for This Topic</div>
                  {(Array.isArray(ev.historians_to_cite) ? ev.historians_to_cite : []).map((h: any, i: number) => (
                    <div key={i} className="pdf-ev-hist">
                      <div className="pdf-ev-hist-name">{typeof h === "object" && h !== null ? h.name : String(h)}</div>
                      {typeof h === "object" && h !== null && h.work && <div className="pdf-ev-hist-work">{h.work}</div>}
                      <div className="pdf-ev-hist-arg">{typeof h === "object" && h !== null ? h.argument : ""}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>)}
        </div>
      )}
    </div>
  );
}

/* ── Shared CSS ── */
const SHARED_CSS = `
  .pdf-ev-card { background:linear-gradient(135deg,#161616,#111); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:28px 30px; margin-bottom:16px; position:relative; overflow:hidden; }
  .pdf-ev-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.02),transparent 60%); pointer-events:none; }
  .pdf-ev-card-gold { border-color:rgba(234,179,8,0.18); background:linear-gradient(135deg,#161410,#111); }
  .pdf-ev-card-gold::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(234,179,8,0.4),transparent); }
  .pdf-ev-card-green { border-color:rgba(74,222,128,0.12); background:linear-gradient(135deg,#101610,#111); }
  .pdf-ev-card-green::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(74,222,128,0.35),transparent); }
  .pdf-ev-ct { font-family:var(--font-mono); font-size:0.58rem; letter-spacing:0.32em; text-transform:uppercase; color:#3b82f6; margin-bottom:18px; display:flex; align-items:center; gap:10px; }
  .pdf-ev-ct::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,rgba(59,130,246,0.25),transparent); }
  .pdf-ev-qbox { background:linear-gradient(135deg,#0d1b3e,#091530); border:1px solid rgba(59,130,246,0.2); border-radius:10px; padding:20px 24px; margin-bottom:20px; }
  .pdf-ev-qlabel { font-family:var(--font-mono); font-size:0.55rem; letter-spacing:0.25em; text-transform:uppercase; color:#3b82f6; margin-bottom:10px; }
  .pdf-ev-qtext { font-size:1.05rem; color:#e2e8f0; line-height:1.65; font-family:var(--font-body); }
  .pdf-ev-score-row { display:flex; justify-content:space-between; align-items:flex-end; padding-bottom:36px; border-bottom:1px solid #2e2e2e; margin-bottom:32px; }
  .pdf-ev-score-num { font-family:var(--font-mono); font-size:5.5rem; font-weight:700; line-height:1; }
  .pdf-ev-score-denom { font-family:var(--font-mono); font-size:1.8rem; color:#444; }
  .pdf-ev-bar-bg { background:#222; border-radius:2px; height:4px; overflow:hidden; margin-top:14px; width:260px; }
  .pdf-ev-bar-fill { height:100%; border-radius:2px; transition:width 1.2s cubic-bezier(.16,1,.3,1); }
  .pdf-ev-sec-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:32px; }
  @media(max-width:620px){ .pdf-ev-sec-grid { grid-template-columns:repeat(2,1fr); } }
  .pdf-ev-sec-card { background:#161616; border:1px solid #2a2a2a; border-radius:6px; padding:16px 14px; }
  .pdf-ev-sec-lbl { font-family:var(--font-mono); font-size:0.52rem; letter-spacing:0.22em; text-transform:uppercase; color:#555; margin-bottom:10px; }
  .pdf-ev-sec-num { font-family:var(--font-mono); font-size:1.85rem; font-weight:700; line-height:1; }
  .pdf-ev-sec-den { font-size:0.9rem; color:#444; }
  .pdf-ev-sec-bar-bg { background:#222; border-radius:2px; height:3px; overflow:hidden; margin:10px 0 8px; }
  .pdf-ev-sec-bar-fill { height:100%; border-radius:2px; transition:width 1.2s cubic-bezier(.16,1,.3,1); }
  .pdf-ev-sec-rsn { font-size:0.76rem; color:#666; line-height:1.5; font-family:var(--font-ui); }
  .pdf-ev-tabs { display:flex; gap:0; margin-bottom:32px; border-bottom:1px solid rgba(255,255,255,0.07); }
  .pdf-ev-tab { padding:13px 28px; cursor:pointer; font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; font-family:var(--font-mono); background:none; border:none; color:#444; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all 0.2s; }
  .pdf-ev-tab.active { color:#e2e8f0; border-bottom-color:#3b82f6; }
  .pdf-ev-tab:hover:not(.active) { color:#888; }
  .pdf-ev-ml { font-family:var(--font-mono); font-size:0.55rem; letter-spacing:0.25em; text-transform:uppercase; color:rgba(74,222,128,0.55); margin:22px 0 12px; display:flex; align-items:center; gap:8px; }
  .pdf-ev-ml::after { content:''; flex:1; height:1px; background:rgba(74,222,128,0.08); }
  .pdf-ev-ml:first-of-type { margin-top:0; }
  .pdf-ev-mp { font-size:0.93rem; line-height:1.9; color:#d4d4d4; margin-bottom:0; font-family:var(--font-body); }
  ul.pdf-ev-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:6px; }
  ul.pdf-ev-list li { padding:10px 14px 10px 16px; background:rgba(255,255,255,0.02); border-radius:6px; border-left:2px solid rgba(255,255,255,0.08); font-size:0.88rem; color:#b0b0b0; line-height:1.7; font-family:var(--font-body); }
  .pdf-ev-hist { padding:22px 0; border-bottom:1px solid rgba(255,255,255,0.05); display:grid; gap:6px; }
  .pdf-ev-hist:first-child { padding-top:0; }
  .pdf-ev-hist:last-child { border-bottom:none; padding-bottom:0; }
  .pdf-ev-hist-name { font-family:var(--font-display); font-size:1.0rem; font-weight:700; color:#60a5fa; letter-spacing:0.01em; }
  .pdf-ev-hist-work { font-family:var(--font-mono); font-size:0.68rem; color:#555; letter-spacing:0.05em; }
  .pdf-ev-hist-arg { font-size:0.88rem; color:#aaa; line-height:1.75; font-family:var(--font-body); }
  .pdf-ev-btn { width:100%; padding:16px; border:1.5px solid rgba(59,130,246,0.5); background:rgba(59,130,246,0.1); color:#3b82f6; font-size:0.78rem; font-family:var(--font-mono); cursor:pointer; transition:all 0.2s; letter-spacing:0.2em; text-transform:uppercase; border-radius:4px; }
  .pdf-ev-btn:hover { background:rgba(59,130,246,0.18); border-color:#3b82f6; }
  .pdf-ev-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .pdf-ev-fade { animation:pdf-ev-fi 0.4s ease; }
  @keyframes pdf-ev-fi { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .pdf-ev-input { width:100%; background:#0d0d0d; border:1px solid #2a2a2a; border-radius:4px; padding:10px 14px; color:#e2e8f0; font-size:0.88rem; font-family:var(--font-body); outline:none; box-sizing:border-box; transition:border-color 0.2s; }
  .pdf-ev-input:focus { border-color:rgba(59,130,246,0.5); }
  .pdf-ev-input::placeholder { color:#444; }
  .pdf-ev-marks-btn { padding:7px 14px; border:1px solid #2a2a2a; background:#161616; color:#666; font-family:var(--font-mono); font-size:0.6rem; letter-spacing:0.12em; cursor:pointer; transition:all 0.15s; border-radius:3px; }
  .pdf-ev-marks-btn.sel { border-color:rgba(59,130,246,0.6); background:rgba(59,130,246,0.12); color:#3b82f6; }
  .pdf-ev-seg-card { background:#161616; border:1px solid #2a2a2a; border-radius:8px; overflow:hidden; margin-bottom:10px; }
  .pdf-ev-seg-head { display:flex; align-items:center; gap:12px; padding:14px 18px; }
  .pdf-ev-seg-body { border-top:1px solid #222; padding:16px 18px; display:flex; flex-direction:column; gap:12px; }
  .pdf-ev-ans-preview { background:#0d0d0d; border:1px solid #1e1e1e; border-radius:4px; padding:12px 14px; font-family:var(--font-mono); font-size:0.68rem; color:#555; line-height:1.7; max-height:120px; overflow-y:auto; white-space:pre-wrap; }
`;

export default function PDFTestEvaluator({
  isPremium, onPaywall, token, paperQuestions,
}: PDFTestEvaluatorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // stage: "upload" | "loading" | "review" | "evaluating" | "done"
  const [stage, setStage] = useState("upload");
  const [stepLabel, setStepLabel] = useState("");
  const [evalCurrent, setEvalCurrent] = useState(0);
  const [evalTotal, setEvalTotal] = useState(0);
  const [evalProgress, setEvalProgress] = useState(0);

  const [transcript, setTranscript] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [cachedImages, setCachedImages] = useState<File[]>([]);
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);

  const [results, setResults] = useState<QuestionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  function handleFile(f: File) {
    if (!f.type.includes("pdf")) { setError("Please upload a PDF file."); return; }
    setFile(f); setError(null);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }

  /* ── PHASE 1: OCR + detect → review ── */
  async function handleDetect() {
    if (!file) return;
    setError(null);
    setStage("loading");
    setEvalProgress(5);
    setEvalTotal(0);

    try {
      setStepLabel("Converting PDF to images…");
      const images = await pdfToImages(file);
      setCachedImages(images);
      setEvalProgress(20);

      setStepLabel(`Extracting handwriting (${images.length} page${images.length > 1 ? "s" : ""})…`);
      const fd = new FormData();
      images.forEach(img => fd.append("files", img));
      let ocrText = "";
      const ocrRes = await fetch("/api/ocr?mode=pdf", {
        method: "POST", headers: { "x-user-token": token ?? "" }, body: fd,
      });
      if (ocrRes.ok) {
        const d = await ocrRes.json();
        ocrText = d.text || d.extracted_text || d.transcript || "";
      }
      setTranscript(ocrText);
      setEvalProgress(55);

      setStepLabel("Detecting questions from transcript…");
      let detected: Segment[] = [];

      if (paperQuestions && paperQuestions.length > 0) {
        detected = paperQuestions.map(q => ({
          questionNumber: q.id,
          marks: q.marks,
          questionText: q.text,
          answerText: ocrText,
        }));
      } else {
        const detRes = await fetch("/api/detect-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-token": token ?? "" },
          body: JSON.stringify({ transcript: ocrText }),
        });
        const detData = await detRes.json();
        if (!detRes.ok) throw new Error(detData.error ?? "Question detection failed");
        detected = detData.segments ?? [];
        if (detected.length === 0) throw new Error("No questions detected. Try again or check the PDF quality.");
      }

      setEvalProgress(100);
      setSegments(detected);
      setStage("review");
    } catch (e: any) {
      setError(e.message);
      setStage("upload");
    }
  }

  /* ── PHASE 2: evaluate reviewed/edited segments ── */
  async function handleRunEvaluation() {
    if (segments.length === 0) return;
    setError(null);
    setStage("evaluating");
    setEvalProgress(5);
    setEvalCurrent(0);
    setEvalTotal(segments.length);

    const questionResults: QuestionResult[] = [];

    try {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const q: PaperQuestion = {
          id: seg.questionNumber,
          marks: seg.marks,
          text: seg.questionText,
        };
        setEvalCurrent(i + 1);
        setStepLabel(`Evaluating ${seg.questionNumber} (${i + 1}/${segments.length})…`);
        setEvalProgress(5 + Math.round(((i + 1) / segments.length) * 90));

        try {
          const evalFd = new FormData();
          evalFd.append("question", q.text || `Question ${q.id}`);
          evalFd.append("marks", String(q.marks));
          evalFd.append("extractedText", seg.answerText || transcript);
          cachedImages.forEach(img => evalFd.append("files", img));

          const evalRes = await fetch("/api/evaluate", {
            method: "POST", headers: { "x-user-token": token ?? "" }, body: evalFd,
          });
          const evalData = await evalRes.json();
          if (!evalRes.ok) throw new Error(evalData.error ?? "Evaluation failed");
          questionResults.push({ question: q, evaluation: evalData });
        } catch (qErr: any) {
          questionResults.push({ question: q, evaluation: null, error: qErr.message });
        }

        if (i < segments.length - 1) await new Promise(r => setTimeout(r, 800));
      }

      setEvalProgress(100);
      setResults(questionResults);
      setStage("done");
      if (questionResults.length > 0) setExpanded(questionResults[0].question.id);
    } catch (e: any) {
      setError(e.message);
      setStage("review");
    }
  }

  /* ── Segment editor helpers ── */
  function updateSegment(idx: number, patch: Partial<Segment>) {
    setSegments(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }
  function removeSegment(idx: number) {
    setSegments(prev => prev.filter((_, i) => i !== idx));
  }

  /* ── PAYWALL ── */
  if (!isPremium) return (
    <div style={{ padding: "32px 0" }}>
      <div style={{ background: "linear-gradient(135deg,#161616,#111)", border: "1px solid #2a2a2a",
        borderRadius: 12, padding: "28px 30px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: "1.8rem" }}>📄</span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
                AI Full Paper Evaluation
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#555", letterSpacing: "0.15em" }}>
                Premium Feature
              </div>
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.2em",
            background: "rgba(234,179,8,0.1)", color: "#eab308", border: "1px solid rgba(234,179,8,0.2)",
            borderRadius: 4, padding: "4px 10px" }}>PREMIUM</span>
        </div>
        <p style={{ fontSize: "0.88rem", color: "#666", lineHeight: 1.7, margin: 0, fontFamily: "var(--font-body)" }}>
          Upload your complete answer script as a PDF. AI reads every page, identifies each answer,
          and gives marks + detailed feedback for the entire paper — all at once.
        </p>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { n: "01", t: "Write answers",    s: "On paper or digitally" },
            { n: "02", t: "Scan to PDF",       s: "All pages in one file" },
            { n: "03", t: "Upload & evaluate", s: "AI scores instantly"   },
          ].map(x => (
            <div key={x.n} style={{ flex: 1, background: "#161616", border: "1px solid #222",
              borderRadius: 8, padding: "16px 14px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#3b82f6",
                letterSpacing: "0.15em", marginBottom: 8 }}>{x.n}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: 4 }}>{x.t}</div>
              <div style={{ fontSize: "0.75rem", color: "#555" }}>{x.s}</div>
            </div>
          ))}
        </div>
        <button onClick={onPaywall} style={{ marginTop: 16, width: "100%", padding: "16px",
          border: "1.5px solid rgba(234,179,8,0.4)", background: "rgba(234,179,8,0.08)", color: "#eab308",
          fontSize: "0.78rem", fontFamily: "var(--font-mono)", cursor: "pointer", letterSpacing: "0.2em",
          textTransform: "uppercase", borderRadius: 4 }}>
          🔒 &nbsp;Unlock with Premium →
        </button>
      </div>
    </div>
  );

  /* ── LOADING (OCR + detect) ── */
  if (stage === "loading") return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.3em",
        textTransform: "uppercase", color: "#555", marginBottom: 32 }}>
        Reading Paper
      </div>
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "4rem", fontWeight: 700, color: "#3b82f6" }}>
          {String(evalProgress).padStart(2, "0")}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", color: "#444" }}>%</span>
      </div>
      <div style={{ background: "#222", borderRadius: 2, height: 3, overflow: "hidden",
        maxWidth: 300, margin: "0 auto 28px" }}>
        <div style={{ height: "100%", background: "#3b82f6", borderRadius: 2,
          width: `${evalProgress}%`, transition: "width 0.8s cubic-bezier(.16,1,.3,1)" }} />
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.15em",
        color: "#444", textTransform: "uppercase" }}>
        {stepLabel}
      </div>
    </div>
  );

  /* ── EVALUATING ── */
  if (stage === "evaluating") return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.3em",
        textTransform: "uppercase", color: "#555", marginBottom: 32 }}>
        Evaluating Paper
      </div>
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "4rem", fontWeight: 700, color: "#3b82f6" }}>
          {String(evalProgress).padStart(2, "0")}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", color: "#444" }}>%</span>
      </div>
      <div style={{ background: "#222", borderRadius: 2, height: 3, overflow: "hidden",
        maxWidth: 300, margin: "0 auto 28px" }}>
        <div style={{ height: "100%", background: "#3b82f6", borderRadius: 2,
          width: `${evalProgress}%`, transition: "width 0.8s cubic-bezier(.16,1,.3,1)" }} />
      </div>
      {evalTotal > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
          {Array.from({ length: evalTotal }, (_, i) => (
            <div key={i} style={{
              width: evalCurrent > i ? 8 : 5, height: evalCurrent > i ? 8 : 5,
              borderRadius: "50%",
              background: evalCurrent > i ? "#3b82f6" : "#222",
              border: evalCurrent > i ? "none" : "1px solid #333",
              boxShadow: evalCurrent > i ? "0 0 8px #3b82f6" : "none",
              transition: "all 0.5s",
            }} />
          ))}
        </div>
      )}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.15em",
        color: "#444", textTransform: "uppercase" }}>
        {stepLabel}
      </div>
    </div>
  );

  /* ── REVIEW ── */
  if (stage === "review") return (
    <div style={{ padding: "32px 0" }}>
      <style>{SHARED_CSS}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.28em",
          textTransform: "uppercase", color: "#555", marginBottom: 8 }}>
          Review Detected Questions
        </div>
        <div style={{ fontSize: "0.92rem", color: "#888", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>
          AI found <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{segments.length} question{segments.length !== 1 ? "s" : ""}</span> in your script.
          Check the question numbers and marks — fix anything before evaluating.
        </div>
      </div>

      {/* Transcript toggle */}
      {transcript && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setShowTranscript(p => !p)} style={{
            fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.18em",
            textTransform: "uppercase", color: "#555", background: "none",
            border: "1px solid #222", borderRadius: 4, padding: "7px 14px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: "0.6rem", transition: "transform 0.2s",
              transform: showTranscript ? "rotate(90deg)" : "none" }}>▶</span>
            {showTranscript ? "Hide OCR Transcript" : "Show Raw OCR Transcript"}
          </button>
          {showTranscript && (
            <div style={{ marginTop: 10, background: "#0d0d0d", border: "1px solid #1e1e1e",
              borderRadius: 6, padding: "18px 20px" }}>
              <pre style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#666",
                lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>
                {transcript}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Segment cards */}
      <div style={{ marginBottom: 20 }}>
        {segments.map((seg, idx) => (
          <div key={idx} className="pdf-ev-seg-card">
            {/* Card header row */}
            <div className="pdf-ev-seg-head">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em",
                textTransform: "uppercase", color: "#3b82f6", minWidth: 32 }}>
                {seg.questionNumber}
              </span>

              {/* Marks selector */}
              <div style={{ display: "flex", gap: 4 }}>
                {[10, 15, 20].map(m => (
                  <button key={m}
                    className={`pdf-ev-marks-btn${seg.marks === m ? " sel" : ""}`}
                    onClick={() => updateSegment(idx, { marks: m })}>
                    {m}M
                  </button>
                ))}
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Toggle answer preview */}
              <button onClick={() => setExpandedAnswer(p => p === String(idx) ? null : String(idx))}
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "#444", background: "none",
                  border: "1px solid #222", borderRadius: 3, padding: "5px 10px", cursor: "pointer" }}>
                {expandedAnswer === String(idx) ? "Hide answer" : "Preview answer"}
              </button>

              {/* Remove */}
              {segments.length > 1 && (
                <button onClick={() => removeSegment(idx)}
                  style={{ color: "#f87171", background: "none", border: "none",
                    cursor: "pointer", fontSize: "0.85rem", padding: "2px 6px", opacity: 0.6 }}
                  title="Remove this question">
                  ✕
                </button>
              )}
            </div>

            {/* Editable question text */}
            <div className="pdf-ev-seg-body">
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.18em",
                  textTransform: "uppercase", color: "#555", marginBottom: 7 }}>
                  Question text <span style={{ color: "#333" }}>(optional — leave blank if unknown)</span>
                </div>
                <input
                  className="pdf-ev-input"
                  placeholder={`e.g. "Examine the role of the Bhakti movement in 15th century India."`}
                  value={seg.questionText}
                  onChange={e => updateSegment(idx, { questionText: e.target.value })}
                />
              </div>

              {/* Answer preview */}
              {expandedAnswer === String(idx) && seg.answerText && (
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.18em",
                    textTransform: "uppercase", color: "#555", marginBottom: 7 }}>
                    Detected answer text
                  </div>
                  <div className="pdf-ev-ans-preview">{seg.answerText}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: 6, padding: "12px 16px", color: "#f87171", fontSize: "0.82rem",
          marginBottom: 16, fontFamily: "var(--font-body)" }}>
          {error}
        </div>
      )}

      {/* Action row */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { setStage("upload"); setSegments([]); setTranscript(""); }}
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#666", background: "none",
            border: "1px solid #2a2a2a", borderRadius: 4, padding: "14px 20px", cursor: "pointer",
            whiteSpace: "nowrap" }}>
          ↩ Back
        </button>
        <button className="pdf-ev-btn" onClick={handleRunEvaluation}
          disabled={segments.length === 0}
          style={{ flex: 1 }}>
          Evaluate {segments.length} Question{segments.length !== 1 ? "s" : ""} →
        </button>
      </div>
    </div>
  );

  /* ── RESULTS ── */
  if (stage === "done") {
    const totalAwarded = results.reduce((s, r) => s + (r.evaluation?.marks ?? 0), 0);
    const totalMax     = results.reduce((s, r) => s + (r.evaluation?.marks_out_of ?? r.question.marks), 0);
    const overallPct   = totalMax > 0 ? (totalAwarded / totalMax) * 100 : 0;
    const overallCol   = overallPct >= 70 ? "#4ade80" : overallPct >= 50 ? "#3b82f6" : "#f87171";

    return (
      <div>
        <style>{SHARED_CSS}</style>
        <div style={{ padding: "0 0 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", letterSpacing: "0.28em",
                textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Paper Complete</div>
              <div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "3.5rem", fontWeight: 700,
                  color: overallCol, lineHeight: 1 }}>{totalAwarded}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", color: "#444" }}>
                  / {totalMax}
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#555",
                letterSpacing: "0.15em", marginTop: 6 }}>
                {results.length} question{results.length !== 1 ? "s" : ""} evaluated
              </div>
            </div>
            <button onClick={() => { setStage("upload"); setFile(null); setResults([]); setTranscript(""); setSegments([]); }}
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#888", background: "none",
                border: "1px solid #2a2a2a", borderRadius: 4, padding: "8px 16px", cursor: "pointer" }}>
              ↩ Evaluate Another
            </button>
          </div>

          {transcript && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => setShowTranscript(p => !p)} style={{
                fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.18em",
                textTransform: "uppercase", color: "#555", background: "none",
                border: "1px solid #222", borderRadius: 4, padding: "7px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: "0.6rem", transform: showTranscript ? "rotate(90deg)" : "none",
                  transition: "transform 0.2s" }}>▶</span>
                {showTranscript ? "Hide OCR Transcript" : "Show OCR Transcript"}
              </button>
              {showTranscript && (
                <div style={{ marginTop: 10, background: "#0d0d0d", border: "1px solid #1e1e1e",
                  borderRadius: 6, padding: "18px 20px" }}>
                  <pre style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#666",
                    lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>
                    {transcript}
                  </pre>
                </div>
              )}
            </div>
          )}

          {results.map(r => (
            <EvalCard key={r.question.id} result={r}
              isOpen={expanded === r.question.id}
              onToggle={() => setExpanded(p => p === r.question.id ? null : r.question.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── UPLOAD ── */
  return (
    <div style={{ padding: "32px 0" }}>
      <style>{SHARED_CSS}</style>
      <div style={{ background: "linear-gradient(135deg,#161616,#111)", border: "1px solid #2a2a2a",
        borderRadius: 12, padding: "28px 30px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: "1.8rem" }}>📄</span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
                AI Full Paper Evaluation
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#555", letterSpacing: "0.15em" }}>
                {paperQuestions?.length
                  ? `${paperQuestions.length} question${paperQuestions.length > 1 ? "s" : ""} · Upload your script`
                  : "Upload · Review · Evaluate"}
              </div>
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.2em",
            background: "rgba(234,179,8,0.1)", color: "#eab308", border: "1px solid rgba(234,179,8,0.2)",
            borderRadius: 4, padding: "4px 10px" }}>PREMIUM</span>
        </div>
        <p style={{ fontSize: "0.88rem", color: "#666", lineHeight: 1.7, margin: 0, fontFamily: "var(--font-body)" }}>
          Upload your complete answer script as a PDF. AI reads every page, detects each question,
          and lets you review before evaluating — marks and detailed feedback for the whole paper.
        </p>
      </div>

      {paperQuestions && paperQuestions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {paperQuestions.map(q => (
            <span key={q.id} style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem",
              letterSpacing: "0.15em", background: "#161616", border: "1px solid #2a2a2a",
              borderRadius: 4, padding: "4px 10px", color: "#666" }}>
              {q.id} · {q.marks}M
            </span>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? "#3b82f6" : file ? "rgba(59,130,246,0.5)" : "#333"}`,
          borderRadius: 6, padding: "44px 24px", textAlign: "center", cursor: "pointer",
          background: dragging ? "#0d1b3e" : file ? "rgba(59,130,246,0.04)" : "#161616",
          transition: "all 0.2s", marginBottom: error ? 12 : 20,
        }}
      >
        <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>📄</div>
        {file ? (
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 4 }}>{file.name}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#555", letterSpacing: "0.1em" }}>
              {(file.size / 1024 / 1024).toFixed(1)} MB · Click to change
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "0.9rem", color: "#888", marginBottom: 6 }}>Upload your answer script PDF</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#444", letterSpacing: "0.1em" }}>
              Click to browse or drag and drop
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: 6, padding: "12px 16px", color: "#f87171", fontSize: "0.82rem",
          marginBottom: 16, fontFamily: "var(--font-body)" }}>
          {error}
        </div>
      )}

      {file && (
        <button className="pdf-ev-btn" onClick={handleDetect}>
          Extract &amp; Detect Questions →
        </button>
      )}
    </div>
  );
}
