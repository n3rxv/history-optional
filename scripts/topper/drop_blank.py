"""
Removes the rows and PDFs for questions that were never answered.

Every booklet prints the full question paper, whether or not the candidate
attempted each question. Slicing therefore produced blocks whose first page
carries a printed question and whose remaining pages are empty. A card like
that sells on the site and shows nothing when opened.

blank.py explains how they are found: the fraction of dark pixels on a page.
A written page runs 7-12%, an empty one under 1.5%.

The order is deliberate: delete the row first, then the file in R2. The other
way round, stopping partway leaves a row whose PDF is gone, which is a broken
card on a page someone has paid for.

    python3 scripts/topper/drop_blank.py            what would go, changing nothing
    python3 scripts/topper/drop_blank.py --apply    actually remove them
"""
import argparse
import json
import os
import re
import subprocess
import urllib.parse
import urllib.request
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

WORK = _work.WORK
BACKUP = Path.home() / 'Desktop' / 'topper-state' / 'deleted_blank_rows.json'

# Ink does not catch everything.
#
# Nausheen-115 is a single page carrying a printed question and no answer, but
# a grey smudge from the scanner gives it as much ink as a full page.
# Samiksha-122's densest page is an empty map. Cases like these were found by
# eye, so their names are recorded in by_eye.json: what a measurement cannot
# catch should be written down, or it has to be found again next time.
BY_EYE = WORK / 'by_eye.json'

DEL_JS = r'''
import fs from 'node:fs';
import { AwsClient } from 'aws4fetch';
for (const l of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g,'');
}
const { R2_ACCOUNT_ID:a, R2_WRITE_ACCESS_KEY_ID:k, R2_WRITE_SECRET_ACCESS_KEY:s,
        R2_BUCKET:b } = process.env;
const c = new AwsClient({ accessKeyId:k, secretAccessKey:s, service:'s3', region:'auto' });
const base = `https://${a}.r2.cloudflarestorage.com/${b}`;
let n = 0;
for (const name of JSON.parse(fs.readFileSync(process.argv[2],'utf8'))) {
  const r = await c.fetch(`${base}/${encodeURIComponent(name)}`, { method:'DELETE' });
  if (!r.ok && r.status !== 404) { console.log(`FAIL ${name} ${r.status}`); process.exit(1); }
  n++;
}
console.log(`OK ${n}`);
'''


def env():
    for line in open('.env.local'):
        m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
        if m and not os.environ.get(m.group(1)):
            os.environ[m.group(1)] = m.group(2).strip('"\'')


def rest(path, method='GET', count=False):
    env()
    url = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + '/rest/v1/' + path
    key = os.environ['SUPABASE_SECRET_KEY']
    h = {'apikey': key, 'Authorization': 'Bearer ' + key,
         'Prefer': 'count=exact' if count else 'return=minimal'}
    req = urllib.request.Request(url, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=90) as r:
        if count:
            return r.headers.get('Content-Range')
        body = r.read().decode()
        return json.loads(body) if body.strip() else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    a = ap.parse_args()

    rows = json.loads(BACKUP.read_text())
    files = sorted({r['drive_file_id'] for r in rows})
    if BY_EYE.exists():
        only = set(json.loads(BY_EYE.read_text()))
        rows = [r for r in rows if r['drive_file_id'] in only]
        files = sorted(only)
    print(f'{len(rows)} rows, {len(files)} PDFs')
    print(f'backup: {BACKUP}')

    if not a.apply:
        for f in files:
            print(f'  {f}')
        print('\nNothing removed. Pass --apply to remove them.')
        return

    ids = [r['id'] for r in rows]
    for i in range(0, len(ids), 20):
        lst = urllib.parse.quote('(' + ','.join(ids[i:i + 20]) + ')')
        rest('topper_copy_pyq_map?topper_copy_id=in.' + lst, 'DELETE')
        rest('topper_copies?id=in.' + lst, 'DELETE')
    print(f'{len(ids)} rows removed')

    script = Path('scripts/topper/_del_many.mjs')
    script.write_text(DEL_JS)
    listing = WORK / '_del_names.json'
    listing.write_text(json.dumps(files))
    r = subprocess.run(['node', str(script), str(listing)], capture_output=True, text=True)
    print(r.stdout.strip() or r.stderr.strip()[:400])

    print('rows now:', rest('topper_copies?select=id&limit=1', count=True))


if __name__ == '__main__':
    main()
