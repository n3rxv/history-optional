import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 60;

const MARKS_RE = /\((\d+)\s*(?:marks?|m)\)/i;

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractQMarkers(transcript: string): string[] {
  return transcript
    .split("\n")
    .filter((l) => /^\[Q\]:/.test(l.trim()))
    .map((l) => l.replace(/^\[Q\]:\s*/, "").trim());
}

/** Replace long answer lines with "[N words]" so Groq sees structure only */
function condense(transcript: string): string {
  return transcript
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return "";
      if (/^\[Q\]:/.test(t) || t.length <= 60) return line;
      return `[${t.split(/\s+/).length} words]`;
    })
    .join("\n");
}

// ── Strategy 1: [Q]: marker-based segmentation ───────────────────────────────
// The pdf-mode OCR injects [Q]: lines. Use them as reliable question boundaries.

function segmentByQMarkerLines(transcript: string): any[] | null {
  const lines = transcript.split("\n");
  const qIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (/^\[Q\]:/.test(lines[i].trim())) qIndices.push(i);
  }

  if (qIndices.length < 1) return null;

  const FULL_Q = /^(?:Q\.?\s*)?(\d)\s*[.(]\s*([a-e])\s*[.)]/i;
  const MAIN_Q = /^(?:Q\.?\s*)?([1-8])\s*[.)]\s*$/;
  const SUB_Q = /^\(?([a-e])\)\.?\s*(?:→\s*)?$/i;

  function guessQNum(beforeLines: string[], prevQNum: string): string {
    for (let k = beforeLines.length - 1; k >= 0; k--) {
      const t = beforeLines[k].trim();
      const fm = t.match(FULL_Q);
      if (fm) return `Q${fm[1]}(${fm[2].toLowerCase()})`;
      const mm = t.match(MAIN_Q);
      if (mm) return `Q${mm[1]}`;
      const sm = t.match(SUB_Q);
      if (sm) {
        const base = prevQNum.match(/Q(\d+)/);
        if (base) return `Q${base[1]}(${sm[1].toLowerCase()})`;
      }
    }
    return "";
  }

  const results: any[] = [];

  qIndices.forEach((qi, idx) => {
    const nextQi = qIndices[idx + 1] ?? lines.length;
    const questionText = lines[qi].replace(/^\[Q\]:\s*/, "").trim();
    const marksMatch = MARKS_RE.exec(questionText);
    const marks = marksMatch ? parseInt(marksMatch[1]) : 15;

    const before = lines.slice(Math.max(0, qi - 5), qi);
    const prevQNum = results[results.length - 1]?.questionNumber ?? "";
    const questionNumber =
      guessQNum(before, prevQNum) || `Q${idx + 1}`;

    const answerText = lines
      .slice(qi + 1, nextQi)
      .filter((l) => !/^\[Q\]:/.test(l.trim()))
      .join("\n")
      .trim();

    results.push({ questionNumber, marks, questionText, answerText });
  });

  return results.length >= 1 ? results : null;
}

// ── Strategy 2: Regex boundary detection ─────────────────────────────────────

function segmentByRegex(transcript: string, qMarkers: string[]): any[] | null {
  const lines = transcript.split("\n");
  const bounds: { lineIdx: number; qNum: string }[] = [];
  let lastMain = "";

  const FULL_Q = /^(?:Q\.?\s*)?(\d)\s*[.(]\s*([a-e])\s*[.)]/i;
  const MAIN_Q = /^(?:Q\.?\s*)?([1-8])\s*[.)]\s*$/;
  const SUB_Q = /^\(?([a-e])\)\.?\s*(?:→\s*)?$/i;

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t || t.length > 30) continue;

    const fm = t.match(FULL_Q);
    if (fm) {
      lastMain = `Q${fm[1]}`;
      const qNum = `Q${fm[1]}(${fm[2].toLowerCase()})`;
      if (!bounds.length || bounds[bounds.length - 1].qNum !== qNum)
        bounds.push({ lineIdx: i, qNum });
      continue;
    }
    const mm = t.match(MAIN_Q);
    if (mm) {
      const qNum = `Q${mm[1]}`;
      if (qNum !== lastMain) {
        lastMain = qNum;
        bounds.push({ lineIdx: i, qNum });
      }
      continue;
    }
    const sm = t.match(SUB_Q);
    if (sm && lastMain) {
      const qNum = `${lastMain}(${sm[1].toLowerCase()})`;
      if (!bounds.length || bounds[bounds.length - 1].qNum !== qNum)
        bounds.push({ lineIdx: i, qNum });
    }
  }

  if (bounds.length < 2) return null;

  return bounds.map((b, idx) => {
    const nextIdx = bounds[idx + 1]?.lineIdx ?? lines.length;
    const segLines = lines.slice(b.lineIdx, nextIdx);
    const qLine = segLines.find((l) => /^\[Q\]:/.test(l.trim()));
    const questionText = qLine
      ? qLine.replace(/^\[Q\]:\s*/, "").trim()
      : qMarkers[idx] ?? "";
    const marksMatch = qLine
      ? MARKS_RE.exec(qLine)
      : MARKS_RE.exec(segLines.slice(0, 5).join(" "));
    const marks = marksMatch ? parseInt(marksMatch[1]) : 15;
    const answerText = segLines
      .filter((l) => !/^\[Q\]:/.test(l.trim()))
      .join("\n")
      .trim();
    return { questionNumber: b.qNum, marks, questionText, answerText };
  });
}

