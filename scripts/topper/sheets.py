"""
Joins candidate pages into contact sheets, for reading.

The sweep only says which pages might carry a question. Its OCR text is not fit
to go into the database, because it comes back looking like this:

    'Y . it 5c) {Critically examine the Deccan policy of Delhi sultans. [10 marks] ue a'

Clean text means reading the page by eye. Opening pages one at a time is slow,
so this stacks the top of six pages per sheet, rotated the right way up and
labelled. Six questions can be read off one sheet.

Local work only, no API calls.

    python3 scripts/topper/sheets.py         build every sheet
    python3 scripts/topper/sheets.py 3       sheet number 3 only
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

from PIL import Image, ImageDraw

SRC = Path.home() / 'Desktop' / 'Topper Copies'
WORK = _work.WORK
OUT = WORK / 'sheets'

PER_SHEET = 6
# The question sits at the top of the sheet. 22% is enough, and it lets six
# pages fit in one image without shrinking the text.
BAND = 0.22
WIDTH = 1500


def strip(pdf: Path, page: int, deg: int) -> Image.Image:
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-png', '-scale-to', str(WIDTH), '-f', str(page),
                        '-l', str(page), '-singlefile', str(pdf), f'{d}/p'],
                       check=True, capture_output=True)
        im = Image.open(f'{d}/p.png').convert('RGB')
        if deg:
            im = im.rotate(-deg, expand=True)
        return im.crop((0, 0, im.width, int(im.height * BAND)))


def main():
    cands = json.loads((WORK / 'rot_candidates.json').read_text())
    if not cands:
        print('no candidates')
        return
    OUT.mkdir(parents=True, exist_ok=True)
    only = int(sys.argv[1]) if len(sys.argv) > 1 else None

    groups = [cands[i:i + PER_SHEET] for i in range(0, len(cands), PER_SHEET)]
    for n, group in enumerate(groups, 1):
        if only and n != only:
            continue
        ims = []
        for c in group:
            try:
                ims.append((c, strip(SRC / c['src'], c['page'], c['rot'])))
            except Exception as e:
                print(f'  skip {c["src"]} p{c["page"]}: {str(e)[:60]}')
        if not ims:
            continue
        w = max(i.width for _, i in ims)
        h = sum(i.height + 26 for _, i in ims)
        sheet = Image.new('RGB', (w, h), 'white')
        d = ImageDraw.Draw(sheet)
        y = 0
        for c, im in ims:
            d.text((6, y + 6), f'{c["src"][:46]}  p{c["page"]}  rot{c["rot"]}', fill='red')
            sheet.paste(im, (0, y + 24))
            y += im.height + 26
        path = OUT / f'sheet-{n:02d}.png'
        sheet.save(path)
        print(f'{path}  ({len(ims)} pages)')

    print(f'\n{len(cands)} candidates, {len(groups)} sheets')


if __name__ == '__main__':
    main()
