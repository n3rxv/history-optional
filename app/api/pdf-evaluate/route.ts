export const maxDuration = 120;
 
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
 
// ─── Premium guard ────────────────────────────────────────────────────────────
 
async function isPremiumUser(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const db = createServerClient();
    const { data: { user } } = await db.auth.getUser(token);
    if (user?.email === process.env.OWNER_EMAIL) return true;
 
    const nowISO = new Date().toISOString();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", token)
      .eq("status", "active")
      .gt("expires_at", nowISO)
      .single();
    return !!sub;
  } catch {
    return false;
  }
}
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
interface QuestionSegment {
  questionNumber: string;
  marks: number;
  questionText: string;
  answerText: string;
}
 
interface PaperQuestion {
  id: string;
  marks: number;
  text: string;
}
 
// ─── Gemini segmentation ──────────────────────────────────────────────────────
 
async function segmentPDFByQuestion(
  pdfBase64: string,
  paperQuestions: PaperQuestion[]
): Promise<QuestionSegment[]> {
  const questionListStr = paperQuestions
    .map(q => `${q.id} (${q.marks}M): ${q.text.slice(0, 120)}`)
    .join("\n");
 
  const prompt = `You are analysing a UPSC History Optional handwritten answer sheet PDF. This PDF contains answers to multiple questions written by a student.
${questionListStr ? `\nThe paper's questions are:\n${questionListStr}\n` : ""}
Your task:
1. Read through the entire PDF carefully.
2. Identify where each question's answer starts and ends (look for question numbers written by the student like "Q3(a)", "3(a)", "7b", etc.)
3. For each question answered, transcribe the question number and the full answer body.
 
Return ONLY a JSON array. No preamble, no markdown fences.
 
[
  {
    "questionNumber": "3(a)",
    "marks": 15,
    "questionText": "the question text if written at top of answer, else empty string",
    "answerText": "complete verbatim transcription of the answer body — every single word"
  }
]
 
RULES:
- Every word must appear — do not summarise or skip
- Historian names are critical — transcribe letter-for-letter
- If unclear (70-89% confident): add (?) after the word
- If unreadable (<70% confident): write [illegible]
- Preserve paragraph breaks with double newlines`;
 
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "application/pdf", data: pdfBase64 } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 32000 }
      })
    }
  );
 
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  const clean = raw.replace(/```json\s*/gi,"").replace(/```/g,"").trim();
 
  let segments: QuestionSegment[] = [];
  try { segments = JSON.parse(clean); } catch { return []; }
 
  return segments.map(seg => {
    if (seg.marks && seg.marks > 0) return seg;
    const n = seg.questionNumber.toLowerCase().replace(/\s/g, "");
    const match = paperQuestions.find(q =>
      q.id.toLowerCase().replace(/\s/g, "") === n ||
      q.id.toLowerCase().replace(/\s/g, "").includes(n) ||
      n.includes(q.id.toLowerCase().replace(/\s/g, ""))
    );
    return { ...seg, marks: match?.marks ?? 15 };
  });
}
 
// ─── Evaluate one question via existing /api/evaluate ────────────────────────
 
async function evaluateOneQuestion(
  questionText: string,
  marks: number,
  answerTranscript: string,
  token: string
): Promise<Record<string, unknown>> {
  const fd = new FormData();
  fd.append("question", questionText);
  fd.append("marks", String(marks));
  fd.append("extractedText", answerTranscript);
 
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.historyoptional.xyz";
  const res = await fetch(`${baseUrl}/api/evaluate`, {
    method: "POST",
    headers: { "x-user-token": token, "x-internal": "1" },
    body: fd,
  });
 
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Evaluation failed" }));
    throw new Error(err.error ?? "Evaluation failed");
  }
  return await res.json();
}
 
// ─── Main handler ─────────────────────────────────────────────────────────────
 
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token") ?? "";
 
  const premium = await isPremiumUser(token);
  if (!premium) {
    return NextResponse.json(
      { error: "premium_required", message: "PDF test evaluation is a premium feature." },
      { status: 403 }
    );
  }
 
  try {
    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File | null;
    const questionsRaw = formData.get("questions") as string | null;
 
    if (!pdfFile)
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    if (pdfFile.type !== "application/pdf")
      return NextResponse.json({ error: "File must be a PDF." }, { status: 400 });
    if (pdfFile.size > 20 * 1024 * 1024)
      return NextResponse.json({ error: "PDF too large (max 20MB)." }, { status: 400 });
 
    let paperQuestions: PaperQuestion[] = [];
    if (questionsRaw) {
      try { paperQuestions = JSON.parse(questionsRaw); } catch { /* ignore */ }
    }
 
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const pdfBase64 = pdfBuffer.toString("base64");
 
    const segments = await segmentPDFByQuestion(pdfBase64, paperQuestions);
 
    if (segments.length === 0) {
      return NextResponse.json(
        { error: "No written answers detected in this PDF." },
        { status: 400 }
      );
    }
 
    const results: Array<{
      questionNumber: string;
      marks: number;
      questionText: string;
      evaluation: Record<string, unknown> | null;
      error?: string;
    }> = [];
 
    for (const seg of segments) {
      if (!seg.answerText?.trim()) {
        results.push({ questionNumber: seg.questionNumber, marks: seg.marks, questionText: seg.questionText, evaluation: null, error: "No answer text found." });
        continue;
      }
      try {
        const evaluation = await evaluateOneQuestion(
          seg.questionText || `Question ${seg.questionNumber}`,
          seg.marks,
          seg.answerText,
          token
        );
        results.push({ questionNumber: seg.questionNumber, marks: seg.marks, questionText: seg.questionText, evaluation });
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        results.push({ questionNumber: seg.questionNumber, marks: seg.marks, questionText: seg.questionText, evaluation: null, error: err instanceof Error ? err.message : "Evaluation failed." });
      }
    }
 
    const evaluated = results.filter(r => r.evaluation);
    const totalMarksScored = evaluated.reduce((s, r) => s + ((r.evaluation as any)?.marks ?? 0), 0);
    const totalMarksOut    = evaluated.reduce((s, r) => s + ((r.evaluation as any)?.marks_out_of ?? r.marks), 0);
 
    return NextResponse.json({
      results,
      summary: {
        questionsFound: segments.length,
        questionsEvaluated: evaluated.length,
        totalMarksScored: Math.round(totalMarksScored * 10) / 10,
        totalMarksOut,
      },
    });
 
  } catch (err) {
    console.error("PDF evaluate error:", err);
    return NextResponse.json({ error: "Failed to process PDF. Please try again." }, { status: 500 });
  }
}
