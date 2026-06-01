import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript?.trim())
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });

    const prompt = `You are analysing a UPSC History Optional handwritten answer sheet that has been OCR-transcribed into plain text.

Your task: segment this transcript into individual question-answer pairs.

TRANSCRIPT:
"""
${transcript}
"""

Rules:
- Look for question number markers like "Q1", "Q.1", "1.", "3(a)", "7b", "5(c)", "Answer 1", etc.
- Each marker signals the start of a new answer
- The student may have written the question text above their answer — if so, extract it
- Extract the complete answer body for each question (everything after the question text until the next question marker)
- For marks: look for patterns like "(10M)", "10 marks", "15M" near the question number — if absent, default to 15
- If you cannot find any question markers, treat the entire transcript as one answer with questionNumber "Q1"

Return ONLY a JSON array, no markdown, no preamble:
[
  {
    "questionNumber": "Q1",
    "marks": 15,
    "questionText": "question text if student wrote it, else empty string",
    "answerText": "complete answer body"
  }
]`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.0,
        max_tokens: 4000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: "Detection failed: " + err }, { status: 500 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "[]";
    const clean = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

    let segments = [];
    try { segments = JSON.parse(clean); } catch {
      return NextResponse.json({ error: "Failed to parse question segments" }, { status: 500 });
    }

    return NextResponse.json({ segments });

  } catch (err) {
    console.error("detect-questions error:", err);
    return NextResponse.json({ error: "Detection failed" }, { status: 500 });
  }
}
