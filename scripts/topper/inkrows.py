"""
Measures how far down each page the writing reaches.

start_page needs the page where the answer to (b) or (c) begins. The candidate
does write a marker, but it is handwriting and tesseract cannot read it, so
every sheet had to be read by eye.

A cheap signal suggests itself: the last page of an answer has empty space
below it, because the next answer starts on a fresh page. So measure where the
last written line falls on each page. Where the writing stops early, the next
page starts a new part.

This is not reliable, so its job is only to propose. Where its answer does not
match the question count, the sheet still has to be read by eye.

VERDICT: it does not work. Checked against 15 files with known answers it got
barely half right, and most of those were page one, which is free. The margin
rule runs the full height of the page and puts ink in every row, so this
measures the rule rather than the handwriting. Kept as a record of what was
tried; use startsheets.py instead.

Local work only, no API calls.

    python3 scripts/topper/inkrows.py <file.pdf> [...]
    python3 scripts/topper/inkrows.py --check      score against recorded files
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

import numpy as np
from PIL import Image

WORK = _work.WORK
STAGE = WORK / 'staged'
CACHE = WORK / 'inkrows.json'

RENDER = 900
# Scanner noise collects at the edges: staple marks, the black band a
# photocopier leaves. Trim a little off every side before measuring.
EDGE = 0.06
DARK = 200          # only pixels darker than this count as writing
MIN_ROW = 0.012     # dark fraction of a row before it counts as a written line


def last_row(pdf: Path, page: int) -> float:
    """How far down the last written line falls, between 0 and 1."""
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-png', '-gray', '-scale-to', str(RENDER),
                        '-f', str(page), '-l', str(page), '-singlefile',
                        str(pdf), f'{d}/p'], check=True, capture_output=True)
        a = np.asarray(Image.open(f'{d}/p.png').convert('L'))
    h, w = a.shape
    a = a[int(h * EDGE):int(h * (1 - EDGE)), int(w * EDGE):int(w * (1 - EDGE))]
    rows = (a < DARK).mean(axis=1)
    hit = np.nonzero(rows > MIN_ROW)[0]
    return float(hit[-1] / len(rows)) if len(hit) else 0.0


def profile(name: str) -> list[float]:
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    if name in cache:
        return cache[name]
    pdf = STAGE / name
    n = int(subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True)
            .stdout.split('Pages:')[1].split()[0])
    out = [last_row(pdf, p) for p in range(1, n + 1)]
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    cache[name] = out
    CACHE.write_text(json.dumps(cache))
    return out


def guess(name: str, want: int) -> list[int]:
    """
    Return as many start pages as there are questions.

    Page 1 is always the first part. For the rest, pick the pages where the
    writing stopped earliest, on the theory that a new part follows. Exactly
    as many cuts are taken as are needed, so the answer always matches the
    count, whether or not it is right.
    """
    p = profile(name)
    ends = sorted(range(len(p) - 1), key=lambda i: p[i])[:want - 1]
    return [1] + sorted(i + 2 for i in ends)


def check():
    rec = json.loads((WORK / 'startpages.json').read_text())
    hit = tot = 0
    for name, v in rec.items():
        want = sorted(v['pages'])
        got = guess(name, len(want))
        ok = sum(1 for x in got if x in want)
        hit += ok
        tot += len(want)
        mark = 'ok  ' if got == want else 'MISS'
        print(f'  {mark} {name:26s} actual {want}  guessed {got}')
    print(f'\n{hit}/{tot} pages correct')


if __name__ == '__main__':
    if sys.argv[1:2] == ['--check']:
        check()
    else:
        for n in sys.argv[1:]:
            print(n, [round(x, 2) for x in profile(n)])
