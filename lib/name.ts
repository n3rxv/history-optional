/**
 * Name normalisation for the profile modal.
 *
 * Deliberately permissive. Names carry apostrophes, hyphens, spaces, accents
 * and scripts other than Latin, and a validator that assumes otherwise
 * rejects real people. Behind a mandatory gate that means someone cannot use
 * the site because of the name they were given, so the only inputs rejected
 * here are the ones that carry no name at all.
 */

const MAX_LEN = 60;

/** Zero-width and bidirectional marks: invisible, and a paste-in nuisance. */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;

/** Control characters, including the newlines a paste can bring along. */
const CONTROL = /[\u0000-\u001F\u007F]/g;

export type NameResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

function clean(raw: string): string {
  return raw
    .replace(INVISIBLE, '')
    .replace(CONTROL, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Something has to be a letter. Digits and punctuation alone are not a name. */
function hasLetter(s: string): boolean {
  return /\p{L}/u.test(s);
}

export function normalizeFirstName(raw: unknown): NameResult {
  if (typeof raw !== 'string') return { ok: false, error: 'Please enter your first name.' };
  const name = clean(raw);
  if (!name) return { ok: false, error: 'Please enter your first name.' };
  if (name.length > MAX_LEN) return { ok: false, error: `First name must be under ${MAX_LEN} characters.` };
  if (!hasLetter(name)) return { ok: false, error: 'Please enter your first name.' };
  return { ok: true, name };
}

/** Optional: absent and blank are both fine, and both store as null. */
export function normalizeLastName(
  raw: unknown
): { ok: true; name: string | null } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, name: null };
  if (typeof raw !== 'string') return { ok: false, error: 'That last name is not valid.' };
  const name = clean(raw);
  if (!name) return { ok: true, name: null };
  if (name.length > MAX_LEN) return { ok: false, error: `Last name must be under ${MAX_LEN} characters.` };
  if (!hasLetter(name)) return { ok: false, error: 'That last name is not valid.' };
  return { ok: true, name };
}
