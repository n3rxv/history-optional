"""
Writes start_page into the database.

Each row is matched to its page by question text, never by row order. Postgres
rewrites an updated row at the end of the heap, so one update reshuffles that
file's rows. After a question on Abhinav-Tyagi-17 was corrected, that row
moved to the end of its own list. Trusting the order would have pinned (b)'s
page onto (c)'s row, and a mistake like that only shows when someone opens it.

The order comes from publish.json's 'part' field, which is the (a) (b) (c)
order as printed on the page. A row that is not in publish.json at all
(Vikram-Grewal-5's (e), which was added later) goes last.

    python3 scripts/topper/write_startpage.py           what would be written
    python3 scripts/topper/write_startpage.py --apply   actually write it
"""
import argparse
import json
import os
import re
import urllib.request
from collections import defaultdict
from difflib import SequenceMatcher
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

WORK = _work.WORK


def env():
    for line in open('.env.local'):
        m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
        if m and not os.environ.get(m.group(1)):
            os.environ[m.group(1)] = m.group(2).strip('"\'')


def rest(path, method='GET', body=None):
    env()
    url = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + '/rest/v1/' + path
    key = os.environ['SUPABASE_SECRET_KEY']
    req = urllib.request.Request(
        url, method=method,
        headers={'apikey': key, 'Authorization': 'Bearer ' + key,
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req, timeout=90) as r:
        t = r.read().decode()
        return json.loads(t) if t.strip() else None


# Match on the opening of a question, not on the whole of it.
#
# publish.json still holds the text the splitter produced, and in places that
# text runs two questions together: Abhinav-Tyagi-17's (c) carries on as "The
# Luddite ... Elaborate. (d) Enlightenment's contribution ...". Matching on
# the full string made the (d) row that part's best fit, and the Luddite page
# ended up pinned to (e). Every question starts with its own opening whatever
# got appended to its tail, so matching on the opening holds.
HEAD = 60


def norm(q):
    return re.sub(r'[^a-z0-9 ]', '', (q or '').lower()).strip()


def score(a, b):
    return SequenceMatcher(None, norm(a)[:HEAD], norm(b)[:HEAD]).ratio()


def ordered(rows, parts):
    """
    Put the database rows into the order printed on the page.

    Each part takes the closest matching row, and the chosen row is removed
    from the pool so two parts cannot land on the same one.
    """
    left = list(rows)
    out = []
    for p in parts:
        if not left:
            break
        best = max(left, key=lambda r: score(r['question'], p))
        if score(best['question'], p) < 0.6:
            continue
        left.remove(best)
        out.append(best)
    return out + left      # rows absent from publish.json go last


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    a = ap.parse_args()

    pages = json.loads((WORK / 'startpages.json').read_text())
    pub = defaultdict(list)
    for r in json.loads((WORK / 'publish.json').read_text()):
        pub[r['file']].append(r)
    for v in pub.values():
        v.sort(key=lambda r: r.get('part', 1))

    rows = rest('topper_copies?select=id,question,drive_file_id,start_page')
    byfile = defaultdict(list)
    for r in rows:
        byfile[r['drive_file_id']].append(r)

    plan, bad = [], []
    for f, v in sorted(pages.items()):
        got = byfile.get(f, [])
        if len(got) != len(v['pages']):
            bad.append(f'{f}: DB me {len(got)} rows, {len(v["pages"])} pages')
            continue
        seq = ordered(got, [x['q'] for x in pub.get(f, [])])
        for r, p in zip(seq, v['pages']):
            plan.append((r, p, f))

    print(f'{len(pages)} PDFs, {len(plan)} rows will get a page')
    for b in bad:
        print('  !!', b)

    change = [(r, p) for r, p, _ in plan if r.get('start_page') != p]
    print(f'{len(change)} rows will change')
    for r, p, f in plan[:6]:
        print(f'  {f:24s} p{p}  {r["question"][:64]}')

    if not a.apply:
        print('\nNothing written. Pass --apply to write it.')
        return

    for i, (r, p) in enumerate(change, 1):
        rest(f'topper_copies?id=eq.{r["id"]}', 'PATCH', {'start_page': p})
        if i % 40 == 0:
            print(f'  {i}/{len(change)}')
    print(f'{len(change)} rows written')

    after = rest('topper_copies?select=drive_file_id,start_page&start_page=not.is.null')
    print(f'{len(after)} rows now carry a start_page')


if __name__ == '__main__':
    main()
