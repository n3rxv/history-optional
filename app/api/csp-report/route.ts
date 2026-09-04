import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Collects Content-Security-Policy violation reports.
 *
 * Exists so the policy can be tightened without guessing. next.config.ts sends
 * a Report-Only policy alongside the enforcing one; browsers evaluate both and
 * POST here for anything the stricter policy would have blocked, while the
 * page keeps working. Once real traffic has exercised checkout, the PDF viewer
 * and the maps without producing reports, the stricter policy can be promoted
 * to enforcing with evidence rather than hope.
 *
 * Reports are attacker-controlled and unauthenticated by nature — any page on
 * the internet can POST here. Nothing is stored; the fields logged are capped,
 * and the endpoint is rate limited per IP so it cannot be used to flood the
 * logs.
 */

const MAX_FIELD = 300;

function trim(v: unknown): string {
  return typeof v === 'string' ? v.slice(0, MAX_FIELD) : '';
}

export async function POST(req: NextRequest) {
  const { allowed } = await checkRateLimit(`csp-report:${clientIp(req)}`, {
    limit: 20,
    windowSeconds: 60,
  });
  // 204 even when rate limited: a browser can do nothing useful with an error
  // here, and retries would only add noise.
  if (!allowed) return new NextResponse(null, { status: 204 });

  try {
    const body = await req.json();

    // Two wire formats: the legacy report-uri shape ({"csp-report": {...}})
    // and the Reporting API shape (an array of {type, body}).
    const reports = Array.isArray(body)
      ? body.filter((r) => r?.type === 'csp-violation').map((r) => r.body)
      : [body['csp-report'] ?? body];

    for (const r of reports) {
      if (!r) continue;
      const directive = trim(r['effective-directive'] ?? r.effectiveDirective ?? r['violated-directive']);
      const blocked = trim(r['blocked-uri'] ?? r.blockedURL);
      const doc = trim(r['document-uri'] ?? r.documentURL);
      const sample = trim(r['script-sample'] ?? r.sample);
      console.warn(
        `[csp] would-block directive=${directive} blocked=${blocked} on=${doc}` +
          (sample ? ` sample=${sample}` : '')
      );
    }
  } catch {
    // A malformed report is not worth an error response.
  }

  return new NextResponse(null, { status: 204 });
}
