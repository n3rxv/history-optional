import { fuzzyMatch } from "./fuzzyMatch";
import type { AnswerKeyEntry } from "./buildAnswerKey";

export interface StudentAnswer {
  number: string;
  site_name: string | null;
  state: string | null;
}

export interface CheckedResult {
  number: string;
  clue: string;
  status: "correct" | "partial" | "wrong_state" | "blank" | "low_confidence";
  marks: number;
  maxMarks: number;
  siteRight: boolean;
  stateRight: boolean;
  studentSite: string | null;
  studentState: string | null;
  correctSite: string | null;
  correctLocation: string | null;
  confidence: number;
  candidates: string[];
}

const MARKS_SITE  = 1.5;
const MARKS_STATE = 0.5;
const MAX_MARKS   = MARKS_SITE + MARKS_STATE;

export function checkAnswers(
  answerKey: AnswerKeyEntry[],
  studentAnswers: StudentAnswer[],
  groqVerified: Record<string, { siteCorrect: boolean; correctSite: string | null }> = {}
): { results: CheckedResult[]; totalMarks: number; maxTotal: number } {
  const results: CheckedResult[] = answerKey.map(key => {
    const student = studentAnswers.find(a => a.number === key.number);

    if (!student?.site_name) {
      return {
        number: key.number, clue: key.clue ?? "", status: "blank", marks: 0, maxMarks: MAX_MARKS,
        siteRight: false, stateRight: false,
        studentSite: null, studentState: null,
        correctSite: key.correctSite, correctLocation: key.correctLocation,
        confidence: key.confidence, candidates: key.candidates,
      };
    }

    const verified = groqVerified[key.number];
    const siteRight = verified?.siteCorrect ?? false;
    const stateScore = fuzzyMatch(student.state ?? "", key.correctLocation ?? "") >= 65 ? MARKS_STATE : 0;
    const siteScore = siteRight ? MARKS_SITE : 0;
    const marks = siteScore + stateScore;

    let status: CheckedResult["status"] = "low_confidence";
    if (siteRight && stateScore > 0) status = "correct";
    else if (siteRight && stateScore === 0) status = "wrong_state";
    else if (!siteRight && stateScore > 0) status = "partial";

    return {
      number: key.number, clue: key.clue ?? "", status, marks, maxMarks: MAX_MARKS,
      siteRight, stateRight: stateScore > 0,
      studentSite: student.site_name, studentState: student.state,
      correctSite: verified?.correctSite ?? key.correctSite,
      correctLocation: key.correctLocation,
      confidence: key.confidence, candidates: key.candidates,
    };
  });

  const totalMarks = results.reduce((s, r) => s + r.marks, 0);
  const maxTotal = answerKey.length * MAX_MARKS;
  return { results, totalMarks, maxTotal };
}
