import { fuzzyMatch } from "./fuzzyMatch";
import type { AnswerKeyEntry } from "./buildAnswerKey";

export interface StudentAnswer {
  number: string;
  site_name: string | null;
  state: string | null;
}

export interface CheckedResult {
  number: string;
  status: "correct" | "partial" | "wrong_site" | "wrong_state" | "blank" | "low_confidence";
  marks: number;
  maxMarks: number;
  siteRight: boolean;
  stateRight: boolean;
  studentSite: string | null;
  studentState: string | null;
  correctSite: string | null;
  correctState: string | null;
  confidence: number;
  candidates: string[];
}

const MARKS_SITE  = 1.5;
const MARKS_STATE = 0.5;
const MAX_MARKS   = MARKS_SITE + MARKS_STATE;

export function checkAnswers(
  answerKey: AnswerKeyEntry[],
  studentAnswers: StudentAnswer[]
): { results: CheckedResult[]; totalMarks: number; maxTotal: number } {
  const results: CheckedResult[] = answerKey.map(key => {
    const student = studentAnswers.find(a => a.number === key.number);

    // Blank
    if (!student?.site_name) {
      return {
        number: key.number, status: "blank", marks: 0, maxMarks: MAX_MARKS,
        siteRight: false, stateRight: false,
        studentSite: null, studentState: null,
        correctSite: key.correctSite, correctState: key.correctState,
        confidence: key.confidence, candidates: key.candidates,
      };
    }

    // Low confidence answer key — flag for teacher review
    if (key.confidence === 0) {
      return {
        number: key.number, status: "low_confidence", marks: 0, maxMarks: MAX_MARKS,
        siteRight: false, stateRight: false,
        studentSite: student.site_name, studentState: student.state,
        correctSite: key.correctSite, correctState: key.correctState,
        confidence: key.confidence, candidates: key.candidates,
      };
    }

    const siteScore  = fuzzyMatch(student.site_name, key.correctSite)  >= 75 ? MARKS_SITE  : 0;
    const stateScore = fuzzyMatch(student.state,     key.correctState) >= 75 ? MARKS_STATE : 0;
    const marks = siteScore + stateScore;

    let status: CheckedResult["status"] = "wrong_site";
    if (siteScore > 0 && stateScore > 0) status = "correct";
    else if (siteScore > 0 && stateScore === 0) status = "wrong_state";
    else if (siteScore === 0 && stateScore > 0) status = "partial";

    return {
      number: key.number, status, marks, maxMarks: MAX_MARKS,
      siteRight: siteScore > 0, stateRight: stateScore > 0,
      studentSite: student.site_name, studentState: student.state,
      correctSite: key.correctSite, correctState: key.correctState,
      confidence: key.confidence, candidates: key.candidates,
    };
  });

  const totalMarks = results.reduce((s, r) => s + r.marks, 0);
  const maxTotal   = answerKey.length * MAX_MARKS;

  return { results, totalMarks, maxTotal };
}
