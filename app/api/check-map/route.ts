import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildAnswerKey } from "@/lib/buildAnswerKey";
import { checkAnswers } from "@/lib/checkAnswers";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const groq = new Groq();
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

async function askGroq(pdfBase64: string, prompt: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 3000,
    messages: [{
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: `data:application/pdf;base64,${pdfBase64}` },
        } as any,
        { type: "text", text: prompt },
      ],
    }],
  });
  return res.choices[0]?.message?.content ?? "[]";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;
    if (!file) return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const pdfBase64 = Buffer.from(buffer).toString("base64");

    const [mapRaw, answersRaw] = await Promise.all([
      askGroq(pdfBase64, `This PDF is a UPSC History Optional map question paper.
Find the page with a map of India with numbered dots (i) through (xx).
Below or beside the map the clues are listed e.g. "(i) Neolithic site", "(ii) Mesolithic site".
For EVERY numbered dot extract:
- number: Roman numeral lowercase string e.g. "i", "xv"
- clue: the clue text exactly as printed
- region: the Indian state/region where that dot appears geographically on the map
Return ONLY a valid JSON array. No markdown, no backticks.
Example: [{"number":"i","clue":"Neolithic site","region":"Kashmir"}]`),

      askGroq(pdfBase64, `This PDF is a UPSC History Optional handwritten answer booklet.
Find the map question section where the student wrote site names and states for Roman numerals (i) through (xx).
For each extract:
- number: Roman numeral lowercase string e.g. "i", "xii"
- site_name: the site name the student wrote (null if blank/illegible)
- state: the state or location written (null if not written)
Fix obvious handwriting errors: "Burzahm"→"Burzahom", "Lothl"→"Lothal", "Kalibagan"→"Kalibangan".
Include ALL numbers i through xx, use null for blanks.
Return ONLY a valid JSON array. No markdown, no backticks.
Example: [{"number":"i","site_name":"Burzahom","state":"Kashmir"}]`),
    ]);

    let dots: any[] = [];
    let studentAnswers: any[] = [];
    try { dots = JSON.parse(mapRaw.replace(/```json|```/g, "").trim()); } catch {}
    try { studentAnswers = JSON.parse(answersRaw.replace(/```json|```/g, "").trim()); } catch {}

    if (!dots.length) {
      return NextResponse.json({ error: "Could not read map dots — try a clearer scan" }, { status: 422 });
    }

    const answerKey = buildAnswerKey(dots);
    const { results, totalMarks, maxTotal } = checkAnswers(answerKey, studentAnswers);

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
