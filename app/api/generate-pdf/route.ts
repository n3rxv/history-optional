import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 28,
    fontFamily: 'Times-Roman',
  },
  questionBox: {
    backgroundColor: '#f8f8f8',
    border: '1pt solid #e0e0e0',
    padding: 10,
    marginBottom: 12,
  },
  questionLabel: {
    fontSize: 7,
    color: '#888888',
    marginBottom: 4,
    fontFamily: 'Times-Bold',
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 10,
    color: '#111111',
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
  },
  divider: {
    borderBottom: '0.5pt solid #e0e0e0',
    marginBottom: 8,
  },
  h1: {
    fontSize: 13,
    fontFamily: 'Times-Bold',
    color: '#0f0f0f',
    marginTop: 10,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottom: '0.5pt solid #e0e0e0',
  },
  h2: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    color: '#0f0f0f',
    marginTop: 8,
    marginBottom: 3,
    paddingBottom: 2,
    borderBottom: '0.5pt solid #e0e0e0',
  },
  h3: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    color: '#2d2d2d',
    marginTop: 6,
    marginBottom: 2,
  },
  bullet: {
    fontSize: 10,
    fontFamily: 'Times-Roman',
    color: '#2d2d2d',
    lineHeight: 1.6,
    marginBottom: 2,
    paddingLeft: 12,
  },
  para: {
    fontSize: 10,
    fontFamily: 'Times-Roman',
    color: '#2d2d2d',
    lineHeight: 1.6,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 28,
    right: 28,
    borderTop: '0.5pt solid #e0e0e0',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#aaaaaa',
    fontFamily: 'Times-Roman',
  },
});

const parseInline = (t: string) =>
  t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1');

export async function POST(req: NextRequest) {
  try {
    const { markdownText, questionText } = await req.json();
    const mdLines: string[] = markdownText.split('\n');

    const doc = React.createElement(Document, {},
      React.createElement(Page, { size: 'A4', style: styles.page },
        ...(questionText ? [
          React.createElement(View, { style: styles.questionBox },
            React.createElement(Text, { style: styles.questionLabel }, 'QUESTION'),
            React.createElement(Text, { style: styles.questionText }, questionText)
          )
        ] : []),
        React.createElement(View, { style: styles.divider }),
        ...mdLines.map((raw, idx) => {
          const t = raw.trim();
          if (!t || /^---+$/.test(t)) return React.createElement(View, { key: idx, style: { marginBottom: 3 } });
          if (/^# /.test(t))      return React.createElement(Text, { key: idx, style: styles.h1 }, parseInline(t.replace(/^# /, '')));
          if (/^## /.test(t))     return React.createElement(Text, { key: idx, style: styles.h2 }, parseInline(t.replace(/^## /, '')));
          if (/^#{3,6} /.test(t)) return React.createElement(Text, { key: idx, style: styles.h3 }, parseInline(t.replace(/^#{3,6} /, '')));
          if (/^[•\-\*] /.test(t)) return React.createElement(Text, { key: idx, style: styles.bullet }, '• ' + parseInline(t.replace(/^[•\-\*] /, '')));
          return React.createElement(Text, { key: idx, style: styles.para }, parseInline(t));
        }),
        React.createElement(View, { style: styles.footer, fixed: true },
          React.createElement(Text, { style: styles.footerText }, 'crispy response'),
          React.createElement(Link, { src: 'https://historyoptional.xyz/chat', style: styles.footerText }, 'www.historyoptional.xyz'),
          React.createElement(Text, { style: styles.footerText, render: ({ pageNumber }: { pageNumber: number }) => String(pageNumber) })
        )
      )
    );

    const buffer = await renderToBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
