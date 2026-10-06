import { NextRequest, NextResponse } from "next/server";
import { resolveEvalAccess, evalAccessDenied } from "@/lib/evalAccess";
import { checkRateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

type Emit = (event: Record<string, unknown>) => void;

/**
 * Hindi answers are read again with Mistral's OCR model. Pixtral 12B, which
 * reads every answer first, garbles Devanagari handwriting: Marathi words in
 * Hindi sentences, invented names ("Arthur C. Desi" for R.C. Dutt), a question
 * nobody asked. The marker then blamed students for its mistakes, and the
 * four Hindi answers checked in October scored 1 to 2.5 out of 10.
 *
 * Which reader is decided by what was written, not the site's language: an
 * English answer from a reader browsing in Hindi stays on Pixtral.
 */
const mostlyDevanagari = (t: string) => {
  const letters = (t.match(/\p{L}/gu) ?? []).length;
  const deva = (t.match(/[\u0900-\u097F]/g) ?? []).length;
  return letters > 40 && deva / letters > 0.5;
};

/** Mistral OCR's markdown as plain transcript text. */
const plainText = (md: string) => md
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')           // images it found on the page
  .replace(/^#{1,6}\s*/gm, '')                      // headings
  .replace(/(\*\*|__)(.*?)\1/g, '$2')                // bold
  .replace(/\$\\(?:rightarrow|to)\$/g, '→').replace(/\$\\leftarrow\$/g, '←')
  .replace(/\$([^$\n]{1,40})\$/g, '$1')             // short inline maths
  .replace(/\n{3,}/g, '\n\n')
  .trim();

async function readPageHindi(image: { url: string }): Promise<string | null> {
  try {
    const res = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
      body: JSON.stringify({ model: 'mistral-ocr-latest', document: { type: 'image_url', image_url: image.url } }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const md = (data.pages ?? []).map((p: { markdown?: string }) => p.markdown ?? '').join('\n\n');
    return md.trim() ? plainText(md) : null;
  } catch {
    return null;
  }
}

/**
 * The OCR model reads the whole page and takes no instructions, so the
 * question written at the top comes through with the answer. A small text
 * model picks it out of the first page; it is then taken off the transcript,
 * but only where it appears word for word near the start.
 */
async function splitQuestion(firstPage: string): Promise<string> {
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        temperature: 0,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: `Below is the text read from the first page of a handwritten UPSC answer sheet. If the page begins with the question being answered (often underlined or labelled प्रश्न, Q or Q.), return that question exactly as it appears, character for character, including any label. If the page starts directly with the answer, return an empty string.\n\nReply only with JSON: {"question": "..."}\n\nPAGE TEXT:\n${firstPage.slice(0, 2000)}`,
        }],
      }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    const q = JSON.parse(data.choices?.[0]?.message?.content ?? '{}').question;
    return typeof q === 'string' ? q.trim() : '';
  } catch {
    return '';
  }
}

/** Every page read by Mistral OCR, and the question split off; null if any page fails, so Pixtral's reading stands. */
async function readHindi(images: { image_url: { url: string } }[]): Promise<{ text: string; question: string } | null> {
  const pages = await Promise.all(images.map((img) => readPageHindi(img.image_url)));
  if (pages.some((p) => !p)) return null;
  let text = (pages as string[]).join('\n\n');
  const question = await splitQuestion(pages[0] as string);
  if (question) {
    const at = text.indexOf(question);
    if (at !== -1 && at < 300) text = text.slice(at + question.length).replace(/^[\s:.\-–—]+/, '');
  }
  return { text, question: question.replace(/^(प्रश्न|प्र|Q|Ques|Question)\s*[\d.]*\s*[:.)\-–—]?\s*/i, '') };
}

/**
 * The evaluate page asks for progress with an x-ocr-stages header and gets
 * newline-delimited JSON: a {"type":"stage"} line as each step finishes, then
 * one {"type":"result"} line with the status and body the plain response
 * would have had. Its reading screen used to advance on a timer ("Parsing
 * text…", "Almost there…") whatever the server was doing. Callers that send no
 * header, the test series among them, get the plain JSON response as before.
 */
export async function POST(req: NextRequest) {
  if (req.headers.get("x-ocr-stages") !== "1") return ocr(req, () => {});

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const line = (o: object) => controller.enqueue(encoder.encode(JSON.stringify(o) + "\n"));
      let result: { status: number; body: unknown };
      try {
        const res = await ocr(req, (event) => line({ type: "stage", ...event }));
        let body: unknown = null;
        try { body = await res.json(); } catch { /* an empty body stays null */ }
        result = { status: res.status, body };
      } catch (err) {
        console.error("OCR error:", err);
        result = { status: 500, body: { error: "OCR failed" } };
      }
      line({ type: "result", ...result });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

async function ocr(req: NextRequest, emit: Emit): Promise<Response> {
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

    // Mistral Pixtral vision format
    const mistralMessages = [
      {
        role: "user",
        content: [
          ...imageContents.map((img) => ({
            type: "image_url",
            image_url: img.image_url,
          })),
          { type: "text", text: ocrPrompt },
        ],
      },
    ];

    emit({ id: "transcribing", pages: files.length });
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
    let text: string = data.choices?.[0]?.message?.content || "";

    // A Hindi answer is read again, page by page, with Mistral OCR, which also
    // gives the question written at the top.
    let detectedQuestion = "";
    let readAsHindi = false;
    if (!isPdfMode && mostlyDevanagari(text)) {
      const hindi = await readHindi(imageContents);
      if (hindi) { text = hindi.text; detectedQuestion = hindi.question; readAsHindi = true; }
    }
    emit({ id: "transcribed", words: text.trim() ? text.trim().split(/\s+/).length : 0 });

    // In PDF mode the question text is embedded in the transcript as [Q]: lines.
    // In normal (single-question) mode, detect it from the first image.
    if (readAsHindi) {
      emit({ id: "question" });
      emit({ id: "question_done", found: Boolean(detectedQuestion) });
    } else if (!isPdfMode) {
      emit({ id: "question" });
      try {
        const firstImg = imageContents[0];
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
      emit({ id: "question_done", found: Boolean(detectedQuestion) });
    }

    return NextResponse.json({ text, detectedQuestion });

  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}
