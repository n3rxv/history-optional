"""
Joins the left edges of every page in a multi-question block into one image.

When a booklet holds three questions, each card has to know which page its
answer starts on. The candidate writes it himself: "3(b)", "3(c)", in the left
margin. But that is handwriting and tesseract cannot read it; what comes back
looks like this:

    'RY, Se SCAR | Ain ORY | Wae Of le | | er | selotyl'

So it has to be read by eye. Opening pages one at a time is far too slow, and
there is no need to see the whole page: the marker is always at the left edge.
So only that strip is cropped, several pages are laid side by side, and a whole
block can be read from a single image.

Local work only, no API calls.

    python3 scripts/topper/margins.py        every block
    python3 scripts/topper/margins.py 5      block number 5 only
"""
import concurrent.futures as cf
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

from PIL import Image, ImageDraw

HERE = Path(__file__).parent
SRC = Path.home() / 'Desktop' / 'Topper Copies'
WORK = _work.WORK
OUT = WORK / 'margins'

_s = importlib.util.spec_from_file_location('split_q', HERE / 'split_q.py')
split_q = importlib.util.module_from_spec(_s)
_s.loader.exec_module(split_q)

# The marker sits at the left edge, in the upper part of the page. Crop wider
# and fewer pages fit in one image; crop narrower and the marker can be lost.
LEFT = 0.30
TOP, BOTTOM = 0.08, 0.58
RENDER = 1500
PER_SHEET = 8
WORKERS = 7


def strip(pdf: Path, page: int) -> Image.Image:
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-png', '-scale-to', str(RENDER), '-f', str(page),
                        '-l', str(page), '-singlefile', str(pdf), f'{d}/p'],
                       check=True, capture_output=True)
        im = Image.open(f'{d}/p.png').convert('RGB')
        return im.crop((0, int(im.height * TOP),
                        int(im.width * LEFT), int(im.height * BOTTOM)))


def main():
    only = int(sys.argv[1]) if len(sys.argv) > 1 else None
    uniq = json.loads((WORK / 'unique.json').read_text())

    blocks = []
    for r in uniq:
        parts = split_q.split_questions(r['q'])
        if len(parts) > 1:
            blocks.append({**r, 'parts': parts})
    (WORK / 'blocks.json').write_text(json.dumps(blocks, indent=1))

    OUT.mkdir(parents=True, exist_ok=True)
    print(f'{len(blocks)} blocks tootne hain\n')

    for n, b in enumerate(blocks, 1):
        if only and n != only:
            continue
        # Name the sheet after the row, never after the block number.
        #
        # Numbering came first, and when the splitter was fixed one block
        # dropped out of the list. Every number after it shifted by one, so
        # sheet 40 held p260-267 while block 40 was p268-275. A name that
        # depends on list position starts lying the moment the list changes.
        stem = b['file'][:-4]
        if not only and list(OUT.glob(f'{stem}-*.png')):
            continue
        pdf = SRC / b['src']
        pages = list(range(b['a'], b['b'] + 1))
        chunks = [pages[i:i + PER_SHEET] for i in range(0, len(pages), PER_SHEET)]
        for ci, chunk in enumerate(chunks, 1):
            # Rendering is where all the time goes, and it is CPU work rather
            # than network. One at a time, 452 strips took two hours; in
            # parallel the same work takes minutes.
            strips = []
            with cf.ThreadPoolExecutor(WORKERS) as ex:
                futs = {ex.submit(strip, pdf, p): p for p in chunk}
                got = {}
                for f in cf.as_completed(futs):
                    try:
                        got[futs[f]] = f.result()
                    except Exception:
                        pass
            strips = [(p, got[p]) for p in chunk if p in got]
            if not strips:
                continue
            w = sum(s.width + 8 for _, s in strips)
            h = max(s.height for _, s in strips) + 24
            sheet = Image.new('RGB', (w, h), 'white')
            d = ImageDraw.Draw(sheet)
            x = 0
            for p, s in strips:
                d.text((x + 4, 5), f'p{p}', fill='red')
                sheet.paste(s, (x, 22))
                x += s.width + 8
            sheet.save(OUT / f'{stem}-{ci}.png')
        print(f'  block {n:02d}  {b["file"]:24s} p{b["a"]}-{b["b"]} '
              f'({b["pages"]}p, {len(b["parts"])} questions)  {b["src"][:34]}')


if __name__ == '__main__':
    main()
