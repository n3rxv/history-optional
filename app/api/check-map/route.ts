import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64 } = await req.json();
    if (!pdfBase64) {
      return NextResponse.json({ error: "No PDF provided" }, { status: 400 });
    }

    const prompt = `You are a strict UPSC History Optional map question examiner.

You will receive a PDF containing:
- Page 1: An outline map of India with numbered dots (i) to (xx) marked on it
- Pages 2-3: The clues/hints for each numbered dot
- Pages 4+: The student's handwritten answers

YOUR TASK:
Evaluate EVERY question from (i) to (xx). For each one:
1. Look at the map to determine which site the dot corresponds to (use the lat/lon grid on the map — grid lines are at 10°N/20°N/30°N and 70°E/80°E/90°E)
2. Read the clue for that number
3. Read the student's handwritten answer (site name + description)
4. Score it

MARKING SCHEME (2.5 marks per question, 50 total):
- Site name: 1.5 marks (full 1.5 if correct, 1.0 if correct site but wrong state/minor error, 0 if wrong)
- Description: 1.0 mark (1.0 if historically accurate and relevant, 0.5 if partially correct, 0 if wrong/blank)
- If site name is wrong: description gets 0 regardless

IMPORTANT RULES:
- If student left it blank: 0/2.5
- Wrong state name (e.g. Nagapattinam in "Andhra Pradesh" instead of Tamil Nadu): deduct 0.5 from site marks
- Kushinagar is in Uttar Pradesh NOT Bihar
- Nagapattinam is in Tamil Nadu NOT Andhra Pradesh  
- Accept spelling variants (Burzahom/Burzahama, Hunsgi/Hunasagi, Erragudi/Yerragalsi etc.)
- "Factory site" is NOT a valid description for Burzahom (it's valid for Hunsgi)
- Sarai Nahar Rai is a BURIAL site, NOT an irrigation centre

Respond with ONLY a JSON object, no markdown, no explanation:
{
  "results": [
    {
      "number": "i",
      "clue": "the clue text",
      "correctSite": "correct site name",
      "correctLocation": "state/region",
      "studentSite": "what student wrote or null",
      "studentDescription": "student description or null",
      "status": "correct|partial|wrong|blank",
      "siteMarks": 1.5,
      "descriptionScore": 1.0,
      "marks": 2.5,
      "maxMarks": 2.5,
      "descriptionFeedback": "brief feedback on description accuracy",
      "confidence": 0.95
    }
  ],
  "totalMarks": 35.0,
  "maxTotal": 50,
  "percentage": 70.0
}

Status rules:
- "correct" = full or near-full marks (2.0-2.5)
- "partial" = some marks but not full (0.5-1.5)  
- "wrong" = site name wrong (0 marks)
- "blank" = student wrote nothing

Evaluate all 20 questions now.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    console.log("[check-map] Claude raw response:", raw.slice(0, 500));

    // Clean and parse JSON
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Claude did not return valid JSON");
    }
    const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[check-map] error:", err);
    return NextResponse.json({ error: err.message || "Evaluation failed" }, { status: 500 });
  }
}
