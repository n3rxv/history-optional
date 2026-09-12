"""
Uploads the sliced PDFs to R2 and writes their rows.

Order is deliberate: the object goes up first, a HEAD confirms it is really
there, and only then is the row written. A row pointing at a missing object is
a broken card on a paid page; an object with no row is invisible and harmless.
So if this stops halfway, it stops on the harmless side.

Duplicates are checked before either. The library already holds four copies of
the same Mauryan question, and rows have been deleted by hand before for being
the same question answered by the same topper twice. Catching that here costs
one string comparison and saves that cleanup.

Writes go through R2_WRITE_* , which is local only. Production keeps the
read-only key and signs nothing but GETs.

    python3 scripts/topper/publish.py            dry run, writes nothing
    python3 scripts/topper/publish.py --apply    upload and insert
"""
import argparse
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

WORK = _work.WORK
STAGE = WORK / 'staged'

DUPLICATE_AT = 0.90


def env():
    for line in open('.env.local'):
        m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
        if m and not os.environ.get(m.group(1)):
            os.environ[m.group(1)] = m.group(2).strip('"\'')


def norm(s: str) -> str:
    return ' '.join(re.sub(r'[^a-z0-9 ]', ' ', (s or '').lower()).split())


def existing_rows():
    """Every question already in the table, grouped by topper."""
    out = subprocess.run(
        ['psql', os.environ['SUPABASE_DB_URL'], '-At', '-F', '\t', '-c',
         "select coalesce(note,''), drive_file_id, "
         "replace(replace(question, chr(10), ' '), chr(9), ' ') from topper_copies;"],
        capture_output=True, text=True, check=True).stdout
    by_note = {}
    keys = set()
    for line in out.splitlines():
        parts = line.split('\t')
        if len(parts) < 3:
            continue
        note, key, q = parts[0], parts[1], parts[2]
        by_note.setdefault(note, []).append(q)
        keys.add(key)
    return by_note, keys


def duplicate_of(question, prior):
    """Nearest existing question by the same topper, if it is close enough."""
    nq = norm(question)
    best, ratio = None, 0.0
    for q in prior:
        r = difflib.SequenceMatcher(None, nq, norm(q)).ratio()
        if r > ratio:
            best, ratio = q, r
    return (best, ratio) if ratio >= DUPLICATE_AT else (None, ratio)


def upload(key: str) -> int:
    """
    Signed PUT via the node helper, which reuses aws4fetch from the app's own
    dependencies rather than reimplementing SigV4 here.
    """
    script = WORK / '_put.mjs'
    script.write_text('''
import fs from 'node:fs';
import { AwsClient } from 'aws4fetch';
for (const l of fs.readFileSync('.env.local','utf8').split('\\n')) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g,'');
}
const { R2_ACCOUNT_ID:a, R2_WRITE_ACCESS_KEY_ID:k, R2_WRITE_SECRET_ACCESS_KEY:s,
        R2_BUCKET:b } = process.env;
const c = new AwsClient({ accessKeyId:k, secretAccessKey:s, service:'s3', region:'auto' });
const base = `https://${a}.r2.cloudflarestorage.com/${b}`;
const [ , , key, file ] = process.argv;
const body = fs.readFileSync(file);
const put = await c.fetch(`${base}/${encodeURIComponent(key)}`,
  { method:'PUT', body, headers:{'content-type':'application/pdf'} });
if (!put.ok) { console.log('PUT ' + put.status); process.exit(1); }
const head = await c.fetch(`${base}/${encodeURIComponent(key)}`, { method:'HEAD' });
console.log(`${head.status} ${head.headers.get('content-length')}`);
''')
    r = subprocess.run(['node', str(script), key, str(STAGE / key)],
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f'upload failed for {key}: {r.stdout}{r.stderr}')
    status, length = r.stdout.split()
    if status != '200':
        raise RuntimeError(f'{key} uploaded but HEAD returned {status}')
    return int(length)


def insert(question: str, key: str, note: str):
    """
    Dollar-quoted so quotes and apostrophes in a question need no escaping.
    The tag is derived from the content, because a fixed one would break the
    day a question happens to contain it, and that failure would be a syntax
    error in the middle of a bulk run rather than anything obvious.
    """
    tag = 'q'
    while any(f'${tag}$' in s for s in (question, key, note)):
        tag += 'q'
    d = f'${tag}$'
    sql = (f'insert into topper_copies (question, drive_file_id, note) '
           f'values ({d}{question}{d}, {d}{key}{d}, {d}{note}{d});')
    subprocess.run(['psql', os.environ['SUPABASE_DB_URL'], '-q', '-v', 'ON_ERROR_STOP=1',
                    '-c', sql], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    a = ap.parse_args()
    env()

    manifest = json.loads((WORK / 'manifest.json').read_text())
    by_note, used_keys = existing_rows()
    print(f'{len(manifest)} sliced questions, '
          f'{sum(len(v) for v in by_note.values())} already in the table\n')

    seen_in_batch = {}
    todo, skipped = [], []
    for row in manifest:
        note, key, q = row['note'], row['file'], row['question']
        if key in used_keys:
            skipped.append((key, 'drive_file_id already used', ''))
            continue
        if not q or len(q) < 30:
            skipped.append((key, 'question too short to trust', q))
            continue
        prior = by_note.get(note, []) + seen_in_batch.get(note, [])
        dup, ratio = duplicate_of(q, prior)
        if dup:
            skipped.append((key, f'duplicate ({ratio:.2f})', dup[:70]))
            continue
        seen_in_batch.setdefault(note, []).append(q)
        todo.append(row)

    for key, why, detail in skipped:
        print(f'  SKIP {key:26s} {why:28s} {detail}')
    print(f'\n{len(todo)} to publish, {len(skipped)} skipped')

    if not a.apply:
        print('\nDry run. Nothing uploaded, nothing inserted. Re-run with --apply.')
        return

    done = 0
    for row in todo:
        size = upload(row['file'])
        insert(row['question'], row['file'], row['note'])
        done += 1
        print(f'  {done}/{len(todo)}  {row["file"]:26s} {size:>8,}b  {row["question"][:52]}')
    print(f'\n{done} published.')


if __name__ == '__main__':
    main()
