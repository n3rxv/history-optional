import { Text, View, Image as PdfImage, StyleSheet, Font } from "@react-pdf/renderer";
import { OWL_PEEK, OWL_PEEK_RATIO, OWL_READING, OWL_READING_RATIO } from "@/lib/pdfMascot";
import path from "path";

/**
 * What every PDF the site makes shares: the font, the colours, the styles,
 * and the header and footer on each page. Noto Sans carries Devanagari as
 * well as Latin, so a Hindi evaluation prints in the same font.
 */

const fontDir = path.join(process.cwd(), "public");
Font.register({
  family: "NotoSans",
  fonts: [
    { src: path.join(fontDir, "NotoSans-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(fontDir, "NotoSans-Bold.ttf"), fontWeight: "bold" },
  ],
});

// ── Devanagari line breaks ──
// react-pdf breaks lines by string position and maps each position to a
// glyph by the code points fontkit says each glyph stands for. For
// Devanagari those counts are wrong: fontkit caches a glyph with the
// characters of the first word it met it in, so a vowel sign can claim none
// or the wrong one, and ऐ claims two. The drift built up over a line, and a
// line or a bold run that ended on a joined sign such as ें or ीं was cut
// through it and printed the sign on a dotted circle. Here each word's
// glyphs are given that word's characters again, so a break between words
// always falls between the right glyphs. Within a word the split is rough,
// but no break falls there.
type FkGlyph = { codePoints: number[] };
type FkRun = { glyphs: FkGlyph[] };
type FkFont = { layout: (text: string, ...rest: unknown[]) => FkRun; __wordsFixed?: boolean };
const GAP = new Set([0x20, 0x0a, 0x09, 0xa0]);

function refitCodePoints(run: FkRun, text: string): FkRun {
  if (!/[\u0900-\u097F]/.test(text)) return run;
  const words = text.split(/[ \n\t\u00a0]/);
  const segs: number[][] = [[]];
  run.glyphs.forEach((g, i) => {
    if (g.codePoints.length === 1 && GAP.has(g.codePoints[0])) segs.push([]);
    else segs[segs.length - 1].push(i);
  });
  if (segs.length !== words.length) return run;
  const glyphs = run.glyphs.slice();
  segs.forEach((seg, k) => {
    const chars = Array.from(words[k]).map((c) => c.codePointAt(0)!);
    const lens = seg.map((i) => glyphs[i].codePoints.length);
    let have = lens.reduce((a, b) => a + b, 0);
    for (let j = lens.length - 1; have > chars.length && j >= 0; j--) {
      const d = Math.min(lens[j], have - chars.length);
      lens[j] -= d; have -= d;
    }
    if (have < chars.length && lens.length) lens[lens.length - 1] += chars.length - have;
    let at = 0;
    seg.forEach((i, j) => {
      // A copy: the cached glyph is shared by every other word that uses it.
      const g = glyphs[i];
      glyphs[i] = Object.assign(Object.create(Object.getPrototypeOf(g)), g, { codePoints: chars.slice(at, at + lens[j]) });
      at += lens[j];
    });
  });
  return { ...run, glyphs } as FkRun;
}

let fitted: Promise<void> | null = null;
/** Call before rendering: wraps the loaded fonts' layout once. */
export function fitDevanagari(): Promise<void> {
  type Source = { load: () => Promise<void>; data: FkFont | null };
  const sources = (Font.getRegisteredFonts() as unknown as Record<string, { sources: Source[] } | undefined>).NotoSans?.sources ?? [];
  fitted ??= Promise.all(sources.map(async (source) => {
    await source.load();
    const font = source.data;
    if (!font || font.__wordsFixed) return;
    const layout = font.layout.bind(font);
    font.layout = (text: string, ...rest: unknown[]) => refitCodePoints(layout(text, ...rest), text);
    font.__wordsFixed = true;
  })).then(() => undefined, (err) => { fitted = null; throw err; });
  return fitted;
}

// --lapis-600, the light theme's accent. A PDF has no stylesheet, so the
// token cannot be used here: var(--accent) reached react-pdf as an unknown
// colour and every rule and bar printed black.
export const BLUE = "#4c6ae2";
export const BLACK = "#1a1a1a";
export const WHITE = "#ffffff";
export const GRAY = "#888888";
export const LIGHT_BLUE = "#eef3fc";
export const RULE = "#bbbbbb";
// The report's score colours, as --success-text, --warning-text and
// --danger-text print on paper, and the faint ground under a score bar.
export const GOOD = "#2f7d4f";
export const FAIR = "#a36a00";
export const POOR = "#b3402f";
export const SOFT = "#eceef3";
// The chat PDF's section numbers and tables.
export const PALE = "#e8e8e8";
export const CELL_RULE = "#cccccc";
export const TABLE_HEAD = "#2a2a2a";
export const TABLE_ALT = "#f5f7ff";

export const s = StyleSheet.create({
  page: { fontFamily: "NotoSans", fontSize: 11, color: BLACK, paddingTop: 36, paddingBottom: 78, paddingLeft: 40, paddingRight: 40 },
  // header
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  headerOwl: { width: 64, height: 64 * OWL_PEEK_RATIO, marginRight: 12 },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: BLACK },
  headerSub: { fontSize: 8, color: GRAY, marginTop: 2 },
  headerDate: { fontSize: 8, color: GRAY, textAlign: "right", letterSpacing: 1 },
  headerDivider: { height: 3, backgroundColor: BLUE, marginBottom: 16 },
  // question
  qBlock: { flexDirection: "row", marginBottom: 16 },
  qAccent: { width: 6, backgroundColor: BLUE },
  qInner: { flex: 1, backgroundColor: LIGHT_BLUE, padding: 12 },
  qLabel: { fontSize: 7, fontWeight: "bold", color: BLUE, letterSpacing: 2, marginBottom: 6 },
  qText: { fontSize: 12, fontWeight: "bold", color: BLACK, lineHeight: 1.4 },
  // section
  sectionThin: { height: 0.5, backgroundColor: RULE, marginTop: 10, marginBottom: 4 },
  sectionRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 2 },
  sectionNum: { fontSize: 28, fontWeight: "bold", color: PALE, width: 36 },
  sectionTitle: { fontSize: 13, fontWeight: "bold", color: BLACK, letterSpacing: 2, flex: 1 },
  sectionBlue: { height: 2, backgroundColor: BLUE, marginBottom: 8 },
  // h2
  h2Row: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 3 },
  h2Accent: { width: 4, height: 14, backgroundColor: BLUE, marginRight: 6 },
  h2Text: { fontSize: 12, fontWeight: "bold", color: BLACK, flex: 1 },
  // h3
  h3Row: { flexDirection: "row", alignItems: "center", marginTop: 7, marginBottom: 3 },
  h3Accent: { width: 3, height: 10, backgroundColor: BLUE, marginRight: 6 },
  h3Text: { fontSize: 11, fontWeight: "bold", color: BLACK, flex: 1 },
  // bullet
  bulletRow: { flexDirection: "row", marginLeft: 8, marginBottom: 5 },
  bulletDot: { width: 14, fontSize: 16, color: BLUE, marginTop: -3 },
  bulletText: { fontSize: 11, color: BLACK, flex: 1, lineHeight: 1.65 },
  // para
  para: { fontSize: 11, color: BLACK, lineHeight: 1.7, marginBottom: 5 },
  // table
  tableRow: { flexDirection: "row" },
  tableCell: { flex: 1, fontSize: 10, padding: 4, borderWidth: 0.5, borderColor: CELL_RULE },
  // score badge
  scoreBlock: { flexDirection: "row", marginBottom: 14 },
  scoreBadge: { backgroundColor: LIGHT_BLUE, padding: 10, width: 110, alignItems: "center", justifyContent: "center" },
  scoreNum: { fontSize: 22, fontWeight: "bold", color: BLACK, textAlign: "center" },
  scoreLabel: { fontSize: 7, color: GRAY, textAlign: "center", letterSpacing: 1, marginTop: 2 },
  scoreMeta: { flex: 1, justifyContent: "center", paddingLeft: 12 },
  scoreTitle: { fontSize: 14, fontWeight: "bold", color: BLACK, marginBottom: 4 },
  scoreSubtitle: { fontSize: 8, color: GRAY },
  // historian card
  hCard: { flexDirection: "row", marginBottom: 8 },
  hAccent: { width: 6, backgroundColor: BLUE },
  hInner: { flex: 1, backgroundColor: LIGHT_BLUE, padding: 10 },
  hName: { fontSize: 12, fontWeight: "bold", color: BLACK, marginBottom: 2 },
  hWork: { fontSize: 9, color: GRAY, marginBottom: 4 },
  hArg: { fontSize: 10.5, color: BLACK, lineHeight: 1.6 },
  // section header (evaluate style)
  evalSecThin: { height: 0.5, backgroundColor: RULE, marginTop: 10, marginBottom: 4 },
  evalSecRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  evalSecAccent: { width: 4, height: 14, backgroundColor: BLUE, marginRight: 6 },
  evalSecTitle: { fontSize: 11, fontWeight: "bold", color: BLACK, letterSpacing: 2, flex: 1 },
  evalSecBlue: { height: 2, backgroundColor: BLUE, marginBottom: 8 },
  // footer. It had no margin below it, so it sat on the paper's edge (where
  // many printers cannot print) with a wide gap above. paddingBottom on the
  // page is the footer's height, about 52, plus a 26pt gap to the text.
  footer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  footerBar: { height: 3, backgroundColor: BLUE },
  footerRow: { flexDirection: "row", alignItems: "center", paddingLeft: 40, paddingRight: 40, paddingTop: 8, paddingBottom: 20 },
  footerOwl: { width: 24, height: 24 * OWL_READING_RATIO, marginRight: 8 },
  footerLeft: { flex: 1 },
  footerSiteLabel: { fontSize: 9, fontWeight: "bold", color: BLACK },
  footerRight: { alignItems: "flex-end" },
  footerPage: { fontSize: 11, fontWeight: "bold", color: BLACK },
  footerPageLabel: { fontSize: 6, color: GRAY, letterSpacing: 1, marginTop: 1 },
});

