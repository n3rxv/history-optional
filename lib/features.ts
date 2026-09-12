/**
 * What free and premium actually include.
 *
 * This table was inlined in the navbar's premium modal. The pricing page needs
 * the same list, and a second copy of it is how the plan prices drifted apart
 * in the first place, so it lives here and both import it.
 *
 * The free-tier numbers are not decorative: they are the limits enforced in
 * lib/evalAccess.ts (FREE_EVAL_LIMIT) and /api/chat-usage (CHAT_FREE_LIMIT).
 * If either constant changes, change it here too.
 */

export type Feature = {
  name: string;
  /** What a signed-out or free user gets. '—' means not available. */
  free: string;
  /** What a subscriber gets. */
  premium: string;
  /** Shown on the pricing page only, where there is room for a line of prose. */
  detail?: string;
};

export const FEATURES: Feature[] = [
  { name: 'Notes (Paper I & II)',      free: '✓', premium: '✓',
    detail: 'Full syllabus notes for both papers, open to everyone.' },
  { name: 'PYQ bank',                  free: '✓', premium: '✓',
    detail: 'Every past paper, sorted by topic and by year.' },
  { name: 'Timeline & Historiography', free: '✓', premium: '✓',
    detail: 'Reference material, no account needed.' },
  { name: 'Answer evaluation',         free: '1 total', premium: 'Unlimited',
    detail: 'Written answers marked against the UPSC scheme, with a score and specific corrections.' },
  { name: 'AI Chat',                   free: '3 total', premium: 'Unlimited',
    detail: 'Ask anything on the syllabus and get an answer grounded in the source books.' },
  { name: 'Model answers',             free: '—', premium: '✓',
    detail: 'A full-marks answer for any question, to write against.' },
  { name: 'Prelims PYQ analysis',      free: '—', premium: 'Unlimited',
    detail: 'Practising the questions is open to all. The dissection is not: step-by-step solution, the elimination technique that cracks that question type, the concepts behind it, and how to smart-guess when you genuinely do not know.' },
  { name: 'Chat with Books',           free: '—', premium: '✓',
    detail: 'Put a question to the standard texts and get the passage it comes from.' },
  { name: 'Map evaluation',            free: '—', premium: '₹49 each',
    detail: 'Sold on its own, not bundled into a plan. Upload a filled map, pay ₹49, get the markings checked.' },
  { name: 'FLT / Full paper eval',     free: '—', premium: 'Unlimited',
    detail: 'A whole paper marked in one go, not one question at a time.' },
  { name: 'PDF upload & chat',         free: '—', premium: '✓',
    detail: 'Bring your own notes and question them the same way.' },
  { name: 'Brainstorm mode',           free: '—', premium: '✓',
    detail: 'Work out the structure of an answer before writing it.' },
  { name: 'Mentor mode',               free: '—', premium: '✓',
    detail: 'The TADA framework applied to your question, and a 350-word plan to write to.' },
  { name: 'Topper copies',             free: '—', premium: '✓',
    detail: 'Full scanned answer copies with the marks awarded. Included in every plan, or ₹799 on its own.' },
];

/**
 * Bought once, not as part of a subscription. Amounts mirror
 * lib/paymentClaim.ts, which is what the server verifies against.
 */
export const ONE_OFF = [
  { name: 'Topper copies',  pricePaise: 79900, inPremium: true,
    blurb: 'Full scanned answer copies with the marks awarded. Already included in every subscription — this is for buying them on their own.' },
  { name: 'Map evaluation', pricePaise:  4900, inPremium: false,
    blurb: 'Charged per map, for subscribers and non-subscribers alike. It is not part of any plan.' },
] as const;
