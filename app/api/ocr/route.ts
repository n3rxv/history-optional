import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const pdfBuffer = Buffer.from(await file.arrayBuffer());

    // Dynamically import pdfjs-dist (pure JS, works on Vercel)
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
    const pdfDoc = await loadingTask.promise;

    const imageContents: { type: "image_url"; image_url: { url: string } }[] = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });

      // Use OffscreenCanvas (available in Node 18+ / Vercel)
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

      await page.render({ canvasContext: context, viewport, canvas: canvas as unknown as HTMLCanvasElement }).promise;

      const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      imageContents.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${base64}` },
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
