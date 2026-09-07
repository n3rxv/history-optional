import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { normalizePhone } from "@/lib/phone";
import { normalizeFirstName, normalizeLastName } from "@/lib/name";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

/**
 * Stores the phone number for a signed-in user or an anonymous browser.
 *
 * Two callers:
 *   - Signed in: x-user-token header, keyed on firebase_uid. Mandatory; the
 *     gate does not offer a way past it.
 *   - Anonymous: visitor_id in the body, the same FingerprintJS id
 *     user_sessions keys on. Prompted softly from the second visit, and
 *     dismissible.
 *
 * The anonymous path takes no credential, so it is rate limited per IP. It is
 * otherwise an open write endpoint on a public site.
 *
 * NOTE: this route, PhoneModal and /api/chat-usage were all written earlier
 * against a user_profiles whose primary key was a NOT NULL uuid pointing into
 * auth.users. This app uses Firebase, so that column was never populated and
 * every write failed. supabase/user_profiles_phone.sql fixes the table; this
 * route assumes it has been run.
 */

const MAX_VISITOR_ID = 64;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}

/** A FingerprintJS id is a hex string; anything else is not one of ours. */
function validVisitorId(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= MAX_VISITOR_ID && /^[a-zA-Z0-9_-]+$/.test(v);
}


/**
 * Moves a number given while logged out onto the signed-in account.
 *
 * Ordering matters and is not arbitrary. The number is written to the account
 * FIRST, then the anonymous row is removed, then the browser id is attached.
 * Doing it the other way round -- delete, then write -- loses the number if
 * the write fails in between. In this order the worst case is a leftover
 * anonymous row, which costs nothing: the admin view already collapses
 * duplicates by number.
 */
