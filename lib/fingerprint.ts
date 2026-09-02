'use client';

/**
 * Stable per-browser id used to attribute free-tier usage.
 *
 * Navbar/VisitorTracker populate the `fp` cookie and localStorage on load, but
 * a request can fire before that finishes. Callers that gate on the fingerprint
 * must not race it, so this falls back to loading FingerprintJS on demand and
 * caches the result the same way.
 */
export async function getFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';

  const fromCookie = document.cookie.match(/fp=([^;]+)/)?.[1];
  if (fromCookie) return fromCookie;

  try {
    const stored = localStorage.getItem('fp');
    if (stored) return stored;
  } catch {
    // localStorage can throw in private mode; fall through and recompute.
  }

  try {
    const FP = await (await import('@fingerprintjs/fingerprintjs')).default.load();
    const { visitorId } = await FP.get();
    try {
      localStorage.setItem('fp', visitorId);
    } catch {
      // Non-fatal: the id still gets sent on this request.
    }
    return visitorId;
  } catch {
    return '';
  }
}
