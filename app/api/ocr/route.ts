import { NextRequest, NextResponse } from "next/server";
import { pdf } from "pdf-to-img";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const pdfBuffer = Buffer.from(await file.arrayBuffer());

    // Convert PDF pages to images using pdf-to-img (works on Vercel Linux)
    const imageContents: { type: "image_url"; image_url: { url: string } }[] = [];

    const document = await pdf(pdfBuffer, { scale: 2 });
    for await (const page of document) {
      const base64 = Buffer.from(page).toString("base64");
      imageContents.push({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${base64}` },
      });
    }

    if (imageContents.length === 0) {
      return NextResponse.json({ error: "Could not convert PDF to images" }, { status: 400 });
    }

    const body = {
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          ...imageContents,
          {
            type: "text",
            text: `OUTPUT THE TRANSCRIPTION ONLY. No steps, no analysis, no commentary, no headings, no markdown.
Read every word of this handwritten answer sheet and output the transcribed text directly.
- Skip only the question text at the very top if the student copied it
- Start directly from the first word of the answer body
- Preserve paragraph breaks and numbering exactly as written
- Correct obvious spelling mistakes silently
- Write [illegible] for unreadable words
- Do not write anything except the transcribed answer text`
          }
        ]
      }],
      temperature: 0,
      max_tokens: 2000,
    };

    const groqFetch = async (key: string) =>
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    let res = await groqFetch(process.env.GROQ_API_KEY!);
    if (res.status === 429 && process.env.GROQ_API_KEY_2) {
      res = await groqFetch(process.env.GROQ_API_KEY_2);
    }
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: "OCR failed: " + err }, { status: 500 });
    }

    const data = await res.json();
    const text = data.choices[0].message.content;
    return NextResponse.json({ text });

  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}
