'use client';
import { useState } from 'react';
import { toast } from '@/components/ui/Toast';
import type { ReportData } from '@/components/evaluate/Report';
import type { MapResults } from '@/hooks/useAnswerHistory';

/**
 * Downloads of a marked answer, a whole paper or the map question, as PDFs
 * made by /api/generate-pdf: everything the report shows, to keep or print.
 */

/** One answer for the PDF: the report's data, with its number in the paper. */
export type PdfAnswer = ReportData & { label?: string; notMarked?: boolean };

const day = () => new Date().toISOString().slice(0, 10);
const nameOf = (t: string) => t.slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');

async function fetchPdf(body: unknown, filename: string) {
  const res = await fetch('/api/generate-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(res.status === 429 ? 'busy' : 'failed');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Safari starts the download after click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** One answer's full evaluation, or a whole paper's with a summary page first. */
export function downloadEvaluationPdf(items: PdfAnswer[], { hi, paper = false }: { hi: boolean; paper?: boolean }) {
  const name = paper ? `Full_paper_evaluation_${day()}` : `${nameOf(items[0]?.question ?? '') || 'Answer'}-evaluation`;
  return fetchPdf({ type: 'report', items, paper, lang: hi ? 'hi' : 'en' }, `${name} (historyoptional.xyz).pdf`);
}

/** The map question, place by place. */
export function downloadMapPdf(map: MapResults & { date?: string }, hi: boolean) {
  return fetchPdf({ type: 'map', map, lang: hi ? 'hi' : 'en' }, `Map_question_evaluation_${(map.date ?? '').slice(0, 10) || day()} (historyoptional.xyz).pdf`);
}

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
);

/** A download button that says it is working and says so if it fails. */
export default function PdfButton({ download, hi, label, className = 'ds-btn ds-btn-line' }: {
  download: () => Promise<void>;
  hi: boolean;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await download();
    } catch (e) {
      toast(e instanceof Error && e.message === 'busy'
        ? (hi ? 'अभी बहुत सारी PDF बन चुकी हैं। कुछ मिनट बाद फिर कोशिश करें।' : 'Too many PDFs in a short while. Try again in a few minutes.')
        : (hi ? 'PDF नहीं बन सकी। फिर कोशिश करें।' : 'The PDF could not be made. Try again in a moment.'), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" className={className} onClick={run} disabled={busy} aria-busy={busy}>
      <DownloadIcon />
      {busy ? (hi ? 'PDF बन रही है…' : 'Making the PDF…') : (label ?? (hi ? 'PDF डाउनलोड करें' : 'Download PDF'))}
    </button>
  );
}
