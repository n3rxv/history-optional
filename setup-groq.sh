#!/bin/bash
# ============================================================
#  UNIVERSAL MAP QUESTION CHECKER — Groq edition
#  Vision model: meta-llama/llama-4-scout-17b-16e-instruct
#  Run from the root of your Next.js project
# ============================================================

# ── 1. fuzzy match utility ──────────────────────────────────
cat > lib/fuzzyMatch.ts << 'EOF'
/**
 * Three-layer fuzzy matcher.
 * Returns a score 0–100.
 */
export function fuzzyMatch(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const na = norm(a);
  const nb = norm(b);

  // Layer 1 — exact
  if (na === nb) return 100;

  // Layer 2 — substring
  if (na.includes(nb) || nb.includes(na)) return 85;

  // Layer 3a — Jaccard token overlap
  const ta = new Set(na.split(/\s+/));
  const tb = new Set(nb.split(/\s+/));
  const intersection = [...ta].filter(t => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  const jaccard = union === 0 ? 0 : intersection / union;

  // Layer 3b — Dice character bigrams
  const bigrams = (s: string) => {
    const bg: string[] = [];
    for (let i = 0; i < s.length - 1; i++) bg.push(s.slice(i, i + 2));
    return bg;
  };
  const ba = bigrams(na.replace(/\s/g, ""));
  const bb = bigrams(nb.replace(/\s/g, ""));
  const setA = new Set(ba);
  const setB = new Set(bb);
  const common = [...setA].filter(bg => setB.has(bg)).length;
  const dice = (setA.size + setB.size) === 0 ? 0 : (2 * common) / (setA.size + setB.size);

  return Math.round(((jaccard + dice) / 2) * 100);
}
EOF

# ── 2. answer key builder ───────────────────────────────────
cat > lib/buildAnswerKey.ts << 'EOF'
import { bookData } from "./bookData";
import { fuzzyMatch } from "./fuzzyMatch";

export interface DotFromMap {
  number: string;   // "i", "ii", ...
  clue: string;     // "Neolithic site", "IVC port town"
  region: string;   // "Kashmir", "Gujarat"
}

export interface AnswerKeyEntry {
  number: string;
  correctSite: string | null;
  correctState: string | null;
  confidence: number;   // 0–3, how many clue words matched
  candidates: string[]; // top 3 alternatives if confidence is low
}

export function buildAnswerKey(dots: DotFromMap[]): AnswerKeyEntry[] {
  return dots.map(dot => {
    // Step 1 — filter by region
    const regionCandidates = bookData.filter(
      site => fuzzyMatch(site.state, dot.region) > 60
    );

    // Step 2 — score by clue word overlap against all text fields
    const clueWords = dot.clue.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    const scored = (regionCandidates.length > 0 ? regionCandidates : bookData).map(site => {
      const haystack = [
        site.name,
        site.state,
        site.period,
        site.type,
        site.majorAspect,
        ...(site.subSites?.map((s: any) => s.name) ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchCount = clueWords.filter(w => haystack.includes(w)).length;
      return { site, matchCount };
    });

    scored.sort((a, b) => b.matchCount - a.matchCount);

    const best = scored[0];
    const topCandidates = scored.slice(0, 3).map(s => s.site.name);

    return {
      number: dot.number,
      correctSite: best?.site.name ?? null,
      correctState: best?.site.state ?? null,
      confidence: best?.matchCount ?? 0,
      candidates: topCandidates,
    };
  });
}
EOF

# ── 3. answer checker + scorer ──────────────────────────────
cat > lib/checkAnswers.ts << 'EOF'
import { fuzzyMatch } from "./fuzzyMatch";
import type { AnswerKeyEntry } from "./buildAnswerKey";

export interface StudentAnswer {
  number: string;
  site_name: string | null;
  state: string | null;
}

export interface CheckedResult {
  number: string;
  status: "correct" | "partial" | "wrong_site" | "wrong_state" | "blank" | "low_confidence";
  marks: number;
  maxMarks: number;
  siteRight: boolean;
  stateRight: boolean;
  studentSite: string | null;
  studentState: string | null;
  correctSite: string | null;
  correctState: string | null;
  confidence: number;
  candidates: string[];
}

const MARKS_SITE  = 1.5;
const MARKS_STATE = 0.5;
const MAX_MARKS   = MARKS_SITE + MARKS_STATE;

export function checkAnswers(
  answerKey: AnswerKeyEntry[],
  studentAnswers: StudentAnswer[]
): { results: CheckedResult[]; totalMarks: number; maxTotal: number } {
  const results: CheckedResult[] = answerKey.map(key => {
    const student = studentAnswers.find(a => a.number === key.number);

    // Blank
    if (!student?.site_name) {
      return {
        number: key.number, status: "blank", marks: 0, maxMarks: MAX_MARKS,
        siteRight: false, stateRight: false,
        studentSite: null, studentState: null,
        correctSite: key.correctSite, correctState: key.correctState,
        confidence: key.confidence, candidates: key.candidates,
      };
    }

    // Low confidence answer key — flag for teacher review
    if (key.confidence === 0) {
      return {
        number: key.number, status: "low_confidence", marks: 0, maxMarks: MAX_MARKS,
        siteRight: false, stateRight: false,
        studentSite: student.site_name, studentState: student.state,
        correctSite: key.correctSite, correctState: key.correctState,
        confidence: key.confidence, candidates: key.candidates,
      };
    }

    const siteScore  = fuzzyMatch(student.site_name, key.correctSite)  >= 75 ? MARKS_SITE  : 0;
    const stateScore = fuzzyMatch(student.state,     key.correctState) >= 75 ? MARKS_STATE : 0;
    const marks = siteScore + stateScore;

    let status: CheckedResult["status"] = "wrong_site";
    if (siteScore > 0 && stateScore > 0) status = "correct";
    else if (siteScore > 0 && stateScore === 0) status = "wrong_state";
    else if (siteScore === 0 && stateScore > 0) status = "partial";

    return {
      number: key.number, status, marks, maxMarks: MAX_MARKS,
      siteRight: siteScore > 0, stateRight: stateScore > 0,
      studentSite: student.site_name, studentState: student.state,
      correctSite: key.correctSite, correctState: key.correctState,
      confidence: key.confidence, candidates: key.candidates,
    };
  });

  const totalMarks = results.reduce((s, r) => s + r.marks, 0);
  const maxTotal   = answerKey.length * MAX_MARKS;

  return { results, totalMarks, maxTotal };
}
EOF

# ── 4. Next.js API route (Groq vision) ─────────────────────
mkdir -p app/api/check-map
cat > app/api/check-map/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildAnswerKey } from "@/lib/buildAnswerKey";
import { checkAnswers } from "@/lib/checkAnswers";

// Initialise Groq client — reads GROQ_API_KEY from env automatically
const groq = new Groq();

// Vision model to use for both image-reading tasks
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// ── Vision: read question paper map ──────────────────────────
async function extractDotsFromMap(imageBase64: string, mimeType: string): Promise<any[]> {
  const response = await groq.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
          {
            type: "text",
            text: `You are reading a UPSC History map question paper.
The image shows a map of India with numbered dots labeled (i) through (xx) or similar.
For each numbered dot, extract:
- number: the Roman numeral label (e.g. "i", "ii", "iii")
- clue: the clue text printed near that dot (e.g. "Neolithic site", "IVC port town", "Major Rock Edict")
- region: the Indian state or broad region where the dot appears geographically

Return ONLY a valid JSON array. No markdown, no explanation, no backticks.
Example: [{"number":"i","clue":"Neolithic site","region":"Kashmir"},{"number":"ii","clue":"Mesolithic site","region":"Rajasthan"}]`,
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "[]";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ── Vision: read student answer sheet ────────────────────────
async function extractStudentAnswers(imageBase64: string, mimeType: string): Promise<any[]> {
  const response = await groq.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
          {
            type: "text",
            text: `You are reading a UPSC History handwritten answer sheet — map question section.
For each Roman numeral (i) through (xx), extract what the student wrote.
Fields:
- number: the Roman numeral (e.g. "i", "ii")
- site_name: the site name they wrote (null if blank or illegible)
- state: the state or location they wrote after the site name (null if not written)

Correct obvious handwriting variants: "Burzahm" → "Burzahom", "Lothl" → "Lothal".
If a number is skipped entirely, include it with null values.

Return ONLY a valid JSON array. No markdown, no explanation, no backticks.
Example: [{"number":"i","site_name":"Burzahom","state":"Kashmir"},{"number":"ix","site_name":null,"state":null}]`,
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "[]";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ── Main route ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Expected body shape:
    // {
    //   questionMapPage: { base64: string, mimeType: string },
    //   studentPages:    [{ base64: string, mimeType: string }, ...]
    // }

    const { questionMapPage, studentPages } = body;

    if (!questionMapPage || !studentPages?.length) {
      return NextResponse.json({ error: "Missing questionMapPage or studentPages" }, { status: 400 });
    }

    // Step 1 — extract dots from question map
    const dots = await extractDotsFromMap(questionMapPage.base64, questionMapPage.mimeType);

    // Step 2 — extract student answers (first page; extend for multi-page)
    const studentAnswers = await extractStudentAnswers(studentPages[0].base64, studentPages[0].mimeType);

    // Step 3 — build answer key from bookData
    const answerKey = buildAnswerKey(dots);

    // Step 4 — compare and score
    const { results, totalMarks, maxTotal } = checkAnswers(answerKey, studentAnswers);

    // Flag low-confidence entries for teacher review
    const flagged = results.filter(r => r.status === "low_confidence");

    return NextResponse.json({
      success: true,
      totalMarks: Math.round(totalMarks * 10) / 10,
      maxTotal,
      percentage: Math.round((totalMarks / maxTotal) * 100),
      results,
      flaggedForReview: flagged,
      answerKey,   // useful for debugging / teacher view
    });

  } catch (err: any) {
    console.error("[check-map]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
EOF

# ── 5. PDF rasterizer (server-side helper) ──────────────────
cat > lib/rasterizePdf.ts << 'EOF'
/**
 * Rasterizes each page of a PDF buffer to JPEG base64 strings.
 * Requires pdftoppm:  apt install poppler-utils
 *
 * Usage:
 *   const pages = await rasterizePdf(buffer);
 *   // pages = [{ base64: "...", mimeType: "image/jpeg" }, ...]
 */
import { execFile } from "child_process";
import { writeFile, readdir, readFile, rm, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function rasterizePdf(
  pdfBuffer: Buffer,
  dpi = 150
): Promise<{ base64: string; mimeType: "image/jpeg" }[]> {
  const workDir = join(tmpdir(), `pdf-${Date.now()}`);
  await mkdir(workDir, { recursive: true });

  const pdfPath = join(workDir, "input.pdf");
  await writeFile(pdfPath, pdfBuffer);

  await execFileAsync("pdftoppm", [
    "-r", String(dpi),
    "-jpeg",
    pdfPath,
    join(workDir, "page"),
  ]);

  const files = (await readdir(workDir))
    .filter(f => f.startsWith("page") && f.endsWith(".jpg"))
    .sort();

  const pages = await Promise.all(
    files.map(async f => ({
      base64: (await readFile(join(workDir, f))).toString("base64"),
      mimeType: "image/jpeg" as const,
    }))
  );

  await rm(workDir, { recursive: true, force: true });
  return pages;
}
EOF

# ── 6. Upload + check page (React component) ───────────────
mkdir -p app/check-map
cat > app/check-map/page.tsx << 'EOF'
"use client";
import { useState } from "react";

type Result = {
  number: string;
  status: string;
  marks: number;
  maxMarks: number;
  siteRight: boolean;
  stateRight: boolean;
  studentSite: string | null;
  studentState: string | null;
  correctSite: string | null;
  correctState: string | null;
  confidence: number;
  candidates: string[];
};

const STATUS_COLOR: Record<string, string> = {
  correct:        "bg-green-100 text-green-800",
  wrong_state:    "bg-yellow-100 text-yellow-800",
  partial:        "bg-yellow-100 text-yellow-800",
  wrong_site:     "bg-red-100 text-red-800",
  blank:          "bg-gray-100 text-gray-500",
  low_confidence: "bg-purple-100 text-purple-800",
};

const STATUS_LABEL: Record<string, string> = {
  correct:        "✅ Correct",
  wrong_state:    "⚠️ Wrong state",
  partial:        "⚠️ Partial",
  wrong_site:     "❌ Wrong site",
  blank:          "— Blank",
  low_confidence: "🔍 Review needed",
};

export default function CheckMapPage() {
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile,   setAnswerFile]   = useState<File | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [response,     setResponse]     = useState<any>(null);
  const [error,        setError]        = useState<string | null>(null);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1]);
      r.onerror = () => rej(new Error("Read failed"));
      r.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    if (!questionFile || !answerFile) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const [qBase64, aBase64] = await Promise.all([
        toBase64(questionFile),
        toBase64(answerFile),
      ]);

      const mimeType = (f: File) =>
        f.type === "application/pdf" ? "application/pdf" : "image/jpeg";

      const res = await fetch("/api/check-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionMapPage: { base64: qBase64, mimeType: mimeType(questionFile) },
          studentPages:    [{ base64: aBase64, mimeType: mimeType(answerFile) }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Server error");
      setResponse(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-8">Map Question Checker</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Question paper map (PDF or image)</span>
          <input type="file" accept=".pdf,image/*" className="mt-1 block w-full text-sm"
            onChange={e => setQuestionFile(e.target.files?.[0] ?? null)} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Student answer sheet (PDF or image)</span>
          <input type="file" accept=".pdf,image/*" className="mt-1 block w-full text-sm"
            onChange={e => setAnswerFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!questionFile || !answerFile || loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700 transition"
      >
        {loading ? "Checking…" : "Check answers"}
      </button>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {response && (
        <div className="mt-8 space-y-6">
          {/* Score summary */}
          <div className="p-6 bg-gray-50 rounded-xl flex items-center gap-8">
            <div>
              <div className="text-4xl font-bold">
                {response.totalMarks}
                <span className="text-xl font-normal text-gray-500"> / {response.maxTotal}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">Total marks</div>
            </div>
            <div>
              <div className="text-4xl font-bold">{response.percentage}%</div>
              <div className="text-sm text-gray-500 mt-1">Score</div>
            </div>
            {response.flaggedForReview?.length > 0 && (
              <div className="ml-auto text-sm text-purple-700 bg-purple-50 px-4 py-2 rounded-lg">
                🔍 {response.flaggedForReview.length} site(s) need teacher review
              </div>
            )}
          </div>

          {/* Per-site results */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-3 py-2 rounded-tl-lg">#</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Student wrote</th>
                <th className="px-3 py-2">Correct answer</th>
                <th className="px-3 py-2 rounded-tr-lg text-right">Marks</th>
              </tr>
            </thead>
            <tbody>
              {response.results.map((r: Result) => (
                <tr key={r.number} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-mono text-gray-500">({r.number})</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[r.status] ?? ""}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    {r.status === "low_confidence" && (
                      <div className="text-xs text-gray-400 mt-1">
                        Candidates: {r.candidates.join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r.studentSite
                      ? <>
                          <span className={r.siteRight ? "text-green-700" : "text-red-600"}>{r.studentSite}</span>
                          {r.studentState && (
                            <span className={`ml-1 text-xs ${r.stateRight ? "text-green-600" : "text-red-400"}`}>
                              ({r.studentState})
                            </span>
                          )}
                        </>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {r.correctSite ?? <span className="text-purple-500 text-xs">unresolved</span>}
                    {r.correctState && (
                      <span className="ml-1 text-xs text-gray-400">({r.correctState})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{r.marks}/{r.maxMarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
EOF

echo ""
echo "✅ All files written (Groq edition). Summary:"
echo "  lib/fuzzyMatch.ts          — three-layer fuzzy matcher (unchanged)"
echo "  lib/buildAnswerKey.ts      — auto-builds answer key from map dots + bookData (unchanged)"
echo "  lib/checkAnswers.ts        — compares student JSON to answer key, scores (unchanged)"
echo "  lib/rasterizePdf.ts        — server-side PDF → JPEG pages via pdftoppm (unchanged)"
echo "  app/api/check-map/route.ts — Next.js POST route using Groq vision"
echo "  app/check-map/page.tsx     — upload UI + results table (unchanged)"
echo ""
echo "Install deps:"
echo "  npm install groq-sdk"
echo "  apt install poppler-utils   # for pdftoppm (PDF support)"
echo ""
echo "Add to .env.local:"
echo "  GROQ_API_KEY=gsk_..."
echo ""
echo "Vision model: meta-llama/llama-4-scout-17b-16e-instruct"
