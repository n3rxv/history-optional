"""
Finds blank pages.

Opening Abhinav-Tyagi-16 showed that seven of its eight pages were completely
empty: the question is printed, and the candidate never attempted it. A PDF
like that sells on the site and shows nothing when opened, so all of them have
to be found first.

The measurement is simple: what fraction of the pixels on a page are dark. A
written page runs 7-9%, an empty one under 1%, since all it carries is the
margin rule and scanner noise.

One trap worth recording. The first attempt measured "where does the writing
end", and every page returned 0.95 whether it was empty or full. The margin
rule runs the whole height of the page and puts ink in every row, so the
measurement was reading the rule, not the handwriting. The rule has to be
cropped away before measuring.

Local work only, no API calls.

    python3 scripts/topper/blank.py
"""
import concurrent.futures as cf
import json
import subprocess
import tempfile
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

import numpy as np
from PIL import Image

WORK = _work.WORK
STAGE = WORK / 'staged'
OUT = WORK / 'ink2.json'

RENDER = 700
# Drop the left margin rule and everything outside it, plus the header and
# footer. What is left is the area the candidate writes in.
BOX = (0.18, 0.10, 0.96, 0.95)

# Measure a second time with the top quarter dropped as well.
#
# The printed question sits there, and it carries enough ink that a page can
# look full when only the total is considered. Nausheen-115 slipped through
# that way: one page, the question printed on it, "(a)" written and nothing
# after, and still 5.21% ink. Drop the top and that page falls to zero, while
# a page with a real answer on it stays above 9%.
ANSWER_TOP = 0.28
DARK = 200
WORKERS = 8


def ink(pdf: Path, page: int) -> tuple[float, float]:
    """Ink over the whole writing area, and again with the top quarter dropped."""
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-png', '-gray', '-scale-to', str(RENDER),
                        '-f', str(page), '-l', str(page), '-singlefile',
                        str(pdf), f'{d}/p'], check=True, capture_output=True)
        a = np.asarray(Image.open(f'{d}/p.png').convert('L'))
    h, w = a.shape
    x0, y0, x1, y1 = BOX
    box = a[int(h * y0):int(h * y1), int(w * x0):int(w * x1)]
    low = a[int(h * ANSWER_TOP):int(h * y1), int(w * x0):int(w * x1)]
    return (round(float((box < DARK).mean()) * 100, 2),
            round(float((low < DARK).mean()) * 100, 2))


def pages(pdf: Path) -> int:
    out = subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True).stdout
    return int(out.split('Pages:')[1].split()[0])


def one(pdf: Path) -> tuple[str, list[float]]:
    return pdf.name, [ink(pdf, p) for p in range(1, pages(pdf) + 1)]


def main():
    done = json.loads(OUT.read_text()) if OUT.exists() else {}
    todo = [f for f in sorted(STAGE.glob('*.pdf')) if f.name not in done]
    print(f'{len(done) + len(todo)} PDFs, {len(todo)} to do\n', flush=True)
    with cf.ThreadPoolExecutor(WORKERS) as ex:
        for i, (name, vals) in enumerate(ex.map(one, todo), 1):
            done[name] = vals
            if i % 50 == 0:
                OUT.write_text(json.dumps(done))
                print(f'  {i}/{len(todo)}', flush=True)
    OUT.write_text(json.dumps(done))
    print(f'\n{len(done)} PDFs measured -> {OUT}')


if __name__ == '__main__':
    main()
