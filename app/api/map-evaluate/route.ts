import { NextRequest, NextResponse } from "next/server";
import { mapData } from "@/lib/mapData";

export const maxDuration = 90;

function toRoman(n: number): string {
  const map: [number, string][] = [
    [20,"xx"],[19,"xix"],[18,"xviii"],[17,"xvii"],[16,"xvi"],
    [15,"xv"],[14,"xiv"],[13,"xiii"],[12,"xii"],[11,"xi"],
    [10,"x"],[9,"ix"],[8,"viii"],[7,"vii"],[6,"vi"],
    [5,"v"],[4,"iv"],[3,"iii"],[2,"ii"],[1,"i"],
  ];
  return map.find(([v]) => v === n)?.[1] ?? String(n);
}

const groqFetch = (body: object, key: string) =>
  fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const callWithFallback = async (body: object) => {
  let res = await groqFetch(body, process.env.GROQ_API_KEY!);
  if (res.status === 429 && process.env.GROQ_API_KEY_2) {
    res = await groqFetch(body, process.env.GROQ_API_KEY_2);
  }
  return res;
};

export async function POST(req: NextRequest) {
  try {
    const { files, year } = await req.json();

    if (!files?.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });
    if (!year) return NextResponse.json({ error: "Year required" }, { status: 400 });

    const entries = mapData.filter((e) => e.year === Number(year)).sort((a, b) => a.number - b.number);
    if (!entries.length) return NextResponse.json({ error: `No map data for ${year}` }, { status: 400 });

    const answerKey = entries
      .map((e) => `(${toRoman(e.number)}) Hint: "${e.hint}" → Correct answer: ${e.answer}`)
      .join("\n");

    // Build image_url blocks for Groq (images only — PDFs not supported by Groq vision)
    const imageBlocks: { type: "image_url"; image_url: { url: string } }[] = [];
    for (const f of files) {
      const mime = f.type || "image/jpeg";
      // Skip non-image files (PDFs) — Groq vision only supports images
      if (!mime.startsWith("image/")) continue;
      imageBlocks.push({
        type: "image_url",
        image_url: { url: `data:${mime};base64,${f.data}` },
      });
    }

    // For PDF files, extract text on client side isn't possible server-side here,
    // so inform the user if only PDFs were sent
    if (imageBlocks.length === 0) {
      return NextResponse.json(
        { error: "Please upload image files (JPG/PNG). For PDFs, please convert to images first or take photos of your answer sheet." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert UPSC History Optional evaluator for Q1 (Map Question).
Q1 has 20 locations marked (i)–(xx) on a blank India map. Each is worth 2.5 marks (identification ~1.5 + note quality ~1). Total: 50 marks.

ANSWER KEY for ${year}:
${answerKey}

SCORING RULES:
- Identification fully correct: 1.5/1.5
- Identification partially correct (right region/period/culture): 0.75/1.5
- Identification wrong: 0/1.5
- Note (~30 words): insightful + accurate = 1/1 | adequate = 0.5/1 | missing/blank = 0/1
- Blank entry: 0/2.5

Respond ONLY with valid JSON, no markdown, no preamble:
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
  ],
  "grandTotal": 42.5,
  "outOf": 50,
  "overallFeedback": "2-3 sentence overall comment"
}`;

    const userContent: ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[] = [
      ...imageBlocks,
      {
        type: "text",
        text: `These are the student's handwritten Q1 map answers for UPSC History Optional ${year}. Extract their answer and ~30-word note for each roman numeral (i)–(xx). Evaluate strictly per the rubric. Return only JSON.`,
      },
    ];

    const res = await callWithFallback({
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq map-evaluate error:", err);
      return NextResponse.json({ error: `AI error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("map-evaluate route error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
