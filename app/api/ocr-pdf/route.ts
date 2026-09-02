import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { resolveEvalAccess, evalAccessDenied } from "@/lib/evalAccess";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const client = new Anthropic();

// The client sends one batch of rendered PDF pages per request (8 at present).
const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;
type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";
const ALLOWED_TYPES: MediaType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const access = await resolveEvalAccess(req);
  if (!access.allowed) return evalAccessDenied(access.reason);

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0)
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    if (files.length > MAX_FILES)
      return NextResponse.json({ error: `Too many images (max ${MAX_FILES})` }, { status: 400 });

    let totalBytes = 0;
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE)
        return NextResponse.json({ error: "An image exceeds the 5MB limit" }, { status: 400 });
      totalBytes += file.size;
    }
    if (totalBytes > MAX_TOTAL_SIZE)
      return NextResponse.json({ error: "Batch exceeds the 20MB limit" }, { status: 400 });

    const imageContents = await Promise.all(files.map(async (file) => {
      const mediaType = (ALLOWED_TYPES as string[]).includes(file.type)
        ? (file.type as MediaType)
        : "image/jpeg";
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      return {
        type: "image" as const,
        source: { type: "base64" as const, media_type: mediaType, data: base64 },
      };
    }));

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      temperature: 0,
      messages: [{
        role: "user",
        content: [
          ...imageContents,
          {
            type: "text",
            text: `You are a precise handwriting transcription engine for UPSC History Optional answer sheets.
RULES:
- Transcribe ALL words exactly as written — do not skip, summarise, or compress anything
- Join hyphenated line-breaks into one word
- Never correct spelling silently
- Historian names are critical — transcribe letter for letter
- If uncertain (70-89% confident): add (?) after the word
- If unreadable (<70%): write [illegible]
- Preserve paragraph breaks as blank lines
QUESTION DETECTION:
- When you see a question label (Q1, Q2, Q.3, 3(a), etc.) at the start of a new answer, output it on its own line as: [Q]: <question number and text if visible>
- Output [Q]: only for actual question markers, not for subheadings or examples mid-answer
- After the [Q]: line, transcribe the complete answer body
Output ONLY the transcribed text. No commentary, no markdown, no explanations.`,
          },
        ],
      }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("ocr-pdf error:", err);
    return NextResponse.json({ error: err.message ?? "OCR failed" }, { status: 500 });
  }
}
