import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin session tokens.
 *
 * The previous token was `{exp}.{hmac(exp)}` and had three problems:
 *
 *  1. `SECRET = process.env.ADMIN_PASSWORD ?? ''` meant a missing env var
 *     silenced the check rather than breaking it. HMAC with an empty key is
 *     something anyone can compute, so a deployment without ADMIN_PASSWORD
 *     handed the whole admin surface — note HTML, blog posts, topper copies,
 *     submissions, notifications — to any caller who knew the format. Nothing
 *     about the running site would have looked wrong.
 *  2. The payload was an expiry and nothing else. No session to name in a log,
 *     nothing to point at after a leak.
 *  3. The only way to invalidate a token was to change ADMIN_PASSWORD, which
 *     is the HMAC key — so "revoke the token someone stole" and "change the
 *     password I type" were the same action.
 *
 * Now: fail closed with no secret, a random session id inside the signature,
 * and a row in `admin_sessions` that can be revoked on its own.
 */

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

/** Null when unconfigured, so callers must decide — never a usable empty key. */
function adminSecret(): string | null {
  const s = process.env.ADMIN_PASSWORD;
  return s && s.length > 0 ? s : null;
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}

function sign(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Issues a token and records the session. Returns null if the server has no
 * ADMIN_PASSWORD — there is no token worth minting without one.
 */
export async function generateAdminToken(req?: NextRequest): Promise<string | null> {
  const secret = adminSecret();
  if (!secret) {
    console.error('[admin-auth] ADMIN_PASSWORD is not set; refusing to issue a token');
    return null;
  }

  const sid = crypto.randomBytes(16).toString('hex');
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${exp}.${sid}`;

  const { error } = await db().from('admin_sessions').insert({
    sid,
    expires_at: new Date(exp).toISOString(),
    ip: req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    user_agent: req?.headers.get('user-agent')?.slice(0, 300) ?? null,
  });

  // Without the row the token cannot be validated, so this is fatal rather
  // than something to log past.
  if (error) {
    console.error('[admin-auth] could not record session:', error);
    return null;
  }

  return `${payload}.${sign(secret, payload)}`;
}

export async function isAdminAuthed(req: NextRequest): Promise<boolean> {
  const secret = adminSecret();
  if (!secret) {
    console.error('[admin-auth] ADMIN_PASSWORD is not set; denying admin request');
    return false;
  }

  const token = req.headers.get('x-admin-token');
  if (!token) return false;

  const [expStr, sid, sig] = token.split('.');
  if (!expStr || !sid || !sig) return false;

  const exp = Number.parseInt(expStr, 10);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  // Check the signature before touching the database, so an unsigned sid
  // cannot be used to probe which sessions exist.
  if (!equal(sig, sign(secret, `${expStr}.${sid}`))) return false;

  const supabase = db();
  const { data, error } = await supabase
    .from('admin_sessions')
    .select('revoked_at, expires_at')
    .eq('sid', sid)
    .maybeSingle();

  // A database problem denies the request. Admin access is rare and the
  // fallback is to try again, which is the right trade against serving a
  // revoked token because a lookup failed.
  if (error) {
    console.error('[admin-auth] session lookup failed:', error);
    return false;
  }
  if (!data || data.revoked_at) return false;
  if (new Date(data.expires_at).getTime() < Date.now()) return false;

  // Best-effort audit trail; never block the request on it.
  void supabase
    .from('admin_sessions')
    .update({ last_seen: new Date().toISOString() })
    .eq('sid', sid)
    .then(undefined, () => {});

  return true;
}

/** Ends one session — what signing out should do. */
export async function revokeAdminSession(req: NextRequest): Promise<void> {
  const sid = req.headers.get('x-admin-token')?.split('.')[1];
  if (!sid) return;
  await db()
    .from('admin_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('sid', sid)
    .is('revoked_at', null);
}
