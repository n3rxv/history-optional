import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function POST(req: NextRequest) {
  try {
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

    const ocrPrompt = `You are a precise handwriting transcription engine for UPSC History Optional answer sheets. Transcribe every word exactly as written.

RULES:
- Transcribe ALL words — do not skip, summarise, or compress anything
- Join hyphenated line-breaks into one word
- Never correct spelling silently — transcribe exactly what is written
- Historian names are critical — transcribe letter for letter as written
- If uncertain (70-89% confident): add (?) after the word
- If unreadable (<70%): write [illegible]
- Preserve paragraph breaks as blank lines
- Skip the question text at the top — start from the first word of the answer body
- Output ONLY plain transcribed text — no headings, no markdown, no commentary, no LaTeX

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

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages,
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
    return NextResponse.json({ text });

  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}
