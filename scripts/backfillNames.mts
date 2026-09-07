/**
 * Copies display names out of Firebase Auth into user_profiles.
 *
 * Everyone signs in with Google, so Firebase has held a display name for every
 * account since the day they registered. Nothing ever wrote it to Supabase, so
 * the admin export would have been 154 phone numbers with no names against
 * them until each person happened to meet the profile modal.
 *
 * Google gives no phone number for an OAuth sign-in, so these rows carry a
 * name and a null phone. The gate reads a null phone as "still needs asking",
 * which is correct: the modal still appears, but arrives with the name already
 * filled in and only the number left to type.
 *
 * Rows are marked source='google' so a backfilled name can be told from one a
 * person typed. A name someone typed is never overwritten -- they chose it,
 * and it is likelier to be what they want than the name on their Google
 * account.
 *
 * Usage:
 *   npx tsx scripts/backfillNames.mts           # dry run, writes nothing
 *   npx tsx scripts/backfillNames.mts --apply   # writes
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { normalizeFirstName, normalizeLastName } from '../lib/name';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const APPLY = process.argv.includes('--apply');
const BATCH = 100;

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

/**
 * "Ram Kumar Sharma" -> first "Ram", last "Kumar Sharma".
 *
 * Splitting on the first space rather than the last: in the names here the
 * given name comes first, and a middle name belongs with the surname more
 * comfortably than it does with the first name. A single word is a first name
 * with no last name, which is a shape the schema already allows.
 */
function splitName(displayName: string): { first: string; last: string | null } | null {
  const parts = displayName.trim().split(/\s+/);
  const firstResult = normalizeFirstName(parts[0]);
  if (!firstResult.ok) return null;

  if (parts.length === 1) return { first: firstResult.name, last: null };

  const lastResult = normalizeLastName(parts.slice(1).join(' '));
  if (!lastResult.ok) return { first: firstResult.name, last: null };
  return { first: firstResult.name, last: lastResult.name };
}

async function main() {
  const { adminAuth } = await import('../lib/firebaseAdmin');

  // Everything already on file, so a name someone typed is left alone.
  const existing = new Map<string, { first_name: string | null; phone: string | null }>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('user_profiles')
      .select('firebase_uid, first_name, phone')
      .not('firebase_uid', 'is', null)
      .range(from, from + 999);
    if (error) throw new Error(`reading user_profiles: ${error.message}`);
    if (!data?.length) break;
    for (const r of data) existing.set(r.firebase_uid!, { first_name: r.first_name, phone: r.phone });
    if (data.length < 1000) break;
  }

  const rows: Array<Record<string, unknown>> = [];
  let scanned = 0, noName = 0, unusable = 0, alreadyNamed = 0;
  let pageToken: string | undefined;

  do {
    const res = await adminAuth.listUsers(1000, pageToken);
    for (const u of res.users) {
      scanned++;

      const display = u.displayName?.trim();
      if (!display) { noName++; continue; }

      const prior = existing.get(u.uid);
      if (prior?.first_name) { alreadyNamed++; continue; }

      const split = splitName(display);
      if (!split) { unusable++; continue; }

      rows.push({
        firebase_uid: u.uid,
        first_name: split.first,
        last_name: split.last,
        // Never clobber a number already on file with a null.
        ...(prior ? {} : { phone: null }),
        source: 'google',
        updated_at: new Date().toISOString(),
      });
    }
    pageToken = res.pageToken;
  } while (pageToken);

  console.log(`firebase accounts scanned : ${scanned}`);
  console.log(`  no display name         : ${noName}`);
  console.log(`  name unusable           : ${unusable}`);
  console.log(`  already named in db     : ${alreadyNamed}`);
  console.log(`  to write                : ${rows.length}`);
  const withLast = rows.filter(r => r.last_name).length;
  console.log(`     with a last name     : ${withLast}`);
  console.log(`     first name only      : ${rows.length - withLast}`);

  if (!APPLY) {
    console.log('\nDry run. Nothing written. Re-run with --apply to write.');
    return;
  }
  if (!rows.length) {
    console.log('\nNothing to write.');
    return;
  }

  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await db.from('user_profiles').upsert(chunk, { onConflict: 'firebase_uid' });
    if (error) throw new Error(`writing rows ${i}-${i + chunk.length}: ${error.message}`);
    written += chunk.length;
    console.log(`  written ${written}/${rows.length}`);
  }
  console.log(`\nDone. ${written} profiles now carry a name.`);
}

main().catch(err => {
  console.error('\nbackfill failed:', err.message);
  process.exit(1);
});
