import { NextRequest, NextResponse } from "next/server";
import { mapData } from "@/lib/mapData";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const { images, year, token } = await req.json();

    if (!images?.length) return NextResponse.json({ error: "No images provided" }, { status: 400 });
    if (!year) return NextResponse.json({ error: "Year required" }, { status: 400 });

    const entries = mapData.filter((e) => e.year === Number(year));
    if (!entries.length) return NextResponse.json({ error: `No map data for ${year}` }, { status: 400 });

    // Sort by number 1–20
    entries.sort((a, b) => a.number - b.number);

    const answerKey = entries
      .map((e) => `(${toRoman(e.number)}) Hint: "${e.hint}" → Correct answer: ${e.answer}`)
      .join("\n");

    // Build image content blocks
    const imageBlocks = images.map((b64: string) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: b64.startsWith("/9j") ? "image/jpeg" : "image/png",
        data: b64,
      },
    }));

    const systemPrompt = `You are an expert UPSC History Optional evaluator for Q1 (Map Question).
Q1 has 20 locations marked (i)–(xx) on a blank India map. Each is worth 2.5 marks (identification ~1.5 + note quality ~1).
Total: 50 marks.

ANSWER KEY for ${year}:
${answerKey}

SCORING RULES:
- Identification fully correct: 1.5/1.5
- Identification partially correct (right region/period): 0.75/1.5
- Identification wrong: 0/1.5
- Note (30 words): insightful + accurate = 1/1 | adequate = 0.5/1 | missing/wrong = 0/1
- If student left blank: 0/2.5

Respond ONLY with a valid JSON object, no markdown, no preamble:
{
  "results": [
    {
      "number": 1,
      "roman": "i",
      "hint": "...",
      "correctAnswer": "...",
      "studentAnswer": "...",
      "studentNote": "...",
      "identificationMarks": 1.5,
      "noteMarks": 1.0,
      "total": 2.5,
      "feedback": "one line feedback"
    }
    // ... all 20 entries
  ],
  "grandTotal": 48.5,
  "outOf": 50,
  "overallFeedback": "2-3 sentence overall comment"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              ...imageBlocks,
              {
                type: "text",
                text: `These are the student's handwritten Q1 answers for UPSC History Optional ${year}. Extract their answer and 30-word note for each roman numeral (i)–(xx) and evaluate strictly per the rubric. Return only JSON.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";

    // Strip possible markdown fences
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [20, "xx"], [19, "xix"], [18, "xviii"], [17, "xvii"], [16, "xvi"],
    [15, "xv"], [14, "xiv"], [13, "xiii"], [12, "xii"], [11, "xi"],
    [10, "x"], [9, "ix"], [8, "viii"], [7, "vii"], [6, "vi"],
    [5, "v"], [4, "iv"], [3, "iii"], [2, "ii"], [1, "i"],
  ];
  return map.find(([v]) => v === n)?.[1] ?? String(n);
}
