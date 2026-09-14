import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { createServerClient } from '@/lib/supabase';
import { signedPdfUrl } from '@/lib/r2';

/**
 * Redirects to a freshly signed R2 URL for one topper copy.
 *
 * Signing happens per click rather than per page render for two reasons: the
 * signature lives for 300 seconds, so 814 links signed at render would all be
 * dead within five minutes; and the R2 object key never has to reach the
 * browser, which is the same rule the public /api/topper-copies/[id] follows.
 *
 * `drive_file_id` is that object key. The column name is left over from when
 * these files were on Google Drive.
 */
export async function GET(req: NextRequest) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createServerClient();
  const { data, error } = await db
    .from('topper_copies')
    .select('drive_file_id')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.drive_file_id) return NextResponse.json({ error: 'No file on record' }, { status: 404 });

  const url = await signedPdfUrl(data.drive_file_id);
  // 302 rather than 307: this is a one-off redirect to a URL that expires, and
  // it must never be cached.
  return NextResponse.redirect(url, { status: 302, headers: { 'Cache-Control': 'no-store' } });
}
