"""
Records the start page of each question in one PDF.

    python3 scripts/topper/setpage.py <file.pdf> 1 4 7

Page numbers are relative to that PDF, so the first page is always 1. This
script used to take source-booklet page numbers and subtract the offset
itself. The sheets are built from the sliced PDFs now, so the number that
comes off a sheet goes straight in with no arithmetic.

A page written as ~8 was identified from the content rather than read off a
marker. The distinction matters: a marker is what the candidate wrote, an
inference is a guess. Both work, but they are not worth the same confidence.
The shell needs ~ quoted: '~8'

The count is checked against the database, not publish.json. publish.json
still holds rows that were later removed, so checking against it leaves a file
that now has two questions asking for three.
"""
import json
import os
import re
import sys
import urllib.request
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

WORK = _work.WORK
STORE = WORK / 'startpages.json'


def db_counts() -> Counter:
    for line in open('.env.local'):
        m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
        if m and not os.environ.get(m.group(1)):
            os.environ[m.group(1)] = m.group(2).strip('"\'')
    url = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + \
        '/rest/v1/topper_copies?select=drive_file_id'
    key = os.environ['SUPABASE_SECRET_KEY']
    req = urllib.request.Request(url, headers={'apikey': key, 'Authorization': 'Bearer ' + key})
    with urllib.request.urlopen(req, timeout=90) as r:
        return Counter(x['drive_file_id'] for x in json.load(r))


def main():
    name = sys.argv[1]
    raw = sys.argv[2:]
    pages = [int(x.lstrip('~')) for x in raw]
    guessed = [i for i, x in enumerate(raw) if x.startswith('~')]

    want = db_counts()[name]
    if not want:
        print(f'!! {name}: not in the database at all')
        return 1
    if len(pages) != want:
        print(f'!! {name}: database has {want} questions, {len(pages)} pages given')
        return 1

    d = json.loads(STORE.read_text()) if STORE.exists() else {}
    d[name] = {'pages': pages, 'inferred': guessed}
    STORE.write_text(json.dumps(d, indent=1))
    tag = f'  ({len(guessed)} andaze se)' if guessed else ''
    print(f'{name}  {pages}{tag}   [{len(d)} PDFs ho gaye]')
    return 0


if __name__ == '__main__':
    sys.exit(main())
