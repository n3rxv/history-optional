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

// ── Main handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mapPage, cluesPage, answersPage } = body;
    if (!mapPage || !cluesPage || !answersPage) {
      return NextResponse.json({ error: "Missing pages" }, { status: 400 });
    }

    // ── Step 1 — Gemini reads clues, dot lat/lon, and student answers ────────
    const [mapRaw, coordsRaw, answersRaw] = await Promise.all([
      askGemini(cluesPage, "image/jpeg", `RESPOND WITH ONLY A JSON ARRAY. NO TEXT BEFORE OR AFTER. NO EXPLANATION.
This image shows a map of India with numbered dots and clues listed beside/below the map.
Extract every dot: number (roman numeral lowercase), clue (exact text in English), region (state on map).
START YOUR RESPONSE WITH [ AND END WITH ]. NOTHING ELSE.
Example: [{"number":"i","clue":"Neolithic site","region":"Kashmir"},{"number":"ii","clue":"Mesolithic site","region":"Rajasthan"}]`),

      askGemini(mapPage, "image/jpeg", `RESPOND WITH ONLY A JSON ARRAY. NO TEXT BEFORE OR AFTER. NO EXPLANATION.
This is a printed outline map of India with latitude/longitude grid lines marked at 10 degree intervals.
Horizontal grid lines: 10N, 20N, 30N
Vertical grid lines: 70E, 80E, 90E (60E at far left, 100E at far right)

For each numbered dot (i) through (xx):
- Identify the 4 grid lines surrounding the dot
- Interpolate its exact position between those grid lines
- Return lat and lon DIRECTLY IN DEGREES (not pixel fractions)

CALIBRATION REFERENCES:
- Kashmir at top of map: around 34-35N, 74-76E
- Sri Lanka visible at bottom: around 8N, 81E
- Pakistan border at left: around 68-70E
- Andaman Islands at right: around 93E, 12N
- Lakshadweep at bottom left: around 10N, 72E

Be precise to 0.5 degrees. Interpolate carefully between the printed grid lines.
START YOUR RESPONSE WITH [ AND END WITH ]. NOTHING ELSE.
Example: [{"number":"i","lat":34.2,"lon":74.9},{"number":"ii","lat":24.9,"lon":74.6}]`),

      askGemini(answersPage, "image/jpeg", `This image is a UPSC History Optional handwritten answer booklet in Hindi and English.
Find the map question section where the student wrote site names and short notes for Roman numerals (i) through (xx).

For EACH numeral i through xx extract:
- number: roman numeral lowercase string e.g. "i", "xii"
- site_name: the site name written (null if blank)
- description: the 1-3 line explanation written below the site name (null if nothing written). Transcribe exactly as written.

Rules:
- Include ALL 20 numerals, use null for blanks
- Fix obvious handwriting errors in site names only: "Burzahm"=>"Burzahom", "Kalibagan"=>"Kalibangan", "Lothl"=>"Lothal"
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
      if (start === -1 || end === -1 || end <= start) return stripped;
      let json = stripped.slice(start, end + 1).trim();
      try {
        JSON.parse(json);
        return json;
      } catch {
        // Repair truncated JSON — remove last incomplete object
        const lastComplete = Math.max(
          json.lastIndexOf("},"),
          json.lastIndexOf("}]")
        );
        if (lastComplete > 0) {
          const trimmed = json.slice(0, lastComplete + 1);
          return trimmed.endsWith("]") ? trimmed : trimmed + "]";
        }
        return json;
      }
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

    // ── Step 2 — Build coordMap from Gemini lat/lon ───────────
    // Gemini now reads lat/lon DIRECTLY from the grid lines on the map.
    // No pixel conversion needed. Works for any scan, any PDF, any paper.
    const coordMap: Record<string, { lat: number; lon: number }> = {};
    for (const c of dotCoords) {
      if (c.number && typeof c.lat === "number" && typeof c.lon === "number") {
        coordMap[c.number] = { lat: c.lat, lon: c.lon };
      } else if (c.number && typeof c.x_pct === "number" && typeof c.y_pct === "number") {
        // Fallback for old pixel format
        const lon = 60 + c.x_pct * 40;
        const lat = 37 - c.y_pct * 30;
        coordMap[c.number] = { lat: Math.round(lat * 2) / 2, lon: Math.round(lon * 2) / 2 };
      }
    }
    console.log("[check-map] coordMap sample:", JSON.stringify(Object.entries(coordMap).slice(0, 5)));

    // ── Step 3 — Build answer key (coords-first matching) ─────
    const answerKey = buildAnswerKey(dots, coordMap);

    // ── Step 4 — Groq identifies + scores using coords + 940 site database ──
    const entriesForGroq = answerKey.map(k => {
      const s = studentAnswers.find((a: any) => a.number === k.number);
      const coords = k.approxCoords;
      return {
        number: k.number,
        clue: k.clue,
        approx_coordinates: coords ? `${coords.lat}N, ${coords.lon}E` : "unknown",
        pre_matched_site: k.correctSite ?? null,
        nearby_candidates: k.candidates ?? [],
        student_answer: s?.site_name ?? null,
        student_description: s?.description ?? null,
      };
    });

    const verifyPrompt = `You are a UPSC History Optional examiner. For each dot on the map:
1. Identify the correct site using coordinates + clue + database below
2. Check if student answer matches
3. Score the description

═══════════════════════════════════════════════
IDENTIFICATION PROCESS (follow for EVERY entry):
═══════════════════════════════════════════════
Step 1: Look at approx_coordinates — what region of India is this?
Step 2: Check pre_matched_site — does it exist in the database near those coords? If yes, use it.
Step 3: Check nearby_candidates — do any fit the coords + clue better?
Step 4: If still unsure, search the 940-site database below for sites near those coordinates
Step 5: Cross-check with clue text to confirm

COORDINATE REGIONS:
- Kashmir/Ladakh: 33-35N, 74-78E
- Punjab/Haryana: 29-31N, 74-77E
- Rajasthan: 24-30N, 69-78E
- Gujarat: 20-24N, 68-74E
- UP/Bihar: 24-28N, 77-88E
- Bengal/Odisha: 19-24N, 84-89E
- Karnataka/AP: 13-18N, 74-80E
- Tamil Nadu/Kerala: 8-13N, 76-80E
- Maharashtra: 16-22N, 72-80E
- NE India: 24-28N, 89-97E
- Pakistan (IVC): 24-32N, 62-74E

═══════════════════════════════════════════════
940 SITE DATABASE (name=lat/lon):
═══════════════════════════════════════════════
Darra-i-kur=36.7°N/70.8°E, Potwar (Pothohar) Plateau=33.5°N/72.8°E, Nadah=30.7°N/76.8°E, Bhimbetka=22.9°N/77.6°E, Hathnora=23.1°N/77.5°E, Pune=18.5°N/73.9°E, Bori=18.4°N/73.8°E, Odai=11.9°N/79.5°E, Ghumarwin=31.4°N/76.7°E, Shivalik/Suketi Fossil Park=30.6°N/77.2°E, Mandla=22.6°N/80.4°E, Ghughua/Ghughwa Fossil Park=22.9°N/81.1°E, Tiruvakkarai Fossil Wood Park=11.9°N/79.5°E, Sanghao Caves=34.2°N/71.9°E, Sohan valley=33.6°N/73.1°E, Pahalgam=34.0°N/75.3°E, Samathan=34.1°N/74.8°E, Pinjore=30.8°N/76.9°E, Didwana=27.4°N/74.6°E, Mogara Hills=26.3°N/73.0°E, Luni Valley=25.5°N/72.0°E, Ajmer=26.5°N/74.6°E, Anangpur=28.4°N/77.3°E, Kalpi=26.1°N/79.7°E, Lekhahia=24.9°N/82.6°E, Paisra=24.9°N/85.6°E, Sabarmati Valley=23.0°N/72.6°E, Ratanpura=23.8°N/72.1°E, Hiran Valley=21.8°N/70.5°E, Bhimbetka=22.9°N/77.6°E, Adamgarh=22.7°N/77.7°E, Baghor=24.4°N/81.9°E, Palamau=24.0°N/84.1°E, Hazaribagh=23.9°N/85.4°E, Ranchi=23.3°N/85.3°E, Barudih=22.8°N/85.9°E, Birbhum=23.9°N/87.5°E, Bardhaman=23.2°N/87.9°E, Ukhrul=25.1°N/94.4°E, Dari Dungri=21.5°N/83.9°E, Nevasa=19.6°N/74.7°E, Hunsagi=16.8°N/76.6°E, Lingsugur=16.2°N/76.5°E, Kurnool caves=15.8°N/78.1°E, Renigunta=13.6°N/79.5°E, Kibbanahalli=13.3°N/77.1°E, Malprabha-Ghatprabha valley=16.2°N/75.2°E, Palghat=10.8°N/76.7°E, Attirampakkam=13.2°N/79.9°E, Gudiyam Cave=13.1°N/79.9°E, Pallavaram=12.9°N/80.1°E, Teri Sites=8.7°N/77.7°E, Adiyala=33.5°N/73.1°E, Ghuman=31.3°N/76.7°E, Shell midden sites of Kachchh=23.7°N/70.2°E, Rojdi=22.0°N/70.8°E, Mehtakheri=21.9°N/76.2°E, Hallur=14.5°N/75.9°E, Tilwara=25.8°N/72.3°E, Bagor=24.9°N/74.6°E, Chandravati=24.8°N/72.9°E, Loteswhwar=23.7738°N/71.6799°E, Langhanaj=23.6°N/72.4°E, Damdama=25.9°N/81.9°E, Sarai Nahar Rai=25.4°N/81.9°E, Mahadaha=25.5°N/81.8°E, Chopani Mando=25.4°N/81.9°E, Lekhakia=24.9°N/82.6°E, Selbalgiri=25.6°N/90.3°E, Birbhanpur=23.2°N/87.9°E, Sundargarh=22.1°N/84.0°E, Kuchai=21.9°N/86.1°E, Sambalpur=21.5°N/83.9°E, Sanganakallu=15.2°N/76.8°E, Thenmalai=9.0°N/76.9°E, Kargil=34.6°N/76.1°E, Chaturbhujnath Nala=24.1°N/75.1°E, Raigarh=21.9°N/83.4°E, Ratnagiri=17.0°N/73.3°E, Usgalimal=15.3°N/74.1°E, Kupgal=15.2°N/76.8°E, Kandanathi=15.8°N/78.1°E, Edakkal Caves=11.6°N/76.1°E, Petroglyphs of Konkan coast=17.5°N/73.3°E, Daraki-Chattan=24.1°N/75.1°E, Yelagiri hills=12.6°N/78.6°E, Bhimbetka=22.9°N/77.6°E, Ramnagar=24.2°N/80.8°E, Baghor=24.4°N/81.9°E, Patne=21.0°N/75.6°E, Kurnool=15.8°N/78.1°E, Lakhudiyar=29.6°N/79.7°E, Chaturbhujnath Nala=24.1°N/75.1°E, Sundargarh=22.1°N/84.0°E, Sambalpur=21.5°N/83.9°E, Ezhuthu Guha=10.0°N/77.1°E, Adamgarh=22.7°N/77.7°E, Ghaligai=35.0°N/72.4°E, Saraikhola=33.5°N/73.1°E, Burzahom=34.2°N/74.9°E, Gufkral=33.9°N/74.9°E, Giak and Kiari=34.3°N/77.6°E, Jalilpur=31.5°N/72.6°E, Kili Gul Muhammad=30.2°N/67.0°E, Rana Ghundai=30.4°N/68.6°E, Mehrgarh=29.4°N/67.6°E, Balakot=25.9°N/66.8°E, Lahuradeva=26.9°N/83.5°E, Sohgaura=26.8°N/83.8°E, Koldihwa=25.1°N/81.7°E, Mahagara=25.1°N/81.8°E, Chirand=25.9°N/84.7°E, Senuar=24.9°N/84.1°E, Kunjhun=24.4°N/81.9°E, Barudih=22.8°N/85.9°E, Pandu Rajar Dhibi=23.3°N/87.9°E, Mahisdal=22.3°N/87.7°E, Sarutaru=26.1°N/91.9°E, Daojali Hading=25.1°N/93.4°E, Napachik=24.5°N/93.9°E, Kuchai=21.9°N/86.1°E, Golbai Sasan=20.2°N/85.8°E, Bagasra=21.5°N/71.4°E, Nagarjunakonda=16.5°N/79.3°E, Maski=15.9°N/76.7°E, Hallur=14.5°N/75.9°E, Brahmatigiri=14.9°N/76.8°E, T.Narsipur=12.2°N/76.9°E, Paiyampalli=12.4°N/78.7°E, Edakkal Caves=11.6°N/76.1°E, Utnur=19.4°N/78.5°E, Budihal=16.6°N/76.8°E, Watgal=16.2°N/76.5°E, Maski=15.9°N/76.7°E, Piklihal=15.9°N/76.6°E, Sanganakallu/Kupgal=15.2°N/76.8°E, Kudatini=15.1°N/76.8°E, Hallur=14.5°N/75.9°E, Mehrgarh=29.4°N/67.6°E, Nausharo/Naushahar=28.8°N/67.8°E, Nal=27.8°N/66.6°E, Kot Diji=27.3°N/68.6°E, Amri=26.1°N/68.0°E, Balakot=25.9°N/66.8°E, Allahdino=24.9°N/67.1°E, Harappa=30.6°N/72.9°E, Kalibangan=29.5°N/74.1°E, Sothi=29.3°N/74.0°E, Siswal=29.2°N/75.7°E, Banawali=29.6°N/75.4°E, Bhirrana=29.6°N/75.5°E, Kunal=29.5°N/75.4°E, Balu=29.8°N/76.4°E, Padri=21.2°N/71.5°E, Mundigak=31.5°N/65.5°E, Damb Sadat=30.2°N/67.0°E, Tarakai Qila=32.9°N/70.6°E, Lewan=32.9°N/70.6°E, Gumla=31.6°N/70.1°E, Rehman Dheri=31.8°N/70.5°E, Sarai Khola=33.5°N/73.1°E, Lakhapar=23.5°N/70.5°E, Ropar=30.9°N/76.5°E, Kalibangan=29.5°N/74.1°E, Banawali=29.6°N/75.4°E, Balu=29.8°N/76.4°E, Rakhigarhi=29.3°N/76.1°E, Alamgirpur=28.9°N/77.7°E, Mohenjodaro=27.3°N/68.1°E, Sutkagendor=25.6°N/62.3°E, Sotkakoh/Sokhta Koh=25.5°N/62.5°E, Amri=26.1°N/68.0°E, Chanhudaro=27.0°N/68.1°E, Allahdino=24.9°N/67.1°E, Dholavira=23.9°N/70.2°E, Surkotada=23.6°N/70.8°E, Desalpur=23.5°N/69.1°E, Nageshwar=22.4°N/69.1°E, Kuntasi=22.5°N/70.2°E, Lothal=22.5°N/72.2°E, Rojdi=22.0°N/70.8°E, Padri=21.2°N/71.5°E, Daimabad=19.8°N/74.7°E, Malvan=21.2°N/72.8°E, Bhagatrav=21.7°N/73.0°E, Ratadiya Ri Dheri=27.0264°N/70.7775°E, Manda=32.5°N/75.1°E, Harappa=30.6°N/72.9°E, Kudwala=28.6913°N/71.6866°E, Pirak=28.0°N/66.0°E, Jhukar=27.5576°N/68.2163°E, Nagar=26.1223°N/75.6632°E, Katpalon=31.2922°N/75.5679°E, Sanghol=30.6634°N/76.3803°E, Bhagawanpura=30.0607°N/76.7631°E, Karan ka Tila=30.0607°N/76.7631°E, Mitathal=28.7328°N/75.8928°E, Hulas=29.9857°N/77.5041°E, Mandi=29.4497°N/77.7429°E, Sinauli=29.0°N/77.3°E, Bet Dwaraka=22.3°N/68.9°E, Mundigak=31.5°N/65.5°E, Mehrgarh=29.4°N/67.6°E, Chirand=25.9°N/84.7°E, Chechar-Kutubpur=25.7492°N/85.3972°E, Senuar=24.9°N/84.1°E, Pandu Rajar Dhibi=23.3°N/87.9°E, Golbai Sasan=20.2°N/85.8°E, Sanganakallu=15.2°N/76.8°E, Maski=15.9°N/76.7°E, Hallur=14.5°N/75.9°E, Brahmagiri=14.9°N/76.8°E, Jodhpura=27.4°N/75.6°E, Piklihal=15.9°N/76.6°E, Ganeshwar=27.7°N/75.8°E, Gilund=25.5°N/74.1°E, Balathal=24.6°N/73.7°E, Ahar=24.6°N/73.7°E, Rangpur=22.7°N/71.7°E, Prabhas Patan=20.9°N/70.4°E, Eran=23.9°N/78.9°E, Kayatha=23.2°N/75.8°E, Navdatoli=22.3°N/75.7°E, Prakash=21.4°N/74.2°E, Savalda=20.9°N/74.8°E, Daimabad=19.8°N/74.7°E, Jorwe=19.3°N/74.5°E, Nevasa=19.6°N/74.7°E, Walki=18.5°N/74.0°E, Inamgaon=18.6°N/74.5°E, Mahisdal=22.3°N/87.7°E, Ojjiyana=25.471°N/74.6961°E, Imlidih=26.6678°N/83.3642°E, Khairadih=25.9°N/83.8°E, Bangarh=25.2°N/88.2°E, Bahal=20.8429°N/75.5261°E, Lal Qila=28.7°N/77.2°E, Madarpur=28.8°N/78.8°E, Saipai=26.7156°N/79.0917°E, Bithur=26.4609°N/80.3218°E, Gungeria=21.8612°N/80.3237°E, Kallur=16.0547°N/76.9004°E, Ganeshpur=27.2093°N/79.0625°E, Katpalon=31.2922°N/75.5679°E, Siswal=29.2°N/75.7°E, Jodhpura=27.4°N/75.6°E, Noh=27.2°N/77.5°E, Bahadrbad=29.9384°N/78.1453°E, Rajpur Parsu=29.0019°N/77.768°E, Hastinapur=29.2°N/78.0°E, Lal Qila=28.7°N/77.2°E, Bisauli=28.0649°N/79.0438°E, Ahichchhatra=28.4°N/79.1°E, Atranikhera=27.555°N/78.5992°E, Katelai=35.1°N/72.4°E, Ghaligai=35.0°N/72.4°E, Timargarh=35.0°N/71.9°E, Loebanr=35.1°N/72.4°E, Aligrama=35.1°N/72.4°E, Birkot Ghundai=35.1°N/72.5°E, Saraikhola=33.5°N/73.1°E, Jakhera=27.555°N/78.5992°E, Dadupur=26.8312°N/80.9174°E, Lahuradeva=26.9°N/83.5°E, Narhan=26.8°N/83.4°E, Jhusi=25.2793°N/81.9035°E, Malhar=22.3°N/82.2°E, Raja Nal-ka-Tila=24.4148°N/83.0638°E, Ahar=24.6°N/73.7°E, Asurgarh (PYQ-2024)=19.8°N/82.6°E, Mayiladumparai=12.5152°N/78.0094°E, Kodumanal=11.4905°N/77.3505°E, Adichanallur=8.8457°N/77.9938°E, Porunthal=10.4257°N/77.8157°E, Sivaklai=8.85°N/77.8°E, Kilnamandi=12.4289°N/78.9992°E, Nagar=26.1223°N/75.6632°E, Dadheri=30.6634°N/76.3803°E, Bhagwanpura=30.0607°N/76.7631°E, Chak 86=29.5°N/74.0°E, Bahawalpur=29.4°N/71.7°E, Ropar=30.9°N/76.5°E, Sanghol=30.6634°N/76.3803°E, Daulatpur=30.0607°N/76.7631°E, Purana Qila=28.6°N/77.2°E, Jodhpura=27.4°N/75.6°E, Noh=27.2°N/77.5°E, Hulas=29.9857°N/77.5041°E, Hastinapur=29.2°N/78.0°E, Ahichchhatra=28.4°N/79.1°E, Kampilya=27.6°N/79.3°E, Jakhera=27.555°N/78.5992°E, Atranjihera=27.555°N/78.5992°E, Mathura=27.5°N/77.7°E, Shravasti=27.5°N/82.1°E, Kaushambi=25.4°N/81.4°E, Ujjain=23.2°N/75.8°E, Puraula=30.9636°N/78.6363°E, Thapli=30.4°N/78.5°E, Kashipur=29.0478°N/79.4326°E, Dambkoh=31.0°N/61.5°E, Nasirabad=26.0788°N/62.7228°E, Mughal Ghundai=31.4167°N/68.6667°E, Burzahom=34.2°N/74.9°E, Gufkral=33.9°N/74.9°E, Giak and Kiari=34.3°N/77.6°E, Nartiang=25.4426°N/92.2988°E, Naikund=21.153°N/79.0145°E, Junapani=21.153°N/79.0145°E, Dhanora=21.1983°N/81.4008°E, Yelleswaram=16.858°N/79.2175°E, Nagarjunakonda=16.5°N/79.3°E, Maski=15.9°N/76.7°E, Hire Benekal=15.5748°N/76.3118°E, Brahmagiri=14.9°N/76.8°E, Hallur=14.5°N/75.9°E, T.Narsipur=12.2°N/76.9°E, Machad=10.4787°N/76.2726°E, Mangadu=8.9674°N/76.8586°E, Tengkkal=9.8155°N/76.9992°E, Paiyampalli=12.4°N/78.7°E, Mallapadi=12.1456°N/78.1132°E, Kodumanal=11.4905°N/77.3505°E, Sittanavasal=10.5°N/78.9°E, Adichanallur=8.8457°N/77.9938°E, Korkai=8.5°N/78.1°E, Vangchhia=23.5444°N/93.348°E, Mudumal=16.7006°N/77.6165°E, Lianpui=23.5444°N/93.348°E, Kilnamandi=12.4289°N/78.9992°E, Charsadda/Pushkalavati=34.1°N/71.7°E, Taxila/Takshashila=33.7°N/72.8°E, Rajapura=33.3772°N/74.3132°E, Bairat/Viratanagar=27.5°N/76.2°E, Indraprastha=28.6°N/77.2°E, Hastinapur=29.2°N/78.0°E, Mathura=27.5°N/77.7°E, Atranjihera=27.555°N/78.5992°E, Ahichchhatra=28.4°N/79.1°E, Kampilya=27.6°N/79.3°E, Shravasti=27.5°N/82.1°E, Kapilavastu=27.6°N/83.1°E, Ayodhya/Saket=26.8°N/82.2°E, Kushinagar=26.7°N/83.9°E, Kaushambi=25.4°N/81.4°E, Kashi/Varanasi=25.3°N/83.0°E, Pataliputra=25.6°N/85.1°E, Vaishali=25.7°N/85.1°E, Rajgir=25.0°N/85.4°E, Champa/Champa Puri/Champanagar=25.3°N/87.1°E, Chandraketugarh=22.7°N/88.6°E, Prabhas Patan=20.9°N/70.4°E, Ujjain=23.2°N/75.8°E, Mahishmati=22.2°N/76.5°E, Potana/Bodhana=18.7°N/78.1°E, Sohgaura=26.8°N/83.8°E, Barabar and Nagarjuni caves=25.153°N/85.0065°E, Tamralipti=22.4°N/87.9°E, Tosali=20.3°N/85.8°E, Ujjain/Ujjayini=23.2°N/75.8°E, Sopara/Nala Sopara=19.4°N/72.8°E, Suvarnagiri/Kanakagiri=15.5748°N/76.3118°E, Mahastangarh=24.9°N/89.4°E, Laghman=34.7833°N/70.1833°E, Bahapur/Srinivaspuri=28.6139°N/77.209°E, Bairat/Bhabru=27.7155°N/76.2639°E, Gujarra=25.9183°N/78.6645°E, Ahraura=24.9317°N/82.628°E, Rupnath=23.223°N/79.9826°E, Pangurariya/Saru-Maru=23.115°N/77.0665°E, Rajula-Mandagiri=15.5479°N/77.5543°E, Erragudi=14.9°N/78.3°E, Brahmagiri=14.9°N/76.8°E, Siddapura=14.3049°N/76.5297°E, Jatinga-Ramesvara=14.3049°N/76.5297°E, Maski=15.9°N/76.7°E, Nittur=15.143°N/76.9173°E, Udegolam=15.143°N/76.9173°E, Sasaram=24.9°N/84.0°E, Kandahar=31.6206°N/65.7158°E, Shahbazgarhi=34.2°N/72.0°E, Mansehra=34.0248°N/71.5354°E, Kalsi=30.5°N/77.8°E, Girnar (Junagarh)=21.5°N/70.5°E, Dhauli=20.0538°N/85.5023°E, Jaugada=19.5°N/84.8°E, Bombay-Sopara=19.055°N/72.8692°E, Sannati=17.1°N/76.8°E, Nigali Sagar=27.9807°N/82.9532°E, Rummindei/Lumbini=27.9807°N/82.9532°E, Allahabad-Kosam (Schism and Queen's edict)=25.2793°N/81.9035°E, Delhi-Topra=28.6139°N/77.209°E, Delhi-Meerut=28.6139°N/77.209°E, Allahabad-Kosam=25.2793°N/81.9035°E, Lauriya Araraj=26.6393°N/84.899°E, Lauriya Nandangarh=27.0518°N/84.3351°E, Rampurva=27.0518°N/84.3351°E, Bactria=36.7992°N/67.2373°E, Ai Khanoun=37.1°N/69.5°E, Bagram=34.9°N/69.0°E, Sagala/Sialkot=32.5°N/74.5°E, Purushpura=34.0°N/71.6°E, Taxila/Takshashila=33.7°N/72.8°E, Multan=30.0911°N/71.4927°E, Sunet=30.8°N/75.9°E, Mathura=27.5°N/77.7°E, Bharatpur=27.0247°N/77.292°E, Ajmer=26.5°N/74.6°E, Nagar=26.1223°N/75.6632°E, Madhyamika=24.7°N/75.1°E, Padmavati=26.0287°N/78.1571°E, Ujjain=23.2°N/75.8°E, Vidisha/Besnagar=23.5°N/77.8°E, Ayodhya/Saketa=26.8°N/82.2°E, Sisupalgarh/Kalinganagari=20.2°N/85.9°E, Nashik=19.9°N/73.8°E, Pratishthana/Paithana=19.5°N/75.4°E, Amaravati=16.6°N/80.4°E, Nagarjunakonda/Vijayapuri=16.5°N/79.3°E, Banavasi=14.5°N/75.0°E, Ter (Tagar)=18.2°N/76.1°E, Kanispora/Kanispur=34.1169°N/74.6971°E, Karur/Karuvur/Vanji=10.9°N/78.1°E, Muziris/Muchiris=10.2°N/76.2°E, Uraiyur=10.8°N/78.7°E, Puhar/Poompuhar=11.1°N/79.8°E, Madurai=9.9°N/78.1°E, Korkai=8.5°N/78.1°E, Mayiladumparai=12.5152°N/78.0094°E, Adichanallur=8.8457°N/77.9938°E, Keeladi/Keezhadi=9.77°N/78.76°E, Thulukkarpatti=8.5495°N/77.5805°E, Kodumanamal=11.4905°N/77.3505°E, Porunthal=10.4257°N/77.8157°E, Sivakalai=8.8457°N/77.9938°E, Kapatapuram=9.9°N/78.4°E, Cheraman Juma Mosque=10.9°N/75.9°E, Dantapuram=18.8°N/84.1°E, Wari-Bateshwar=23.9°N/90.7°E, Pataliputra=25.6°N/85.1°E, Prayag=25.4°N/81.9°E, Ujjain=23.2°N/75.8°E, Vallabhi=21.9°N/71.9°E, Vatsagulma=20.2874°N/77.237°E, Nandivardhana=21.153°N/79.0145°E, Pundranagara/Mahastthangarh=24.8347°N/89.3342°E, Pragjyotishpura=26.2°N/91.7°E, Kalinganagara=18.596°N/83.9639°E, Banavasi=14.5°N/75.0°E, Kolar=13.1805°N/78.2669°E, Talakadu=12.1°N/77.0°E, Srinagar=34.0659°N/74.8463°E, Sthaneshwar/Thaneshwar=30.0607°N/76.7631°E, Kannauj/Kanyakubja=27.0°N/79.9°E, Karnasavarana/Karnasubarna=24.2904°N/88.3664°E, Multan=30.0911°N/71.4927°E, Alor=27.7102°N/68.8413°E, Brahmanabad/Bahmanabad=26.1188°N/68.4732°E, Debal/Deval=24.8°N/67.3°E, Sirpur/Shripura=21.6°N/82.8°E, Badami/Vatapi=15.9°N/75.7°E, Kanchi=12.8°N/79.7°E, Mahabalipuram/Mamallapuram=12.6362°N/80.0654°E, Kaladi/Kalady=10.2°N/76.4°E, Udabhanda=33.9°N/72.3°E, Parihaspore/Parihaspur=34.1774°N/74.315°E, Avantipura/Awantipora=33.949°N/75.0418°E, Delhi/Dhillika=28.6139°N/77.209°E, Ajmer/Ajaymeru=26.3319°N/74.717°E, Bhinmal=25.2093°N/72.3179°E, Kannauj=26.9987°N/79.6928°E, Munger/Mudgagiri=25.4°N/86.5°E, Nabadwip=23.4847°N/88.5567°E, Bikrampur=23.5256°N/90.4414°E, Khajuraho=24.7606°N/79.6782°E, Mahoba=25.3616°N/79.706°E, Dhar=22.5787°N/75.2259°E, Tripuri=23.223°N/79.9826°E, Devagiri/Daulatabad=19.9392°N/75.2196°E, Warangal=17.8676°N/79.8019°E, Vengi=16.8°N/81.1°E, Kalyani/Basavakalyani=18.0207°N/77.2487°E, Manyakheta/Malkhed=17.5°N/76.6°E, Vijayanagara/Hampi=15.3°N/76.5°E, Dwarasamudra/Halebidu=13.2°N/75.9°E, Gangaikonda Cholapuram=11.1531°N/79.2586°E, Uraiyur=10.8°N/78.7°E, Thanjavur=10.8°N/79.1°E, Chittor=24.9°N/74.6°E, Kapilavastu=27.6°N/83.1°E, Lumbini=27.5°N/83.3°E, Shravasti=27.5°N/82.1°E, Kushinagar=26.7°N/83.9°E, Sarnath=25.4°N/83.0°E, Bodhgaya=24.695°N/84.991°E, Rajgir=25.0°N/85.4°E, Vaishali=25.7°N/85.1°E, Pataliputra=25.6°N/85.1°E, Kundalavana=34.1°N/74.9°E, Guldara=34.5°N/69.4167°E, Butkara=34.0248°N/71.5354°E, Jamal Garhi=34.0248°N/71.5354°E, Kanishka Stupa=34.0°N/71.6°E, Dharmarajika Stupa (Takshashila)=33.7°N/72.8°E, Manikyala=33.95°N/72.5426°E, Mohenjodaro=27.3°N/68.1°E, Sanghol (PYQ-2016)=30.6634°N/76.3803°E, Sankissa (PYQ-2021)=27.7°N/79.8°E, Piprahwa=27.2512°N/82.8717°E, Ramagrama Stupa=27.5308°N/83.6664°E, Kushinagar=26.7°N/83.9°E, Dhamek/Dhamekh=25.3719°N/82.9414°E, Devni Mori=23.4843°N/73.3986°E, Bharhut=24.6954°N/80.777°E, Sanchi=23.5°N/77.7°E, Salihundam=18.4°N/84.1°E, Thotlakonda=17.8°N/83.4°E, Bavikonda=17.8°N/83.4°E, Phanigiri=17.1°N/79.4°E, Jagayyapeta=16.2135°N/81.0278°E, Nagarjunakonda=16.5°N/79.3°E, Amaravati/Dhanayakataka=16.2854°N/80.5686°E, Bhattiprolu=15.9344°N/80.4506°E, Kanaganahalli=16.1°N/76.6°E, Anuradhapura=7.5555°N/80.7138°E, Sigiriya=7.3819°N/80.7234°E, Alchi Monastery=34.2°N/77.2°E, Thiksey Monastery=33.97°N/77.67°E, Hemis Monastery=33.92°N/77.7°E, Key Monastery=32.5016°N/77.579°E, Tabo=32.5016°N/77.579°E, Tawang Monastery=27.6°N/91.9°E, Lamayuru=34.0041°N/77.6573°E, Lhotsava=31.593°N/78.3281°E, Dilwara=24.5924°N/72.7082°E, Palitana/Shatrunjaya Hills=21.5657°N/71.9078°E, Sonagiri=25.9183°N/78.6645°E, Sammed Shikar/Parshyanatha/Shikharji=24.3315°N/86.1548°E, Moodbidri=12.8226°N/75.2265°E, Shravanabelagola=13.0302°N/76.1745°E, Osian=26.4105°N/72.9647°E, Ranakpur=25.4552°N/73.4194°E, Vallabhi=21.9°N/71.9°E, Girnar=21.3365°N/70.425°E, Kankali Tila/Mathura=27.6333°N/77.5833°E, Siddhachal Caves=26.0287°N/78.1571°E, Khajuraho=24.7606°N/79.6782°E, Udayagiri and Khandagiri=20.3°N/85.8°E, Aihole=16.0°N/75.9°E, Sittanavasal=10.5°N/78.9°E, Kalugumalai=8.8457°N/77.9938°E, Ayodhya=26.6383°N/82.0585°E, Deogarh=24.5°N/78.2°E, Champapuri=25.2495°N/86.9828°E, Sirpur=21.6°N/82.8°E, Badami/Vatapi=15.9°N/75.7°E, Penukonda=14.6783°N/77.6065°E, Halebidu=13.0302°N/76.1745°E, Artipura=12.6369°N/76.7275°E, Kanchipuram=12.8°N/79.7°E, Barabar-Nagarjuni Caves=25.153°N/85.0065°E, Saptaparni Cave=25.2116°N/85.4485°E, Unakoti=24.191°N/92.046°E, Udayagiri/Khandagiri=20.0538°N/85.5023°E, Siddhachal caves=26.0287°N/78.1571°E, Udaigiri=23.5°N/77.8°E, Bagh=22.3°N/74.8°E, Ajanta=20.6°N/75.7°E, Pitalkhora=20.4°N/75.2°E, Ellora=20.0°N/75.2°E, Aurangabad Caves=19.9°N/75.3°E, Nashik/Pandavleni caves/Trirashmi caves=19.97°N/73.83°E, Manmodi Caves=18.6449°N/73.9224°E, Kanheri Caves=19.2°N/72.9°E, Elephanta caves=19.055°N/72.8692°E, Kondhane Caves=18.6449°N/73.9224°E, Karle Caves=18.6449°N/73.9224°E, Bhaja Caves=18.7°N/73.5°E, Badami=16.2904°N/75.5916°E, Guntupalle/Guntupalli group of Buddhist Monuments=17.0138°N/81.0803°E, Undavalli=16.2854°N/80.5686°E, Mahabalipuram=12.6°N/80.2°E, Sittanavasal caves (Arivar Koil)=10.3827°N/78.8191°E, Lakhudiyar=29.6°N/79.7°E, Bedse=18.6449°N/73.9224°E, Dharashiv Cave=18.1698°N/76.118°E, Sitabinji=21.5892°N/85.6688°E, Armamalai=12.5831°N/78.6245°E, Malayadipatti=10.2903°N/78.8174°E, Thirunanthikarai cave=8.0793°N/77.5499°E, Bhitargaon=26.3°N/79.6°E, Sun Temple (Gwalior)=26.0287°N/78.1571°E, Sun Temple (Mandsaur)=24.1°N/75.1°E, Dashavatara temple=24.5°N/78.2°E, Tigawa=23.8°N/79.9°E, Bhumara/Bhumra=24.6954°N/80.777°E, Khokh=24.6954°N/80.777°E, Nachna Kuthara=24.4499°N/80.1463°E, Maniyar Math=25.2116°N/85.4485°E, Dah Parbatiya=26.5°N/92.7°E, Martanda Sun Temple=33.8097°N/75.2495°E, Shankaracharya Temple=34.1°N/74.9°E, Pandrethan Temple=34.1179°N/74.9659°E, Avantiswami Temple/Ruins=33.9°N/74.9°E, Masroor Rock Cut Temple=32.1°N/76.4°E, Badrinath=30.4986°N/79.6191°E, Rahily/Rahelia Sun Temple=25.3616°N/79.706°E, Kamakhya=26.1806°N/91.7539°E, Kantaji Temple=25.6376°N/88.725°E, Dhakeswari Temple=23.7644°N/90.389°E, Maluti Temple=24.3159°N/87.2721°E, Bishnupur Temple=23.1324°N/87.2082°E, Dakshineshwar Kali Temple=22.65°N/88.36°E, Lingaraja Temple=20.2603°N/85.8395°E, Rajarani Temple=20.2603°N/85.8395°E, Vaital Deul Temple=20.2603°N/85.8395°E, Konark Sun temple=19.8343°N/85.6853°E, Jagannath Puri=19.8343°N/85.6853°E, Sirpur Group of monuments=21.1923°N/82.489°E, Bateshwar Temples=26.385°N/77.8613°E, Chausath Yogini Temple=26.385°N/77.8613°E, Khajuraho=24.7606°N/79.6782°E, Teli Ka Temple=26.23°N/78.17°E, Sas Bahu Temple=26.23°N/78.17°E, Bhojeshwar Temple=23.2°N/77.8°E, Omkareshwar Temple=22.2°N/76.2°E, Mahakaleshwar Temple=23.2°N/75.8°E, Kal Bhairava Temple=23.2°N/75.8°E, Gadkalika Temple=23.2933°N/75.6263°E, Harsiddhi Temple=23.2933°N/75.6263°E, Ancient Temples of Kalachuri=23.0346°N/81.751°E, Hinglaj Temple=25.5°N/65.5°E, Pushkar=26.5°N/74.6°E, Dilwara Temple=24.5924°N/72.7082°E, Bhoramdeo Temple=20.4°N/81.3°E, Kedarnath=30.7°N/79.1°E, Maladevi temple (Gyaraspur)=23.8463°N/77.837°E, Amarkantak=23.0346°N/81.751°E, Modhera Sun temple=23.6013°N/72.3742°E, Somnath Temple=20.9298°N/70.7628°E, Ter/Trivikrama Temple=18.1698°N/76.118°E, Arasavalli Sun Temple=18.6224°N/84.1444°E, Kailashnath Temple (Ellora)=20.0225°N/75.1515°E, Kanchipuram=12.8°N/79.7°E, Uttaramrer/Uthiramerur Temples=12.9647°N/79.984°E, Mahabalipuram=12.6°N/80.2°E, Nataraja Temple, Chidambaram=11.5202°N/79.3396°E, Gangaikonda Cholapuram temple (Gan gaikondacholisvaram)=11.1531°N/79.2586°E, Rajarajeshwar Temple=10.659°N/79.2014°E, Kampaneshwara Temple=10.659°N/79.2014°E, Airavatesvara Temple=10.9446°N/79.3563°E, Meenakshi Temple=9.92°N/78.12°E, Muvar Koil (Kodumbalur)=11.1°N/78.8°E, Kopeshwar Temple (Khidrapur)=16.4627°N/74.0895°E, Aihole=16.0°N/75.9°E, Pattadakal (PYQ-2020, 2024)=15.94°N/75.82°E, Badami=16.2904°N/75.5916°E, Lakkundi=15.4167°N/75.6816°E, Dambal=15.4167°N/75.6816°E, Itagi=15.5748°N/76.3118°E, Hampi (PYQ-2018)=15.143°N/76.9173°E, Belur=13.0302°N/76.1745°E, Halebidu/Hoysaleshwara=13.0302°N/76.1745°E, Chennakeshava Temple=12.1968°N/76.612°E, Ramappa Temple=17.9°N/79.9°E, Tirupati=13.63°N/79.42°E, Vithoba temple (Pandharpur)=17.67°N/75.9008°E, Agrasen Ki Baoli=28.6139°N/77.209°E, Surajkund Lake=28.3584°N/77.3268°E, Fatehpur Sikri=27.0756°N/77.8754°E, Sringaverapura=25.5°N/81.7°E, Rani ki Vav (the Queen's stepwell)=23.86°N/72.1°E, Adalaj=22.7455°N/72.2975°E, Sudarsan Lake=21.3365°N/70.425°E, Warangal=17.8676°N/79.8019°E, Grand Anicut of Cholas/Kallanai Dam=10.85°N/78.82°E, Wular Lake=34.2874°N/74.4617°E, Khooni Bhandara=21.3349°N/76.3709°E, Aurangabad=19.8773°N/75.339°E, Kalinga=20.5°N/85.5°E, Srinagar=34.0659°N/74.8463°E, Rohtas=32.9376°N/73.7371°E, Lahore=31.5439°N/74.3883°E, Multan=30.0911°N/71.4927°E, Amritsar=31.7686°N/74.8316°E, Delhi=28.6139°N/77.209°E, Agra=27.0756°N/77.8754°E, Sikandra=27.0756°N/77.8754°E, Fatehpur Sikri=27.0756°N/77.8754°E, Lucknow=26.8344°N/80.8156°E, Allahabad (Prayagraj)=25.2793°N/81.9035°E, Jaunpur=25.7967°N/82.4889°E, Sasaram=24.9°N/84.0°E, Gaur/Gauda/Lakhnauti/Jannatabad=24.9°N/88.1°E, Pandua=25.0057°N/88.1398°E, Jaipur=26.9784°N/75.7122°E, Ahmedabad=22.7455°N/72.2975°E, Champaner/Muhammadabad=22.6978°N/73.5981°E, Mandu=22.5787°N/75.2259°E, Daulatabad=20.0225°N/75.1515°E, Ahmednagar=19.1628°N/74.858°E, Gulbarga=17.2409°N/76.7697°E, Bidar=18.0207°N/77.2487°E, Golconda=17.3888°N/78.4611°E, Hyderabad=17.3888°N/78.4611°E, Bijapur=16.8144°N/75.8934°E, Herat=34.3497°N/62.2178°E, Bamiyan=34.8°N/67.8°E, Bagram=34.9°N/69.0°E, Hadda=34.4428°N/70.509°E, Sugh=30.2159°N/77.3257°E, Hansi Hoard=29.2397°N/75.8175°E, Mathura=27.5°N/77.7°E, Bhuteshwar=27.6333°N/77.5833°E, Parkham=27.6333°N/77.5833°E, Hulas Khera=26.8312°N/80.9174°E, Chausa=25.5045°N/84.1098°E, Didarganj=25.4681°N/85.1953°E, Nalanda=25.1°N/85.4°E, Kurkihar (PYQ- 2022)=24.6794°N/85.0116°E, Sultanganj=25.2861°N/87.1304°E, Chandraketugarh (PYQ-2016, 2018, 2021, 2025)=22.7°N/88.6°E, Akota=22.3179°N/73.3049°E, Phopnar=21.3349°N/76.3709°E, Amaravati (PYQ-2019)=16.2854°N/80.5686°E, Nagarjunakonda=16.5°N/79.3°E, Thanjavur=10.8°N/79.1°E, Swamimalai=10.659°N/79.2014°E, Basantgarh hoard=24.8114°N/72.83°E, Udaigiri=23.5°N/77.8°E, Shravanabelagola=13.0302°N/76.1745°E, Mahabalipuram=12.6°N/80.2°E, Orchha Palace=25.3123°N/78.6676°E, Bagh=22.3°N/74.8°E, Ravan Chhaya Rock shelters=21.5°N/85.5°E, Ajanta=20.6°N/75.7°E, Ellora=20.0°N/75.2°E, Badami Caves=15.9°N/75.7°E, Virupaksha Temple=14.9429°N/76.0448°E, Lepakshi Temple=14.6783°N/77.6065°E, Mattancherry Palace=10.0384°N/76.5074°E, Chidambaram=11.5202°N/79.3396°E, Brihadeshwara Temple=10.659°N/79.2014°E, Sittanavasal Jain Paintings=10.3827°N/78.8191°E, Padmanabhapuram Palace=8.0793°N/77.5499°E, Bundi Fort=25.4368°N/75.7361°E, Sharda Peeth=34.7°N/74.1°E, Takshashila=33.4741°N/73.4089°E, Kashi=25.3719°N/82.9414°E, Vikramashila=25.3°N/87.3°E, Nalanda=25.1°N/85.4°E, Odantapuri=25.2°N/85.5°E, Moghalmari=22.2°N/87.5°E, Bikrampur Vihara=23.5256°N/90.4414°E, Jagaddala Vihara=24.8735°N/88.7376°E, Somapura=25.0°N/88.9°E, Mahastangarh=24.9°N/89.4°E, Pushpagiri=20.7176°N/86.1863°E, Lalitgiri=20.5°N/86.0°E, Udayagiri=20.8747°N/86.1215°E, Ratnagiri=17.0°N/73.3°E, Vallabhi=21.9°N/71.9°E, Ujjayini=23.2933°N/75.6263°E, Nagarjuna Vidyapeeth=16.2854°N/80.5686°E, Salotgi=16.8144°N/75.8934°E, Manyakheta=17.2409°N/76.7697°E, Sringeri Math=13.318°N/75.7739°E, Kanthalloor=8.577°N/77.0501°E, Kanchipuram=12.8°N/79.7°E, Ennayiram=11.9398°N/79.4946°E, Nabadwip=23.4847°N/88.5567°E, Deval/Debal=24.8305°N/67.1349°E, Barbarikon=24.8305°N/67.1349°E, Bharuch/Bhrigukachchha=21.7°N/73.0°E, Bhagatrav=21.7°N/73.0°E, Sopara/Nala Sopara=19.4°N/72.8°E, Chaul=18.4928°N/73.1381°E, Dabhol=17.2826°N/73.457°E, Beypur/Beypore/Vayapura=11.4656°N/75.8919°E, Nelcynda (Niranam)=9.2781°N/76.9737°E, Muziris/Muchiris=10.2°N/76.2°E, Kollam/Quilon=8.88°N/76.59°E, Chattogram/Chittagong=22.4225°N/91.7313°E, Tamralipti/Tamluk=22.4°N/87.9°E, Khalkattapatna=19.8°N/85.9°E, Kalingapatnam=18.35°N/84.13°E, Masulipatnam/Machilipatnam=16.2135°N/81.0278°E, Motupalli=15.5642°N/80.0067°E, Mamallapuram/Mahabalipuram=12.6362°N/80.0654°E, Vasasamudram=12.9647°N/79.984°E, Arikamedu=11.9°N/79.8°E, Puhar/Kaveripattanam/Kaveri Poompatinam=11.1896°N/79.6946°E, Nagapattinam=10.6026°N/79.7619°E, Tuticorin=8.8457°N/77.9938°E, Korkai=8.5°N/78.1°E, Mylapore=13.0837°N/80.2702°E, Hydaspes/Jhelum=32.9°N/73.7°E, Kalinga=20.5°N/85.5°E, Vatapi/Badami=16.2904°N/75.5916°E, Peshawar=34.0°N/71.6°E, Tarain=29.7256°N/76.9107°E, Chandawar=27.1942°N/78.4605°E, Diu=20.72°N/70.99°E, Panipat=29.3473°N/76.8872°E, Khanwa=27.0247°N/77.292°E, Chanderi=24.6186°N/77.8787°E, Ghaghra=25.9°N/84.7°E, Chausa=25.5045°N/84.1098°E, Kannauj=26.9987°N/79.6928°E, Sirhind=30.63°N/76.39°E, Talikota=16.8144°N/75.8934°E, Haldighati=25.2892°N/73.8241°E, Surat=21.1924°N/72.9551°E, Purandar=18.6449°N/73.9224°E, Vasai/Bassein=19.055°N/72.8692°E, Karnal=29.69°N/77.0°E, Kangra Fort=32.0769°N/76.2986°E, Lahore Fort=31.59°N/74.32°E, Red Fort=28.6139°N/77.209°E, Junagarh Fort=28.0159°N/73.3171°E, Jaisalmer Fort=26.91°N/70.91°E, Mehrangarh Fort=26.2968°N/73.0351°E, Amber/Amer Fort=26.9784°N/75.7122°E, Ranthambore Fort=26.229°N/76.3044°E, Kumbhalgarh Fort=25.2892°N/73.8241°E, Chittorgarh Fort=24.89°N/74.64°E, Gagron Fort=24.3132°N/76.5221°E, Agra Fort=27.18°N/78.02°E, Gwalior Fort=26.0287°N/78.1571°E, Jhansi Fort=25.5299°N/78.6528°E, Daulatabad/Deogiri Fort=19.94°N/75.22°E, Raigad Fort=18.4928°N/73.1381°E, Rajgad Fort=18.6449°N/73.9224°E, Pratapgad Fort=17.6361°N/74.2983°E, Panhala Fort=16.4627°N/74.0895°E, Sindhudurg Fort=16.1357°N/73.6522°E, Bidar Fort=18.0207°N/77.2487°E, Warangal Fort=17.8676°N/79.8019°E, Golconda Fort=17.3606°N/78.4741°E, Srirangapatna Fort=12.6369°N/76.7275°E, Gingee Fort=11.9398°N/79.4946°E, Fort St George (Madras)=13.0008°N/80.2023°E, Fort William=22.5726°N/88.3639°E, Bhera=31.0°N/72.0°E, Vijaydurg=16.1357°N/73.6522°E, Suvarnadurg=17.2826°N/73.457°E, Janjira=18.4928°N/73.1381°E, Diu=20.72°N/70.99°E, Broach=21.8357°N/72.8821°E, Surat=21.1924°N/72.9551°E, Daman=20.4°N/72.8°E, Bassein=19.3654°N/73.3685°E, Bombay=19.055°N/72.8692°E, Vengurla=16.1357°N/73.6522°E, Goa (Fort Aguada)=15.5°N/73.77°E, Cannanore=11.9863°N/75.548°E, Mahe=11.7°N/75.53°E, Calicut/Kozhikode=11.4656°N/75.8919°E, Cochin=10.0384°N/76.5074°E, Hugli=22.9°N/88.4°E, Chandernagore/Chandannagar=22.87°N/88.37°E, Chinsura=22.9°N/88.39°E, Serampore=22.75°N/88.34°E, Calcutta (Fort William)=22.5726°N/88.3639°E, Hariharpur, Balasore=21.5006°N/86.9199°E, Yanam=16.73°N/82.21°E, Masulipatnam/Machilipatnam=16.2135°N/81.0278°E, Pulicat=13.1394°N/79.9071°E, Madras (Fort St George)=13.0008°N/80.2023°E, Pondicherry=11.93°N/79.83°E, Karaikal=10.9156°N/79.8069°E, Tranquebar/Tharangambadi=11.1896°N/79.6946°E, Nagapattinam=10.6026°N/79.7619°E, Agra=27.0756°N/77.8754°E, Patna=25.4681°N/85.1953°E, Qasimbazar=24.2904°N/88.3664°E, Ahmedabad=22.7455°N/72.2975°E, Banskhera Copper Plate Inscription=27.9129°N/79.7476°E, Bhitari Pillar Inscription=25.6035°N/83.5076°E, Damodarpur Copper Plate=25.6376°N/88.725°E, Hathigumpha=20.3°N/85.8°E, Gwalior=26.2°N/78.2°E, Mandsaur (Sondani)=24.2628°N/75.3857°E, Eran Pillar inscription=23.8083°N/78.7583°E, Besnagar/Vidisha Pillar inscription=23.8463°N/77.837°E, Junagadh Rock Inscription=21.5°N/70.5°E, Nashik=19.9°N/73.8°E, Naneghat=18.6449°N/73.9224°E, Riddhapur=21.1545°N/77.6443°E, Aihole=16.0°N/75.9°E, Kudumiyanmalai=10.3827°N/78.8191°E, Uttaramerur=12.6°N/79.8°E, Kanaganahalli=16.1°N/76.6°E, Bicholim=15.6°N/74.0°E, Bhir Mound=33.7°N/72.8°E, Sunet=30.8°N/75.9°E, Bayana=26.9°N/77.3°E, Bharsar Hoard=25.3719°N/82.9414°E, Hooghly/Hasnan Hoard=22.9099°N/88.0121°E, Kalighat=22.5°N/88.3°E, Vadnagar=23.6013°N/72.3742°E, Jogalthambi=20.2255°N/74.1042°E, Phanigiri=17.1°N/79.4°E, Arikamedu=11.9°N/79.8°E, Palghat gap=10.8°N/76.7°E, Ujjain=23.2°N/75.8°E, Hill Forts of Rajasthan=26.8106°N/73.7685°E, Jaipur city=26.9784°N/75.7122°E, The Jantar Mantar=26.9784°N/75.7122°E, Humayun's Tomb=28.6139°N/77.209°E, Qutub Minar and its monuments=28.6139°N/77.209°E, Red Fort Complex=28.6139°N/77.209°E, Agra Fort=27.18°N/78.02°E, Taj Mahal=27.0756°N/77.8754°E, Fatehpur Sikri=27.0756°N/77.8754°E, Archaeological Site of Nalanda Mahaviha ra at Nalanda=25.2116°N/85.4485°E, Mahabodhi Temple Complex=24.6945°N/84.9934°E, Santiniketan=24.0622°N/87.6983°E, Dholavira: A Harappan City=23.9°N/70.2°E, Rani ki Vav (the Queen's stepwell)=23.86°N/72.1°E, Historic city of Ahmedabad=23.03°N/72.58°E, Champaner-Pavagadh Archaeological Park=22.6978°N/73.5981°E, Buddhist Monuments at Sanchi=23.2676°N/78.1727°E, Khajuraho Group of Monuments=24.7606°N/79.6782°E, Rock shelters of Bhimbetka=22.93°N/77.61°E, Sun Temple, Konark=19.8343°N/85.6853°E, Ajanta Caves=20.0225°N/75.1515°E, Ellora=20.0°N/75.2°E, Chhatrapati Shivaji Terminus=19.055°N/72.8692°E, Victorian Gothic and Art Deco Ensembles of Mumbai=19.055°N/72.8692°E, Elephanta caves=19.055°N/72.8692°E, Kakatiya Rudreshwara (Ramappa)=18.3145°N/80.3459°E, Group of Monuments at Pattadakal=16.2904°N/75.5916°E, Group of Monuments Hampi=14.9429°N/76.0448°E, Sacred Ensembles of Hoysalas=13.0°N/76.2°E, Churches and Convents of Goa=15.5023°N/73.9117°E, Great Living Chola Temples=11.3324°N/78.6099°E, Moidams- the Mound-Burial System of the Ahom Dynasty=27.0697°N/95.0642°E, Group of Monuments at Mahabalipuram=12.6362°N/80.0654°E, Chandigarh Capitol Complex (Part of The Architectural Work of Le Corbusier, an Outstanding Contribution to the Modern Movement)=30.7334°N/76.7797°E

═══════════════════════════════════════════════
SCORING RULES:
═══════════════════════════════════════════════
siteCorrect: true if student answer = correct site (spelling variants OK):
- "Hunsgi"="Hungsi", "Asmaka"="Ashmaka"="Assaka"
- "Erragudi"="Yerragudi"="Erreguda"
- "Nagapattinam"="Nagapatnam"
- "Tamralipti"="Tamluk"="Tamralipti port"
- "Kalibangan"="Kalibanga"
- Student adding state/description is fine: "Hunsgi, Karnataka" = correct
siteCorrect: false if student wrote a genuinely different site

Marks:
- siteCorrect=true: 1.5 marks for site
- descriptionScore: 0=blank/wrong, 0.5=vague/partial, 1=accurate+specific
- siteCorrect=false: descriptionScore must be 0

═══════════════════════════════════════════════
OUTPUT: JSON only. No markdown. No backticks.
Keys = roman numeral strings.
Each value: correctSite, siteCorrect, descriptionScore, descriptionFeedback
═══════════════════════════════════════════════

Entries:
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
