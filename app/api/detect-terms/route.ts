import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a UPSC History Optional expert. Given a passage of historical text, identify up to 15 important historical/technical terms that a student might not know. These can be Persian/Arabic/Sanskrit terms, administrative titles, technical concepts, or lesser-known historical events.

Return ONLY a JSON array. No preamble, no markdown, no code fences. Each object must have:
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
- Return empty array [] if no relevant terms found
- Return ONLY the JSON array, nothing else`;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ terms: [] });
    }

    // Strip HTML tags, decode entities, collapse whitespace
    const cleanText = decodeHtmlEntities(
      text.replace(/<[^>]+>/g, " ")
    )
      .replace(/\s+/g, " ")
      .trim();

    if (cleanText.length < 20) {
      return NextResponse.json({ terms: [] });
    }

    const truncated = cleanText.slice(0, 4000);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("detect-terms: GEMINI_API_KEY not set");
      return NextResponse.json({ terms: [] });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              parts: [
                {
                  text: `Identify historical terms in this text:\n\n${truncated}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 800,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) {
      console.error("detect-terms Gemini error:", res.status, await res.text());
      return NextResponse.json({ terms: [] });
    }

    const data = await res.json();
    let content: string =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    content = content.replace(/```json|```/g, "").trim();

    let terms: { term: string; description: string }[] = [];
    try {
      const parsed = JSON.parse(content);
      terms = Array.isArray(parsed)
        ? parsed
        : (parsed.terms ?? parsed.result ?? []);
    } catch {
      terms = [];
    }

    return NextResponse.json({ terms });
  } catch (err) {
    console.error("detect-terms error:", err);
    return NextResponse.json({ terms: [] });
  }
}
