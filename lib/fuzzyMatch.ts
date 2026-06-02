/**
 * Three-layer fuzzy matcher.
 * Returns a score 0–100.
 */
export function fuzzyMatch(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const na = norm(a);
  const nb = norm(b);

  // Layer 1 — exact
  if (na === nb) return 100;

  // Layer 2 — substring
  if (na.includes(nb) || nb.includes(na)) return 85;

  // Layer 3a — Jaccard token overlap
  const ta = new Set(na.split(/\s+/));
  const tb = new Set(nb.split(/\s+/));
  const intersection = [...ta].filter(t => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  const jaccard = union === 0 ? 0 : intersection / union;

  // Layer 3b — Dice character bigrams
  const bigrams = (s: string) => {
    const bg: string[] = [];
    for (let i = 0; i < s.length - 1; i++) bg.push(s.slice(i, i + 2));
    return bg;
  };
  const ba = bigrams(na.replace(/\s/g, ""));
  const bb = bigrams(nb.replace(/\s/g, ""));
  const setA = new Set(ba);
  const setB = new Set(bb);
  const common = [...setA].filter(bg => setB.has(bg)).length;
  const dice = (setA.size + setB.size) === 0 ? 0 : (2 * common) / (setA.size + setB.size);

  return Math.round(((jaccard + dice) / 2) * 100);
}
