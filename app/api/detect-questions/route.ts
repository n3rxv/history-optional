import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 60;

const MARKS_RE = /\((\d+)\s*(?:marks?|m)\)/i;

// ── Normalise question number strings for fuzzy matching ─────────────────────
// "Q.5 (a)", "5(a)", "Q5a", "5 a" → "5a"
function normQNum(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^q\.?\s*/i, "")
    .replace(/[\s.()\[\]]/g, "")
    .replace(/–|-/g, "");
}

// ── Detect map question: Q1 sub-parts listed as (i)(ii)(iii) ─────────────────
function isMapQuestion(lines: string[], questionText: string = ""): boolean {
  // Signal 1: question text explicitly calls for map work
  const qLower = questionText.toLowerCase();
  if (/\b(on (?:the )?map|locate|mark on|shade|label the|identify.*map|map.*identify)\b/.test(qLower))
    return true;

  const nonEmpty = lines.filter((l) => l.trim().length > 0);

  // Signal 2: ≥70 % of non-empty lines are ≤4 words → place-name listing
  if (nonEmpty.length >= 3) {
    const short = nonEmpty.filter((l) => l.trim().split(/\s+/).length <= 4);
    if (short.length / nonEmpty.length >= 0.7) return true;
  }

  // Signal 3: roman-numeral markers (raised threshold to ≥4 to cut false positives)
  let romanCount = 0;
  for (const l of lines)
    if (/^\(x{0,3}(?:ix|iv|v?i{0,3})\)/i.test(l.trim())) romanCount++;
  if (romanCount >= 4) return true;

  // Signal 4: some roman markers + very short avg line = listing, not prose
  if (romanCount >= 2 && nonEmpty.length >= 2) {
    const avgWords =
      nonEmpty.reduce((s, l) => s + l.trim().split(/\s+/).length, 0) / nonEmpty.length;
    if (avgWords <= 5) return true;
  }

  return false;
}

// ── Zone splitter ─────────────────────────────────────────────────────────────
// Returns index of first line of the answer zone.
// Heuristic: answer zone starts when we see a question number marker
// followed within 6 lines by a long prose line (>80 chars).
function findAnswerZoneStart(lines: string[]): number {
  const QNUM = /^(?:Q\.?\s*)?(\d)\s*[.()\s]*(?:[a-e]\s*[.)]\s*)?$/i;
  for (let i = 0; i < lines.length; i++) {
    if (!QNUM.test(lines[i].trim())) continue;
    // look ahead for a prose line
    for (let j = i + 1; j < Math.min(i + 7, lines.length); j++) {
      if (lines[j].trim().length > 80) return i;
    }
  }
  // Fallback: if no split found, treat whole transcript as answer zone
  return 0;
}

// ── Parse question paper zone → question map ─────────────────────────────────
// Returns { normKey → { text, marks } }
function parseQuestionMap(
  lines: string[]
): Record<string, { text: string; marks: number }> {
  const map: Record<string, { text: string; marks: number }> = {};

  const FULL_Q = /^(?:Q\.?\s*)?(\d)\s*[.(]\s*([a-e])\s*[.)]\s*(.*)/i;
  const MAIN_Q = /^(?:Q\.?\s*)?([1-8])\s*[.)]\s*(.*)/i;
  const SUB_Q  = /^\(?\s*([a-e])\s*\)\.?\s*(.*)/i;

  let lastMain = "";
  let collectingFor: string | null = null;
  let collectBuf: string[] = [];

  function flush() {
    if (!collectingFor) return;
    const text = collectBuf.join(" ").trim();
    const mMatch = MARKS_RE.exec(text);
    const marks = mMatch ? parseInt(mMatch[1]) : 15;
    map[normQNum(collectingFor)] = { text, marks };
    collectingFor = null;
    collectBuf = [];
  }

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) continue;

    const fm = t.match(FULL_Q);
    if (fm) {
      flush();
      lastMain = `Q${fm[1]}`;
      const key = `Q${fm[1]}(${fm[2].toLowerCase()})`;
      collectingFor = key;
      collectBuf = fm[3] ? [fm[3]] : [];
      continue;
    }

    const mm = t.match(MAIN_Q);
    if (mm && t.length < 200) {
      flush();
      lastMain = `Q${mm[1]}`;
      collectingFor = lastMain;
      collectBuf = mm[2] ? [mm[2]] : [];
      continue;
    }

    const sm = t.match(SUB_Q);
    if (sm && lastMain && t.length < 200) {
      flush();
      const key = `${lastMain}(${sm[1].toLowerCase()})`;
      collectingFor = key;
      collectBuf = sm[2] ? [sm[2]] : [];
      continue;
    }

    // continuation line
    if (collectingFor && t.length > 0) {
      collectBuf.push(t);
    }
  }
  flush();

  return map;
}

