"""
Crops the top of each multi-question block's question page, for reading.

Splitting on text works only as far as the model transcribed the (a) (b) (c)
labels. Where it dropped them, splitting becomes guesswork and gets it wrong:
Abhinav-Tyagi-5 prints five parts on the page and the text yielded only four,
because (d) ends without a directive and (e) opens with "The revolutionary...".
No rule can catch that difference, because the difference is not in the text.

The printed page says it plainly. All the parts sit together on one page, each
with its label and its marks. So the top of each block's first page is cropped,
three to an image, and the real question list is read off those.

Local work only, no API calls.

    python3 scripts/topper/qpages.py
"""
import concurrent.futures as cf
import json
import subprocess
import tempfile
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

from PIL import Image, ImageDraw

SRC = Path.home() / 'Desktop' / 'Topper Copies'
WORK = _work.WORK
OUT = WORK / 'qpages'

# The top half of the page, at full width.
#
# This was a quarter at first, and it cut off Abhinav-Tyagi-13's (d) and (e).
# Neither was in the model's transcription either, so the sheet was the only
# place they could have shown up, and they did not. A smaller crop fits more
# blocks per sheet, but a sheet that cuts away the very thing you came to find
# is worth nothing.
BAND = 0.56
RENDER = 1700
PER_SHEET = 2
WORKERS = 7


def band(pdf: Path, page: int) -> Image.Image:
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-png', '-scale-to', str(RENDER), '-f', str(page),
                        '-l', str(page), '-singlefile', str(pdf), f'{d}/p'],
                       check=True, capture_output=True)
        im = Image.open(f'{d}/p.png').convert('RGB')
        return im.crop((0, 0, im.width, int(im.height * BAND)))


def main():
    blocks = json.loads((WORK / 'blocks.json').read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    todo = [b for b in blocks if not (OUT / f'q-{b["file"][:-4]}.png').exists()]
    print(f'{len(blocks)} blocks, {len(todo)} ke question page banane hain\n', flush=True)

    groups = [blocks[i:i + PER_SHEET] for i in range(0, len(blocks), PER_SHEET)]
    for n, group in enumerate(groups, 1):
        path = OUT / f'sheet-{n:02d}.png'
        if path.exists():
            continue
        with cf.ThreadPoolExecutor(WORKERS) as ex:
            futs = {ex.submit(band, SRC / b['src'], b['a']): b for b in group}
            got = {}
            for f in cf.as_completed(futs):
                try:
                    got[futs[f]['file']] = f.result()
                except Exception:
                    pass
        ims = [(b, got[b['file']]) for b in group if b['file'] in got]
        if not ims:
            continue
        w = max(i.width for _, i in ims)
        h = sum(i.height + 26 for _, i in ims)
        sheet = Image.new('RGB', (w, h), 'white')
        d = ImageDraw.Draw(sheet)
        y = 0
        for b, im in ims:
            d.text((6, y + 6), f'{b["file"]}  p{b["a"]}-{b["b"]}  '
                               f'(text se {len(b["parts"])} parts bane)', fill='red')
            sheet.paste(im, (0, y + 24))
            y += im.height + 26
        sheet.save(path)
        print(f'  {path.name}  {[b["file"] for b in group]}', flush=True)


if __name__ == '__main__':
    main()
