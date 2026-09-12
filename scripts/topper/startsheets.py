"""
Builds the sheets used to read start_page off the copies.

When one PDF holds three or five questions, each card has to know which page
its answer begins on, or the card for (b) opens at page 1 as well. The
candidate writes "3(b)", "3(c)" in the left margin, but that is handwriting
and tesseract cannot read it, so these have to be read by eye.

Guessing from where the writing ends on a page was tried and abandoned. Scored
against 15 files with known answers it got barely half right, and most of that
half was page one, which is free anyway. The margin rule puts ink in every
row, so the measurement was reading the rule rather than the handwriting. See
inkrows.py for that attempt.

Sheet width is the real constraint: eight strips in a row come to 2520 pixels,
and the image is scaled down to 2000 when viewed. Past three rows the height
overtakes the width and every strip shrinks, so a sheet holds three rows at
most.

Local work only, no API calls.

    python3 scripts/topper/startsheets.py          whatever is left to read
    python3 scripts/topper/startsheets.py a.pdf b.pdf
"""
import concurrent.futures as cf
import json
import math
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

from PIL import Image, ImageDraw

WORK = _work.WORK
STAGE = WORK / 'staged'
OUT = WORK / 'startsheets'

LEFT, TOP, BOTTOM = 0.30, 0.08, 0.58
RENDER = 1500
PER_ROW = 8
ROWS = 3
WORKERS = 7


def strip(pdf: Path, page: int):
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-png', '-scale-to', str(RENDER), '-f', str(page),
                        '-l', str(page), '-singlefile', str(pdf), f'{d}/p'],
                       check=True, capture_output=True)
        im = Image.open(f'{d}/p.png').convert('RGB')
        return page, im.crop((0, int(im.height * TOP),
                              int(im.width * LEFT), int(im.height * BOTTOM)))


def npages(pdf: Path) -> int:
    out = subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True).stdout
    return int(out.split('Pages:')[1].split()[0])


def todo() -> list[tuple[str, int]]:
    """Files from the database that hold several questions and are not yet read."""
    for line in open('.env.local'):
        m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
        if m and not os.environ.get(m.group(1)):
            os.environ[m.group(1)] = m.group(2).strip('"\'')
    url = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + \
        '/rest/v1/topper_copies?select=drive_file_id'
    key = os.environ['SUPABASE_SECRET_KEY']
    req = urllib.request.Request(url, headers={'apikey': key, 'Authorization': 'Bearer ' + key})
    with urllib.request.urlopen(req, timeout=90) as r:
        rows = json.load(r)
    n = defaultdict(int)
    for x in rows:
        n[x['drive_file_id']] += 1
    done = json.loads((WORK / 'startpages.json').read_text())
    return sorted((f, c) for f, c in n.items() if c > 1 and f not in done)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    if sys.argv[1:]:
        files = [(f, 0) for f in sys.argv[1:]]
    else:
        files = todo()
    print(f'{len(files)} files to read\n')

    # Pack files into sheets by row count. A file of more than eight pages
    # takes two rows.
    sheets, cur, used = [], [], 0
    for f, q in files:
        need = math.ceil(npages(STAGE / f) / PER_ROW)
        if used + need > ROWS and cur:
            sheets.append(cur)
            cur, used = [], 0
        cur.append((f, q))
        used += need
    if cur:
        sheets.append(cur)

    for n, group in enumerate(sheets, 1):
        path = OUT / f'sheet-{n:02d}.png'
        if path.exists():
            continue
        lines = []
        for f, q in group:
            pdf = STAGE / f
            pages = list(range(1, npages(pdf) + 1))
            with cf.ThreadPoolExecutor(WORKERS) as ex:
                got = dict(ex.map(lambda p: strip(pdf, p), pages))
            for i in range(0, len(pages), PER_ROW):
                lines.append((f, q, [(p, got[p]) for p in pages[i:i + PER_ROW]]))
        w = max(sum(im.width + 8 for _, im in ss) for _, _, ss in lines)
        h = sum(max(im.height for _, im in ss) + 26 for _, _, ss in lines)
        sheet = Image.new('RGB', (w, h), 'white')
        d = ImageDraw.Draw(sheet)
        y = 0
        for f, q, ss in lines:
            x = 0
            for p, im in ss:
                d.text((x + 4, y + 5), f'{f[:-4]}  p{p}' if x == 0 else f'p{p}', fill='red')
                sheet.paste(im, (x, y + 22))
                x += im.width + 8
            y += max(im.height for _, im in ss) + 26
        sheet.save(path)
        print(f'  {path.name}  {[f for f, _ in group]}', flush=True)


if __name__ == '__main__':
    main()
