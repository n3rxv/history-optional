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

export async function POST(req: NextRequest) {
  try {
    const { files, year, lang } = await req.json();

    if (!files?.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });
    if (!year) return NextResponse.json({ error: "Year required" }, { status: 400 });

    const entries = mapData
      .filter((e) => e.year === Number(year))
      .sort((a, b) => a.number - b.number);
    if (!entries.length)
      return NextResponse.json({ error: `No map data for ${year}` }, { status: 400 });

    const answerKey = entries
      .map((e) => `(${toRoman(e.number)}) Hint: "${e.hint}" → Correct answer: ${e.answer}`)
      .join("\n");

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

    const userText = `These are the student's handwritten Q1 map answers for UPSC History Optional ${year}. Extract their answer and ~30-word note for each roman numeral (i)–(xx). Evaluate strictly per the rubric. Return only JSON.`;

    // ── Step 1: OCR via Gemini (supports both images AND PDFs) ──────────────
    let transcript = "";
    try {
      const geminiParts: object[] = files.map((f: { data: string; type: string }) => ({
        inline_data: { mime_type: f.type || "image/jpeg", data: f.data },
      }));
      geminiParts.push({
        text: `Transcribe every handwritten answer you can see for Q1 map question. For each roman numeral (i) through (xx), write: the location name the student wrote, and their ~30-word note. Be precise. Format as:
(i) [location] — [note]
(ii) [location] — [note]
...and so on. If blank, write: (ix) blank`,
      });

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: geminiParts }],
            generationConfig: { temperature: 0.0, maxOutputTokens: 3000 },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        transcript = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        console.log("Map OCR transcript:\n", transcript.slice(0, 400));
      } else {
        console.log("Gemini OCR failed — will pass images directly to Haiku");
      }
    } catch (ocrErr) {
      console.log("OCR error (non-fatal):", ocrErr);
    }

    // ── Step 2: Evaluate via Claude Haiku 4.5 ───────────────────────────────
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Convert base64 images to Anthropic format
    type AnthropicImageBlock = {
      type: "image";
      source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string };
    };
    const imageBlocks: AnthropicImageBlock[] = (files as { data: string; type: string }[])
      .filter((f) => f.type?.startsWith("image/"))
      .map((f) => ({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: (f.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: f.data,
        },
      }));

    const userContent: Anthropic.MessageParam["content"] = [
      ...imageBlocks,
      {
        type: "text" as const,
        text: transcript
          ? `${userText}\n\nOCR TRANSCRIPT (use this as primary source):\n${transcript}`
          : userText,
      },
    ];

    const haikuRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: systemPrompt + (lang === "hi" ? "\n\nIMPORTANT: Write your ENTIRE response in Hindi (Devanagari script)." : ""),
      messages: [{ role: "user", content: userContent }],
    });

    const raw = haikuRes.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("map-evaluate route error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
