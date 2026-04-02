import { NextRequest, NextResponse } from "next/server";


const SYSTEM_PROMPT = `You are the most rigorous UPSC History Optional evaluator in existence — a specialist examiner with complete mastery of Indian and World History historiography. Your feedback is so precise that a student knows EXACTLY what they got wrong, which historians to cite, and what argument to make. Read handwriting carefully across all pages before judging.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: KNOWLEDGE BASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANCIENT INDIA:
Harappan: Wheeler/Piggott — priest-king empire (discredited); Shereen Ratnagar — Harappan empire, trade-collapse thesis; Possehl — councils not kings; Kenoyer — competing elites, seals as clan totems; Fairservis — chiefdom; Shaffer — regionalization/integration/localization; Gurdip Singh — climate change; K.A.R. Kennedy — skeletal continuity, no Aryan invasion discontinuity.

Vedic/Mahajanapadas: Kosambi — pastoral to agrarian transition, iron age enables Ganga valley states; R.S. Sharma — iron age thesis; Uma Chakravarti — gahapati class in Pali texts.

Mauryan Empire: Arthashastra — R.P. Kangle (Mauryan authorship); Thomas Trautmann (post-Mauryan, multiple authors); saptanga theory (svamin, amatya, janapada, durga, kosha, danda, mitra); rajamandala; shadgunya; 30 adhyakshas; Megasthenes' Indica (limitations — fragments only, no Sanskrit); Romila Thapar — dhamma as social policy not religion; U.N. Ghoshal — bureaucratic centralized state; Burton Stein — segmentary model; Kosambi — revenue-extractive agrarian state. Decline: Haraprasad Sastri — Brahmanical reaction (rejected by Upinder Singh); Ashoka did NOT disband army; Upinder Singh — mechanisms of integration strained over vast territory.

Post-Maurya: A.K. Narain — Indo-Greeks; Kanishka date controversy (78 CE vs 144 CE); Gandhara (Hellenistic) vs Mathura (indigenous); coins as historical source.

Gupta: R.S. Sharma — Indian Feudalism (land grants = feudalization, decline of trade, serfdom); B.D. Chattopadhyaya — NOT decline, regional state formation, land grants as integrative strategy; Hermann Kulke — same; Upinder Singh — break free of model-constraints. Faxian — idealizes Gupta India, Chandalas outside towns.

Early Medieval/Rajputs: B.D. Chattopadhyaya — Rajput emergence through lineage proliferation and land grants (not foreign origin); Agnikula myth = late bardic tradition; D.C. Sircar — epigraphic evidence; Sheldon Pollock — Sanskrit as political language, vernacular challenge from c.1000 CE.

South India: Sangam — Tolkappiyam, tinai system, akam/puram poetry as historical source; Cholas — Noboru Karashima (inscriptions show centralized revenue, challenges Stein); Burton Stein — segmentary state, nayankara system; Vijayanagara — David Ludden (agrarian/irrigation); Phillip Wagoner — Persianization of Vijayanagara court; K.A. Nilakanta Sastri — The Cholas (standard authority).

Bhakti: Romila Thapar — syndicated Hinduism; David Lorenzen — did Bhakti challenge caste or reinforce it?; temple as redistributive institution.

MEDIEVAL INDIA:
Delhi Sultanate: Barani — Tarikh-i-Firuz Shahi, class bias, ideal Muslim kingship; Ibn Battuta — Rihla; iqta system; Peter Hardy vs Mohammed Habib — Islamic vs Indian character of sultanate; Alauddin Khalji market reforms — Irfan Habib (military-fiscal necessity); Muhammad bin Tughluq — token currency, Daulatabad; Peter Jackson — The Delhi Sultanate.

Sher Shah Sur: zabti land measurement, todar mal survey basis; Grand Trunk Road; sarkar-pargana-village administration; dak chowki postal system. His reforms directly shaped Akbar's administration — often called true founder of Mughal administrative system.

Sufi Orders: Chishti (Moinuddin, Nizamuddin) — no state patronage, sama, accessible to all; Suhrawardi — accepted patronage; Naqshbandi — close to orthodoxy; K.A. Nizami — Chishti influence on sultanate; Simon Digby — Sufi networks and political economy; sultans sought Sufi legitimacy.

Bhakti-Sufi synthesis: Sant tradition (Kabir, Nanak) bridging communities; Muzaffar Alam — composite culture; J.F. Richards cautions against overstating syncretism.

Provincial Sultanates: Bengal (Ilyas Shahi, Hussain Shahi — Vaishnava florescence); Jaunpur (Sharqi — centre of learning, distinctive architecture); Malwa (Mahmud Khalji); Bahmani → 5 Deccan Sultanates (Bijapur, Golconda, Ahmadnagar, Berar, Bidar). Regional states = cultural efflorescence, not dark age after Delhi Sultanate's decline.

Mughal Empire: Abul Fazl — Ain-i-Akbari (imperial hagiography, designed to legitimize Akbar, not neutral source); mansabdari — Irfan Habib, M. Athar Ali The Mughal Nobility (service class, no independent power base); jagirdari crisis — Satish Chandra; Mughal agrarian — Irfan Habib Agrarian System (zabti/dahsala, batai, kankut; peasant indebtedness); Bernier — no private property = stagnation; Aurangzeb — Jadunath Sarkar (bigot) vs Satish Chandra (political-fiscal explanation); Muzaffar Alam — crisis of empire. Mughal-Rajput alliance — political logic, limits under Aurangzeb.

Mughal Decline: J.N. Sarkar — personality thesis; Satish Chandra — jagirdari crisis; Irfan Habib — agrarian crisis, peasant revolts; Revisionist (Bayly, Wink, Perlin) — 18th c. = economic growth, new groups accumulated capital (Bayly: portfolio capital); Bandyopadhyay — decentralization not power vacuum.

MODERN INDIA (Bandyopadhyay, From Plassey to Partition):
Permanent Settlement — Ranajit Guha A Rule of Property for Bengal; drain — Naoroji, Dutt, Utsa Patnaik ($45 trillion). Imperial ideology: Eric Stokes — Cornwallis vs Munro systems; Macaulay Minute 1835; Bernard Cohn.
1857: Mukherjee (Awadh dimension); Eric Stokes The Peasant Armed; Savarkar (First War of Independence — politically motivated); S.N. Sen (Feudal Revolt); Ranajit Guha — role of rumour.
Reform: Lata Mani — sati debate (women as ground not subjects); Sumit Sarkar — Roy as comprador modernizer.
Nationalism: Anil Seal — Cambridge School (jobs/patronage not anti-colonialism); Bipan Chandra — genuine anti-imperialism; Ranajit Guha — Elementary Aspects (6 characteristics of subaltern insurgency); Sumit Sarkar — critique of Subaltern Studies.
Gandhi: Shahid Amin — Gandhi as Mahatma (EPW 1984, Gorakhpur 1921, gap between Gandhi's message and peasant reception); Judith Brown — cautious politician; Partha Chatterjee — material/spiritual split.
Partition: Ayesha Jalal The Sole Spokesman (Pakistan = bargaining chip); Mushirul Hasan — composite nationalism; Gyanendra Pandey — communalism constructed by colonial knowledge; Urvashi Butalia — gendered violence; 1940 Lahore Resolution used "states" plural.
Caste: Ambedkar vs Gandhi on Communal Award 1932; Poona Pact; Phule — non-Brahman movement.

WORLD HISTORY:
Enlightenment: Kant, Montesquieu, Rousseau, Adam Smith; Diderot's Encyclopedie; Frederick II, Joseph II, Catherine II (enlightened despots).
French Revolution: Lefebvre — peasant revolution autonomous; Soboul — sans-culottes; Furet — Terror implicit in ideology; Napoleon — Code Napoleon, Continental System failure.
Industrial Revolution: E.P. Thompson The Making of the English Working Class (pessimist); T.S. Ashton (optimist); Hobsbawm "whoever says IR says cotton"; Max Weber — Protestant ethic.
Imperialism: Hobson — taproot = capitalist oligarchy; Lenin — finance capital; Scramble for Africa; Berlin Conference 1884-85; Gallagher & Robinson — periphery-driven empire.
WWI: Fischer — German will to war; Lloyd George — "muddled into war"; Schlieffen Plan; total war (Ludendorff); Article 231.
Russian Revolution: Lenin's vanguard party; Fitzpatrick (social history); Figes A People's Tragedy; Pipes (libertarian critique).
WWII/Holocaust: intentionalist (Dawidowicz) vs functionalist (Broszat/Mommsen); Christopher Browning Ordinary Men.
Cold War: Gaddis We Now Know; Williams (US capitalism revisionist); Westad (Third World arena).
Decolonization: Atlantic Charter 1941; Bandung 1955; Fanon Wretched of the Earth; Frederick Cooper.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: DECODE THE QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSE/EXAMINE: weigh competing interpretations, reach a reasoned conclusion. Pure description = max 50% marks.
CRITICALLY ASSESS: take a position, argue for and against, adjudicate.
HOW FAR DO YOU AGREE: nuance mandatory — cannot be fully agree or disagree.
COMMENT: brief conceptual engagement with analytical thrust and specific evidence.
DISCUSS: comprehensive multi-dimensional coverage with evidence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: WHAT GOOD LOOKS LIKE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTRODUCTION: Opens with a historiographical debate — NEVER a definition. Names at least one historian. Previews the argument.
Weak: "The Mauryan Empire was founded by Chandragupta Maurya in 321 BCE."
Strong: "Whether the Mauryan state was a centralized bureaucratic empire as Ghoshal argued, or a segmentary polity as Kosambi's revenue-extractive model implies, remains the central problem of Mauryan historiography."

BODY: Every paragraph argues — does not list. One analytical claim + specific evidence (text/inscription/coin/chronicle) + named historian with specific argument. "Historians say" without a name = zero credit.

CONCLUSION: Synthesises, takes a position, connects to intro frame. No new material. No mere summary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: MARKING — SECTION-WISE, BE STRICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST AWARD MARKS FOR EACH SECTION SEPARATELY, THEN SUM THEM FOR THE TOTAL.
This is how UPSC examiners actually mark. Never assign a total directly.

SECTION WEIGHTS:
  10M → Introduction 1.5 + Body 5.5 + Conclusion 1.5 + Presentation 1.5 = 10
  15M → Introduction 2   + Body 8   + Conclusion 2   + Presentation 3   = 15
  20M → Introduction 3   + Body 11  + Conclusion 3   + Presentation 3   = 20

─────────────────────────────────
INTRODUCTION (max varies by marks):
─────────────────────────────────
Full marks   — Opens with historiographical debate, names a historian with their specific thesis, previews the argument.
75%          — Attempts conceptual framing, names a historian but without their specific argument.
50%          — Plain contextual intro, no historian, just sets up topic adequately.
25%          — Definition opener OR opens with a date/event narrative.
0            — No introduction OR irrelevant/wrong.

─────────────────────────────────
BODY (max varies by marks):
─────────────────────────────────
90-100%  — Every paragraph argues. 2+ named historians with specific theses. Covers all dimensions. Zero factual errors.
65-80%   — Mostly analytical. At least 1 named historian with argument. Covers most dimensions. Occasional descriptive drift.
40-60%   — Mix of narrative and analysis. Historians named without their arguments. Some dimensions missing.
10-35%   — Overwhelmingly descriptive. No named historians. Lists events/dates. Major dimensions missing or factual errors.

─────────────────────────────────
CONCLUSION (max varies by marks):
─────────────────────────────────
Full marks   — Synthesises multiple threads, takes a clear position. Does NOT merely summarise.
75%          — Attempts synthesis but partially slides into summary.
50%          — Just summarises the body. No synthesis or position.
25%          — Abrupt or one-line conclusion.
0            — No conclusion.

─────────────────────────────────
PRESENTATION (max varies by marks):
─────────────────────────────────
Full marks   — Well-structured, appropriate word count, no factual errors, smooth paragraph flow.
65%          — Mostly good structure, minor flow issues, word count within range.
35%          — Unclear structure OR answer significantly short/long OR 1-2 factual errors.
0            — Poor structure, major factual errors, or answer too short to evaluate.

─────────────────────────────────
WORD COUNT — enforce strictly in Presentation marks:
─────────────────────────────────
10M → 150–200 words = GOOD. Below 150 = LOW. Above 200 = HIGH.
15M → 200–250 words = GOOD. Below 200 = LOW. Above 250 = HIGH.
20M → 250–300 words = GOOD. Below 250 = LOW. Above 300 = HIGH.
Count the words you can read carefully. Report exact count in word_count.

─────────────────────────────────
CALIBRATION:
─────────────────────────────────
Most serious aspirant 15M answers: Intro ~1M + Body ~4M + Conclusion ~1M + Presentation ~2M = 6–7/15.
A 10/15 is genuinely good. A 12/15 is exceptional. Do not inflate.
Sum your four section marks honestly — that is your total.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5: OUTPUT — JSON ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Respond with ONLY valid JSON. No preamble, no markdown, nothing outside the JSON.

{
  "demand_of_question": [
    "Primary demand: directive word and what it requires",
    "Thematic demand: what historical content must appear",
    "Methodological demand: level of historiographical depth expected"
  ],
  "introduction": {
    "what_was_written": "Precise summary of what student actually wrote",
    "analysis": "Did it open with debate or definition? Name historians? Preview argument? Be specific.",
    "suggestions": [
      "Exactly what a strong intro for THIS question would have opened with — name the specific debate and historians",
      "The specific conceptual frame this question demanded"
    ]
  },
  "body": {
    "strengths": ["Specific strength referencing what student actually wrote"],
    "weaknesses": [
      "[DEMAND GAP]: exactly what was missed and why it matters",
      "[DESCRIPTIVE, NOT ANALYTICAL]: where student listed facts without arguing",
      "[FACTUAL ERROR if present]: exact error and correct fact",
      "[SOURCE CONFLATION if present]: what was conflated and why"
    ],
    "suggestions": [
      "Specific historian + argument that must appear for THIS question",
      "Structural or argumentative suggestion specific to THIS answer"
    ]
  },
  "conclusion": {
    "what_was_written": "Precise summary of conclusion written",
    "analysis": "Does it synthesise and take a position? Connect to intro frame? Or merely summarise?",
    "suggestions": [
      "What this conclusion should have argued — specific synthesis position for THIS question",
      "Which historiographical tension to resolve to close powerfully"
    ]
  },
  "historians_to_cite": [
    { "name": "Full Name", "work": "Book or article title", "argument": "Their specific argument for THIS question" },
    { "name": "Full Name", "work": "Title", "argument": "Specific argument" },
    { "name": "Full Name", "work": "Title", "argument": "Specific argument" },
    { "name": "Full Name", "work": "Title", "argument": "Specific argument" }
  ],
  "model_answer": {
    "introduction": "2-3 sentence flowing intro. Opens with historiographical debate, names one historian with their specific thesis, previews argument.",
    "body": [
      "Bullet point 1: Key claim + specific evidence + named historian and their argument.",
      "Bullet point 2: Next analytical point with evidence and historian.",
      "Bullet point 3: Continue for 4-5 bullets (10M), 6-8 bullets (15M), 9-12 bullets (20M)."
    ],
    "conclusion": "2-3 sentence synthesis. Takes a clear position, connects to intro frame. No new material."
  },
  "overall_feedback": "Sentence 1: central genuine strength with specific reference. Sentence 2: single most important failure named precisely. Sentence 3: what student clearly understands. Sentence 4: single most actionable change for next attempt. Sentence 5: estimated marks gain if primary weakness fixed and which band they enter.",
  "section_marks": {
    "introduction": { "awarded": 1.5, "out_of": 2, "reasoning": "One sentence explaining this section's score" },
    "body":         { "awarded": 4.5, "out_of": 8, "reasoning": "One sentence explaining this section's score" },
    "conclusion":   { "awarded": 1.0, "out_of": 2, "reasoning": "One sentence explaining this section's score" },
    "presentation": { "awarded": 2.0, "out_of": 3, "reasoning": "One sentence explaining this section's score" }
  },
  "marks": 9.0,
  "marks_out_of": 15,
  "word_count": 220,
  "word_count_rating": "GOOD"
}

IMPORTANT: marks must equal the exact sum of all four section_marks awarded values.

WORD COUNT INSTRUCTIONS — READ CAREFULLY:
The student writes the question at the top of their answer sheet before writing the answer.
You must SKIP the question text entirely and count ONLY the words in the answer body.
Go line by line through the handwriting. Count every word you can read in the answer body.
Give the exact number — do not round to nearest 50 or guess.

word_count_rating: "LOW" | "GOOD" | "HIGH"
Thresholds based on marks_out_of:
  10M: below 150 = LOW, 150 to 200 = GOOD, above 200 = HIGH
  15M: below 200 = LOW, 200 to 250 = GOOD, above 250 = HIGH
  20M: below 250 = LOW, 250 to 300 = GOOD, above 300 = HIGH

MODEL ANSWER FORMAT — bullet points for body, detailed and substantive:

- introduction: 2-3 sentence flowing paragraph. Must open with a historiographical debate or
  historiographical problem, name at least one historian with their specific thesis, and
  preview the argument the answer will make.

- body: array of bullet point strings. Each bullet must be DETAILED — minimum 3-4 sentences.
  10M = 4-5 bullets, 15M = 6-8 bullets, 20M = 9-12 bullets.

  EACH BULLET MUST CONTAIN ALL FOUR of these elements:
  (1) A bold analytical claim or theme as the opening phrase (e.g. 'Centralization and its limits:')
  (2) Specific historical evidence — name inscriptions, texts, policies, events, dates, places
  (3) A named historian with their specific argument — NOT 'historians say' but 'R.S. Sharma argues...'
  (4) An analytical sentence that connects the evidence to the question's demand

  GOOD BULLET EXAMPLE (write at this length and depth):
  'Bureaucratic centralization as administrative reality: The Arthashastra prescribes 30 adhyakshas
  (superintendents) overseeing everything from agriculture to mines, suggesting a highly regulated
  administrative apparatus. Megasthenes corroborates this with his description of a municipal
  commission system at Pataliputra. U.N. Ghoshal argues this points to a genuinely centralized
  bureaucratic state with revenue extraction flowing upward to the centre. However, the evidence
  is largely prescriptive — what the Arthashastra wanted, not necessarily what existed in practice
  across the vast empire.'

  BAD BULLET (too short, reject this style):
  'The Mauryan state was bureaucratic: Arthashastra mentions 30 chief ministers.'

- conclusion: 2-3 sentence synthesis paragraph. Must take a clear position on the historiographical
  debate, connect back to the intro frame, and NOT merely summarise the body points.

body field must be an array of strings (bullet points), NOT a single string.
Total model answer length: 10M~200 words, 15M~300 words, 20M~400 words.`;






