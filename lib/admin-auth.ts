import { NextRequest } from 'next/server';
import crypto from 'crypto';

const SECRET = process.env.ADMIN_PASSWORD ?? '';
const TOKEN_TTL = 8 * 60 * 60 * 1000; // 8 hours

export function generateAdminToken(): string {
  const exp = Date.now() + TOKEN_TTL;
  const payload = `${exp}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${exp}.${sig}`;
}

export function isAdminAuthed(req: NextRequest): boolean {
  const token = req.headers.get('x-admin-token');
  if (!token) return false;
  const [expStr, sig] = token.split('.');
  if (!expStr || !sig) return false;
  if (Date.now() > parseInt(expStr)) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(expStr).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