// ── Parse answer zone → segments ─────────────────────────────────────────────
interface RawSegment {
  qKey: string;   // normalised
  qRaw: string;   // as written by student
  lines: string[];
}

function parseAnswerZone(lines: string[]): RawSegment[] {
  const FULL_Q = /^(?:Q\.?\s*)?(\d)\s*[.(]\s*([a-e])\s*[.)]/i;
  const MAIN_Q = /^(?:Q\.?\s*)?([1-8])\s*[.)]\s*$/;
  const SUB_Q  = /^\(?\s*([a-e])\s*\)\s*(?:→\s*)?$/i;

  const bounds: { lineIdx: number; qRaw: string; qKey: string }[] = [];
  let lastMain = "";

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t || t.length > 40) continue;

    const fm = t.match(FULL_Q);
    if (fm) {
      lastMain = `Q${fm[1]}`;
      const qRaw = `Q${fm[1]}(${fm[2].toLowerCase()})`;
      if (!bounds.length || bounds[bounds.length - 1].qKey !== normQNum(qRaw))
        bounds.push({ lineIdx: i, qRaw, qKey: normQNum(qRaw) });
      continue;
    }

    const mm = t.match(MAIN_Q);
    if (mm) {
      const qRaw = `Q${mm[1]}`;
      if (normQNum(qRaw) !== lastMain) {
        lastMain = normQNum(qRaw);
        bounds.push({ lineIdx: i, qRaw, qKey: normQNum(qRaw) });
      }
      continue;
    }

    const sm = t.match(SUB_Q);
    if (sm && lastMain) {
      const qRaw = `Q${lastMain.replace(/^q/i, "")}(${sm[1].toLowerCase()})`;
      if (!bounds.length || bounds[bounds.length - 1].qKey !== normQNum(qRaw))
        bounds.push({ lineIdx: i, qRaw, qKey: normQNum(qRaw) });
    }
  }

  return bounds.map((b, idx) => {
    const nextIdx = bounds[idx + 1]?.lineIdx ?? lines.length;
    const segLines = lines.slice(b.lineIdx + 1, nextIdx);
    return { qKey: b.qKey, qRaw: b.qRaw, lines: segLines };
  });
}

// ── Strip rewritten question lines from the top of an answer ─────────────────
// If the first 1-4 lines look like a rewritten question (short, ends with ?
// or shares many words with qText), drop them.
function stripRewrittenQuestion(lines: string[], qText: string): string[] {
  const qWords = new Set(
    qText.toLowerCase().split(/\s+/).filter((w) => w.length > 4)
  );
  let cutAt = 0;
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    const t = lines[i].trim();
    if (!t) continue;
    // Short line ending with ? → likely rewritten question
    if (t.endsWith("?") && t.length < 200) { cutAt = i + 1; continue; }
    // Line shares >50% of long words with the question text → rewrite
    const lineWords = t.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const overlap = lineWords.filter((w) => qWords.has(w)).length;
    if (lineWords.length > 0 && overlap / lineWords.length > 0.5) {
      cutAt = i + 1;
      continue;
    }
    // OCR-injected [Q]: line
    if (/^\[Q\]:/.test(t)) { cutAt = i + 1; continue; }
    break; // first non-question line → stop
  }
  return lines.slice(cutAt);
}

// ── Condense transcript for Groq (keeps structure, strips prose bulk) ─────────
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

