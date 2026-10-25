// A full paper's report is the longest render, a page or more per answer.
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";
import type { ReactElement } from "react";
import { renderToBuffer, Document, Page, Text, View, type DocumentProps } from "@react-pdf/renderer";
import { s, WHITE, BLACK, TABLE_HEAD, TABLE_ALT, Header, Footer, EvalSectionHeader, fitDevanagari } from "./parts";
import { ReportPDF, MapPDF, reportTooBig, mapTooBig, type ReportItem, type MapData } from "./report";

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
                      backgroundColor: rIdx === 0 ? TABLE_HEAD : rIdx % 2 === 0 ? TABLE_ALT : WHITE,
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
            <Text style={s.scoreSubtitle}>{marks} Marks  ·  UPSC CSM</Text>
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
type Body = { type?: string; markdownText?: string; questionText?: string; question?: string; marks?: number; evaluation?: unknown; items?: unknown; map?: unknown; paper?: boolean };
const fileName = (t: string) => t.slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_");

/** The document a request asks for, built outside the handler's try (JSX there would not be caught by it anyway). */
function documentFor(body: Body, hi: boolean, dateStr: string): { doc: ReactElement<DocumentProps>; filename: string } | { error: string } {
  const { type = "chat", markdownText, questionText, question, marks, evaluation, items, map, paper } = body;
  if (type === "report") {
    // The full evaluation: one answer, or a whole paper with its summary.
    return { doc: <ReportPDF items={items as ReportItem[]} hi={hi} dateStr={dateStr} paper={!!paper} />, filename: paper ? "Full paper evaluation (historyoptional.xyz).pdf" : "Evaluation (historyoptional.xyz).pdf" };
  }
  if (type === "map") {
    return { doc: <MapPDF map={map as MapData} hi={hi} dateStr={dateStr} />, filename: "Map question evaluation (historyoptional.xyz).pdf" };
  }
  if (type === "eval") {
    if (!question || !evaluation) return { error: "Missing eval data" };
    return { doc: <EvalPDF question={question} marks={marks ?? 20} evaluation={evaluation} dateStr={dateStr} />, filename: fileName(question) + "-model_answer (historyoptional.xyz).pdf" };
  }
  if (!markdownText) return { error: "Missing content" };
  return { doc: <ChatPDF markdownText={markdownText} questionText={questionText} dateStr={dateStr} />, filename: fileName(questionText ?? markdownText) + " (historyoptional.xyz).pdf" };
}

// renderToBuffer is CPU-bound and runs in-process, so a burst of requests
// saturates the function rather than queuing cheaply. None of the three
// callers is behind a login, so the gate is per-IP rather than per-account.
const MAX_TEXT_CHARS = 100_000;

export async function POST(req: NextRequest) {
  const { allowed } = await checkRateLimit(`generate-pdf:${clientIp(req)}`, {
    limit: 20,
    windowSeconds: 10 * 60,
  });
  if (!allowed) return tooManyRequests();

  try {
    const body = await req.json();
    const { type = "chat", markdownText, questionText, question, evaluation, items, map, lang } = body;
    const hi = lang === "hi";

    // Bounds the render: without them a single request can pin a lambda for
    // the full 30s budget on an arbitrarily long document.
    const oversized =
      (typeof markdownText === "string" && markdownText.length > MAX_TEXT_CHARS) ||
      (typeof questionText === "string" && questionText.length > 2_000) ||
      (typeof question === "string" && question.length > 2_000) ||
      (evaluation !== undefined && JSON.stringify(evaluation).length > MAX_TEXT_CHARS) ||
      (type === "report" && reportTooBig(items)) ||
      (type === "map" && mapTooBig(map));
    if (oversized) {
      return NextResponse.json({ error: "Content too long for PDF export" }, { status: 413 });
    }

    const now = new Date();
    const dateStr = hi
      ? now.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })
      : now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase();

    const made = documentFor(body, hi, dateStr);
    if ("error" in made) return NextResponse.json({ error: made.error }, { status: 400 });
    await fitDevanagari();
    const buffer = await renderToBuffer(made.doc);
    const filename = made.filename;

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