async function claimAnonRow(
  supabase: ReturnType<typeof db>,
  uid: string,
  visitorId: string,
  current: { phone: string | null; first_name: string | null; last_name: string | null } | null
) {
  const { data: anon } = await supabase
    .from("user_profiles")
    .select("phone, first_name, last_name")
    .eq("visitor_id", visitorId)
    .is("firebase_uid", null)
    .maybeSingle();

  if (!anon?.phone) return null;

  // A name typed while signed in is kept over the one from the anonymous row.
  const first = current?.first_name ?? anon.first_name ?? null;
  const last  = current?.last_name  ?? anon.last_name  ?? null;

  const { error: writeErr } = await supabase.from("user_profiles").upsert(
    {
      firebase_uid: uid,
      phone: anon.phone,
      first_name: first,
      last_name: last,
      // It arrived anonymously but now sits on an account. Leaving it as
      // 'google' would report a backfilled name that never got a number.
      source: "authed",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "firebase_uid" }
  );
  if (writeErr) {
    console.error("[profile] claim write failed:", writeErr);
    return null;
  }

  // visitor_id is unique, so the old row has to go before the account can
  // take the id over. Both steps are best-effort: the number is already safe.
  await supabase.from("user_profiles").delete().eq("visitor_id", visitorId).is("firebase_uid", null);
  await supabase.from("user_profiles").update({ visitor_id: visitorId }).eq("firebase_uid", uid);

  return { phone: anon.phone, firstName: first, lastName: last };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = await verifyFirebaseToken(req.headers.get("x-user-token"));

  // Identity first: an unusable identity should fail before anything is
  // written, and before the rate limiter is consulted on a doomed request.
  let identity: { firebase_uid: string; visitor_id: string | null; source: "authed" }
              | { firebase_uid: null; visitor_id: string; source: "anon" };

  if (user) {
    // The browser id is recorded alongside the account so that signing out
    // does not turn a known reader back into a stranger who gets prompted.
    identity = {
      firebase_uid: user.uid,
      visitor_id: validVisitorId(body.visitor_id) ? body.visitor_id : null,
      source: "authed",
    };
  } else if (validVisitorId(body.visitor_id)) {
    identity = { firebase_uid: null, visitor_id: body.visitor_id, source: "anon" };
  } else {
    return NextResponse.json({ error: "Could not identify this browser." }, { status: 400 });
  }

  // Signed-in writes are bounded by the account. Anonymous ones are bounded
  // per browser first and per IP only as an abuse backstop.
  //
  // An IP-only limit is wrong here: a college hostel, an office, and every
  // mobile carrier put hundreds of people behind one address, so a tight
  // per-IP cap refuses the eleventh honest person rather than an attacker.
  // The browser id is the natural unit -- one browser has one number to give.
  if (identity.source === "anon") {
    const [perBrowser, perIp] = await Promise.all([
      checkRateLimit(`profile-anon-fp:${identity.visitor_id}`, { limit: 5, windowSeconds: 3600 }),
      checkRateLimit(`profile-anon-ip:${clientIp(req)}`, { limit: 200, windowSeconds: 3600 }),
    ]);
    if (!perBrowser.allowed || !perIp.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
  }

  // Validated before the write, and in field order, so the message the modal
  // shows names the field the reader has to fix.
  const first = normalizeFirstName(body.first_name);
  if (!first.ok) return NextResponse.json({ error: first.error, field: "first_name" }, { status: 400 });

  const last = normalizeLastName(body.last_name);
  if (!last.ok) return NextResponse.json({ error: last.error, field: "last_name" }, { status: 400 });

  const result = normalizePhone(body.phone);
  if (!result.ok) return NextResponse.json({ error: result.error, field: "phone" }, { status: 400 });

  // Phone is deliberately not unique across the table: one person on two
  // devices is two visitor_ids, and a shared family number is one number
  // across two people. Rejecting those would trap a real visitor behind the
  // gate. Duplicates are collapsed in the admin view instead.
  // The anonymous path carries no credential: the visitor_id is just a value
  // in the request body, so anyone who learns one could post over that row.
  // A browser that has already given a number has no way to reach this modal
  // again, so a second anonymous write for the same id is not a correction
  // and is refused. Signed-in callers are exempt: they are authenticated, and
  // may legitimately be fixing a typo.
  if (identity.source === "anon") {
    const { data: held } = await db()
      .from("user_profiles")
      .select("phone")
      .eq("visitor_id", identity.visitor_id)
      .maybeSingle();
    if (held?.phone) {
      return NextResponse.json({ ok: true, phone: held.phone, alreadySet: true });
    }
  }

  // A signed-in row claiming a browser id would collide with the anonymous
  // row that already holds it. Same person, so the older row gives way.
  if (identity.source === "authed" && identity.visitor_id) {
    await db().from("user_profiles").delete()
      .eq("visitor_id", identity.visitor_id).is("firebase_uid", null);
  }

  const onConflict = identity.source === "authed" ? "firebase_uid" : "visitor_id";
  const { error } = await db()
    .from("user_profiles")
    .upsert(
      {
        ...identity,
        phone: result.phone,
        first_name: first.name,
        last_name: last.name,
        updated_at: new Date().toISOString(),
      },
      { onConflict }
    );

  if (error) {
    console.error("[profile] upsert failed:", error);
    return NextResponse.json({ error: "Could not save your number. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, phone: result.phone });
}

/**
 * What the gate needs to decide whether to show itself: whether a number is on
 * file, and for anonymous browsers how many visits they have made, since the
 * prompt only appears from the second.
 */
export async function GET(req: NextRequest) {
  const user = await verifyFirebaseToken(req.headers.get("x-user-token"));
  const visitorId = req.nextUrl.searchParams.get("visitor_id");
  const supabase = db();

  if (user) {
    const { data } = await supabase
      .from("user_profiles")
      .select("phone, first_name, last_name")
      .eq("firebase_uid", user.uid)
      .maybeSingle();

    // Someone who gave a number while logged out and then signed in has that
    // number on a row keyed by visitor_id, which a lookup by firebase_uid
    // never sees. Without this they are asked a second time for something
    // they already gave, which is the fastest way to make a mandatory gate
    // feel broken.
    if (!data?.phone && validVisitorId(visitorId)) {
      const claimed = await claimAnonRow(supabase, user.uid, visitorId, data ?? null);
      if (claimed) return NextResponse.json({ ...claimed, visits: null });
    }

    return NextResponse.json({
      phone: data?.phone ?? null,
      firstName: data?.first_name ?? null,
      lastName: data?.last_name ?? null,
      visits: null,
    });
  }

  if (!validVisitorId(visitorId)) return NextResponse.json({ phone: null, visits: 0 });

  const [{ data: profile }, { data: session }] = await Promise.all([
    supabase.from("user_profiles").select("phone, first_name, last_name").eq("visitor_id", visitorId).maybeSingle(),
    supabase.from("user_sessions").select("visit_count").eq("visitor_id", visitorId).maybeSingle(),
  ]);

  return NextResponse.json({
    phone: profile?.phone ?? null,
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
    visits: session?.visit_count ?? 0,
  });
}
