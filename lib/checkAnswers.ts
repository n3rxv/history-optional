import type { AnswerKeyEntry } from "./buildAnswerKey";

export interface StudentAnswer {
  number: string;
  site_name: string | null;
  state: string | null;
  description: string | null;
}

export interface CheckedResult {
  number: string;
  clue: string;
  status: "correct" | "partial" | "wrong" | "blank" | "review";
  marks: number;
  maxMarks: number;
  studentSite: string | null;
  studentDescription: string | null;
  correctSite: string | null;
  correctLocation: string | null;
  descriptionScore: number;
  descriptionFeedback: string;
  confidence: number;
}

const MARKS_SITE = 1.5;
const MARKS_DESC = 1;
const MAX_MARKS  = MARKS_SITE + MARKS_DESC;

export function checkAnswers(
  answerKey: AnswerKeyEntry[],
  studentAnswers: StudentAnswer[],
  groqVerified: Record<string, { siteCorrect: boolean; correctSite: string | null; descriptionScore: number; descriptionFeedback: string }> = {}
): { results: CheckedResult[]; totalMarks: number; maxTotal: number } {
  const results: CheckedResult[] = answerKey.map(key => {
    const student = studentAnswers.find(a => a.number === key.number);

    if (!student?.site_name) {
      return {
        number: key.number, clue: key.clue ?? "", status: "blank" as const,
        marks: 0, maxMarks: MAX_MARKS,
        studentSite: null, studentDescription: null,
        correctSite: key.correctSite, correctLocation: key.correctLocation,
        descriptionScore: 0, descriptionFeedback: "",
        confidence: key.confidence,
      };
    }

    const v = groqVerified[key.number];
    if (!v) {
      return {
        number: key.number, clue: key.clue ?? "", status: "review" as const,
        marks: 0, maxMarks: MAX_MARKS,
        studentSite: student.site_name, studentDescription: student.description,
        correctSite: null, correctLocation: key.correctLocation,
        descriptionScore: 0, descriptionFeedback: "",
        confidence: 0,
      };
    }

    const siteMarks = v.siteCorrect ? MARKS_SITE : 0;
    const descMarks = v.siteCorrect ? (v.descriptionScore ?? 0) : 0;
    const marks = siteMarks + descMarks;
    const status = !v.siteCorrect ? "wrong" as const
      : descMarks >= MARKS_DESC ? "correct" as const
      : "partial" as const;

    return {
      number: key.number, clue: key.clue ?? "", status,
      marks, maxMarks: MAX_MARKS,
      studentSite: student.site_name, studentDescription: student.description,
      correctSite: v.correctSite ?? key.correctSite,
      correctLocation: key.correctLocation,
      descriptionScore: descMarks,
      descriptionFeedback: v.descriptionFeedback ?? "",
      confidence: key.confidence,
    };
  });

  const totalMarks = results.reduce((s, r) => s + r.marks, 0);
  const maxTotal = answerKey.length * MAX_MARKS;
  return { results, totalMarks, maxTotal };
}
