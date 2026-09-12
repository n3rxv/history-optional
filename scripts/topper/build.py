"""
Turns a scan into per-question PDFs, ready to upload.

Reads the JSON that scan.py wrote, works out each question's page range, and
writes one PDF per question. Pages are copied, not re-rendered: the scan, the
coaching watermark and the printed question block come through untouched,
because the PDF a reader opens should be the page the topper actually wrote on.

Nothing here uploads or touches the database. It writes files to a staging
directory and prints what it would do, so the split can be checked by opening
a few before anything becomes permanent.

    python3 scripts/topper/build.py --list          what has been scanned
    python3 scripts/topper/build.py <scan.json>     slice one booklet
    python3 scripts/topper/build.py --all           slice everything scanned
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

import importlib.util

import pypdf

_s = importlib.util.spec_from_file_location('attribute', Path(__file__).parent / 'attribute.py')
attribute = importlib.util.module_from_spec(_s)
_s.loader.exec_module(attribute)

SRC = Path.home() / 'Desktop' / 'Topper Copies'
WORK = _work.WORK
STAGE = WORK / 'staged'

# Overrides, for sources whose filename cannot identify the owner.
#
# Everyone else is matched against the notes already in the table, which are
# the strings you verified when you added those toppers by hand. That keeps one
# source of truth rather than a second list here that can drift from it.
#
# These five cannot be: two carry no name at all, and Sarla is not yet in the
# table. Paper 2 was identified by the owner, Medieval India by its cover sheet
# reading "History Test Series 2025, Test 02, Name: Samiksha Dwiwedi", and
# Sarla Jakher's rank and year from the CSE 2024 results.
NOTES = {
    'Paper 2 (Modern + World).pdf':       'Samiksha Dwivedi, AIR-56, 2025',
    'Medieval India.pdf':                 'Samiksha Dwivedi, AIR-56, 2025',
    'Sarla Jakher-Rank 593-Ancient.pdf':  'Sarla Jakher, AIR-593, 2024',
    'Sarla Jakher-Rank 593-Medieval.pdf': 'Sarla Jakher, AIR-593, 2024',
}


def _db_notes():
    """
    The note strings already present in the table.

    psql first, because it is direct and current. But it can fail, and it did:
    the Supabase host would not resolve and the whole run stopped, when all it
    actually needed was a dozen names. So a snapshot taken over REST is the
    fallback. Attribution should not depend on the network being up.
    """
    import subprocess
    for line in open('.env.local'):
        m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
        if m and not os.environ.get(m.group(1)):
            os.environ[m.group(1)] = m.group(2).strip('"\'')
    try:
        out = subprocess.run(
            ['psql', os.environ['SUPABASE_DB_URL'], '-At', '-c',
             'select distinct note from topper_copies where note is not null;'],
            capture_output=True, text=True, check=True, timeout=30).stdout
        notes = [n for n in out.splitlines() if n.strip()]
        if notes:
            return notes
    except Exception:
        pass

    snap = WORK / 'db_snapshot.json'
    if snap.exists():
        import json as _json
        rows = _json.loads(snap.read_text())
        return sorted({r['note'] for r in rows if r.get('note')})
    return []


_notes_cache = None


def note_for_source(filename: str):
    """
    Whose booklet this is, from the override list or from the table.

    Every word of a topper's name must appear in the filename. A first name
    alone is accepted only when exactly one topper in the table has it, so
    "Deeksha - Rank 44-Modern.pdf" resolves while a second Deeksha would make
    it ambiguous and return nothing rather than pick one.
    """
    global _notes_cache
    if filename in NOTES:
        return NOTES[filename]
    if _notes_cache is None:
        _notes_cache = _db_notes()

    def key(s):
        return re.sub(r'[^a-z]', '', s.lower())

    fk = key(filename)
    full = [n for n in _notes_cache
            if all(key(w) in fk for w in n.split(',')[0].split() if len(w) > 2)]
    if len(full) == 1:
        return full[0]
    first = [n for n in _notes_cache if key(n.split(',')[0].split()[0]) in fk]
    if len(first) == 1:
        return first[0]
    return None


# Years a divider page does not state, filled in from verified sources rather
# than inferred. All three appear on GS Score's own CSE 2018 results page with
# these ranks; Abhinav Tyagi is corroborated by a rank-150 CSE 2018 interview
# and a published AIR-150 booklet labelled IAS 2018.
VERIFIED_YEARS = {
    'Abhinav Tyagi': '2018',
    'Desai Neha Diwakar': '2018',
    'Vikram Grewal': '2018',
}

# File stem for each topper, matching what is already in R2.
STEM = {
    'Sarla Jakher, AIR-593, 2024':   'Sarla-Jakher',
    'Samiksha Dwivedi, AIR-56, 2025': 'Samiksha-Dwivedi',
    'Hassan Khan, AIR-95, 2025':      'Hassan-Khan',
    'Surabhi Yadav, AIR-14, 2025':    'Surabhi-Yadav',
}


# Map questions are deliberately not part of the library: none of the 376 rows
# is one, and they are excluded on purpose.
#
# They still have to be DETECTED, which is the part that is easy to get wrong.
# A boundary the detector ignores does not remove those pages, it hands them to
# the question before it. Missing the Section B map question in Medieval India
# turned one answer into an 11-page PDF carrying eight pages of somebody else's
# map work. So a map question ends the previous range and is then dropped: it
# gets no slice, no number and no row.
MAP_RE = re.compile(
    r'identify the following places|marked on the map|locational hints|seriatim',
    re.I)


def is_map(q: str) -> bool:
    return bool(q and MAP_RE.search(q))


def stem_for(note):
    """
    Existing toppers keep the stem already used in R2. A new one gets it from
    the name, so keys stay predictable without a table entry per person.
    """
    if note in STEM:
        return STEM[note]
    return re.sub(r'[^A-Za-z0-9]+', '-', note.split(',')[0].strip()).strip('-')


def ranges(starts, total):
    """
    A question owns every page from where it starts until the next one begins.

    The trailing pages after the last question belong to it too: a booklet ends
    with the final answer, not with a separate section.
    """
    out = []
    for i, s in enumerate(starts):
        end = starts[i + 1] - 1 if i + 1 < len(starts) else total
        out.append((s, end))
    return out


# Next free number per topper, for the whole run.
#
# This has to be a running counter, not a fresh look at the folder each time.
# Samiksha has ten source booklets; asking the folder "highest Samiksha-N?"
# once per booklet returns the same answer every time, because nothing has been
# written to the folder yet, and all ten would number from the same point and
# overwrite each other. Staged files count too, so a second run continues
# rather than repeating.
_next = {}


def take_number(stem):
    if stem not in _next:
        # Seed from the real folder only, never from staging.
        #
        # Staging holds the sliced files from the previous run, and counting
        # those pushes every name forward: on a rebuild, Abhinav-Tyagi-6
        # jumped straight to Abhinav-Tyagi-26. The names already in the
        # database are the ones in SRC; staging is only this run's scratch.
        n = 0
        for folder in (SRC,):
            if not folder.exists():
                continue
            for p in folder.glob(f'{stem}-*.pdf'):
                m = re.match(rf'^{re.escape(stem)}-(\d+)\.pdf$', p.name)
                if m:
                    n = max(n, int(m.group(1)))
        _next[stem] = n
    _next[stem] += 1
    return _next[stem]


def peek_number(stem):
    """What take_number would return next, without consuming it."""
    if stem not in _next:
        take_number(stem)
        _next[stem] -= 1
    return _next[stem] + 1


def sections_of(pdf: Path, total: int):
    """
    The topper sections in one source, as (note, first page, last page).

    Most files are one person throughout. History_Topper_Copies.pdf is three,
    and that difference cannot be handled by attribution alone: a section
    boundary has to be a hard cut, or the last question of one topper swallows
    the pages of the next one and ships under the wrong name.
    """
    try:
        dividers, _ = attribute.divider_pages(pdf)
    except Exception:
        dividers = []
    runs = attribute.sections(dividers, total) if dividers else []
    if len(runs) < 2:
        return None
    out = []
    for r in runs:
        year = r['year'] or VERIFIED_YEARS.get(r['name'])
        if not year:
            print(f'  SKIP section {r["name"]}: exam year unverified')
            continue
        out.append((f"{r['name']}, AIR-{r['rank']}, {year}", r['start'], r['end']))
    return out


def slice_one(scan_path: Path, apply: bool):
    d = json.loads(scan_path.read_text())
    src_name = d['file']
    pdf = SRC / src_name
    reader = pypdf.PdfReader(str(pdf))
    rows_by_page = {r['page']: r for r in d['rows']}

    print(f'\n{src_name}')
    multi = sections_of(pdf, d['pages'])
    if multi:
        print(f'  {len(multi)} toppers in this file, cut at their section boundaries')
        blocks = [(note, [s for s in d['starts'] if lo <= s <= hi], hi)
                  for note, lo, hi in multi]
    else:
        note = note_for_source(src_name)
        if not note:
            print('  SKIP: no note string, attribution unknown')
            return []
        blocks = [(note, d['starts'], d['pages'])]

    made = []
    STAGE.mkdir(parents=True, exist_ok=True)
    for note, starts, last in blocks:
        if not starts:
            continue
        made += _slice_block(reader, rows_by_page, note, starts, last, src_name, apply)
    return made


def _slice_block(reader, rows_by_page, note, starts, last, src_name, apply):
    stem = stem_for(note)
    rs = ranges(starts, last)
    print(f'  {note}   {len(rs)} questions, numbering from {stem}-{peek_number(stem)}')

    made = []
    for a, b in rs:
        row = rows_by_page.get(a) or {}
        q = row.get('q') or ''
        # `drop` marks boundaries that break a range without being uploaded
        # themselves: map test pages, and the cover sheet of the next test.
        # They have to count as boundaries, or their pages end up inside the
        # previous question's PDF, which is what was happening to six of
        # Vikram's answers.
        if row.get('drop') or is_map(q):
            print(f'  {"(map, dropped)":26s} p{a:>3}-{b:<3} ({b - a + 1}p)  {q[:52]}')
            continue
        name = f'{stem}-{take_number(stem)}.pdf'
        print(f'  {name:26s} p{a:>3}-{b:<3} ({b - a + 1}p)  {q[:64]}')
        if apply:
            w = pypdf.PdfWriter()
            for p in range(a - 1, b):
                w.add_page(reader.pages[p])
            with open(STAGE / name, 'wb') as f:
                w.write(f)
        made.append({'file': name, 'question': q, 'note': note,
                     'pages': [a, b], 'source': src_name})
    return made


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('scan', nargs='?')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--apply', action='store_true',
                    help='actually write the sliced PDFs into the staging directory')
    a = ap.parse_args()

    scans = sorted(WORK.glob('scan-*.json'))
    if a.list:
        for s in scans:
            d = json.loads(s.read_text())
            note = note_for_source(d['file']) or '(no note string)'
            print(f'{len(d["starts"]):3d} questions  {d["pages"]:3d} pages  '
                  f'{d["file"]:52s} {note}')
        return

    targets = scans if a.all else [Path(a.scan)] if a.scan else []
    if not targets:
        ap.error('give a scan json, --all or --list')

    manifest = []
    for s in targets:
        manifest += slice_one(s, a.apply)

    if a.apply and manifest:
        (WORK / 'manifest.json').write_text(json.dumps(manifest, indent=1))
        print(f'\nwrote {len(manifest)} PDFs to {STAGE}')
        print(f'manifest: {WORK / "manifest.json"}')
    else:
        print(f'\n{len(manifest)} questions would be sliced. '
              f'Nothing written. Re-run with --apply.')


if __name__ == '__main__':
    main()
