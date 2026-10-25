import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { s, BLUE, BLACK, GRAY, RULE, GOOD, FAIR, POOR, SOFT, Header, Footer, EvalSectionHeader } from "./parts";

/**
 * A marked answer as a PDF, the whole of what the report page shows: the
 * score and the marks for each part, the feedback on each part, the model
 * answer and the historians to cite. A full paper is a summary page and then
 * one of these per answer. The map question has its own, place by place.
 */

type SectionMark = { awarded: number; out_of: number; reasoning?: string };
type Part = { what_was_written?: string; strengths?: unknown; weaknesses?: unknown; analysis?: string; suggestions?: unknown };
type Historian = { name?: string; work?: string; argument?: string } | string;

/** One answer: the report page's ReportData, with its number in the paper. */
export type ReportItem = {
  label?: string;
  question: string;
  allotted: number;
  marks: number;
  marksOutOf: number;
  overall?: string;
  demand?: unknown;
  sectionMarks?: Partial<Record<"introduction" | "body" | "conclusion" | "presentation", SectionMark>>;
  introduction?: Part;
  body?: Part;
  conclusion?: Part;
  historians?: Historian[];
  model?: { introduction?: string; body?: string | string[]; conclusion?: string };
  date?: string;
  /** In a paper's summary only: the answer the marking failed on. */
  notMarked?: boolean;
};

type MapPlace = {
  number: string; clue: string; status: "correct" | "partial" | "wrong" | "blank";
  marks: number; maxMarks: number; studentSite: string | null; studentDescription: string | null;
  correctSite: string | null; correctLocation: string | null; siteMarks: number; descriptionScore: number; descriptionFeedback: string;
};
export type MapData = { results: MapPlace[]; totalMarks: number; maxTotal: number; percentage: number; date?: string };

// The request bounds. A paper of 40 answers, each report around 15,000
// characters, renders in a few seconds; past that a single request could
// hold the function for its whole budget.
const MAX_ITEMS = 40;
const MAX_CHARS = 800_000;
export const reportTooBig = (items: unknown) =>
  !Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS || JSON.stringify(items).length > MAX_CHARS ||
  items.some((x) => !x || typeof x.question !== "string" || x.question.length > 2_000);
export const mapTooBig = (map: unknown) => {
  const m = map as MapData | null;
  return !m || !Array.isArray(m.results) || m.results.length === 0 || m.results.length > 40 || JSON.stringify(m).length > 200_000;
};

const words = (hi: boolean) => hi ? {
  marksScored: "प्राप्त अंक", evaluation: "उत्तर का मूल्यांकन", paper: "पूरे पेपर का मूल्यांकन", question: "प्रश्न",
  marks: "अंक", evaluatedOn: "मूल्यांकन", note: "ये अंक संकेत हैं, सटीक नहीं: परीक्षक एक-दो अंक कम दे सकता है। अंक बढ़ाती है प्रतिक्रिया: छूटे बिंदु, उद्धृत करने लायक इतिहासकार, और उत्तर कितना विश्लेषणात्मक है।",
  sectionMarks: "हर भाग के अंक", parts: { introduction: "भूमिका", body: "मुख्य भाग", conclusion: "निष्कर्ष", presentation: "प्रस्तुति" },
  overall: "कुल मिलाकर", demand: "प्रश्न क्या माँगता है", wrote: "आपने लिखा", worked: "क्या अच्छा रहा", fix: "क्या सुधारें",
  tryNext: "अगली बार ऐसे लिखें", model: "आदर्श उत्तर", historians: "उद्धृत करने लायक इतिहासकार", notMarked: "नहीं जाँचा गया",
  answers: (n: number) => `${n} उत्तर जाँचे गए`, total: "कुल अंक",
  map: "मानचित्र प्रश्न", mapNote: "हर स्थल 2.5 अंक का है: नाम के 1.5 और टिप्पणी का 1।", clue: "संकेत", youWrote: "आपने लिखा",
  answer: "सही उत्तर", yourNote: "आपकी टिप्पणी", blank: "कुछ नहीं लिखा",
  status: { correct: "सही", partial: "आंशिक", wrong: "ग़लत", blank: "खाली" },
} : {
  marksScored: "MARKS SCORED", evaluation: "ANSWER EVALUATION", paper: "FULL PAPER EVALUATION", question: "QUESTION",
  marks: "Marks", evaluatedOn: "Evaluated", note: "These marks are indicative: an examiner may give a mark or two less. What moves your score is the feedback, the points you missed, the historians you could cite, and how analytical the answer is.",
  sectionMarks: "Marks for each part", parts: { introduction: "Introduction", body: "Body", conclusion: "Conclusion", presentation: "Presentation" },
  overall: "Overall", demand: "What the question asks for", wrote: "What you wrote", worked: "What worked", fix: "What to fix",
  tryNext: "Try this next time", model: "Model answer", historians: "Historians to cite", notMarked: "Not marked",
  answers: (n: number) => `${n} ${n === 1 ? "answer" : "answers"} marked`, total: "TOTAL",
  map: "MAP QUESTION", mapNote: "Each place is out of 2.5: 1.5 for the name and 1 for your note.", clue: "The clue", youWrote: "You wrote",
  answer: "The answer", yourNote: "Your note", blank: "Nothing written",
  status: { correct: "Right", partial: "Partly right", wrong: "Wrong", blank: "Left blank" },
};

