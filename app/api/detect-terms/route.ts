import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a UPSC History Optional expert. Given a passage of historical text, identify up to 15 important historical/technical terms that a student might not know. These can be Persian/Arabic/Sanskrit terms, administrative titles, technical concepts, or lesser-known historical events.

Return ONLY a valid JSON array. No preamble, no markdown, no code fences. Each object must have:
- "term": the exact word or phrase as it appears in the text (case-sensitive match)
- "description": a clear 1-2 line explanation (max 25 words) suitable for a UPSC student

Example output:
[{"term":"iqta","description":"Land revenue assignment given to military officers in the Delhi Sultanate instead of cash salary."},{"term":"mansabdar","description":"Mughal official holding a mansab rank determining their military and administrative responsibilities."}]

Rules:
- Only include terms actually present verbatim in the text
- Prefer lesser-known Persian/Arabic/Sanskrit terms, titles, and concepts over common English words
- Max 15 terms
- Return empty array [] if no relevant terms found`;

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
      return NextResponse.json({ terms: [], debug: "no text" });
    }

    const cleanText = decodeHtmlEntities(text.replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();

    if (cleanText.length < 20) {
      return NextResponse.json({ terms: [], debug: "text too short" });
    }

    const truncated = cleanText.slice(0, 4000);

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
            {
              role: "user",
              content: `Identify historical terms in this text:\n\n${truncated}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 800,
        }),
      });

    const key1 = process.env.GROQ_API_KEY;
    if (!key1) {
      return NextResponse.json({ terms: [], debug: "no GROQ_API_KEY" });
    }

    let res = await groqFetch(key1);
    if (res.status === 429 && process.env.GROQ_API_KEY_2) {
      res = await groqFetch(process.env.GROQ_API_KEY_2);
    }

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ terms: [], debug: `groq error ${res.status}: ${errText}` });
    }

    const data = await res.json();
    let content: string = data.choices?.[0]?.message?.content ?? "[]";
    const rawContent = content;
    content = content.replace(/```json|```/g, "").trim();

    let terms: { term: string; description: string }[] = [];
    try {
      const parsed = JSON.parse(content);
      terms = Array.isArray(parsed)
        ? parsed
        : (parsed.terms ?? parsed.result ?? []);
    } catch (e) {
      return NextResponse.json({ terms: [], debug: `parse error: ${e}, raw: ${rawContent}` });
    }

    return NextResponse.json({ terms, debug: `ok, found ${terms.length} terms` });
  } catch (err) {
    return NextResponse.json({ terms: [], debug: `exception: ${err}` });
  }
}
