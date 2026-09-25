/**
 * Confirm QDRANT_URL and QDRANT_API_KEY actually reach a cluster.
 *
 *   node scripts/qdrant-check.mjs
 *
 * Worth its own step: a URL missing the :6333 REST port, or carrying a
 * trailing path, fails in ways that are much easier to read here than
 * halfway through loading 30k points.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const env = {};
for (const line of readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const url = (env.QDRANT_URL ?? '').replace(/\/$/, '');
const key = env.QDRANT_API_KEY ?? '';
const collection = env.QDRANT_COLLECTION ?? 'book_chunks';

if (!url || !key) {
  console.error('✗ QDRANT_URL and/or QDRANT_API_KEY missing from .env.local');
  process.exit(1);
}
// Report the host only -- the key must not end up in a terminal someone
// screenshots.
console.log(`host       : ${new URL(url).host}`);
console.log(`collection : ${collection}`);

// Qdrant Cloud publishes the hostname without a port. REST is normally on
// 6333, but some clusters also answer on plain HTTPS, so try both rather than
// make the reader guess which one their cluster wants.
const parsed = new URL(url);
const bare = `${parsed.protocol}//${parsed.hostname}`;
const candidates = parsed.port
  ? [url]
  : [`${bare}:6333`, bare];

let working = null;
for (const candidate of candidates) {
  process.stdout.write(`trying ${new URL(candidate).host} ... `);
  try {
    const res = await fetch(`${candidate}/collections`, {
      headers: { 'api-key': key },
      signal: AbortSignal.timeout(10000),
    });
    const body = await res.text();
    if (res.ok) {
      console.log('ok');
      working = { candidate, body };
      break;
    }
    console.log(`${res.status}`);
    if (res.status === 401 || res.status === 403) {
      console.error('\n✗ The key was rejected — check you copied the whole thing.');
      process.exit(1);
    }
  } catch (e) {
    console.log(e.name === 'TimeoutError' ? 'timeout' : e.message);
  }
}

if (!working) {
  console.error('\n✗ Neither port answered. Check the hostname is copied exactly.');
  process.exit(1);
}

const names = (JSON.parse(working.body).result?.collections ?? []).map((c) => c.name);
console.log(`✓ reachable. existing collections: ${names.length ? names.join(', ') : '(none yet)'}`);
console.log(`\nUse this in .env.local:\n  QDRANT_URL=${working.candidate}`);
console.log('\nthen run: node scripts/qdrant-load.mjs');
