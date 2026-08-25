export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

const fontDir = path.join(process.cwd(), "public");
const notoRegularB64 = "data:font/truetype;base64," + fs.readFileSync(path.join(fontDir, "NotoSans-Regular.ttf")).toString("base64");
const notoBoldB64 = "data:font/truetype;base64," + fs.readFileSync(path.join(fontDir, "NotoSans-Bold.ttf")).toString("base64");
Font.register({
  family: "NotoSans",
  fonts: [
    { src: notoRegularB64, fontWeight: "normal" },
    { src: notoBoldB64, fontWeight: "bold" },
  ],
});

const BLUE = "#1a4fa0";
const BLACK = "#1a1a1a";
const WHITE = "#ffffff";
const GRAY = "#888888";
const LIGHT_BLUE = "#eef3fc";

const s = StyleSheet.create({
  page: { fontFamily: "NotoSans", fontSize: 11, color: BLACK, paddingTop: 40, paddingBottom: 70, paddingLeft: 40, paddingRight: 40 },
  // header
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  headerBox: { width: 54, height: 54, backgroundColor: BLACK, alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerBoxText: { color: WHITE, fontSize: 28, fontWeight: "bold" },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 30, fontWeight: "bold", color: BLACK },
  headerSub: { fontSize: 7.5, color: GRAY },
  headerDate: { fontSize: 8, color: GRAY, textAlign: "right", letterSpacing: 1 },
  headerDivider: { height: 3, backgroundColor: BLUE, marginBottom: 16 },
  // question
  qBlock: { flexDirection: "row", marginBottom: 16 },
  qAccent: { width: 6, backgroundColor: BLUE },
  qInner: { flex: 1, backgroundColor: LIGHT_BLUE, padding: 12 },
  qLabel: { fontSize: 7, fontWeight: "bold", color: BLUE, letterSpacing: 2, marginBottom: 6 },
  qText: { fontSize: 12, fontWeight: "bold", color: BLACK, lineHeight: 1.4 },
  // section
  sectionThin: { height: 0.5, backgroundColor: "#bbbbbb", marginTop: 10, marginBottom: 4 },
  sectionRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 2 },
  sectionNum: { fontSize: 28, fontWeight: "bold", color: "#e8e8e8", width: 36 },
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
  tableCell: { flex: 1, fontSize: 10, padding: 4, borderWidth: 0.5, borderColor: "#cccccc" },
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
  evalSecThin: { height: 0.5, backgroundColor: "#bbbbbb", marginTop: 10, marginBottom: 4 },
  evalSecRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  evalSecAccent: { width: 4, height: 14, backgroundColor: BLUE, marginRight: 6 },
  evalSecTitle: { fontSize: 11, fontWeight: "bold", color: BLACK, letterSpacing: 2, flex: 1 },
  evalSecBlue: { height: 2, backgroundColor: BLUE, marginBottom: 8 },
  // footer
  footer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  footerBar: { height: 3, backgroundColor: BLUE },
  footerRow: { flexDirection: "row", paddingLeft: 40, paddingRight: 40, paddingTop: 10 },
  footerLeft: { flex: 1 },
  footerSiteLabel: { fontSize: 8, fontWeight: "bold", color: BLACK },
  footerSiteUrl: { fontSize: 7, color: GRAY, marginTop: 1 },
  footerRight: { alignItems: "flex-end" },
  footerPage: { fontSize: 11, fontWeight: "bold", color: BLACK },
  footerPageLabel: { fontSize: 6, color: GRAY, letterSpacing: 1, marginTop: 1 },
});

// ── Helpers ──
function parseInlineChat(t: string): string {
  return t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1");
}

