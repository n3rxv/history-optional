import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a UPSC History Optional expert. Given a passage of historical text, identify up to 15 important historical/technical terms that a student might not know. These can be Persian/Arabic/Sanskrit terms, administrative titles, technical concepts, or lesser-known historical events.

Return ONLY a JSON array. No preamble, no markdown. Each object must have:
- "term": the exact word or phrase as it appears in the text (case-sensitive match)
- "description": a clear 1-2 line explanation (max 25 words) suitable for a UPSC student

Example:
[
  {"term": "iqta", "description": "Land revenue assignment given to military officers in the Delhi Sultanate instead of cash salary."},
  {"term": "mansabdar", "description": "Mughal official holding a mansab (rank) determining their military and administrative responsibilities."}
]

Rules:
- Only include terms actually present verbatim in the text
- Prefer lesser-known terms over common ones
- Max 15 terms
- Return empty array [] if no relevant terms found`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ terms: [] });
    }

    // Truncate to 4000 chars to avoid token limits
    const truncated = text.slice(0, 4000);

    const groqFetch = async (key: string) =>
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Identify historical terms in this text:\n\n${truncated}` },
          ],
          temperature: 0.1,
          max_tokens: 800,
          response_format: { type: "json_object" },
        }),
      });

    let res = await groqFetch(process.env.GROQ_API_KEY!);
    if (res.status === 429 && process.env.GROQ_API_KEY_2) {
      res = await groqFetch(process.env.GROQ_API_KEY_2);
    }

    if (!res.ok) {
      console.error("detect-terms Groq error:", res.status);
      return NextResponse.json({ terms: [] });
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content ?? "[]";
    content = content.replace(/```json|```/g, "").trim();

    // Handle both {terms:[...]} and plain [...] responses
    let terms: { term: string; description: string }[] = [];
    try {
      const parsed = JSON.parse(content);
      terms = Array.isArray(parsed) ? parsed : (parsed.terms ?? parsed.result ?? []);
    } catch {
      terms = [];
    }

    return NextResponse.json({ terms });
  } catch (err) {
    console.error("detect-terms error:", err);
    return NextResponse.json({ terms: [] });
  }
}
