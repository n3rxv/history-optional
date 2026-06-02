import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildAnswerKey } from "@/lib/buildAnswerKey";
import { checkAnswers } from "@/lib/checkAnswers";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";

async function askGemini(base64: string, mimeType: string, prompt: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not configured");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
}

// ── Groq text-only verify step ────────────────────────────────
const groq = new Groq();

async function askGroqText(prompt: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 3000,
    temperature: 0.1,
    messages: [{ role: "user", content: prompt }],
  });
  return res.choices[0]?.message?.content ?? "{}";
}

// ── Main handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mapPage, cluesPage, answersPage } = body;
    if (!mapPage || !cluesPage || !answersPage) {
      return NextResponse.json({ error: "Missing pages" }, { status: 400 });
    }

    // Step 1 — Gemini reads clues from map page
    const mapRaw = await askGemini(cluesPage, "image/jpeg", `RESPOND WITH ONLY A JSON ARRAY. NO TEXT BEFORE OR AFTER. NO EXPLANATION.
This image shows a map of India with numbered dots and clues listed beside/below the map.
Extract every dot: number (roman numeral lowercase), clue (exact text in English), region (state on map).
START YOUR RESPONSE WITH [ AND END WITH ]. NOTHING ELSE.
Example: [{"number":"i","clue":"Neolithic site","region":"Kashmir"},{"number":"ii","clue":"Mesolithic site","region":"Rajasthan"}]`);

    // Step 2 — Gemini reads student handwritten answers
    const answersRaw = await askGemini(answersPage, "image/jpeg", `This image is a UPSC History Optional handwritten answer booklet in Hindi and English.
Find the map question section where the student wrote site names and short notes for Roman numerals (i) through (xx).

For EACH numeral i through xx extract:
- number: roman numeral lowercase string e.g. "i", "xii"
- site_name: the site name written (null if blank)
- description: the 1-3 line explanation written below the site name (null if nothing written). Transcribe exactly as written.

Rules:
- Include ALL 20 numerals, use null for blanks
- Fix obvious handwriting errors in site names only: "Burzahm"→"Burzahom", "Kalibagan"→"Kalibangan", "Lothl"→"Lothal"
- Do NOT fix or alter the description text
- The description is the lines written BELOW the underlined site name

Return ONLY a valid JSON array. No markdown, no backticks.
Example: [{"number":"i","site_name":"Burzahom","description":"Dog bones found here. Burial grounds. Factory site."},{"number":"ii","site_name":null,"description":null}]`);

    let dots: any[] = [];
    let studentAnswers: any[] = [];

    console.log("[check-map] mapRaw:", mapRaw.slice(0, 500));
    console.log("[check-map] answersRaw:", answersRaw.slice(0, 800));
    console.log("[check-map] first student answer sample:", JSON.stringify(studentAnswers?.slice?.(0,2)));

    function cleanJson(raw: string): string {
      return raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/g, "").trim();
    }
    try { dots = JSON.parse(cleanJson(mapRaw)); } catch (e) { console.log("[check-map] dots parse error:", e, mapRaw.slice(0, 200)); }
    try { studentAnswers = JSON.parse(cleanJson(answersRaw)); } catch (e) { console.log("[check-map] answers parse error:", e, answersRaw.slice(0, 200)); }

    if (!dots.length) {
      return NextResponse.json({ error: "Could not read map clues — try a clearer scan" }, { status: 422 });
    }

    const answerKey = buildAnswerKey(dots);

    // Step 3 — Groq text-only verify
    const verifyPrompt = `You are a UPSC History examiner marking a UPSC History Optional map question.

STRICT RULES for siteCorrect:
- Mark siteCorrect: true if the student answer refers to the SAME site as the correct answer, even if spelling differs slightly (e.g. "Hunsgi"="Hungsi", "Ashmaka"="Assaka"="Asmaka", "Erreguda"="Yerragudi", "Nagapattinam"="Nagapatnam")
- Mark siteCorrect: true if the site is a well-known accepted answer for that clue, even if not the most common name
- Mark siteCorrect: false ONLY if the student wrote a clearly different site or a site that does not match the clue at all
- The clue and region together define what is correct — use your knowledge of Indian history to judge
- Do NOT invent obscure "correct answers" — if the student answer matches the clue and region well, mark it correct

SCORING:
- 1.5 marks for correct site name (siteCorrect: true)
- 1 mark for description quality: 0 = blank/irrelevant, 0.5 = vague but related, 1 = accurate and historically specific
- If siteCorrect is false, descriptionScore must be 0

Return ONLY a JSON object. Keys = roman numeral strings. Each value:
- siteCorrect: true or false
- correctSite: the standard accepted site name
- descriptionScore: 0, 0.5, or 1
- descriptionFeedback: one sentence — what was good or what was missing

Entries:
${JSON.stringify(answerKey.map(k => {
  const s = studentAnswers.find((a: any) => a.number === k.number);
  return {
    number: k.number,
    clue: k.clue,
    region: k.correctLocation,
    student_answer: s?.site_name ?? null,
    student_description: s?.description ?? null,
  };
}), null, 2)}

Return ONLY valid JSON. No markdown, no backticks.
Example: {"i":{"siteCorrect":true,"correctSite":"Burzahom","descriptionScore":1,"descriptionFeedback":"Correctly mentions dog bones and burial grounds."}}`;

    const verifyRaw = await askGroqText(verifyPrompt);
    let groqVerified: Record<string, { siteCorrect: boolean; correctSite: string | null; descriptionScore: number; descriptionFeedback: string }> = {};
    try {
      groqVerified = JSON.parse(verifyRaw.replace(/```json|```/g, "").trim());
    } catch (e) {
      console.log("[check-map] verify parse error:", e, verifyRaw.slice(0, 300));
    }

    const { results, totalMarks, maxTotal } = checkAnswers(answerKey, studentAnswers, groqVerified);

    return NextResponse.json({
      success: true,
      totalMarks: Math.round(totalMarks * 10) / 10,
      maxTotal,
      percentage: Math.round((totalMarks / maxTotal) * 100),
      results,
      flaggedForReview: results.filter((r: any) => r.status === "low_confidence"),
      answerKey,
    });

  } catch (err: any) {
    console.error("[check-map]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
