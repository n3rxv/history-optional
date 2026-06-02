"use client";
import { useState } from "react";

type Result = {
  number: string;
  status: string;
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
};

const STATUS_COLOR: Record<string, string> = {
  correct:        "bg-green-100 text-green-800",
  wrong_state:    "bg-yellow-100 text-yellow-800",
  partial:        "bg-yellow-100 text-yellow-800",
  wrong_site:     "bg-red-100 text-red-800",
  blank:          "bg-gray-100 text-gray-500",
  low_confidence: "bg-purple-100 text-purple-800",
};

const STATUS_LABEL: Record<string, string> = {
  correct:        "✅ Correct",
  wrong_state:    "⚠️ Wrong state",
  partial:        "⚠️ Partial",
  wrong_site:     "❌ Wrong site",
  blank:          "— Blank",
  low_confidence: "🔍 Review needed",
};

export default function CheckMapPage() {
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile,   setAnswerFile]   = useState<File | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [response,     setResponse]     = useState<any>(null);
  const [error,        setError]        = useState<string | null>(null);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1]);
      r.onerror = () => rej(new Error("Read failed"));
      r.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    if (!questionFile || !answerFile) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const [qBase64, aBase64] = await Promise.all([
        toBase64(questionFile),
        toBase64(answerFile),
      ]);

      const mimeType = (f: File) =>
        f.type === "application/pdf" ? "application/pdf" : "image/jpeg";

      const res = await fetch("/api/check-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionMapPage: { base64: qBase64, mimeType: mimeType(questionFile) },
          studentPages:    [{ base64: aBase64, mimeType: mimeType(answerFile) }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Server error");
      setResponse(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-8">Map Question Checker</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Question paper map (PDF or image)</span>
          <input type="file" accept=".pdf,image/*" className="mt-1 block w-full text-sm"
            onChange={e => setQuestionFile(e.target.files?.[0] ?? null)} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Student answer sheet (PDF or image)</span>
          <input type="file" accept=".pdf,image/*" className="mt-1 block w-full text-sm"
            onChange={e => setAnswerFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!questionFile || !answerFile || loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700 transition"
      >
        {loading ? "Checking…" : "Check answers"}
      </button>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {response && (
        <div className="mt-8 space-y-6">
          {/* Score summary */}
          <div className="p-6 bg-gray-50 rounded-xl flex items-center gap-8">
            <div>
              <div className="text-4xl font-bold">
                {response.totalMarks}
                <span className="text-xl font-normal text-gray-500"> / {response.maxTotal}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">Total marks</div>
            </div>
            <div>
              <div className="text-4xl font-bold">{response.percentage}%</div>
              <div className="text-sm text-gray-500 mt-1">Score</div>
            </div>
            {response.flaggedForReview?.length > 0 && (
              <div className="ml-auto text-sm text-purple-700 bg-purple-50 px-4 py-2 rounded-lg">
                🔍 {response.flaggedForReview.length} site(s) need teacher review
              </div>
            )}
          </div>

          {/* Per-site results */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-3 py-2 rounded-tl-lg">#</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Student wrote</th>
                <th className="px-3 py-2">Correct answer</th>
                <th className="px-3 py-2 rounded-tr-lg text-right">Marks</th>
              </tr>
            </thead>
            <tbody>
              {response.results.map((r: Result) => (
                <tr key={r.number} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-mono text-gray-500">({r.number})</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[r.status] ?? ""}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    {r.status === "low_confidence" && (
                      <div className="text-xs text-gray-400 mt-1">
                        Candidates: {r.candidates.join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r.studentSite
                      ? <>
                          <span className={r.siteRight ? "text-green-700" : "text-red-600"}>{r.studentSite}</span>
                          {r.studentState && (
                            <span className={`ml-1 text-xs ${r.stateRight ? "text-green-600" : "text-red-400"}`}>
                              ({r.studentState})
                            </span>
                          )}
                        </>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {r.correctSite ?? <span className="text-purple-500 text-xs">unresolved</span>}
                    {r.correctState && (
                      <span className="ml-1 text-xs text-gray-400">({r.correctState})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{r.marks}/{r.maxMarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
