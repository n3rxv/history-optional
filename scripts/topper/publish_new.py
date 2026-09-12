"""
Slices the PDFs, uploads them to R2, and inserts the rows.

The order is deliberate: the object goes up first, a HEAD confirms it really
arrived, and only then is the row created. Stopping partway leaves an orphaned
file in R2, which nobody ever sees. The other way round leaves a row that
breaks when opened, on a page someone has paid for.

One PDF can hold several questions. A GS Score paper prints three together and
all three answers are in the same booklet, so all three rows point at the same
file. `start_page` says where to open it.

    python3 scripts/topper/publish_new.py --slice     cut the PDFs (local)
    python3 scripts/topper/publish_new.py             what would happen, doing nothing
    python3 scripts/topper/publish_new.py --apply     upload and insert
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

import pypdf

SRC = Path.home() / 'Desktop' / 'Topper Copies'
WORK = _work.WORK
STAGE = WORK / 'staged'


def env():
    for line in open('.env.local'):
        m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
        if m and not os.environ.get(m.group(1)):
            os.environ[m.group(1)] = m.group(2).strip('"\'')


def by_pdf():
    """One entry per PDF to be built, with all of its questions."""
    rows = json.loads((WORK / 'publish.json').read_text())
    out = {}
    for x in rows:
        out.setdefault(x['file'], []).append(x)
    return out


def slice_all():
    STAGE.mkdir(parents=True, exist_ok=True)
    groups = by_pdf()
    readers = {}
    made = 0
    for name, qs in sorted(groups.items()):
        dest = STAGE / name
        if dest.exists():
            continue
        r = qs[0]
        src = SRC / r['src']
        if src.name not in readers:
            readers[src.name] = pypdf.PdfReader(str(src))
        reader = readers[src.name]
        w = pypdf.PdfWriter()
        for p in range(r['a'] - 1, r['b']):
            w.add_page(reader.pages[p])
        with open(dest, 'wb') as f:
            w.write(f)
        made += 1
        if made % 25 == 0:
            print(f'  {made} PDFs', flush=True)
    total = len(list(STAGE.glob('*.pdf')))
    size = sum(f.stat().st_size for f in STAGE.glob('*.pdf'))
    print(f'{made} naye bane, staging me kul {total} PDFs, {size/1e6:.0f} MB')


PUT_JS = r'''
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
const names = JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const dir = process.argv[3];
let done = 0;
for (const name of names) {
  const body = fs.readFileSync(`${dir}/${name}`);
  const key = encodeURIComponent(name);
  const put = await c.fetch(`${base}/${key}`, { method:'PUT', body,
    headers:{'content-type':'application/pdf'} });
  if (!put.ok) { console.log(`FAIL ${name} PUT ${put.status}`); process.exit(1); }
  const head = await c.fetch(`${base}/${key}`, { method:'HEAD' });
  if (head.status !== 200) { console.log(`FAIL ${name} HEAD ${head.status}`); process.exit(1); }
  done++;
  if (done % 25 === 0) console.log(`  uploaded ${done}/${names.length}`);
}
console.log(`OK ${done}`);
'''


def upload_all(names):
    # The script has to be written inside the repo, not in the scratchpad.
    #
    # node resolves modules from the script's own location, and there is no
    # node_modules in the scratchpad. The first attempt ran from there and
    # stopped on "Cannot find package 'aws4fetch'". The saving grace was that
    # because of the ordering, nothing had been uploaded by that point.
    script = Path('scripts/topper/_put_many.mjs')
    script.write_text(PUT_JS)
    listing = WORK / '_names.json'
    listing.write_text(json.dumps(names))
    r = subprocess.run(['node', str(script), str(listing), str(STAGE)],
                       capture_output=True, text=True)
    print(r.stdout.strip())
    if r.returncode != 0:
        print(r.stderr.strip()[:500])
        raise SystemExit('upload ruk gaya')


def insert_rows(rows):
    """
    Rows go in over Supabase REST, not psql.

    psql cannot resolve the host at the moment; REST reaches the same data
    through a different host and works. 100 rows at a time, so no single
    request grows too large.
    """
    env()
    url = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + '/rest/v1/topper_copies'
    key = os.environ['SUPABASE_SECRET_KEY']
    done = 0
    for i in range(0, len(rows), 100):
        chunk = [{'question': x['q'], 'drive_file_id': x['file'], 'note': x['note']}
                 for x in rows[i:i + 100]]
        req = urllib.request.Request(url, data=json.dumps(chunk).encode(), headers={
            'apikey': key, 'Authorization': 'Bearer ' + key,
            'Content-Type': 'application/json', 'Prefer': 'return=minimal'})
        with urllib.request.urlopen(req, timeout=120) as r:
            if r.status not in (200, 201, 204):
                raise SystemExit(f'insert failed: {r.status}')
        done += len(chunk)
        print(f'  inserted {done}/{len(rows)}')
    return done


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slice', action='store_true')
    ap.add_argument('--apply', action='store_true')
    a = ap.parse_args()

    groups = by_pdf()
    rows = json.loads((WORK / 'publish.json').read_text())

    if a.slice:
        slice_all()
        return

    staged = {f.name for f in STAGE.glob('*.pdf')}
    missing = [n for n in groups if n not in staged]
    print(f'{len(rows)} rows, {len(groups)} PDFs, {len(staged)} staged')
    if missing:
        print(f'{len(missing)} PDFs are not sliced yet. Run --slice first.')
        return

    if not a.apply:
        print('\nDry run. Nothing uploaded, no rows created.')
        print('Pass --apply to run it.')
        return

    print('\nUploading to R2...')
    upload_all(sorted(groups))
    print('\nInserting rows...')
    n = insert_rows(rows)
    print(f'\n{len(groups)} PDFs upload, {n} rows insert.')


if __name__ == '__main__':
    main()
