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

// ── Convert normalised pixel position → approximate lat/lon ──
// The India outline map has these approximate bounds:
//   left edge  = 60°E,  right edge  = 100°E
//   top edge   = 37°N,  bottom edge =  7°N
function pixelToLatLon(x_pct: number, y_pct: number) {
  const lon = 60 + x_pct * (100 - 60);          // 60°E … 100°E
  const lat = 37 - y_pct * (37 - 7);            // 37°N … 7°N  (y=0 is top)
  return { lat: Math.round(lat * 2) / 2, lon: Math.round(lon * 2) / 2 }; // 0.5° precision
}

// ── Main handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mapPage, cluesPage, answersPage } = body;
    if (!mapPage || !cluesPage || !answersPage) {
      return NextResponse.json({ error: "Missing pages" }, { status: 400 });
    }

    // ── Step 1a — Gemini reads clues from clues page ──────────
    const mapRaw = await askGemini(cluesPage, "image/jpeg", `RESPOND WITH ONLY A JSON ARRAY. NO TEXT BEFORE OR AFTER. NO EXPLANATION.
This image shows a map of India with numbered dots and clues listed beside/below the map.
Extract every dot: number (roman numeral lowercase), clue (exact text in English), region (state on map).
START YOUR RESPONSE WITH [ AND END WITH ]. NOTHING ELSE.
Example: [{"number":"i","clue":"Neolithic site","region":"Kashmir"},{"number":"ii","clue":"Mesolithic site","region":"Rajasthan"}]`);

    // ── Step 1b — Gemini reads dot pixel positions from map page (NEW) ──
    // We ask Gemini to estimate where each numbered dot sits as a
    // fraction of the total image width/height (0.0 = left/top, 1.0 = right/bottom).
    // These are then converted to approximate lat/lon below.
    const coordsRaw = await askGemini(mapPage, "image/jpeg", `RESPOND WITH ONLY A JSON ARRAY. NO TEXT BEFORE OR AFTER. NO EXPLANATION.
This is a printed outline map of India with latitude/longitude grid lines visible.
The map shows numbered dots labelled with Roman numerals in parentheses like (i), (ii), (iii) ... (xx).

For EVERY numbered dot you can see, estimate its position as a fraction of the TOTAL IMAGE dimensions:
- x_pct: horizontal position from LEFT edge (0.0 = far left, 1.0 = far right)
- y_pct: vertical position from TOP edge (0.0 = very top, 1.0 = very bottom)

Be as precise as possible. Use the printed latitude/longitude grid lines on the map to guide your estimates.
For example, if the map spans 60°E–100°E and a dot appears 60% of the way across, x_pct ≈ 0.60.

START YOUR RESPONSE WITH [ AND END WITH ]. NOTHING ELSE.
Example: [{"number":"i","x_pct":0.52,"y_pct":0.18},{"number":"ii","x_pct":0.31,"y_pct":0.65}]`);

    // ── Step 2 — Gemini reads student handwritten answers ─────
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
    let dotCoords: any[] = [];
    let studentAnswers: any[] = [];

    console.log("[check-map] mapRaw:", mapRaw.slice(0, 500));
    console.log("[check-map] coordsRaw:", coordsRaw.slice(0, 500));
    console.log("[check-map] answersRaw:", answersRaw.slice(0, 800));

    function cleanJson(raw: string): string {
      const start = raw.indexOf("[") !== -1 ? raw.indexOf("[") : raw.indexOf("{");
      const end = raw.lastIndexOf("]") !== -1 ? raw.lastIndexOf("]") : raw.lastIndexOf("}");
      return start !== -1 && end !== -1 ? raw.slice(start, end + 1).trim() : raw.trim();
    }

    try { dots = JSON.parse(cleanJson(mapRaw)); }
    catch (e) { console.log("[check-map] dots parse error:", e, mapRaw.slice(0, 200)); }

    try { dotCoords = JSON.parse(cleanJson(coordsRaw)); }
    catch (e) { console.log("[check-map] coords parse error:", e, coordsRaw.slice(0, 200)); }

    try { studentAnswers = JSON.parse(cleanJson(answersRaw)); }
    catch (e) { console.log("[check-map] answers parse error:", e, answersRaw.slice(0, 200)); }

    console.log("[check-map] first student answer sample:", JSON.stringify(studentAnswers?.slice?.(0, 2)));

    if (!dots.length) {
      return NextResponse.json({ error: "Could not read map clues — try a clearer scan" }, { status: 422 });
    }

    // ── Build a number → lat/lon lookup from pixel positions ──
    const coordMap: Record<string, { lat: number; lon: number }> = {};
    for (const c of dotCoords) {
      if (c.number && typeof c.x_pct === "number" && typeof c.y_pct === "number") {
        coordMap[c.number] = pixelToLatLon(c.x_pct, c.y_pct);
      }
    }
    console.log("[check-map] coordMap sample:", JSON.stringify(Object.entries(coordMap).slice(0, 5)));

    const answerKey = buildAnswerKey(dots);

    // ── Step 3 — Groq verify with coordinate context (PATCHED) ──
    // Each entry now carries an approx_coordinates field so Groq
    // can use geographic reasoning to pick the right site instead
    // of relying on clue text alone.
    const entriesWithCoords = answerKey.map(k => {
      const s = studentAnswers.find((a: any) => a.number === k.number);
      const coords = coordMap[k.number] ?? null;
      return {
        number: k.number,
        clue: k.clue,
        region: k.correctLocation,
        // The key addition — actual geographic coordinates of the dot
        approx_coordinates: coords
          ? `~${coords.lat}°N, ${coords.lon}°E`
          : "unknown",
        student_answer: s?.site_name ?? null,
        student_description: s?.description ?? null,
      };
    });

    const verifyPrompt = `You are a UPSC History examiner marking a UPSC History Optional map question.

Each entry includes approx_coordinates — the approximate latitude/longitude of the dot on the map.
USE THE COORDINATES AS THE PRIMARY SIGNAL for identifying the correct site.
The clue and region are secondary hints to confirm.

COORDINATE REASONING RULES:
- Always cross-check: does the correctSite you pick actually lie near the given coordinates?
- If the student's answer matches the coordinates geographically, prefer it even if the clue wording is loose.
- If the student's answer is geographically wrong (e.g. they wrote Pataliputra ~25.5°N/85°E but the dot is at ~21°N/87°E), mark siteCorrect: false.
- Use your knowledge of exact locations: Pataliputra=25.5°N/85°E, Tamralipti=22°N/88°E, Ujjain=23°N/75.8°E, etc.

STRICT RULES for siteCorrect:
- Mark siteCorrect: true if the student answer refers to the SAME site as the correct answer, even if spelling differs slightly
  (e.g. "Hunsgi"="Hungsi", "Ashmaka"="Assaka"="Asmaka", "Erreguda"="Yerragudi", "Nagapattinam"="Nagapatnam")
- Mark siteCorrect: true if the site is a well-known accepted answer for that clue AND coordinates
- Mark siteCorrect: false if the student wrote a site that is geographically far from the dot coordinates

SCORING:
- 1.5 marks for correct site name (siteCorrect: true)
- 1 mark for description quality: 0 = blank/irrelevant, 0.5 = vague but related, 1 = accurate and historically specific
- If siteCorrect is false, descriptionScore must be 0

Return ONLY a JSON object. Keys = roman numeral strings. Each value:
- siteCorrect: true or false
- correctSite: the standard accepted site name (geographically consistent with approx_coordinates)
- descriptionScore: 0, 0.5, or 1
- descriptionFeedback: one sentence — what was good or what was missing

Entries:
${JSON.stringify(entriesWithCoords, null, 2)}

Return ONLY valid JSON. No markdown, no backticks.
Example: {"i":{"siteCorrect":true,"correctSite":"Burzahom","descriptionScore":1,"descriptionFeedback":"Correctly mentions dog bones and burial grounds."}}`;

    const verifyRaw = await askGroqText(verifyPrompt);
    let groqVerified: Record<string, {
      siteCorrect: boolean;
      correctSite: string | null;
      descriptionScore: number;
      descriptionFeedback: string;
    }> = {};

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
      // expose coords in response for debugging
      dotCoordinates: coordMap,
    });

  } catch (err: any) {
    console.error("[check-map]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
