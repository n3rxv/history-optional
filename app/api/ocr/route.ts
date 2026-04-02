import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0)
      return NextResponse.json({ error: "No files provided" }, { status: 400 });

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

    const body = {
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          ...imageContents,
          {
            type: "text",
            text: "OUTPUT THE TRANSCRIPTION ONLY. No steps, no analysis, no commentary, no headings, no markdown.\nRead every word of this handwritten answer sheet and output the transcribed text directly.\n- Skip only the question text at the very top if the student copied it\n- Start directly from the first word of the answer body\n- Preserve paragraph breaks and numbering exactly as written\n- Correct obvious spelling mistakes silently\n- Write [illegible] for unreadable words\n- Do not write anything except the transcribed answer text",
          },
        ],
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
    if (res.status === 429 && process.env.GROQ_API_KEY_2)
      res = await groqFetch(process.env.GROQ_API_KEY_2);

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