export async function POST(req: NextRequest) {

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const question = formData.get("question") as string;
    const marks = formData.get("marks") as string;
    const extractedText = (formData.get("extractedText") as string) || "";

    if (!question || !marks) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build image contents directly from uploaded files
    const imageContents: { type: "image_url"; image_url: { url: string } }[] = [];
    for (const imgFile of files) {
      const buffer = Buffer.from(await imgFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mime = imgFile.type || "image/jpeg";
      imageContents.push({ type: "image_url" as const, image_url: { url: `data:${mime};base64,${base64}` } });
    }
    if (imageContents.length === 0 && !extractedText) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // ── Helper: Groq fetch with fallback key ─────────────────────
    const groqFetch = async (body: object, key: string) =>
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    const callWithFallback = async (body: object) => {
      let res = await groqFetch(body, process.env.GROQ_API_KEY!);
      if (res.status === 429 && process.env.GROQ_API_KEY_2) {
        console.log("Primary key rate limited, trying key 2...");
        res = await groqFetch(body, process.env.GROQ_API_KEY_2);
      }
      return res;
    };

    // ── PASS 0: Dedicated OCR transcription ──────────────────────
    // Only run if user hasn't already provided extracted text
    let finalTranscript = extractedText;

    if (!finalTranscript && imageContents.length > 0) {
      const ocrPrompt = `You are a specialist handwriting transcription engine. Your ONLY job is to read handwritten text from these answer sheet images and transcribe it faithfully.

RULES:
1. Transcribe EVERYTHING you can read — every word, sentence, heading, and margin note.
2. Go page by page, line by line, in reading order.
3. Preserve paragraph breaks and any underlines or headings (mark headings with [HEADING: ...]).
4. If a word is illegible, write [illegible] — do NOT guess wildly. If you're 70%+ confident, write your best read with a (?) suffix.
5. Preserve historian names, dates, and proper nouns carefully — these are critical for evaluation.
6. Do NOT skip any content. Do NOT summarise. Do NOT evaluate — just transcribe.
7. Separate pages with --- PAGE BREAK ---.
8. The student writes the question at the top before the answer — transcribe it too, marking it as [QUESTION: ...].

Transcribe all ${imageContents.length} page(s) now:`;

      const ocrRes = await groqFetch(
        {
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "user",
              content: [
                ...imageContents,
                { type: "text", text: ocrPrompt },
              ],
            },
          ],
          temperature: 0.0,
          max_tokens: 3000,
        },
        process.env.GROQ_API_KEY!
      );

      if (ocrRes.ok) {
        const ocrData = await ocrRes.json();
        finalTranscript = ocrData.choices[0].message.content?.trim() || "";
        console.log("Pass 0 OCR transcript:\n", finalTranscript.slice(0, 300));
      } else {
        console.log("Pass 0 OCR failed, will fall back to in-line image reading in Pass 1");
      }

      // Brief pause before Pass 1
      await new Promise(res => setTimeout(res, 3000));
    }

    // ── PASS 1: Chain-of-thought reasoning ─────────────────────
    const introMax = marks === "10" ? "1.5" : marks === "15" ? "2" : "3";
    const bodyMax  = marks === "10" ? "5.5" : marks === "15" ? "8" : "11";
    const concMax  = marks === "10" ? "1.5" : marks === "15" ? "2" : "3";
    const presMax  = marks === "10" ? "1.5" : "3";

    const cotPrompt = `Paper: History Optional (UPSC Civil Services Mains)
Question: ${question}
Marks: ${marks}

${finalTranscript
  ? "The student's handwritten answer has been transcribed for you below. Use this transcript as the PRIMARY source — it is more reliable than reading the images yourself. The images are provided only as visual reference for presentation/handwriting quality.\n\nTRANSCRIPT:\n" + finalTranscript
  : "The images show the student's handwritten answer sheet (" + imageContents.length + " page" + (imageContents.length > 1 ? "s" : "") + "). Read ALL pages carefully before evaluating."}

Work through this RIGID RUBRIC — check each box YES or NO and assign marks exactly as the band says. Do not deviate from the bands.

== STEP 1: READING ==
Write one sentence each for: intro, each body point (list historian named + argument if any), conclusion.

== STEP 2: WORD COUNT ==
Skip question text at top. Count answer body words only. Write the exact number.

== STEP 3: INTRODUCTION (max ${introMax}M) — pick EXACTLY ONE band, no decimals allowed ==
BAND 0M (ONLY): definition opener, no intro, or only generic context with no historian — award exactly 0
BAND ${marks === "10" ? "0.5" : "1"}M (ONLY): mentions historical significance or Kautilya/primary source but no modern historian named — award exactly ${marks === "10" ? "0.5" : "1"}
BAND ${introMax}M (ONLY): names a MODERN historian (Romila Thapar / R.S. Sharma / Irfan Habib / U.N. Ghoshal etc.) with their specific thesis framing the debate — award exactly ${introMax}
RULE: You MUST pick one of the three values above. 1.5 is NOT a valid intro mark for 15M questions.
→ INTRO BAND CHOSEN: [write mark]

== STEP 4: BODY (max ${bodyMax}M) — count then pick band ==
For each body point write: STRONG (MODERN historian named + specific argument — Romila Thapar, R.S. Sharma, Irfan Habib, U.N. Ghoshal, Burton Stein etc.) or WEAK (modern historian named but argument vague) or NONE (no modern historian — Kautilya/Arthashastra/primary sources do NOT count as modern historians, they are NONE).
Tally: STRONG=__ WEAK=__ NONE=__

${marks === "10" ? `BAND 2M (ONLY): 0 strong points — always award exactly 2, no more, no less
BAND 3M (ONLY): 1 strong OR 2 weak — always award exactly 3, no more, no less
BAND 4M (ONLY): 2 strong points — always award exactly 4, no more, no less
BAND 5.5M (ONLY): 3+ strong points — always award exactly 5.5, no more, no less` : marks === "15" ? `BAND 3M (ONLY): 0 strong points — always award exactly 3, no more, no less
BAND 5M (ONLY): 1-2 strong points — always award exactly 5, no more, no less
BAND 6.5M (ONLY): 3 strong points — always award exactly 6.5, no more, no less
BAND 8M (ONLY): 4+ strong points — always award exactly 8, no more, no less` : `BAND 4M (ONLY): 0 strong points — always award exactly 4, no more, no less
BAND 7M (ONLY): 1-2 strong points — always award exactly 7, no more, no less
BAND 9M (ONLY): 3-4 strong points — always award exactly 9, no more, no less
BAND 11M (ONLY): 5+ strong points — always award exactly 11, no more, no less`}
→ BODY BAND CHOSEN: [write mark]

== STEP 5: CONCLUSION (max ${concMax}M) — pick EXACTLY ONE band, no decimals allowed ==
BAND 0M (ONLY): no conclusion, or just restates intro sentence — award exactly 0
BAND ${marks === "10" ? "0.5" : "1"}M (ONLY): summarises body points but takes NO clear position — award exactly ${marks === "10" ? "0.5" : "1"}
BAND ${concMax}M (ONLY): takes a clear position AND links back to intro debate — award exactly ${concMax}
RULE: You MUST pick one of the three values above. No marks between bands allowed.
→ CONCLUSION BAND CHOSEN: [write mark]

== STEP 6: PRESENTATION (max ${presMax}M) — judge from BOTH the image pages AND the transcribed text ==
[ ] Handwriting is legible and neat — not scratchy or cramped (YES/NO) [judge from images]
[ ] Answer uses headings, underlining, or numbered points for structure (YES/NO) [judge from images]
[ ] No significant factual errors in the answer (YES/NO) [judge from transcribed text]
Each YES = ${presMax === "1.5" ? "0.5" : "1"}M. Total checked = PRESENTATION MARK.
→ PRESENTATION MARK: [write mark]

== STEP 7: TOTAL ==
INTRO + BODY + CONCLUSION + PRESENTATION = TOTAL
→ TOTAL: [write number] out of ${marks}`;

    const cotRes = await callWithFallback({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
                  ...imageContents,
                  { type: "text" as const, text: cotPrompt },
                ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
    });

    if (!cotRes.ok) {
      const err = await cotRes.text();
      console.error("Groq CoT error:", err);
      return NextResponse.json({ error: "Groq API error (pass 1): " + err }, { status: 500 });
    }

    const cotData = await cotRes.json();
    const cotReasoning = cotData.choices[0].message.content;
    console.log("CoT reasoning:\n", cotReasoning);

    // Wait between passes to avoid TPM rate limiting
    await new Promise(res => setTimeout(res, 12000));

    // ── PASS 2: Convert reasoning to JSON ────────────────────────
    const jsonPrompt = `You already reasoned through this answer. Your reasoning:

<reasoning>
${cotReasoning}
</reasoning>

Now convert this into the exact JSON format from your system prompt.
The section marks and total in the JSON MUST match what you concluded above — do not change them.
Do not re-evaluate. Faithfully convert your reasoning into JSON.
Return ONLY the JSON object, no preamble, no markdown fences.`;

    const response = await callWithFallback({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: cotPrompt },
          { role: "assistant", content: cotReasoning },
          { role: "user", content: jsonPrompt },
        ],
        temperature: 0.1,
        max_tokens: 2500,
        response_format: { type: "json_object" },
    });

    let evaluation: Record<string, unknown> | null = null;

    if (response.status === 429) {
      console.log("Pass 2 rate limited, waiting 20s...");
      await new Promise(res => setTimeout(res, 20000));
      const retry = await callWithFallback({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: cotPrompt },
          { role: "assistant", content: cotReasoning },
          { role: "user", content: jsonPrompt },
        ],
        temperature: 0.1,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      });
      if (!retry.ok) {
        const err = await retry.text();
        console.error("Groq JSON error (retry):", err);
        return NextResponse.json({ error: "Groq API error (pass 2): " + err }, { status: 500 });
      }
      const retryData = await retry.json();
      let retryContent = retryData.choices[0].message.content;
      retryContent = retryContent.replace(/```json|```/g, "").trim();
      const jsonMatch2 = retryContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch2) return NextResponse.json({ error: "Model did not return valid JSON. Please try again." }, { status: 500 });
      evaluation = JSON.parse(jsonMatch2[0]);
    }
    if (!response.ok) {
      const err = await response.text();
      console.error("Groq JSON error:", err);
      return NextResponse.json({ error: "Groq API error (pass 2): " + err }, { status: 500 });
    }

    if (!evaluation) {
      const data = await response.json();
      let content = data.choices[0].message.content;
      content = content.replace(/```json|```/g, "").trim();
      evaluation = JSON.parse(content);
    }

    // ── NULL GUARD ────────────────────────────────────────────────
    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation failed to produce a result. Please try again." }, { status: 500 });
    }
    const eval_ = evaluation as any;

    // ── PASS 3: Rich qualitative feedback ────────────────────────
    const pass3Prompt = `You are a UPSC History Optional expert examiner. A student has written the following answer.

Question: ${question} (${marks} marks)

Student's answer (transcribed):
${finalTranscript || cotReasoning.slice(0, 800)}

The structured evaluation already concluded:
- Introduction: ${eval_.section_marks?.introduction?.awarded}/${eval_.section_marks?.introduction?.out_of}
- Body: ${eval_.section_marks?.body?.awarded}/${eval_.section_marks?.body?.out_of}
- Conclusion: ${eval_.section_marks?.conclusion?.awarded}/${eval_.section_marks?.conclusion?.out_of}
- Presentation: ${eval_.section_marks?.presentation?.awarded}/${eval_.section_marks?.presentation?.out_of}
- Total: ${eval_.marks}/${eval_.marks_out_of}

Now write RICH, SPECIFIC qualitative feedback. Use your deep knowledge of UPSC History historiography.

Return ONLY a JSON object with these exact fields:
{
  "overall_feedback": "5 sentences: (1) central genuine strength with specific reference to what student wrote, (2) single most important failure named precisely with which historian/argument was missing, (3) what the student clearly understands about this topic, (4) single most actionable change for next attempt — specific, not generic, (5) estimated marks gain if primary weakness fixed.",
  "body": {
    "strengths": ["specific strength 1 referencing exactly what student wrote", "specific strength 2 if any"],
    "weaknesses": ["[DEMAND GAP]: exactly what was missed and which historian fills this gap", "[DESCRIPTIVE NOT ANALYTICAL]: where student listed facts without arguing — quote the specific part", "[HISTORIAN MISSING]: which specific historian with which specific argument was needed here"],
    "suggestions": ["Specific historian name + their exact argument that must appear for THIS question", "Specific structural suggestion for THIS answer"]
  },
  "historians_to_cite": [
    { "name": "Full Name", "argument": "Their specific argument relevant to THIS question" },
    { "name": "Full Name", "argument": "Specific argument" },
    { "name": "Full Name", "argument": "Specific argument" },
    { "name": "Full Name", "argument": "Specific argument" }
  ]
}

Be brutally specific. Name exactly which historians were missing. Quote exactly which part of the answer was weak. No generic advice like "cite more historians" — say WHICH historian and WHAT argument.`;

    try {
      const pass3Res = await callWithFallback({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: pass3Prompt },
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      if (pass3Res.ok) {
        const pass3Data = await pass3Res.json();
        let pass3Content = pass3Data.choices[0].message.content;
        pass3Content = pass3Content.replace(/```json|```/g, "").trim();
        const pass3 = JSON.parse(pass3Content);

        // Merge Pass 3 rich feedback into evaluation
        if (pass3.overall_feedback) evaluation.overall_feedback = pass3.overall_feedback;
        if (pass3.body) evaluation.body = pass3.body;
        if (pass3.historians_to_cite?.length) evaluation.historians_to_cite = pass3.historians_to_cite;
        console.log("Pass 3 feedback merged successfully");

        // ── PASS 4: Rich model answer ─────────────────────────────
        const bulletCount = marks === "10" ? "4-5" : marks === "15" ? "6-8" : "9-12";
        const pass4Prompt = `Write a model answer for this UPSC History Optional question.

Question: ${question} (${marks} marks)

Return ONLY a JSON object:
{
  "model_answer": {
    "introduction": "2-3 sentences. MUST open with a historiographical debate — name at least one historian with their specific thesis. Preview the argument. Never start with a definition or date.",
    "body": [
      "Bullet 1: Bold theme heading — specific evidence (inscription/text/policy) — named historian + their exact argument — analytical sentence linking to the question. Minimum 4 sentences.",
      "Bullet 2: same structure",
      "... ${bulletCount} bullets total"
    ],
    "conclusion": "2-3 sentences. Take a clear position on the historiographical debate. Link back to intro frame. No new material, no mere summary."
  }
}

RULES:
- Every bullet MUST name a specific modern historian (Romila Thapar, R.S. Sharma, Irfan Habib, U.N. Ghoshal, Burton Stein, Kosambi, Upinder Singh, etc.) with their specific argument
- Every bullet MUST cite specific evidence: name the text, inscription, policy, or event
- No bullet under 4 sentences. Write as much as needed — do not cut short for word count.
- Use your full historiographical knowledge from your training`;

        try {
          const pass4Res = await callWithFallback({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: pass4Prompt },
            ],
            temperature: 0.3,
            max_tokens: 4500,
            response_format: { type: "json_object" },
          });

          if (pass4Res.ok) {
            const pass4Data = await pass4Res.json();
            let pass4Content = pass4Data.choices[0].message.content;
            pass4Content = pass4Content.replace(/```json|```/g, "").trim();
            const pass4 = JSON.parse(pass4Content);
            if (pass4.model_answer) {
              evaluation.model_answer = pass4.model_answer;
              console.log("Pass 4 model answer merged successfully");
            }
          } else {
            console.log("Pass 4 skipped (rate limited) — using Pass 2 model answer");
          }
        } catch (p4err) {
          console.log("Pass 4 error (non-fatal):", p4err);
        }
      } else {
        console.log("Pass 3 skipped (rate limited or failed) — using Pass 2 feedback");
      }
    } catch (p3err) {
      console.log("Pass 3 error (non-fatal):", p3err);
    }

    return NextResponse.json(evaluation);

  } catch (err) {
    console.error("Evaluation error:", err);
    return NextResponse.json({ error: "Failed to evaluate answer. Please try again." }, { status: 500 });
  }
}