function parseInlineEval(t: string): { text: string; bold?: boolean }[] {
  const parts: { text: string; bold?: boolean }[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0, m;
  while ((m = regex.exec(t)) !== null) {
    if (m.index > last) parts.push({ text: t.slice(last, m.index) });
    parts.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < t.length) parts.push({ text: t.slice(last) });
  return parts.length ? parts : [{ text: t }];
}

function Header({ dateStr }: { dateStr: string }) {
  return (
    <>
      <View style={s.headerRow}>
        <View style={s.headerBox}><Text style={s.headerBoxText}>H.</Text></View>
        <View style={s.headerMid}>
          <Text style={s.headerTitle}>historyoptional.xyz</Text>
          <Text style={s.headerSub}>one-stop solution for everything history optional</Text>
        </View>
        <Text style={s.headerDate}>{dateStr}</Text>
      </View>
      <View style={s.headerDivider} />
    </>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <View style={s.footerBar} />
      <View style={s.footerRow}>
        <View style={s.footerLeft}>
          <Text style={s.footerSiteLabel}>H.  HISTORY OPTIONAL</Text>
          <Text style={s.footerSiteUrl}>historyoptional.xyz</Text>
        </View>
        <View style={s.footerRight}>
          <Text style={s.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          <Text style={s.footerPageLabel}>PAGE</Text>
        </View>
      </View>
    </View>
  );
}

function EvalSectionHeader({ title }: { title: string }) {
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

// ── Chat/PYQ PDF ──
function ChatPDF({ markdownText, questionText, dateStr }: { markdownText: string; questionText?: string; dateStr: string }) {
  const lines = markdownText.split("\n");
  const elements: any[] = [];
  let sectionNum = 0;
  let i = 0;

  while (i < lines.length) {
    const t = lines[i].trim();
    if (t.startsWith("|") && t.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { tableLines.push(lines[i].trim()); i++; }
      const rows = tableLines.filter(l => !/^\|[-| :]+\|$/.test(l))
        .map(r => r.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim()));
      if (rows.length) elements.push({ type: "table", rows });
      continue;
    }
    if (!t || /^---+$/.test(t)) elements.push({ type: "spacer" });
    else if (/^# /.test(t)) { sectionNum++; elements.push({ type: "h1", text: parseInlineChat(t.replace(/^# /, "")), num: sectionNum }); }
    else if (/^## /.test(t)) elements.push({ type: "h2", text: parseInlineChat(t.replace(/^## /, "")) });
    else if (/^#{3,6} /.test(t)) elements.push({ type: "h3", text: parseInlineChat(t.replace(/^#{3,6} /, "")) });
    else if (/^[•\-\*] /.test(t)) elements.push({ type: "bullet", text: parseInlineChat(t.replace(/^[•\-\*] /, "")) });
    else elements.push({ type: "para", text: parseInlineChat(t) });
    i++;
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Header dateStr={dateStr} />
        {questionText && (
          <View style={s.qBlock}>
            <View style={s.qAccent} />
            <View style={s.qInner}>
              <Text style={s.qLabel}>QUESTION</Text>
              <Text style={s.qText}>{questionText}</Text>
            </View>
          </View>
        )}
        {elements.map((el, idx) => {
          if (el.type === "spacer") return <View key={idx} style={{ height: 4 }} />;
          if (el.type === "h1") return (
            <View key={idx}>
              <View style={s.sectionThin} />
              <View style={s.sectionRow}>
                <Text style={s.sectionNum}>{String(el.num).padStart(2, "0")}</Text>
                <Text style={s.sectionTitle}>{el.text.toUpperCase()}</Text>
              </View>
              <View style={s.sectionBlue} />
            </View>
          );
          if (el.type === "h2") return <View key={idx} style={s.h2Row}><View style={s.h2Accent} /><Text style={s.h2Text}>{el.text}</Text></View>;
          if (el.type === "h3") return <View key={idx} style={s.h3Row}><View style={s.h3Accent} /><Text style={s.h3Text}>{el.text}</Text></View>;
          if (el.type === "bullet") return <View key={idx} style={s.bulletRow}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>{el.text}</Text></View>;
          if (el.type === "table") return (
            <View key={idx} style={{ marginVertical: 8 }}>
              {el.rows.map((row: string[], rIdx: number) => (
                <View key={rIdx} style={s.tableRow}>
                  {row.map((cell: string, cIdx: number) => (
                    <Text key={cIdx} style={[s.tableCell, {
                      backgroundColor: rIdx === 0 ? "#2a2a2a" : rIdx % 2 === 0 ? "#f5f7ff" : WHITE,
                      color: rIdx === 0 ? WHITE : BLACK,
                      fontWeight: rIdx === 0 ? "bold" : "normal",
                    }]}>{cell}</Text>
                  ))}
                </View>
              ))}
            </View>
          );
          return <Text key={idx} style={s.para}>{el.text}</Text>;
        })}
        <Footer />
      </Page>
    </Document>
  );
}

// ── Evaluate/Model Answer PDF ──
function EvalPDF({ question, marks, evaluation, dateStr }: { question: string; marks: number; evaluation: any; dateStr: string }) {
  const idealWC = marks === 10 ? "150 words" : marks === 15 ? "200 words" : "250 words";
  const scoreStr = `${evaluation.marks} / ${evaluation.marks_out_of}`;
  const bodyParas: string[] = Array.isArray(evaluation.model_answer.body)
    ? evaluation.model_answer.body
    : evaluation.model_answer.body.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Header dateStr={dateStr} />
        {/* Score badge */}
        <View style={s.scoreBlock}>
          <View style={s.scoreBadge}>
            <Text style={s.scoreNum}>{scoreStr}</Text>
            <Text style={s.scoreLabel}>MARKS SCORED</Text>
          </View>
          <View style={s.scoreMeta}>
            <Text style={s.scoreTitle}>MODEL ANSWER</Text>
            <Text style={s.scoreSubtitle}>{idealWC}  ·  {marks} Marks  ·  UPSC CSM</Text>
          </View>
        </View>
        {/* Question */}
        <View style={s.qBlock}>
          <View style={s.qAccent} />
          <View style={s.qInner}>
            <Text style={s.qLabel}>QUESTION</Text>
            <Text style={s.qText}>{question}</Text>
          </View>
        </View>
        {/* Introduction */}
        <EvalSectionHeader title="Introduction" />
        <Text style={s.para}>{evaluation.model_answer.introduction}</Text>
        {/* Body */}
        <EvalSectionHeader title="Body" />
        {bodyParas.map((p: string, idx: number) => (
          <View key={idx} style={s.bulletRow}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}>{p}</Text>
          </View>
        ))}
        {/* Conclusion */}
        <EvalSectionHeader title="Conclusion" />
        <Text style={s.para}>{evaluation.model_answer.conclusion}</Text>
        {/* Historians */}
        <EvalSectionHeader title="Historians to Cite" />
        {evaluation.historians_to_cite.map((h: any, idx: number) => (
          <View key={idx} style={s.hCard}>
            <View style={s.hAccent} />
            <View style={s.hInner}>
              <Text style={s.hName}>{h.name}</Text>
              {h.work && <Text style={s.hWork}>{h.work}</Text>}
              <Text style={s.hArg}>{h.argument}</Text>
            </View>
          </View>
        ))}
        <Footer />
      </Page>
    </Document>
  );
}

// ── Route Handler ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type = "chat", markdownText, questionText, question, marks, evaluation } = body;

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase();

    let buffer: Buffer;
    let filename: string;

    if (type === "eval") {
      if (!question || !evaluation) return NextResponse.json({ error: "Missing eval data" }, { status: 400 });
      buffer = await renderToBuffer(<EvalPDF question={question} marks={marks ?? 20} evaluation={evaluation} dateStr={dateStr} />);
      filename = question.slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_") + "-model_answer (historyoptional.xyz).pdf";
    } else {
      if (!markdownText) return NextResponse.json({ error: "Missing content" }, { status: 400 });
      buffer = await renderToBuffer(<ChatPDF markdownText={markdownText} questionText={questionText} dateStr={dateStr} />);
      filename = (questionText ?? markdownText).slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_") + " (historyoptional.xyz).pdf";
    }

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
