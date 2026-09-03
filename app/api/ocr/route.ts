import { NextRequest, NextResponse } from "next/server";
import { resolveEvalAccess, evalAccessDenied } from "@/lib/evalAccess";
import { checkRateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function POST(req: NextRequest) {
  // Every call here is an LLM transcription we pay for. This was the last step
  // of the evaluation flow still reachable without an account — lib/evalAccess
  // was written to close exactly this and was applied to /api/ocr-pdf and
  // /api/detect-questions but never to /api/ocr.
  const access = await resolveEvalAccess(req);
  if (!access.allowed) return evalAccessDenied(access.reason);

  // A subscription is unlimited, not infinite-rate: without a ceiling one
  // account can still drive the OCR bill on its own.
  const { allowed: withinRate } = await checkRateLimit(
    `ocr:${access.uid ?? clientIp(req)}`,
    { limit: 30, windowSeconds: 10 * 60 }
  );
  if (!withinRate) return tooManyRequests();

  try {
    const url = new URL(req.url);
    const isPdfMode = url.searchParams.get("mode") === "pdf";

    const formData = await req.formData();
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

    const imageContents = await Promise.all(files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mime = file.type || "image/jpeg";
      return {
        type: "image_url" as const,
        image_url: { url: `data:${mime};base64,${base64}` },
      };
    }));

    // PDF mode: include question text as [Q]: markers so detect-questions can extract it.
    // Normal mode: skip question text (user enters it manually in the single-question flow).
    const ocrPrompt = isPdfMode
      ? `You are a precise handwriting transcription engine for UPSC History Optional answer sheets. Transcribe every word exactly as written.

RULES:
- Transcribe ALL words — do not skip, summarise, or compress anything
- Join hyphenated line-breaks into one word
- Do NOT preserve original line breaks — merge each paragraph into continuous flowing text
- Only use a newline when a new paragraph, heading, or section begins
- Never correct spelling silently — transcribe exactly what is written
- Historian names are critical — transcribe letter for letter as written
- If uncertain (70-89% confident): add (?) after the word
- If unreadable (<70%): write [illegible]
- Preserve paragraph breaks as blank lines
- QUESTION DETECTION — STRICT RULES:
  * Output [Q]: ONLY when the very first non-empty content on the page starts with an explicit question label like "Q.", "Q1", "Q2", "Ques.", "Question" followed by the question text
  * The [Q]: line must be the VERY FIRST line of your output — never output [Q]: after you have already started transcribing answer content
  * If the PDF is a continuation of an answer (no question label visible at top), do NOT output [Q]: at all
  * NEVER output [Q]: for: examples, subheadings, boxed words, "BUT", "However", "e.g.", section titles, underlined headings mid-answer, or ANY content that appears after the first line
  * When in doubt, do NOT add [Q]: — transcribe it as normal answer text instead
  * One [Q]: maximum per OCR call — if you have already output one, never output another
- After the [Q]: line (if any), transcribe the complete answer body normally
- Output ONLY the transcribed handwritten text — nothing else
- NEVER output markdown headers (##), step descriptions, meta-commentary, reasoning, or explanations
- NEVER output LaTeX — use plain Unicode: → for arrows, × for multiplication, etc.
- Do NOT narrate what you are doing — just output the transcription directly

Output the transcription now:`
      : `You are a precise handwriting transcription engine for UPSC History Optional answer sheets. Transcribe every word exactly as written.

RULES:
- Transcribe ALL words — do not skip, summarise, or compress anything
- Join hyphenated line-breaks into one word
- Do NOT preserve original line breaks — merge each paragraph into continuous flowing text
- Only use a newline when a new paragraph, heading, or section begins
- Never correct spelling silently — transcribe exactly what is written
- Historian names are critical — transcribe letter for letter as written
- If uncertain (70-89% confident): add (?) after the word
- If unreadable (<70%): write [illegible]
- Preserve paragraph breaks as blank lines
- Skip the question text at the top — start from the first word of the answer body
- Output ONLY the transcribed handwritten text — nothing else
- NEVER output markdown headers (##), step descriptions, meta-commentary, reasoning, or explanations
- NEVER output LaTeX — use plain Unicode: → for arrows, × for multiplication, etc.
- Do NOT narrate what you are doing — just output the transcription directly

Output the transcription now:`;

    const messages = [
      {
        role: "user",
        content: [
          ...imageContents,
          { type: "text", text: ocrPrompt },
        ],
      },
    ];

    // Mistral Pixtral vision format
    const mistralMessages = [
      {
        role: "user",
        content: [
          ...imageContents.map((img: any) => ({
            type: "image_url",
            image_url: img.image_url,
          })),
          { type: "text", text: ocrPrompt },
        ],
      },
    ];

    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "pixtral-12b-2409",
        messages: mistralMessages,
        temperature: 0.0,
        max_tokens: 4000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: "OCR failed: " + err }, { status: 500 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";

    // In PDF mode the question text is embedded in the transcript as [Q]: lines.
    // In normal (single-question) mode, detect it from the first image.
    let detectedQuestion = "";
    if (!isPdfMode) {
      try {
        const firstImg = imageContents[0] as any;
        const qRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            model: "pixtral-12b-2409",
            messages: [{
              role: "user",
              content: [
                { type: "image_url", image_url: firstImg.image_url },
                { type: "text", text: "Look at this handwritten answer sheet. Extract ONLY the question text written at the top of the page (usually underlined, in a box, or written before the answer begins). Output ONLY the question text, nothing else. If no question is visible, output empty string." },
              ],
            }],
            temperature: 0.0,
            max_tokens: 300,
          }),
        });
        if (qRes.ok) {
          const qData = await qRes.json();
          detectedQuestion = qData.choices?.[0]?.message?.content?.trim() || "";
        }
      } catch { /* ignore question detection errors */ }
    }

    return NextResponse.json({ text, detectedQuestion });

  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}
