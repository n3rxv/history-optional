import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildAnswerKey } from "@/lib/buildAnswerKey";
import { checkAnswers } from "@/lib/checkAnswers";

// Initialise Groq client — reads GROQ_API_KEY from env automatically
const groq = new Groq();

// Vision model to use for both image-reading tasks
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// ── Vision: read question paper map ──────────────────────────
async function extractDotsFromMap(imageBase64: string, mimeType: string): Promise<any[]> {
  const response = await groq.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
          {
            type: "text",
            text: `You are reading a UPSC History map question paper.
The image shows a map of India with numbered dots labeled (i) through (xx) or similar.
For each numbered dot, extract:
- number: the Roman numeral label (e.g. "i", "ii", "iii")
- clue: the clue text printed near that dot (e.g. "Neolithic site", "IVC port town", "Major Rock Edict")
- region: the Indian state or broad region where the dot appears geographically

Return ONLY a valid JSON array. No markdown, no explanation, no backticks.
Example: [{"number":"i","clue":"Neolithic site","region":"Kashmir"},{"number":"ii","clue":"Mesolithic site","region":"Rajasthan"}]`,
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "[]";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ── Vision: read student answer sheet ────────────────────────
async function extractStudentAnswers(imageBase64: string, mimeType: string): Promise<any[]> {
  const response = await groq.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
          {
            type: "text",
            text: `You are reading a UPSC History handwritten answer sheet — map question section.
For each Roman numeral (i) through (xx), extract what the student wrote.
Fields:
- number: the Roman numeral (e.g. "i", "ii")
- site_name: the site name they wrote (null if blank or illegible)
- state: the state or location they wrote after the site name (null if not written)

Correct obvious handwriting variants: "Burzahm" → "Burzahom", "Lothl" → "Lothal".
If a number is skipped entirely, include it with null values.

Return ONLY a valid JSON array. No markdown, no explanation, no backticks.
Example: [{"number":"i","site_name":"Burzahom","state":"Kashmir"},{"number":"ix","site_name":null,"state":null}]`,
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "[]";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ── Main route ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Expected body shape:
    // {
    //   questionMapPage: { base64: string, mimeType: string },
    //   studentPages:    [{ base64: string, mimeType: string }, ...]
    // }

    const { questionMapPage, studentPages } = body;

    if (!questionMapPage || !studentPages?.length) {
      return NextResponse.json({ error: "Missing questionMapPage or studentPages" }, { status: 400 });
    }

    // Step 1 — extract dots from question map
    const dots = await extractDotsFromMap(questionMapPage.base64, questionMapPage.mimeType);

    // Step 2 — extract student answers (first page; extend for multi-page)
    const studentAnswers = await extractStudentAnswers(studentPages[0].base64, studentPages[0].mimeType);

    // Step 3 — build answer key from bookData
    const answerKey = buildAnswerKey(dots);

    // Step 4 — compare and score
    const { results, totalMarks, maxTotal } = checkAnswers(answerKey, studentAnswers);

    // Flag low-confidence entries for teacher review
    const flagged = results.filter(r => r.status === "low_confidence");

    return NextResponse.json({
      success: true,
      totalMarks: Math.round(totalMarks * 10) / 10,
      maxTotal,
      percentage: Math.round((totalMarks / maxTotal) * 100),
      results,
      flaggedForReview: flagged,
      answerKey,   // useful for debugging / teacher view
    });

  } catch (err: any) {
    console.error("[check-map]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
