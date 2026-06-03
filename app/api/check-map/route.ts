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

// ── Groq text-only step ───────────────────────────────────────
const groq = new Groq();

async function askGroqText(prompt: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4000,
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
  const lon = 60 + x_pct * (100 - 60);
  const lat = 37 - y_pct * (37 - 7);
  return { lat: Math.round(lat * 2) / 2, lon: Math.round(lon * 2) / 2 };
}

// ── Main handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mapPage, cluesPage, answersPage } = body;
    if (!mapPage || !cluesPage || !answersPage) {
      return NextResponse.json({ error: "Missing pages" }, { status: 400 });
    }

    // ── Step 1 — Gemini reads clues, dot positions, and student answers ──────
    const [mapRaw, coordsRaw, answersRaw] = await Promise.all([
      askGemini(cluesPage, "image/jpeg", `RESPOND WITH ONLY A JSON ARRAY. NO TEXT BEFORE OR AFTER. NO EXPLANATION.
This image shows a map of India with numbered dots and clues listed beside/below the map.
Extract every dot: number (roman numeral lowercase), clue (exact text in English), region (state on map).
START YOUR RESPONSE WITH [ AND END WITH ]. NOTHING ELSE.
Example: [{"number":"i","clue":"Neolithic site","region":"Kashmir"},{"number":"ii","clue":"Mesolithic site","region":"Rajasthan"}]`),

      askGemini(mapPage, "image/jpeg", `RESPOND WITH ONLY A JSON ARRAY. NO TEXT BEFORE OR AFTER. NO EXPLANATION.
This is a printed outline map of India with latitude/longitude grid lines visible.
The map shows numbered dots labelled with Roman numerals in parentheses like (i), (ii), (iii) ... (xx).

For EVERY numbered dot you can see, estimate its position as a fraction of the TOTAL IMAGE dimensions:
- x_pct: horizontal position from LEFT edge (0.0 = far left, 1.0 = far right)
- y_pct: vertical position from TOP edge (0.0 = very top, 1.0 = very bottom)

CRITICAL: Use the printed latitude/longitude grid lines on the map to guide your estimates.
The map spans 60°E–100°E horizontally and 7°N–37°N vertically.
A dot at 80°E would be at x_pct = (80-60)/(100-60) = 0.50.
A dot at 25°N would be at y_pct = (37-25)/(37-7) = 0.40.

Be as precise as possible. Read the grid lines carefully.
START YOUR RESPONSE WITH [ AND END WITH ]. NOTHING ELSE.
Example: [{"number":"i","x_pct":0.52,"y_pct":0.18},{"number":"ii","x_pct":0.31,"y_pct":0.65}]`),

      askGemini(answersPage, "image/jpeg", `This image is a UPSC History Optional handwritten answer booklet in Hindi and English.
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
Example: [{"number":"i","site_name":"Burzahom","description":"Dog bones found here. Burial grounds. Factory site."},{"number":"ii","site_name":null,"description":null}]`),
    ]);

    let dots: any[] = [];
    let dotCoords: any[] = [];
    let studentAnswers: any[] = [];

    console.log("[check-map] mapRaw:", mapRaw.slice(0, 500));
    console.log("[check-map] coordsRaw:", coordsRaw.slice(0, 500));
    console.log("[check-map] answersRaw:", answersRaw.slice(0, 800));

    function cleanJson(raw: string): string {
      const stripped = raw.replace(/```json|```/g, "").trim();
      const start = stripped.indexOf("[") !== -1 ? stripped.indexOf("[") : stripped.indexOf("{");
      const end = stripped.lastIndexOf("]") !== -1 ? stripped.lastIndexOf("]") : stripped.lastIndexOf("}");
      return start !== -1 && end !== -1 ? stripped.slice(start, end + 1).trim() : stripped;
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

    // ── Step 2 — Build coordMap from pixel positions ──────────
    const coordMap: Record<string, { lat: number; lon: number }> = {};
    for (const c of dotCoords) {
      if (c.number && typeof c.x_pct === "number" && typeof c.y_pct === "number") {
        coordMap[c.number] = pixelToLatLon(c.x_pct, c.y_pct);
      }
    }
    console.log("[check-map] coordMap sample:", JSON.stringify(Object.entries(coordMap).slice(0, 5)));

    // ── Step 3 — Build answer key (coords-first matching) ─────
    const answerKey = buildAnswerKey(dots, coordMap);

    // ── Step 4 — Groq: identify + verify using coords as PRIMARY signal ──────
    //
    // For EVERY dot — whether correctSite is known or null — Groq must:
    //   1. Use approx_coordinates as the primary identifier
    //   2. Use clue + nearby_candidates as confirmation hints
    //   3. Determine the correct site and score the student's answer
    //
    // This works for PYQs, mock tests, state PSC, and any other paper.

    const entriesForGroq = answerKey.map(k => {
      const s = studentAnswers.find((a: any) => a.number === k.number);
      const coords = k.approxCoords;
      return {
        number: k.number,
        clue: k.clue,
        // Coordinates are the primary signal — always included
        approx_coordinates: coords
          ? `~${coords.lat}°N, ${coords.lon}°E`
          : "unknown",
        // Pre-matched site from bookData/mapData — use as strong hint if present
        pre_matched_site: k.correctSite ?? null,
        // Nearby sites from bookData within radius — use as candidates
        nearby_candidates: k.candidates ?? [],
        student_answer: s?.site_name ?? null,
        student_description: s?.description ?? null,
      };
    });

    const verifyPrompt = `You are a UPSC History Optional examiner. Your job is to:
1. Identify the CORRECT site for each numbered dot on the map
2. Check if the student's answer matches
3. Score the description

═══════════════════════════════════════════════
PRIMARY RULE — COORDINATES FIRST:
═══════════════════════════════════════════════
The approx_coordinates field gives the ~lat/lon of the dot on the map.
THIS IS YOUR PRIMARY SIGNAL. Always ask: what historical site lies at these coordinates?

Use this reasoning process for EVERY entry:
  Step 1: Look at approx_coordinates → what region/state is this?
  Step 2: Look at pre_matched_site (if not null) → does it match the coordinates? If yes, use it.
  Step 3: Look at nearby_candidates → do any match coordinates + clue better?
  Step 4: If pre_matched_site is null or doesn't fit → use your own geographic knowledge
  Step 5: Cross-check with clue text to confirm

COORDINATE REFERENCE (use these to reason):
- Kashmir/Ladakh: 33–35°N, 74–78°E
- Punjab/Haryana: 29–31°N, 74–77°E
- Rajasthan: 24–30°N, 69–78°E
- Gujarat: 20–24°N, 68–74°E
- UP/Bihar: 24–28°N, 77–88°E
- Bengal/Odisha: 19–24°N, 84–89°E
- Karnataka/AP: 13–18°N, 74–80°E
- Tamil Nadu/Kerala: 8–13°N, 76–80°E
- Maharashtra: 16–22°N, 72–80°E
- NE India: 24–28°N, 89–97°E
- Pakistan (IVC sites): 24–32°N, 62–74°E

KNOWN SITE COORDINATES (use these exactly):
Burzahom=34.2°N/74.9°E, Bagor=24.9°N/74.6°E, Hunsgi=16.8°N/76.6°E,
Sarai Nahar Rai=25.4°N/81.9°E, Lothal=22.5°N/72.2°E, Kalibangan=29.5°N/74.1°E,
Rakhigarhi=29.3°N/76.1°E, Dholavira=23.9°N/70.2°E, Mohenjodaro=27.3°N/68.1°E,
Harappa=30.6°N/72.9°E, Tamralipti=22.4°N/87.9°E, Pataliputra=25.6°N/85.1°E,
Ujjain=23.2°N/75.8°E, Kushinagar=26.7°N/83.9°E, Nalanda=25.1°N/85.4°E,
Chandraketugarh=22.7°N/88.6°E, Nagapattinam=10.8°N/79.8°E, Amaravati=16.6°N/80.4°E,
Erragudi=14.9°N/78.3°E, Hampi=15.3°N/76.5°E, Ajanta=20.6°N/75.7°E,
Sanchi=23.5°N/77.7°E, Sarnath=25.4°N/83.0°E, Bodh Gaya=24.7°N/84.9°E,
Attirampakkam=13.2°N/79.9°E, Bhimbetka=22.9°N/77.6°E, Arikamedu=11.9°N/79.8°E,
Sisupalgarh=20.2°N/85.9°E, Vallabhi=21.9°N/71.9°E, Taxila=33.7°N/72.8°E

═══════════════════════════════════════════════
SCORING RULES:
═══════════════════════════════════════════════
siteCorrect: true if student answer = correct site (spelling variants OK):
  - "Hunsgi"="Hungsi", "Asmaka"="Ashmaka"="Assaka"
  - "Erragudi"="Yerragudi"="Erreguda"
  - "Nagapattinam"="Nagapatnam"="Nagapattinam port"
  - "Tamralipti"="Tamluk"="Tamralipti port"
  - "Kalibangan"="Kalibanga"
  - Student adding state name is fine: "Hunsgi, Karnataka" = correct
siteCorrect: false if student wrote a DIFFERENT site (even if plausible)

Marks:
- siteCorrect=true → 1.5 marks for site
- descriptionScore: 0=blank/wrong, 0.5=vague/partial, 1=accurate+specific
- siteCorrect=false → descriptionScore must be 0

═══════════════════════════════════════════════
OUTPUT FORMAT:
═══════════════════════════════════════════════
Return ONLY a JSON object. Keys = roman numeral strings. No markdown, no backticks.
Each value must have:
- correctSite: string (the standard accepted name, geographically consistent with approx_coordinates)
- siteCorrect: boolean
- descriptionScore: 0, 0.5, or 1
- descriptionFeedback: one sentence

Example:
{"i":{"correctSite":"Burzahom","siteCorrect":true,"descriptionScore":1,"descriptionFeedback":"Correctly mentions pit dwellings and dog burials."},"ii":{"correctSite":"Bagor","siteCorrect":false,"descriptionScore":0,"descriptionFeedback":"Student wrote Langhanaj which is in Gujarat, not Rajasthan."}}

Entries to process:
${JSON.stringify(entriesForGroq, null, 2)}`;

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
      dotCoordinates: coordMap,
    });

  } catch (err: any) {
    console.error("[check-map]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