// ── Groq fallback for completely unstructured transcripts ─────────────────────
async function segmentViaGroq(transcript: string): Promise<any[]> {
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
          content: "Return ONLY a valid JSON array. No markdown. No extra text.",
        },
        {
          role: "user",
          content: `Segment this UPSC answer sheet transcript into question-answer pairs.\nTranscript:\n"""\n${condense(transcript)}\n"""\nRules: identify question markers, extract answerText (prose only, no map sub-listings), default marks=15.\nReturn: [{"questionNumber":"Q5(a)","marks":15,"questionText":"...","answerText":"..."}]`,
        },
      ],
      temperature: 0,
      max_tokens: 3000,
    }),
  });
  if (!res.ok) throw new Error("Groq error: HTTP " + res.status);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "[]";
  const stripped = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const s = stripped.indexOf("[");
  const e = stripped.lastIndexOf("]");
  try {
    return JSON.parse(s !== -1 ? stripped.slice(s, e + 1) : stripped);
  } catch {
    return [];
  }
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

    const lines = transcript.split("\n");

    // ── Step 1: split into zones ─────────────────────────────────────────────
    const answerStart = findAnswerZoneStart(lines);
    const qpLines = lines.slice(0, answerStart);
    const ansLines = lines.slice(answerStart);

    console.log(
      `detect-questions: zone split at line ${answerStart}/${lines.length}`
    );

    // ── Step 2: build question map from question paper zone ──────────────────
    const qMap = answerStart > 0 ? parseQuestionMap(qpLines) : {};
    console.log(
      `detect-questions: question map keys = [${Object.keys(qMap).join(", ")}]`
    );

    // ── Step 3: parse answer zone ────────────────────────────────────────────
    const rawSegs = parseAnswerZone(ansLines);
    console.log(`detect-questions: raw answer segments = ${rawSegs.length}`);

    // ── Step 4: merge + filter ───────────────────────────────────────────────
    const segments: any[] = [];

    for (const seg of rawSegs) {
      // Look up question in map — exact match first, then prefix fuzzy
      const mapEntry =
        qMap[seg.qKey] ??
        Object.entries(qMap).find(
          ([k]) => k.startsWith(seg.qKey) || seg.qKey.startsWith(k)
        )?.[1];

      const questionText = mapEntry?.text ?? "";
      const marks = mapEntry?.marks ?? 15;

      // Strip rewritten question lines from top of answer
      const cleanLines = stripRewrittenQuestion(seg.lines, questionText);

      // Remove any remaining [Q]: injected lines
      const answerText = cleanLines
        .filter((l) => !/^\[Q\]:/.test(l.trim()))
        .join("\n")
        .trim();

      // Omit if no actual answer content (< 10 words)
      if (!answerText || answerText.split(/\s+/).length < 10) continue;

      // Omit map questions (Q1 roman-numeral sub-listings)
      if (isMapQuestion(cleanLines)) continue;

      segments.push({
        questionNumber: seg.qRaw,
        marks,
        questionText,
        answerText,
      });
    }

    // ── Step 5: Groq fallback if structured parsing found nothing ────────────
    if (segments.length === 0) {
      console.log(
        "detect-questions: structured parse empty, falling back to Groq"
      );
      const groqSegs = await segmentViaGroq(transcript);
      const filtered = groqSegs.filter(
        (s) =>
          s.answerText?.trim() &&
          s.answerText.split(/\s+/).length >= 10 &&
          !isMapQuestion(s.answerText.split("\n"), s.questionText ?? "")
      );
      if (filtered.length > 0)
        return NextResponse.json({ segments: filtered });

      // Last resort: single segment with full transcript
      return NextResponse.json({
        segments: [
          {
            questionNumber: "Q1",
            marks: 15,
            questionText: "",
            answerText: transcript.replace(/^\[Q\]:.*$/gm, "").trim(),
          },
        ],
      });
    }

    console.log(`detect-questions: final segments = ${segments.length}`);
    return NextResponse.json({ segments });
  } catch (err: any) {
    console.error("detect-questions error:", err);
    return NextResponse.json(
      { error: "Detection failed: " + (err?.message ?? String(err)) },
      { status: 500 }
    );
  }
}
