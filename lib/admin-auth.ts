// Shared admin token verification for all /api/admin/* routes.
// Import this instead of checking x-admin-password directly.
import { NextRequest } from 'next/server';
import { adminTokens } from '@/app/api/admin/verify-password/route';

export function isAdminAuthed(req: NextRequest): boolean {
  const token = req.headers.get('x-admin-token');
  if (!token) return false;
  const exp = adminTokens.get(token);
  if (!exp) return false;
  if (Date.now() > exp) {
    adminTokens.delete(token);
    return false;
  }
  return true;
}
