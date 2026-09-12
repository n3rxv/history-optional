"""
Diffs two transcriptions of the same question and shows where they disagree.

Checking spelling against a dictionary does not work here. The papers are full
of words like 'Rajatarangini', 'Zain-ul-Abidin' and 'Tuzuk-i-Babari', and the
system dictionary carries neither proper names nor inflections, so it flags
340 words of which none are actually wrong.

What does work: the same question appears in several toppers' copies, and each
copy was read independently. The two transcriptions will be nearly identical,
and where they differ either the model misread one or the papers really are
printed differently. That is how 'BrahmoSamaj' against 'BrahmaSamaj' turned up.

The call is made by eye. 'How for' and 'cotemporary' are printed that way on
the paper itself; those are not mistakes and should be left alone.

    python3 scripts/topper/spellcheck.py
"""
import json
import os
import re
import urllib.request
from difflib import SequenceMatcher

NEAR = 0.88     # similarity at which two strings count as the same question
SAME = 0.999    # identical enough that there is nothing to look at


def db_rows():
    for line in open('.env.local'):
        m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
        if m and not os.environ.get(m.group(1)):
            os.environ[m.group(1)] = m.group(2).strip('"\'')
    url = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + \
        '/rest/v1/topper_copies?select=question,drive_file_id'
    key = os.environ['SUPABASE_SECRET_KEY']
    req = urllib.request.Request(url, headers={'apikey': key, 'Authorization': 'Bearer ' + key})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def words(q):
    return re.findall(r"[A-Za-z][A-Za-z'’-]*", q)


def main():
    rows = db_rows()
    qs = sorted({(r['question'], r['drive_file_id']) for r in rows})
    shown = 0
    for i, (qa, fa) in enumerate(qs):
        for qb, fb in qs[i + 1:]:
            if fa.rsplit('-', 1)[0] == fb.rsplit('-', 1)[0]:
                continue
            r = SequenceMatcher(None, qa, qb).ratio()
            if not (NEAR < r < SAME):
                continue
            wa, wb = words(qa), words(qb)
            diff = []
            sm = SequenceMatcher(None, wa, wb)
            for tag, i1, i2, j1, j2 in sm.get_opcodes():
                if tag != 'equal':
                    diff.append((' '.join(wa[i1:i2]) or '-', ' '.join(wb[j1:j2]) or '-'))
            if not diff:
                continue
            shown += 1
            print(f'{fa}  vs  {fb}   ({r:.3f})')
            for x, y in diff:
                print(f'    {x!r:34s} {y!r}')
    print(f'\n{shown} pairs differ')


if __name__ == '__main__':
    main()
