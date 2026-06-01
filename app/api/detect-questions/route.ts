import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript?.trim())
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });

    const prompt = `You are analysing a UPSC History Optional handwritten answer sheet that has been OCR-transcribed.
Segment the transcript into individual question-answer pairs.

TRANSCRIPT:
"""
${transcript}
"""

Rules:
- Look for question number markers like "Q1", "Q.1", "1.", "3(a)", "7b", "5(c)", "Answer 1", etc.
- Each marker signals the start of a new answer
- Extract the complete answer body for each question
- For marks: look for "(10M)", "10 marks", "15M" near the question — default to 15 if absent
- If no question markers found, return the whole transcript as one answer with questionNumber "Q1"

CRITICAL: Respond with ONLY a raw JSON array. No markdown. No backticks. No explanation. No preamble. Start your response with [ and end with ].

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
        messages: [
          {
            role: "system",
            content: "You are a JSON-only response bot. You output raw JSON arrays with no markdown, no backticks, no explanation. Your entire response must be a valid JSON array starting with [ and ending with ].",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.0,
        max_tokens: 4000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: "Detection failed: " + err }, { status: 500 });
    }

    const data = await res.json();
    let raw: string = data.choices?.[0]?.message?.content ?? "";

    // ── Aggressive cleaning ──
    // Strip markdown fences (```json ... ``` or ``` ... ```)
    raw = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
    // Strip any leading text before the first [
    const arrayStart = raw.indexOf("[");
    const arrayEnd   = raw.lastIndexOf("]");
    if (arrayStart === -1 || arrayEnd === -1) {
      // Last resort: wrap the whole transcript as one segment
      console.error("detect-questions: no JSON array found in response:", raw.slice(0, 300));
      return NextResponse.json({
        segments: [{
          questionNumber: "Q1",
          marks: 15,
          questionText: "",
          answerText: transcript,
        }],
      });
    }

    raw = raw.slice(arrayStart, arrayEnd + 1).trim();

    let segments = [];
    try {
      segments = JSON.parse(raw);
    } catch (parseErr) {
      console.error("detect-questions parse error:", parseErr, "raw:", raw.slice(0, 300));
      // Graceful fallback: treat whole transcript as one question
      segments = [{
        questionNumber: "Q1",
        marks: 15,
        questionText: "",
        answerText: transcript,
      }];
    }

    // Ensure every segment has required fields
    segments = segments.map((s: any) => ({
      questionNumber: s.questionNumber ?? "Q1",
      marks: Number(s.marks) || 15,
      questionText: s.questionText ?? "",
      answerText: s.answerText ?? transcript,
    }));

    return NextResponse.json({ segments });
  } catch (err) {
    console.error("detect-questions error:", err);
    return NextResponse.json({ error: "Detection failed" }, { status: 500 });
  }
}
