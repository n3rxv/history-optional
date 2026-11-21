import { retrieve } from '@/lib/rag/retrieve';
import { formatPassages, formatTimeline } from '@/lib/rag/context';

/**
 * Book-passage retrieval for the evaluation flow.
 *
 * This used to live behind POST /api/rag-search, which /api/evaluate called
 * over HTTP against its own domain. That was wrong twice over: the route was
 * unauthenticated, so anyone could spend Voyage embedding credits by POSTing
 * to it, and the self-call burned a second lambda invocation plus a network
 * round-trip on every evaluation — with NEXT_PUBLIC_SITE_URL unset it fell
 * back to http://localhost:3000 and silently returned nothing in production.
 *
 * Callers now invoke this directly, in-process.
 */

const TIMEOUT_MS = 12000;

/**
 * Returns source-labelled passages for `query`, followed by the curated
 * timeline rows for it, or '' when there is neither. Never throws — retrieval
 * is an enhancement, and an evaluation without book context is worth more to
 * the student than a failed request.
 *
 * The passages come from the planned, filtered and reranked search in
 * lib/rag/retrieve.ts. What this replaced kept every passage when fewer than
 * three cleared its similarity floor, so off-topic books still reached the
 * marker.
 */
export async function getBookContext(query: string): Promise<string> {
  if (!query || query.trim().length < 4) return '';

  // Without a deadline a hung upstream eats the caller's whole time budget.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const r = await retrieve(query, { signal: controller.signal });
    const passages = formatPassages(r.hits);
    const timeline = formatTimeline(r.events);
    return [passages, timeline && `TIMELINE (curated dates for this question; prefer these over any other date):\n${timeline}`]
      .filter(Boolean)
      .join('\n\n');
  } catch (err) {
    console.error('[ragSearch] retrieval failed (non-fatal):', err);
    return '';
  } finally {
    clearTimeout(timer);
  }
}
