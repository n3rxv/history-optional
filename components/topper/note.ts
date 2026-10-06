/**
 * A topper copy's note, "Vikram Grewal, AIR-51, 2018", and the parts the
 * pages show of it. Shared by the list, the viewer and the compare page.
 */
export function parseNote(note: string | null) {
  const parts = (note ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    name: parts[0] || 'Topper copy',
    rank: parts.find((p) => /^AIR/i.test(p))?.replace(/^AIR[\s-]*/i, 'AIR '),
    year: parts.find((p) => /^\d{4}$/.test(p)),
  };
}

/** "Vikram Grewal" from "Vikram Grewal, AIR-51, 2018". */
export const topperOf = (note: string | null) => (note ?? '').split(',')[0].trim();

/** 51 from "Vikram Grewal, AIR-51, 2018"; unranked notes sort last. */
export const rankOf = (note: string) => Number(note.match(/AIR[\s-]*(\d+)/i)?.[1] ?? Infinity);

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