const tone = (pct: number) => (pct >= 0.7 ? GOOD : pct >= 0.5 ? FAIR : POOR);
const mood = (pct: number, hi: boolean) =>
  pct >= 0.75 ? (hi ? "मज़बूत उत्तर। ऐसे ही लिखते रहें।" : "A strong answer. Keep writing like this.")
  : pct >= 0.5 ? (hi ? "ठीक प्रयास, कुछ कमियाँ भरनी हैं।" : "A decent attempt, with a few gaps to close.")
  : pct >= 0.3 ? (hi ? "अभी कुछ दूरी है। नीचे की प्रतिक्रिया रास्ता दिखाती है।" : "Some way to go. The feedback below shows where.")
  : (hi ? "इस पर काफ़ी काम चाहिए। नीचे की प्रतिक्रिया से शुरू करें।" : "This needs real work. Start with the feedback below.");
const dateOf = (iso: string | undefined, hi: boolean) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";
};

// The same clean-up the report page does on what the model sends back.
function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (val && typeof val === "object") return Object.values(val as object).map(String).filter(Boolean);
  if (typeof val === "string" && val.trim()) return [val];
  return [];
}
const clean = (val: unknown) => toArray(val).filter((t) => t && !t.startsWith("One sentence") && !t.startsWith("IMPORTANT") && !t.startsWith("Use ["));
const plain = (t: string) => t.replace(/^#{1,4}\s+/, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/^[-•*]\s+/, "").trim();
const bodyParas = (body: string | string[] | undefined) =>
  (Array.isArray(body) ? body : (body ?? "").split(/\n\n+/)).map((t) => plain(String(t))).filter(Boolean);

const r = StyleSheet.create({
  label: { fontSize: 7, fontWeight: "bold", color: BLUE, marginBottom: 4 },
  note: { fontSize: 8.5, color: GRAY, lineHeight: 1.5, marginBottom: 12 },
  // marks for each part
  secRow: { marginBottom: 8 },
  secTop: { flexDirection: "row", alignItems: "center" },
  secName: { width: 96, fontSize: 10, fontWeight: "bold", color: BLACK },
  secBar: { flex: 1, height: 5, backgroundColor: SOFT, marginRight: 10 },
  secScore: { width: 52, fontSize: 10, fontWeight: "bold", textAlign: "right" },
  secWhyRow: { flexDirection: "row", marginTop: 2 },
  secGutter: { width: 96 },
  secWhy: { flex: 1, fontSize: 9, color: GRAY, lineHeight: 1.5 },
  // feedback on a part
  partHead: { flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 6 },
  partAccent: { width: 4, height: 14, backgroundColor: BLUE, marginRight: 6 },
  partTitle: { fontSize: 12, fontWeight: "bold", color: BLACK, flex: 1 },
  partMark: { fontSize: 10, fontWeight: "bold", color: GRAY },
  wrote: { borderLeftWidth: 2, borderLeftColor: RULE, paddingLeft: 8, marginBottom: 8 },
  wroteText: { fontSize: 9.5, color: GRAY, lineHeight: 1.55 },
  colTitle: { fontSize: 9, fontWeight: "bold", marginTop: 4, marginBottom: 4 },
  point: { flexDirection: "row", marginBottom: 4, marginLeft: 4 },
  pointDot: { width: 12, fontSize: 10 },
  pointText: { flex: 1, fontSize: 10, color: BLACK, lineHeight: 1.55 },
  pointTag: { fontWeight: "bold" },
  analysis: { fontSize: 10, color: BLACK, lineHeight: 1.6, marginTop: 4, marginBottom: 4 },
  modelH: { fontSize: 10, fontWeight: "bold", color: BLUE, marginTop: 8, marginBottom: 4 },
  // a paper's summary
  sumRow: { flexDirection: "row", alignItems: "flex-start", paddingTop: 6, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: RULE },
  sumId: { width: 48, fontSize: 10, fontWeight: "bold", color: BLUE },
  sumQ: { flex: 1, fontSize: 10, color: BLACK, lineHeight: 1.5, paddingRight: 10 },
  sumMarks: { width: 64, fontSize: 11, fontWeight: "bold", textAlign: "right" },
  sumTotal: { flexDirection: "row", paddingTop: 8 },
  sumTotalLabel: { flex: 1, fontSize: 10, fontWeight: "bold", color: BLACK },
  // a map place
  place: { borderWidth: 0.5, borderColor: RULE, padding: 10, marginBottom: 8 },
  placeTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  placeN: { width: 32, fontSize: 10, fontWeight: "bold", color: BLUE },
  placeClue: { flex: 1, fontSize: 10, fontWeight: "bold", color: BLACK, lineHeight: 1.45, paddingRight: 8 },
  placeScore: { fontSize: 10, fontWeight: "bold", textAlign: "right" },
  placeStatus: { fontSize: 8, textAlign: "right", marginTop: 2 },
  pair: { flexDirection: "row", marginLeft: 32 },
  pairBox: { flex: 1, paddingRight: 8 },
  boxText: { fontSize: 9.5, color: BLACK, lineHeight: 1.5 },
  boxSub: { fontSize: 9, color: GRAY, lineHeight: 1.45 },
  placeNote: { marginLeft: 32, marginTop: 6 },
});

function Bar({ pct }: { pct: number }) {
  return (
    <View style={r.secBar}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%`, height: 5, backgroundColor: tone(pct) }} />
    </View>
  );
}

/** "[missed demand]: the point" with the tag in bold. */
function Point({ text, color }: { text: string; color: string }) {
  const m = text.match(/^\[([^\]]+)\]:\s*/);
  return (
    <View style={r.point} wrap={false}>
      <Text style={[r.pointDot, { color }]}>•</Text>
      <Text style={r.pointText}>
        {m && <Text style={[r.pointTag, { color }]}>{m[1]}: </Text>}
        {m ? text.slice(m[0].length) : text}
      </Text>
    </View>
  );
}

function Title({ text, hi }: { text: string; hi: boolean }) {
  // Letter-spacing pulls Devanagari's joined letters apart, so the Hindi
  // titles are neither spaced nor capitalised. A title keeps a few lines of
  // what it heads with it, rather than end a page alone.
  return <View minPresenceAhead={60}>{hi ? <EvalSectionHeaderHi title={text} /> : <EvalSectionHeader title={text} />}</View>;
}
function EvalSectionHeaderHi({ title }: { title: string }) {
  return (
    <>
      <View style={s.evalSecThin} />
      <View style={s.evalSecRow}>
        <View style={s.evalSecAccent} />
        <Text style={[s.evalSecTitle, { letterSpacing: 0 }]}>{title}</Text>
      </View>
      <View style={s.evalSecBlue} />
    </>
  );
}

function PartFeedback({ name, mark, part, model, w }: { name: string; mark?: SectionMark; part?: Part; model?: string; w: ReturnType<typeof words> }) {
  if (!part && !model) return null;
  const good = clean(part?.strengths), fix = clean(part?.weaknesses), tries = clean(part?.suggestions);
  return (
    <View>
      <View style={r.partHead} wrap={false} minPresenceAhead={48}>
        <View style={r.partAccent} />
        <Text style={r.partTitle}>{name}</Text>
        {mark && <Text style={r.partMark}>{mark.awarded} / {mark.out_of}</Text>}
      </View>
      {part?.what_was_written && (
        <View style={r.wrote}>
          <Text minPresenceAhead={24} style={r.label}>{w.wrote}</Text>
          <Text style={r.wroteText}>{part.what_was_written}</Text>
        </View>
      )}
      {good.length > 0 && <Text minPresenceAhead={36} style={[r.colTitle, { color: GOOD }]}>{w.worked}</Text>}
      {good.map((t, i) => <Point key={`g${i}`} text={t} color={GOOD} />)}
      {fix.length > 0 && <Text minPresenceAhead={36} style={[r.colTitle, { color: POOR }]}>{w.fix}</Text>}
      {fix.map((t, i) => <Point key={`f${i}`} text={t} color={POOR} />)}
      {part?.analysis && <Text style={r.analysis}>{part.analysis}</Text>}
      {tries.length > 0 && <Text minPresenceAhead={36} style={[r.colTitle, { color: BLUE }]}>{w.tryNext}</Text>}
      {tries.map((t, i) => <Point key={`t${i}`} text={plain(t)} color={BLUE} />)}
    </View>
  );
}

/** One answer's pages. */
function AnswerPage({ item, hi, dateStr }: { item: ReportItem; hi: boolean; dateStr: string }) {
  const w = words(hi);
  const pct = item.marksOutOf ? item.marks / item.marksOutOf : 0;
  const demand = toArray(item.demand);
  const historians = (item.historians ?? []).filter(Boolean);
  const evaluated = dateOf(item.date, hi);
  return (
    <Page size="A4" style={s.page}>
      <Header dateStr={dateStr} hi={hi} />
      <View style={s.scoreBlock}>
        <View style={s.scoreBadge}>
          <Text style={[s.scoreNum, { color: tone(pct) }]}>{item.marks} / {item.marksOutOf}</Text>
          <Text style={[s.scoreLabel, hi ? { letterSpacing: 0 } : {}]}>{w.marksScored}</Text>
        </View>
        <View style={s.scoreMeta}>
          <Text style={s.scoreTitle}>{item.label ? `${item.label} · ` : ""}{w.evaluation}</Text>
          <Text style={s.scoreSubtitle}>{item.allotted} {w.marks}  ·  UPSC CSM{evaluated ? `  ·  ${w.evaluatedOn} ${evaluated}` : ""}</Text>
          <Text style={[s.scoreSubtitle, { color: tone(pct), marginTop: 4 }]}>{mood(pct, hi)}</Text>
        </View>
      </View>
      <View style={s.qBlock}>
        <View style={s.qAccent} />
        <View style={s.qInner}>
          <Text style={[s.qLabel, hi ? { letterSpacing: 0 } : {}]}>{w.question}</Text>
          <Text style={s.qText}>{item.question}</Text>
        </View>
      </View>
      <Text style={r.note}>{w.note}</Text>

      {item.sectionMarks && (
        <View wrap={false}>
          <Title text={w.sectionMarks} hi={hi} />
          {(["introduction", "body", "conclusion", "presentation"] as const).map((k) => {
            const m = item.sectionMarks?.[k];
            if (!m) return null;
            const p = m.out_of ? m.awarded / m.out_of : 0;
            return (
              <View key={k} style={r.secRow}>
                <View style={r.secTop}>
                  <Text style={r.secName}>{w.parts[k]}</Text>
                  <Bar pct={p} />
                  <Text style={[r.secScore, { color: tone(p) }]}>{m.awarded} / {m.out_of}</Text>
                </View>
                {m.reasoning && <View style={r.secWhyRow}><View style={r.secGutter} /><Text style={r.secWhy}>{m.reasoning}</Text></View>}
              </View>
            );
          })}
        </View>
      )}

      {item.overall && (
        <View>
          <Title text={w.overall} hi={hi} />
          <Text style={s.para}>{item.overall}</Text>
        </View>
      )}

      {demand.length > 0 && (
        <View>
          <Title text={w.demand} hi={hi} />
          {demand.map((d, i) => <Point key={i} text={d} color={BLUE} />)}
        </View>
      )}

      <PartFeedback name={w.parts.introduction} mark={item.sectionMarks?.introduction} part={item.introduction} w={w} />
      <PartFeedback name={w.parts.body} mark={item.sectionMarks?.body} part={item.body} w={w} />
      <PartFeedback name={w.parts.conclusion} mark={item.sectionMarks?.conclusion} part={item.conclusion} w={w} />

      {item.model && (item.model.introduction || item.model.body || item.model.conclusion) && (
        <View>
          <Title text={`${w.model} · ${item.allotted} ${w.marks}`} hi={hi} />
          {item.model.introduction && <><Text minPresenceAhead={36} style={r.modelH}>{w.parts.introduction}</Text><Text style={s.para}>{plain(item.model.introduction)}</Text></>}
          {bodyParas(item.model.body).length > 0 && <Text minPresenceAhead={36} style={r.modelH}>{w.parts.body}</Text>}
          {bodyParas(item.model.body).map((p, i) => (
            <View key={i} style={s.bulletRow}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>{p}</Text></View>
          ))}
          {item.model.conclusion && <><Text minPresenceAhead={36} style={r.modelH}>{w.parts.conclusion}</Text><Text style={s.para}>{plain(item.model.conclusion)}</Text></>}
        </View>
      )}

      {historians.length > 0 && (
        <View>
          <Title text={w.historians} hi={hi} />
          {historians.map((h, i) => (
            <View key={i} style={s.hCard} wrap={false}>
              <View style={s.hAccent} />
              <View style={s.hInner}>
                <Text style={s.hName}>{typeof h === "string" ? h : h.name}</Text>
                {typeof h === "object" && h.work && <Text style={s.hWork}>{h.work}</Text>}
                {typeof h === "object" && h.argument && <Text style={s.hArg}>{h.argument}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
      <Footer hi={hi} />
    </Page>
  );
}

/** One answer, or a whole paper: a summary page and then each answer. */
export function ReportPDF({ items, hi, dateStr, paper }: { items: ReportItem[]; hi: boolean; dateStr: string; paper: boolean }) {
  const w = words(hi);
  const marked = items.filter((x) => !x.notMarked);
  const got = marked.reduce((n, x) => n + (Number(x.marks) || 0), 0);
  const max = items.reduce((n, x) => n + (Number(x.marksOutOf) || Number(x.allotted) || 0), 0);
  const pct = max ? got / max : 0;
  const evaluated = dateOf(marked[0]?.date, hi);
  return (
    <Document title={paper ? w.paper : w.evaluation} author="HistoryOptional.xyz">
      {paper && (
        <Page size="A4" style={s.page}>
          <Header dateStr={dateStr} hi={hi} />
          <View style={s.scoreBlock}>
            <View style={s.scoreBadge}>
              <Text style={[s.scoreNum, { color: tone(pct) }]}>{got} / {max}</Text>
              <Text style={[s.scoreLabel, hi ? { letterSpacing: 0 } : {}]}>{w.marksScored}</Text>
            </View>
            <View style={s.scoreMeta}>
              <Text style={s.scoreTitle}>{w.paper}</Text>
              <Text style={s.scoreSubtitle}>{w.answers(marked.length)}  ·  UPSC CSM{evaluated ? `  ·  ${w.evaluatedOn} ${evaluated}` : ""}</Text>
            </View>
          </View>
          <Text style={r.note}>{w.note}</Text>
          {items.map((x, i) => {
            const p = x.marksOutOf ? x.marks / x.marksOutOf : 0;
            return (
              <View key={i} style={r.sumRow} wrap={false}>
                <Text style={r.sumId}>{x.label || `${i + 1}`}</Text>
                <Text style={r.sumQ}>{x.question}</Text>
                <Text style={[r.sumMarks, { color: x.notMarked ? GRAY : tone(p) }]}>{x.notMarked ? w.notMarked : `${x.marks} / ${x.marksOutOf}`}</Text>
              </View>
            );
          })}
          <View style={r.sumTotal}>
            <Text style={r.sumTotalLabel}>{w.total}</Text>
            <Text style={[r.sumMarks, { color: tone(pct) }]}>{got} / {max}</Text>
          </View>
          <Footer hi={hi} />
        </Page>
      )}
      {marked.map((x, i) => <AnswerPage key={i} item={x} hi={hi} dateStr={dateStr} />)}
    </Document>
  );
}

/** The map question, place by place. */
export function MapPDF({ map, hi, dateStr }: { map: MapData; hi: boolean; dateStr: string }) {
  const w = words(hi);
  const pct = map.maxTotal ? map.totalMarks / map.maxTotal : 0;
  const count = (st: MapPlace["status"]) => map.results.filter((x) => x.status === st).length;
  const tally = (["correct", "partial", "wrong", "blank"] as const).filter((st) => st === "correct" || st === "wrong" || count(st) > 0)
    .map((st) => `${count(st)} ${w.status[st]}`).join("  ·  ");
  const evaluated = dateOf(map.date, hi);
  const stTone = (st: MapPlace["status"]) => (st === "correct" ? GOOD : st === "partial" ? FAIR : st === "wrong" ? POOR : GRAY);
  return (
    <Document title={w.map} author="HistoryOptional.xyz">
      <Page size="A4" style={s.page}>
        <Header dateStr={dateStr} hi={hi} />
        <View style={s.scoreBlock}>
          <View style={s.scoreBadge}>
            <Text style={[s.scoreNum, { color: tone(pct) }]}>{map.totalMarks} / {map.maxTotal}</Text>
            <Text style={[s.scoreLabel, hi ? { letterSpacing: 0 } : {}]}>{w.marksScored}</Text>
          </View>
          <View style={s.scoreMeta}>
            <Text style={s.scoreTitle}>{w.map}</Text>
            <Text style={s.scoreSubtitle}>{tally}{evaluated ? `  ·  ${w.evaluatedOn} ${evaluated}` : ""}</Text>
          </View>
        </View>
        <Text style={r.note}>{w.mapNote}</Text>
        {map.results.map((x, i) => (
          <View key={i} style={r.place} wrap={false}>
            <View style={r.placeTop}>
              <Text style={r.placeN}>({x.number})</Text>
              <Text style={r.placeClue}>{x.clue}</Text>
              <View>
                <Text style={[r.placeScore, { color: stTone(x.status) }]}>{x.marks} / {x.maxMarks}</Text>
                <Text style={[r.placeStatus, { color: stTone(x.status) }]}>{w.status[x.status]}</Text>
              </View>
            </View>
            <View style={r.pair}>
              <View style={r.pairBox}>
                <Text style={r.label}>{w.youWrote}</Text>
                <Text style={r.boxText}>{x.studentSite || w.blank}</Text>
                {x.studentDescription && <Text style={r.boxSub}>{x.studentDescription}</Text>}
              </View>
              <View style={r.pairBox}>
                <Text style={r.label}>{w.answer}{x.status !== "blank" ? `  ${x.siteMarks} / 1.5` : ""}</Text>
                <Text style={r.boxText}>{x.correctSite || ""}</Text>
                {x.correctLocation && <Text style={r.boxSub}>{x.correctLocation}</Text>}
              </View>
            </View>
            {(x.descriptionFeedback || x.status !== "blank") && (
              <View style={r.placeNote}>
                <Text style={r.label}>{w.yourNote}{x.status !== "blank" ? `  ${x.descriptionScore} / 1` : ""}</Text>
                {x.descriptionFeedback && <Text style={r.boxSub}>{x.descriptionFeedback}</Text>}
              </View>
            )}
          </View>
        ))}
        <Footer hi={hi} />
      </Page>
    </Document>
  );
}
