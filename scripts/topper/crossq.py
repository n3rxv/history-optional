"""
Compares the question sets of toppers who sat the same test.

Vikram, Abhinav and Desai sat the same GS Score tests; Samiksha, Hassan and
Deeksha sat the same LevelUp ones. Both copies of a block should hold the same
questions. If one has five and the other four, the splitter has merged two
questions somewhere.

That is how Vikram-Grewal-5 turned up: the page printed five parts, (a) to
(e), and the database held four rows, because the label closing (d) was never
transcribed and nothing was left to split on. No amount of reading that text
finds the fault, since the difference is not in the text at all. The same
block in another topper's copy is complete, and the gap shows immediately.

Local work only, no API calls beyond reading rows from the database.

    python3 scripts/topper/crossq.py
"""
import json
import os
import re
import urllib.request
from collections import defaultdict
from difflib import SequenceMatcher

MIN_SHARED = 2      # shared questions before two files count as the same block
SAME = 0.82         # similarity at which two questions count as the same


def db_rows():
    for line in open('.env.local'):
        m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
        if m and not os.environ.get(m.group(1)):
            os.environ[m.group(1)] = m.group(2).strip('"\'')
    url = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + \
        '/rest/v1/topper_copies?select=id,question,drive_file_id,note'
    key = os.environ['SUPABASE_SECRET_KEY']
    req = urllib.request.Request(url, headers={'apikey': key, 'Authorization': 'Bearer ' + key})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def norm(q: str) -> str:
    return re.sub(r'[^a-z0-9 ]', '', q.lower()).strip()


def topper(name: str) -> str:
    return re.sub(r'-\d+\.pdf$', '', name)


def main():
    rows = db_rows()
    files = defaultdict(list)
    for r in rows:
        files[r['drive_file_id']].append(r['question'])

    multi = {f: qs for f, qs in files.items() if len(qs) > 1}
    keys = sorted(multi)
    norms = {f: [norm(q) for q in qs] for f, qs in multi.items()}

    seen = set()
    for i, a in enumerate(keys):
        for b in keys[i + 1:]:
            if topper(a) == topper(b):
                continue
            shared = 0
            for qa in norms[a]:
                if any(SequenceMatcher(None, qa, qb).ratio() > SAME for qb in norms[b]):
                    shared += 1
            if shared < MIN_SHARED:
                continue
            if len(multi[a]) == len(multi[b]):
                continue
            key = tuple(sorted((a, b)))
            if key in seen:
                continue
            seen.add(key)
            short, long = (a, b) if len(multi[a]) < len(multi[b]) else (b, a)
            print(f'{short} has {len(multi[short])} questions, '
                  f'{long} has {len(multi[long])}  ({shared} shared)')
            have = norms[short]
            for q in multi[long]:
                if not any(SequenceMatcher(None, norm(q), h).ratio() > SAME for h in have):
                    print(f'    missing from {short}:  {q[:110]}')
    if not seen:
        print('Every block has a matching question count.')


if __name__ == '__main__':
    main()
