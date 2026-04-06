import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function POST(req: NextRequest) {
  // Auth gate
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createServerClient();
  const { data: { user }, error: authErr } = await db.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const questionText = formData.get("question") as string || "";
    const rawFiles = formData.getAll("files") as File[];
    const files = [...rawFiles].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (!files || files.length === 0)
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    if (files.length > MAX_FILES)
      return NextResponse.json({ error: `Too many files (max ${MAX_FILES})` }, { status: 400 });
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE)
        return NextResponse.json({ error: "File too large (max 5MB each)" }, { status: 400 });
      if (!ALLOWED_TYPES.includes(file.type))
        return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 });
    }

    const imageContents: { type: "image_url"; image_url: { url: string } }[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mime = file.type || "image/jpeg";
      imageContents.push({
        type: "image_url",
        image_url: { url: `data:${mime};base64,${base64}` },
      });
    }

    const ocrPrompt = `You are the world's most precise handwriting transcription engine, built specifically for UPSC History Optional answer sheets. Your ONLY function is letter-perfect transcription. A student's evaluation depends entirely on the accuracy of your reading — a single misread word can cause wrong marks, wrong feedback, and wrong historian attribution. Errors are unacceptable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE TRANSCRIPTION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE 1 — TRANSCRIBE EVERY SINGLE WORD.
Do not skip, summarise, paraphrase, or compress anything. Every word on every line on every page must appear in your output. If the answer is 300 words, your transcript must be ~300 words. If you produce significantly fewer words than appear on the page, you have failed.

RULE 2 — GO SLOW. READ CHARACTER BY CHARACTER IF NEEDED.
Do not skim. For each word: look at every letter individually, consider the full word context, then commit. Rushing causes errors. Take your time on every single word.

RULE 3 — HISTORIAN NAMES ARE SACRED. NEVER GET THEM WRONG.
Historian names are the most critical part of this evaluation. Read them with extreme care.
Known names that may appear — read these exactly:
Romila Thapar, R.S. Sharma, Irfan Habib, U.N. Ghoshal, Burton Stein, D.D. Kosambi, B.D. Chattopadhyaya, Satish Chandra, Upinder Singh, Shereen Ratnagar, Possehl, Kenoyer, Fairservis, Shaffer, K.A.R. Kennedy, Uma Chakravarti, R.P. Kangle, Thomas Trautmann, Hermann Kulke, D.C. Sircar, Sheldon Pollock, Noboru Karashima, K.A. Nilakanta Sastri, David Ludden, Phillip Wagoner, David Lorenzen, Peter Hardy, Mohammed Habib, Peter Jackson, K.A. Nizami, Simon Digby, Muzaffar Alam, J.F. Richards, M. Athar Ali, Jadunath Sarkar, Ranajit Guha, Ayesha Jalal, Mushirul Hasan, Gyanendra Pandey, Urvashi Butalia, Bipan Chandra, Anil Seal, Sumit Sarkar, Shahid Amin, Judith Brown, Partha Chatterjee, Lata Mani, Eric Stokes, Bernard Cohn, Utsa Patnaik, E.P. Thompson, Hobsbawm, Max Weber, Lefebvre, Soboul, Furet, Fischer, Fitzpatrick, Gaddis, Fanon, Frederick Cooper, C.A. Bayly, André Wink, Frank Perlin, Bandyopadhyay.
If you see a name that resembles one of these, read it carefully and transcribe it exactly as written — do NOT auto-correct to the known spelling unless you are certain.

RULE 4 — NEVER CORRECT SPELLING SILENTLY.
Do NOT fix spelling mistakes. Transcribe exactly what is written. If the student misspelled a historian's name, transcribe the misspelling — the evaluator needs to see it. Silent corrections destroy evaluation accuracy.

RULE 5 — DATES, NUMBERS, AND YEARS: TRANSCRIBE EXACTLY.
Do not round, approximate, or guess dates. If you see "1857" write "1857". If you cannot read a digit clearly, write [illegible digit].

RULE 6 — TECHNICAL TERMS: TRANSCRIBE EXACTLY AS WRITTEN.
Terms like: iqta, mansabdari, jagirdari, zabti, dahsala, batai, kankut, saptanga, rajamandala, shadgunya, adhyaksha, gahapati, nayankara, tinai, akam, puram, sama, pargana, sarkar — transcribe these exactly as the student wrote them, even if misspelled.

RULE 7 — UNCERTAIN WORDS: USE THE RIGHT FLAG.
- If you are 90%+ confident: transcribe normally.
- If you are 70–89% confident: transcribe with (?) suffix — e.g. "Kosambi(?)"
- If you are below 70% confident: write [illegible] — do NOT guess silently.
- NEVER substitute a wrong word without flagging it. A flagged uncertainty is infinitely better than a silent error.

RULE 8 — PRESERVE ALL STRUCTURE EXACTLY.
- New paragraph → blank line in transcript
- Underlined heading → write the heading text normally (do not add any markup)
- Numbered point → keep the number
- Skip the question text at the very top — the student copies the question before writing their answer, do NOT include it in the transcript. Start from the first word of the answer body only.
- Page break → --- PAGE BREAK ---

RULE 9 — OUTPUT FORMAT: PLAIN TEXT ONLY. THIS IS NON-NEGOTIABLE.
Your entire response must be ONLY the transcribed words from the answer sheet.
FORBIDDEN — if any of these appear in your output, you have failed:
✗ "## Step 1" or any step headings
✗ "The handwritten text on page X is as follows:"
✗ "Here is the transcription:"
✗ "Transcription:" or any label before the text
✗ $Q$, $^{n}$, $\rightarrow$, or ANY LaTeX/math notation — write these as plain text: "Q.", "Solution:", "→"
✗ Any markdown: no ##, no **, no __, no bullet points using *, no ---
✗ Any commentary, analysis, or observation about the text
✗ Repeating the transcription (do NOT transcribe once per page then combine — one clean output only)

CORRECT output looks like this:
"""
Q. How far did the Mauryans facilitate the diffusion of the material culture of the Gangetic plains? Explain.

The Mauryan expansion into the North-west and South led to the expansion of the Gangetic culture all across India. This view has been proposed by R.S. Sharma.

1) The art/culture of Statecraft (Arthashastra) spread across the region...
"""

WRONG output looks like this (DO NOT DO THIS):
"""
## Step 1: Transcribe the first page.
The handwritten text on the first page is as follows:
$Q$. How far did...
## Step 2: Transcribe the second page.
"""

RULE 10 — ONE PASS, ONE OUTPUT.
Do not transcribe page by page and then combine. Read all pages, then output one clean continuous transcription. No repetition.

RULE 11 — MENTAL CHECK BEFORE OUTPUTTING.
Ask yourself: Is my output pure transcribed text with zero headings, zero LaTeX, zero step markers, zero repetition? If not, rewrite it before outputting.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW OUTPUT THE TRANSCRIPTION OF ${imageContents.length} PAGE(S) — PLAIN TEXT ONLY, STARTING WITH THE FIRST WORD OF THE ANSWER BODY. SKIP THE QUESTION TEXT AT THE TOP ENTIRELY — DO NOT INCLUDE IT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const geminiParts = [
      ...imageContents.map((img: { type: string; image_url: { url: string } }) => {
        const matches = img.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
        return matches
          ? { inline_data: { mime_type: matches[1], data: matches[2] } }
          : null;
      }).filter(Boolean),
      { text: ocrPrompt },
    ];

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: geminiParts }],
          generationConfig: { temperature: 0.0, maxOutputTokens: 4000 },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: "OCR failed: " + err }, { status: 500 });
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return NextResponse.json({ text });

  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}