export function Header({ dateStr, hi = false }: { dateStr: string; hi?: boolean }) {
  return (
    <>
      <View style={s.headerRow}>
        <PdfImage src={OWL_PEEK} style={s.headerOwl} />
        <View style={s.headerMid}>
          <Text style={s.headerTitle}>HistoryOptional.xyz</Text>
          <Text style={s.headerSub}>one-stop solution for everything history optional</Text>
        </View>
        <Text style={[s.headerDate, hi ? { letterSpacing: 0 } : {}]}>{dateStr}</Text>
      </View>
      <View style={s.headerDivider} />
    </>
  );
}

export function Footer({ hi = false }: { hi?: boolean }) {
  return (
    <View style={s.footer} fixed>
      <View style={s.footerBar} />
      <View style={s.footerRow}>
        <PdfImage src={OWL_READING} style={s.footerOwl} />
        <View style={s.footerLeft}>
          <Text style={s.footerSiteLabel}>HistoryOptional.xyz</Text>
        </View>
        <View style={s.footerRight}>
          <Text style={s.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          <Text style={[s.footerPageLabel, hi ? { letterSpacing: 0 } : {}]}>{hi ? "पृष्ठ" : "PAGE"}</Text>
        </View>
      </View>
    </View>
  );
}

export function EvalSectionHeader({ title }: { title: string }) {
  return (
    <>
      <View style={s.evalSecThin} />
      <View style={s.evalSecRow}>
        <View style={s.evalSecAccent} />
        <Text style={s.evalSecTitle}>{title.toUpperCase()}</Text>
      </View>
      <View style={s.evalSecBlue} />
    </>
  );
}

