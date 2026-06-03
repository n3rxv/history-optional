import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;
export const config = { api: { bodyParser: { sizeLimit: "50mb" } } };
export const dynamic = "force-dynamic";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { pdf } = await req.json();
    if (!pdf) return NextResponse.json({ error: "No PDF provided" }, { status: 400 });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      temperature: 0,
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: pdf },
          },
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
