/**
 * Phone normalisation and validation, shared by the API route and its tests.
 *
 * Lives outside the route so the rules can be tested without standing up a
 * request, and so the client and server cannot drift apart on what counts as
 * a valid number.
 */

/** Digits only, no country code, per ITU E.164 minus the leading '+'. */
const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

/**
 * Numbers that are syntactically fine and obviously fake. Collected numbers
 * are only worth having if someone can be reached on them, and these are what
 * people type when a modal will not let them past.
 */
function isJunk(digits: string): boolean {
  const national = digits.length > 10 ? digits.slice(-10) : digits;
  if (/^(\d)\1+$/.test(national)) return true;           // 9999999999
  if (national === '1234567890') return true;
  if (national === '0123456789') return true;
  return false;
}

export type PhoneResult =
  | { ok: true; phone: string }
  | { ok: false; error: string };

export function normalizePhone(raw: unknown): PhoneResult {
  if (typeof raw !== 'string') return { ok: false, error: 'Please enter your phone number.' };

  // Strip the separators people actually type. Anything else surviving this is
  // a real character in the wrong place, and should fail rather than be
  // silently dropped.
  const cleaned = raw.replace(/[\s\-().]/g, '');
  const match = cleaned.match(/^(\+?)(\d+)$/);
  if (!match) return { ok: false, error: 'That does not look like a phone number.' };

  let digits = match[2];
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) {
    return { ok: false, error: 'That number looks too short or too long.' };
  }
  if (isJunk(digits)) return { ok: false, error: 'Please enter a real phone number.' };

  // The picker supplies +91 and the reader types their number again with the
  // country code in it, giving +91 91 XXXXXXXXXX. Fourteen digits passes the
  // generic international check and is not dialable. The intent is not in
  // doubt, so the duplicate is dropped rather than refused.
  if (digits.length === 14 && digits.startsWith('9191') && /^[6-9]\d{9}$/.test(digits.slice(4))) {
    digits = digits.slice(2);
  }

  // An Indian mobile is 10 digits starting 6-9. The picker defaults to +91, so
  // this is the case worth checking properly.
  if (digits.startsWith('91') && digits.length === 12) {
    const national = digits.slice(2);
    if (!/^[6-9]\d{9}$/.test(national)) {
      return { ok: false, error: 'Indian mobile numbers are 10 digits starting with 6, 7, 8 or 9.' };
    }
  }

  return { ok: true, phone: '+' + digits };
}
