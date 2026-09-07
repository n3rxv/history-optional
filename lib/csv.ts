/**
 * CSV cell escaping for exports.
 *
 * Two separate problems, and only the first is about CSV:
 *
 *   1. A value containing a comma, a quote or a newline has to be quoted, or
 *      it splits into extra columns and corrupts every row after it. This
 *      applies to everything.
 *
 *   2. A spreadsheet reads a leading =, +, - or @ as the start of a formula
 *      and evaluates it on open. Quoting does not stop that; only breaking the
 *      leading character does.
 *
 * The second applies to text a person typed, not to values this system
 * produced. That distinction has to be made at the call site, which is why
 * there are two functions rather than one clever one: every phone number
 * starts with '+', so defusing everything would write '+919812345678 into the
 * phone column and break it for any tool that imports the file.
 */

/** Characters a spreadsheet treats as the start of an expression. */
const FORMULA_START = /^[=+\-@\t\r]/;

function quote(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * For text a person typed: names, notes, anything free-form.
 *
 * A leading apostrophe makes the cell literal text. It is the convention
 * spreadsheets already understand.
 */
export function csvText(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return quote(FORMULA_START.test(s) ? `'${s}` : s);
}

/**
 * For values this system generated or validated: phone numbers that passed
 * normalizePhone, timestamps, counts. Quoted, never defused.
 */
export function csvValue(value: unknown): string {
  return quote(value === null || value === undefined ? '' : String(value));
}
