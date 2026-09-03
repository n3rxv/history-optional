import { WHITELISTED_HISTORIAN_BOOKS } from '@/lib/prompts';
import { fixSentenceSpacing } from '@/lib/textSpacing';

/**
 * Citation auditing at sentence granularity, so answers can stream.
 *
 * Background: 9f287ee stopped /api/chat streaming on purpose. A streamed token
 * cannot be recalled, and this audit deletes historian citations it cannot
 * substantiate — showing a student a fabricated citation and removing it a
 * second later is worse than showing nothing. So the whole answer was
 * buffered, audited, then sent in one piece.
 *
 * That was the right call while the audit made an API call (a Haiku pass over
 * the finished text). 4042502 disabled that verifier a month later, and what
 * remains is pure local string matching whose rules are all scoped to a single
 * sentence. Holding the entire answer to satisfy a per-sentence check costs the
 * reader 30-60 seconds of blank screen for nothing.
 *
 * The gate below keeps the guarantee exactly — no sentence reaches the client
 * before it has been audited — while releasing each sentence as soon as it is
 * complete.
 */

/**
 * Historians the knowledge base covers only in outline. Naming one alongside a
 * specific claim is the shape a fabrication takes, so the sentence goes.
 */
const BROAD_ONLY = [
  'Jha', 'Nizami', 'Riazul Islam', 'Surendra Gopal',
  'Majumdar', 'K.A. Nizami', 'R.C. Majumdar', 'D.N. Jha',
];

const CLAIM_VERB =
  /argues|notes|writes|states|claimed|asserts|observes|emphasises|emphasizes|points out|concludes|suggests|contends|maintains/;

const BRACKET = /\([A-Z][a-zA-Z.\s]+?,\s*[^)]+?\)/;

/** Inline RAG citations: the claim is already tied to a retrieved passage. */
const SOURCE_CITATION = /Source #\d+/;

/**
 * Audits one sentence.
 *
 * Returns the sentence to emit, or null to drop it entirely.
 *
 * A sentence carrying a `Source #N` citation is passed through: it is grounded
 * in a passage that was actually retrieved. This used to be an all-or-nothing
 * decision over the whole answer — one `Source #N` anywhere disabled auditing
 * everywhere — which let unsourced claims ride along beside sourced ones.
 * Per-sentence is stricter and is the point of the change.
 */
export function auditSentence(sentence: string): string | null {
  if (SOURCE_CITATION.test(sentence)) return sentence;

  // Rule A — a broad-coverage historian carrying a specific claim.
  // The whole sentence goes: unlike a misattributed quote, there is no
  // underlying fact to preserve once the attribution is invented.
  for (const name of BROAD_ONLY) {
    if (sentence.includes(name) && (CLAIM_VERB.test(sentence) || BRACKET.test(sentence))) {
      return null;
    }
  }

  // Rule B — a whitelisted historian cited against a book that is not theirs.
  // Only the bracket is removed; the claim itself may well be true, just
  // wrongly sourced.
  let cleaned = sentence;
  for (const [historian, books] of Object.entries(WHITELISTED_HISTORIAN_BOOKS)) {
    if (!cleaned.includes(historian)) continue;
    for (const bracket of cleaned.match(/\([^)]+\)/g) ?? []) {
      if (/^\(\d{4}\)$/.test(bracket.trim())) continue;      // a bare year
      if (!/[a-zA-Z]{4,}/.test(bracket)) continue;            // not a title
      const lower = bracket.toLowerCase();
      const verified = books.some((b) => lower.includes(b.slice(0, 10).toLowerCase()));
      if (!verified) {
        cleaned = cleaned.split(bracket).join('').replace(/\s+([.,;])/g, '$1');
      }
    }
  }

  return cleaned;
}

/**
 * Abbreviations whose full stop does not end a sentence. Single letters are
 * handled separately, which covers initials and also e.g. / i.e. / B.C. / A.D.
 */
const ABBREVIATIONS = new Set([
  'etc', 'cf', 'vs', 'dr', 'mr', 'mrs', 'ms', 'prof', 'no', 'vol', 'ed', 'eds',
  'trans', 'ch', 'pp', 'fig', 'ibid', 'al', 'st', 'approx', 'circa',
]);

/**
 * Index just past the end of the first complete sentence in `text`, or -1.
 *
 * Splitting naively on [.!?] is wrong here in a way that defeats the audit:
 * this corpus is full of initials — R.C. Majumdar, D.N. Jha, K.A. Nizami —
 * so "R.C. Majumdar argues X." fragments into "R.", "C." and
 * " Majumdar argues X.". Rule A only sees the last fragment, and in a
 * streaming gate the first two would already have been emitted.
 *
 * `atEnd` allows a terminator with nothing after it, which is only known to be
 * a real boundary once the model has finished.
 */
function sentenceEnd(text: string, atEnd: boolean): number {
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '.' && text[i] !== '!' && text[i] !== '?') continue;

    // Absorb repeated terminators ("?!") and any closing quote or bracket.
    let j = i;
    while (j + 1 < text.length && '.!?'.includes(text[j + 1])) j++;
    while (j + 1 < text.length && `"'»)]`.includes(text[j + 1])) j++;

    const after = j + 1;
    const followedBySpace = after < text.length && /\s/.test(text[after]);
    // Mid-stream, only whitespace proves the sentence actually ended; more
    // text may still be coming for this one.
    if (!followedBySpace && !(atEnd && after >= text.length)) continue;

    if (text[i] === '.') {
      const before = text.slice(0, i);
      // A single letter before the stop is an initial: R. / C. / e.g. / B.C.
      // The preceding character may itself be a full stop — in "R.C." the C is
      // an initial too, and missing that splits the name in half.
      if (/(?:^|[\s(.])[A-Za-z]$/.test(before)) continue;
      const word = (before.match(/([A-Za-z]+)$/) ?? [])[1];
      if (word && ABBREVIATIONS.has(word.toLowerCase())) continue;
    }

    return after;
  }
  return -1;
}

export type SentenceGate = {
  /** Feed a token chunk. Emits every sentence that completes. */
  push: (chunk: string) => void;
  /** Call once the model is done. Emits a clean tail, drops a truncated one. */
  flush: () => void;
  /** Total characters actually emitted, for the empty-answer fallback. */
  emitted: () => number;
};

export function createSentenceGate(send: (text: string) => void): SentenceGate {
  let pending = '';
  let emittedChars = 0;

  const emit = (sentence: string) => {
    const audited = auditSentence(sentence);
    if (audited === null) return;               // Rule A dropped it
    const text = fixSentenceSpacing(audited);
    if (!text) return;
    emittedChars += text.length;
    send(text);
  };

  return {
    push(chunk: string) {
      pending += chunk;
      // Only ever release on a sentence terminator. Flushing on a newline
      // would be more responsive but unsound: "**Romila Thapar**" alone looks
      // clean, and the claim verb that would condemn it arrives later.
      for (;;) {
        const end = sentenceEnd(pending, false);
        if (end === -1) break;
        emit(pending.slice(0, end));
        pending = pending.slice(end);
      }
    },

    flush() {
      const tail = pending;
      pending = '';
      if (!tail.trim()) return;
      // No terminator means the model was cut off mid-sentence. Dropping it is
      // what 572ebba's trailing-fragment trim was for, and here it falls out of
      // the design rather than needing a heuristic.
      if (sentenceEnd(tail, true) === -1) return;
      emit(tail);
    },

    emitted: () => emittedChars,
  };
}
