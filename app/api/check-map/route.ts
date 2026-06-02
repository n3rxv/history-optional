import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildAnswerKey } from "@/lib/buildAnswerKey";
import { checkAnswers } from "@/lib/checkAnswers";

export const maxDuration = 60;
export const dynamic = "force-dynamic";


const groq = new Groq();
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

async function extractDotsFromMap(base64: string): Promise<any[]> {
  const res = await groq.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:image/png;base64,${base64}` } },
        { type: "text", text: `You are reading a UPSC History Optional map question paper.
The image shows a map of India with numbered dots (i) through (xx).
Below or beside the map the clues are listed seriatim e.g. "(i) Neolithic site", "(ii) Mesolithic site".
For EVERY numbered dot extract:
- number: Roman numeral as lowercase string e.g. "i", "ii", "xv"
- clue: the clue text exactly as printed
- region: the Indian state/region where that dot appears geographically on the map

Return ONLY a valid JSON array. No markdown, no backticks, no explanation.
Example: [{"number":"i","clue":"Neolithic site","region":"Kashmir"},{"number":"ii","clue":"Mesolithic site","region":"Rajasthan"}]` }
      ]
    }]
  });
  const text = res.choices[0]?.message?.content ?? "[]";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return []; }
}

async function extractStudentAnswers(images: string[]): Promise<any[]> {
  const content: any[] = images.map(b64 => ({
    type: "image_url",
    image_url: { url: `data:image/png;base64,${b64}` }
  }));
  content.push({
    type: "text",
    text: `You are reading a UPSC History Optional handwritten answer booklet — map question Q1.
Across ALL the images find every Roman numeral answer (i) through (xx).
For each extract:
- number: Roman numeral lowercase string e.g. "i", "xii"
- site_name: the site name the student wrote (null if blank or illegible)
- state: the state or location written (null if not written)

Fix obvious handwriting errors: "Burzahm"→"Burzahom", "Lothl"→"Lothal", "Kalibagan"→"Kalibangan", "Kushinara"→"Kushinagar".
Include ALL numbers i through xx; use null values for any that are blank.

Return ONLY a valid JSON array. No markdown, no backticks, no explanation.
Example: [{"number":"i","site_name":"Burzahom","state":"Kashmir"},{"number":"ix","site_name":null,"state":null}]`
  });

  const res = await groq.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 3000,
    messages: [{ role: "user", content }]
  });
  const text = res.choices[0]?.message?.content ?? "[]";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return []; }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mapPage, answerPages } = body;

    if (!mapPage || !answerPages?.length) {
      return NextResponse.json({ error: "Missing mapPage or answerPages" }, { status: 400 });
    }

    const [dots, studentAnswers] = await Promise.all([
      extractDotsFromMap(mapPage),
      extractStudentAnswers(answerPages),
    ]);

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
      flaggedForReview: results.filter(r => r.status === "low_confidence"),
      answerKey,
    });

  } catch (err: any) {
    console.error("[check-map]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
