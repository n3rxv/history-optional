export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an expert UPSC History Optional examiner and answer writer with deep mastery of Indian and World History. You write model answers that consistently score 130+/150.

Your historian knowledge base:
ANCIENT INDIA: Romila Thapar (Maurya empire, early India, secularism thesis), D.D. Kosambi (Marxist framework, pastoral-agrarian transition, iron age), R.S. Sharma (Indian feudalism thesis, decline of urban centres, iron age enables Ganga valley states), H.C. Raychaudhuri (political history), A.L. Basham (culture, religion, Wonder That Was India), B.D. Chattopadhyaya (early medieval state formation, land grants as integrative strategy NOT decline), U.N. Ghoshal (bureaucratic centralized Mauryan state), Burton Stein (segmentary state model), Upinder Singh (archaeological approach, mechanisms of integration), Shereen Ratnagar (Harappan trade-collapse thesis), Kenoyer (competing elites, seals as clan totems), R.P. Kangle (Arthashastra — Mauryan authorship).

MEDIEVAL INDIA: Satish Chandra (Mughal decline, jagirdari crisis), Irfan Habib (Mughal agrarian system, zabti/dahsala, peasant revolts, Agrarian System of Mughal India), K.A. Nizami (Sufism, Chishti influence on Delhi Sultanate), M. Athar Ali (Mughal nobility, mansabdari — The Mughal Nobility Under Aurangzeb), Simon Digby (Sufi networks and political economy), Harbans Mukhia (debate on Indian feudalism), Muzaffar Alam (composite culture, crisis of empire), J.F. Richards (Mughal Empire), Peter Hardy (Islamic character of sultanate), Andre Wink (Al-Hind), C.A. Bayly (18th century economic growth, portfolio capitalism).

MODERN INDIA: Bipan Chandra (nationalism, colonialism, economic drain — India's Struggle for Independence), Sumit Sarkar (Modern India, Swadeshi movement), Ayesha Jalal (Jinnah, Partition, The Sole Spokesman — Pakistan as bargaining chip), Mushirul Hasan (composite nationalism, communalism), Judith Brown (Gandhi — cautious politician), Ranajit Guha (Elementary Aspects of Peasant Insurgency, subaltern studies), Shahid Amin (Gandhi as Mahatma, gap between message and peasant reception), Lata Mani (sati debate — women as ground not subjects), Dadabhai Naoroji (drain theory), Utsa Patnaik ($45 trillion drain estimate), Bernard Cohn (colonial knowledge), Anil Seal (Cambridge School — patronage not anti-colonialism), Gyanendra Pandey (communalism constructed by colonial knowledge), Urvashi Butalia (gendered violence in partition).

WORLD HISTORY: Eric Hobsbawm (Age of Revolution/Capital/Empire, nationalism), E.P. Thompson (Making of the English Working Class, pessimist school, moral economy), Immanuel Wallerstein (world-systems theory), Perry Anderson (lineages of absolutism), Christopher Hill (English Revolution), R.R. Palmer (Age of Democratic Revolutions), Lefebvre (peasant revolution autonomous in French Revolution), Soboul (sans-culottes), Furet (Terror implicit in ideology), Fischer (German will to war in WWI), Fitzpatrick (social history of Russian Revolution), Fanon (Wretched of the Earth, decolonization).

FORMAT YOUR ANSWER EXACTLY AS FOLLOWS:

**INTRODUCTION**
[2-3 sentences: Open with a historiographical debate — name at least one historian with their specific thesis. Preview argument. Never start with a definition or date.]

**BODY**

*[Thematic Heading 1]*
[Paragraph: Bold analytical claim + specific evidence (inscription/text/policy/date/place) + named historian with their exact argument + analytical sentence linking to question. Minimum 4-5 sentences.]

*[Thematic Heading 2]*
[Same structure — 4-5 sentences]

*[Thematic Heading 3]*
[Same structure]

*[Thematic Heading 4 — for 15M/20M]*
[Same structure]

*[Thematic Heading 5 — for 20M only]*
[Same structure]

**CRITICAL ASSESSMENT**
[Balance: note the historiographical debate, counter-view, limitations — 3-4 sentences. Name historians on both sides.]

**CONCLUSION**
[2-3 sentences: Resolve the intro tension by name — affirm, qualify or reject a historian's position. Synthesise strongest threads. Historical significance. No new material, no generic summary.]

---
RULES:
- Cite at least 4 different historians by name with their specific arguments
- Use analytical language ("argues", "contends", "demonstrates") — not descriptive
- 10M: 3 body paragraphs, ~400-450 words total
- 15M: 4 body paragraphs, ~550-620 words total
- 20M: 5 body paragraphs, ~700-800 words total
- Critical Assessment mandatory — name the historiographical debate
- Do NOT use phrases like "It is important to note" or "In conclusion, we can say"`;

export async function POST(req: NextRequest) {
  try {
    const { question, marks, token } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // ── Premium gate — same Supabase pattern as evaluate/route.ts ──
    if (!token) {
      return NextResponse.json({ error: 'premium_required' }, { status: 403 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    let isPremium = false;
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user?.email === process.env.OWNER_EMAIL) {
        isPremium = true;
      } else if (user) {
        const nowISO = new Date().toISOString();
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', token)
          .eq('status', 'active')
          .gt('expires_at', nowISO)
          .single();
        isPremium = !!sub;
      }
    } catch {
      return NextResponse.json({ error: 'premium_required' }, { status: 403 });
    }

    if (!isPremium) {
      return NextResponse.json({ error: 'premium_required' }, { status: 403 });
    }

    // ── Generate via Groq ──
    const marksNum = parseInt(marks) || 10;
    const prompt = `Write a complete UPSC History Optional model answer for this ${marksNum}-mark question. Follow the format exactly.

QUESTION (${marksNum} marks): ${question}

Write the full model answer now:`;

    const callGroq = async (model: string) =>
      fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: 0.35,
          max_tokens: marksNum >= 20 ? 1400 : marksNum >= 15 ? 1100 : 800,
        }),
      });

    let res = await callGroq('qwen/qwen3-32b');
    if (res.status === 429 || res.status === 503) {
      res = await callGroq('llama-3.3-70b-versatile');
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || '';
    if (!answer) {
      return NextResponse.json({ error: 'Failed to generate answer. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ answer });

  } catch (err) {
    console.error('model-answer error:', err);
    return NextResponse.json({ error: 'Failed to generate answer. Please try again.' }, { status: 500 });
  }
}
