import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildAnswerKey } from "@/lib/buildAnswerKey";
import { checkAnswers } from "@/lib/checkAnswers";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const groq = new Groq();
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

async function askGroq(base64: string, prompt: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 3000,
    messages: [{
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${base64}` },
        } as any,
        { type: "text", text: prompt },
      ],
    }],
  });
  return res.choices[0]?.message?.content ?? "[]";
}

export async function POST(req: NextRequest) {
  try {


    const body = await req.json();
    const { mapPage, cluesPage, answersPage } = body;
    if (!mapPage || !cluesPage || !answersPage) {
      return NextResponse.json({ error: "Missing pages" }, { status: 400 });
    }

    const [mapRaw, answersRaw] = await Promise.all([
      askGroq(cluesPage, `RESPOND WITH ONLY A JSON ARRAY. NO TEXT BEFORE OR AFTER. NO EXPLANATION.
This image shows a map of India with numbered dots and clues listed beside/below the map.
Extract every dot: number (roman numeral lowercase), clue (exact text), region (state on map).
START YOUR RESPONSE WITH [ AND END WITH ]. NOTHING ELSE.
Example output: [{"number":"i","clue":"Neolithic site","region":"Kashmir"},{"number":"ii","clue":"Mesolithic site","region":"Rajasthan"}]`),

      askGroq(answersPage, `This image is a UPSC History Optional handwritten answer booklet.
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
    console.log("[check-map] mapRaw:", mapRaw.slice(0, 500));
    console.log("[check-map] answersRaw:", answersRaw.slice(0, 500));
    try { dots = JSON.parse(mapRaw.replace(/```json|```/g, "").trim()); } catch (e) { console.log("[check-map] dots parse error:", e); }
    try { studentAnswers = JSON.parse(answersRaw.replace(/```json|```/g, "").trim()); } catch (e) { console.log("[check-map] answers parse error:", e); }

    if (!dots.length) {
      return NextResponse.json({ error: "Could not read map dots — try a clearer scan" }, { status: 422 });
    }

    const answerKey = buildAnswerKey(dots);

    // Ask Groq to verify each student answer against the clue+region
    const verifyPrompt = `You are a UPSC History examiner.
For each entry below, the student wrote a site name for a map dot with a given clue and region.
Determine if the student's site_name is a valid/accepted answer for that clue in that region.
Be generous — accept common spelling variants and partially correct answers.
Return ONLY a JSON object where keys are roman numeral numbers and values are objects:
{"siteCorrect": true/false, "correctSite": "the standard accepted site name"}

Entries:
${JSON.stringify(answerKey.map(k => {
  const s = studentAnswers.find(a => a.number === k.number);
  return { number: k.number, clue: k.clue, region: k.correctLocation, student_answer: s?.site_name ?? null };
}), null, 2)}

Return ONLY valid JSON. No markdown, no backticks.`;

    const verifyRaw = await askGroq(answersPage, verifyPrompt);
    let groqVerified: Record<string, { siteCorrect: boolean; correctSite: string | null }> = {};
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
