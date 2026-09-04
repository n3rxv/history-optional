import { AwsClient } from 'aws4fetch';

/**
 * Short-lived signed URLs for topper copy PDFs.
 *
 * These are the ₹365 product, and they sit in an R2 bucket served through its
 * public development URL — pub-<hash>.r2.dev — which performs no access check
 * of its own. Until the list endpoints stopped returning drive_file_id, two
 * unauthenticated GETs enumerated every object key in the library, and a key
 * is all the bucket asks for.
 *
 * Withholding the keys closed the enumeration. It cannot close the rest: a key
 * that has already been copied keeps working forever. Signing does, because a
 * signed URL carries its own expiry and is issued only after the entitlement
 * check in /api/topper-copies/[id].
 *
 * Signed URLs address the S3 API endpoint, which is a different host from the
 * public r2.dev one and always requires a signature. So this works whether or
 * not public access is still switched on, and the rollout is:
 *
 *   1. deploy this,
 *   2. confirm PDFs still open,
 *   3. THEN turn off the public development URL in Cloudflare.
 *
 * Step 3 is what actually revokes the leaked keys. Until it happens this is
 * only a better front door on an unlocked building.
 */

const TTL_SECONDS = 300;

function config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

export function r2Configured(): boolean {
  return config() !== null;
}

/**
 * A URL for `key` that expires in five minutes.
 *
 * Falls back to the public URL when R2 credentials are absent, so deploying
 * this ahead of configuring them does not take the feature down. The fallback
 * is logged, because silently serving unsigned URLs is exactly the state this
 * module exists to end.
 */
export async function signedPdfUrl(key: string): Promise<string> {
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE
    ?? 'https://pub-163b2186589649f4a759ed969e0779e0.r2.dev';
  // Each path segment is encoded separately: slashes in a key are real path
  // separators in the object name and must survive.
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');

  const cfg = config();
  if (!cfg) {
    console.warn('[r2] credentials not set — falling back to the public URL, which is unsigned');
    return `${publicBase}/${encodedKey}`;
  }

  try {
    const client = new AwsClient({
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      service: 's3',
      region: 'auto',
    });

    const url = new URL(
      `https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucket}/${encodedKey}`
    );
    url.searchParams.set('X-Amz-Expires', String(TTL_SECONDS));

    const signed = await client.sign(new Request(url, { method: 'GET' }), {
      aws: { signQuery: true },
    });
    return signed.url;
  } catch (err) {
    console.error('[r2] signing failed, falling back to the public URL:', err);
    return `${publicBase}/${encodedKey}`;
  }
}