// ── Strategy 3: Groq with condensed transcript ────────────────────────────────

async function segmentViaGroq(
  transcript: string,
  qMarkers: string[]
): Promise<any[]> {
  const condensedTx = condense(transcript);

  const prompt = `You are analysing a UPSC History Optional handwritten answer sheet OCR transcript.
Segment into individual question-answer pairs.

TRANSCRIPT:
"""
${condensedTx}
"""

Rules:
- Look for question markers: "Q1", "1.", "3(a)", "(b)", "[Q]: ..."
- "[Q]: " lines contain question text — copy verbatim without the "[Q]: " prefix
- For marks look for "(15M)", "15 marks", "(10 marks)" near markers — default 15
- Return ALL questions including sub-parts like Q3(a), Q3(b), Q3(c), Q5(a)-(e)
- Do NOT include [Q]: lines in answerText

Return ONLY a JSON array, no markdown:
[{"questionNumber":"Q3(a)","marks":15,"questionText":"...","answerText":"..."}]`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content:
            "Return ONLY a valid JSON array. No markdown. No extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 3000,
    }),
  });

  if (!res.ok) {
    let errText = `HTTP ${res.status}`;
    try {
      errText = await res.text();
    } catch {}
    throw new Error("Groq API error: " + errText);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error("Groq returned non-JSON response");
  }

  const raw = data.choices?.[0]?.message?.content ?? "[]";
  const stripped = raw
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  const s = stripped.indexOf("[");
  const e = stripped.lastIndexOf("]");
  const clean = s !== -1 && e !== -1 ? stripped.slice(s, e + 1) : stripped;

  let segments: any[] = [];
  try {
    segments = JSON.parse(clean);
  } catch {
    // JSON parse failed — single-segment fallback
    return [
      {
        questionNumber: "Q1",
        marks: 15,
        questionText: qMarkers[0] ?? "",
        answerText: transcript.replace(/^\[Q\]:.*$/gm, "").trim(),
      },
    ];
  }

  // Overlay qMarkers where LLM left questionText empty
  if (qMarkers.length > 0) {
    segments = segments.map((seg: any, i: number) =>
      seg.questionText?.trim() ? seg : { ...seg, questionText: qMarkers[i] ?? "" }
    );
  }

  // Strip [Q]: lines from answer text
  return segments.map((seg: any) => ({
    ...seg,
    answerText: (seg.answerText || "").replace(/^\[Q\]:.*$/gm, "").trim(),
  }));
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript?.trim())
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );

    const qMarkers = extractQMarkers(transcript);

    // Strategy 1: [Q]: marker boundaries (most reliable for UPSC scripts)
    const s1 = segmentByQMarkerLines(transcript);
    if (s1 && s1.length >= 1) {
      console.log(`detect-questions: strategy 1 → ${s1.length} segments`);
      return NextResponse.json({ segments: s1 });
    }

    // Strategy 2: Regex boundaries
    const s2 = segmentByRegex(transcript, qMarkers);
    if (s2 && s2.length >= 2) {
      console.log(`detect-questions: strategy 2 → ${s2.length} segments`);
      return NextResponse.json({ segments: s2 });
    }

    // Strategy 3: Groq with condensed transcript (avoids token limits)
    console.log("detect-questions: falling back to strategy 3 (Groq condensed)");
    const s3 = await segmentViaGroq(transcript, qMarkers);
    console.log(`detect-questions: strategy 3 → ${s3.length} segments`);
    return NextResponse.json({ segments: s3 });
  } catch (err: any) {
    console.error("detect-questions error:", err);
    return NextResponse.json(
      { error: "Detection failed: " + (err?.message ?? String(err)) },
      { status: 500 }
    );
  }
}
