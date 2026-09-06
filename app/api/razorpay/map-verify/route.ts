import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminAuth } from "@/lib/firebaseAdmin";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { claimPayment, MAP_AMOUNT_PAISE } from "@/lib/paymentClaim";

/**
 * Evaluates a map answer sheet for a completed ₹49 payment.
 *
 * This granted on a valid signature alone, so replaying the same request
 * re-ran a Claude Sonnet call over a whole PDF — real money per replay. It
 * also never checked the order belonged to the caller or that ₹49 was paid.
 *
 * The result is stored now. Previously it existed only in the HTTP response,
 * so a reader who lost it had paid for nothing and re-submitting was the only
 * recovery — which is what made the replay hole load-bearing. A replay returns
 * the stored evaluation instead of buying another one.
 */
export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let firebaseUser: { uid: string; email?: string };
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    firebaseUser = { uid: decoded.uid, email: decoded.email };
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, pdfBase64, lang } =
    await req.json().catch(() => ({}));

  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  // Proves the pair came from Razorpay; says nothing about who bought it.
  const body        = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  if (expectedSig !== razorpay_signature)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );

  const claim = await claimPayment({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    expectedUid: firebaseUser.uid,
    kind: "map",
    expectedAmountPaise: MAP_AMOUNT_PAISE,
  });

  if (!claim.ok) {
    return NextResponse.json({ error: claim.error }, { status: claim.status });
  }

  // Already paid for and already evaluated: hand back what was produced rather
  // than spending another model call on the same PDF.
  if (claim.status === "already_applied") {
    const { data: prior } = await supabase
      .from("map_evaluations")
      .select("result")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();
    if (prior?.result) return NextResponse.json(prior.result);
    // Claimed but never stored — the earlier attempt failed after claiming.
    // Fall through and evaluate, so the reader is not left with nothing.
  }

  // Every exit from here must release the claim, or a reader who paid cannot
  // retry after a failure.
  const releaseClaim = async () => {
    if (claim.status === "claimed") await claim.release();
  };

  if (!pdfBase64 || typeof pdfBase64 !== "string") {
    await releaseClaim();
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

Evaluate all 20 questions now.${lang === "hi" ? "\n\nIMPORTANT: Write descriptionFeedback and overallFeedback in Hindi (Devanagari script)." : ""}`;

  const response = await client.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 8192,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          {
            type:   "document",
            source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const raw     = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd   = cleaned.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    // The reader paid and got nothing usable; let them try again.
    await releaseClaim();
    return NextResponse.json({ error: "Evaluation failed. Please try again." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
  } catch {
    await releaseClaim();
    return NextResponse.json({ error: "Evaluation failed. Please try again." }, { status: 502 });
  }

  // Stored so it survives a closed tab, and so a replay costs nothing.
  const { error: saveErr } = await supabase.from("map_evaluations").upsert(
    {
      firebase_uid: firebaseUser.uid,
      razorpay_payment_id,
      razorpay_order_id,
      result: parsed,
    },
    { onConflict: "razorpay_payment_id" }
  );
  // A save failure is not worth withholding the result the reader paid for.
  if (saveErr) console.error("[map-verify] result save failed:", saveErr);

  return NextResponse.json(parsed);
}
