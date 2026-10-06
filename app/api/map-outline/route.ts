import { mapOutline } from '@/lib/mapBook';

/** The outline map of the region around India, built once at build time. */
export const dynamic = 'force-static';

export async function GET() {
  return Response.json(mapOutline());
}
