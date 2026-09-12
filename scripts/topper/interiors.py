"""
Extracts text from pages inside long ranges, to surface missed questions.

When a question boundary is not detected, its pages end up inside the previous
question's PDF. That is what happened in two of Aditya Kaushik's files: p17-26
held a question that only ran to p19, and p41-46 had two questions run
together.

Local tesseract only, no API and no cost. A printed question comes out legible
and handwriting comes out as noise, and that difference is what says whether a
new question starts on the page.

    python3 scripts/topper/interiors.py          write everything
    python3 scripts/topper/interiors.py --likely only pages that look like a new question
"""
import argparse
import concurrent.futures as cf
import hashlib
import json
import os
import re
import subprocess
import tempfile
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

SRC = Path.home() / 'Desktop' / 'Topper Copies'
WORK = _work.WORK
CACHE = WORK / 'interior-cache'
WORKERS = 7
TOP = 0.34

MARKS = re.compile(r'[\[\(]\s*\d{1,3}\s*(?:x\s*[\d.]+\s*=\s*\d+\s*)?marks?\s*[\]\)\}]', re.I)
QNUM = re.compile(r'(?:^|\s)(?:Q\s*\.?\s*)?\d{1,2}\s*[.\)]\s*\(?[a-e]\)?[\s.)]', re.I)


def lexicon():
    words = set()
    p = '/usr/share/dict/words'
    if os.path.exists(p):
        words |= {w.strip().lower() for w in open(p, errors='ignore') if len(w.strip()) > 2}
    pyq = Path(__file__).resolve().parents[2] / 'lib' / 'pyqData.ts'
    if pyq.exists():
        for m in re.finditer(r'question: "((?:[^"\\]|\\.)*)"', pyq.read_text(errors='ignore')):
            words |= {w.lower() for w in re.findall(r"[A-Za-z][A-Za-z'-]{2,}", m.group(1))}
    return words


DICT = lexicon()


def ocr(pdf: Path, page: int) -> str:
    key = hashlib.md5(f'{pdf}:{page}:{TOP}:i'.encode()).hexdigest()[:12]
    CACHE.mkdir(parents=True, exist_ok=True)
    txt = CACHE / f'{key}.txt'
    if txt.exists():
        return txt.read_text()
    png = CACHE / f'{key}.png'
    if not png.exists():
        subprocess.run(['pdftoppm', '-png', '-scale-to', '1700', '-f', str(page),
                        '-l', str(page), '-singlefile', str(pdf), str(CACHE / key)],
                       check=True, capture_output=True)
        from PIL import Image
        im = Image.open(png)
        im.crop((0, 0, im.width, int(im.height * TOP))).save(png)
    r = subprocess.run(['tesseract', str(png), 'stdout', '--psm', '6'],
                       capture_output=True, text=True)
    out = '\n'.join(' '.join(l.split()) for l in r.stdout.splitlines() if l.strip())
    txt.write_text(out)
    return out


def score(text: str):
    """The most English-looking line, and its longest run of real words."""
    best = (0.0, 0, '')
    for line in text.splitlines():
        toks = re.findall(r"[A-Za-z][A-Za-z'-]{2,}", line)
        if len(toks) < 5:
            continue
        r = sum(1 for w in toks if w.lower().strip("'-") in DICT) / len(toks)
        if r > best[0]:
            best = (round(r, 2), len(toks), ' '.join(line.split()))
    toks = re.findall(r"[A-Za-z][A-Za-z'-]{2,}", text)
    run = cur = 0
    for w in toks:
        cur = cur + 1 if w.lower().strip("'-") in DICT else 0
        run = max(run, cur)
    return {'line': best[0], 'toks': best[1], 'text': best[2],
            'run': run, 'marks': bool(MARKS.search(text)), 'qnum': bool(QNUM.search(text))}


def likely(s):
    return s['run'] >= 5 or (s['line'] >= 0.70 and s['toks'] >= 6) or s['marks']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--likely', action='store_true')
    a = ap.parse_args()

    uniq = json.loads((WORK / 'unique.json').read_text())
    targets = [r for r in uniq if r['pages'] > 4]

    jobs = []
    for r in targets:
        for p in range(r['a'] + 1, r['b'] + 1):
            jobs.append((r, p))

    print(f'{len(targets)} rows, {len(jobs)} interior pages\n', flush=True)
    results = []

    def go(job):
        r, p = job
        try:
            return r, p, score(ocr(SRC / r['src'], p))
        except Exception as e:
            return r, p, {'line': 0, 'toks': 0, 'text': f'ERR {e}', 'run': 0,
                          'marks': False, 'qnum': False}

    done = 0
    with cf.ThreadPoolExecutor(WORKERS) as ex:
        for r, p, s in ex.map(go, jobs):
            results.append({'file': r['file'], 'src': r['src'], 'note': r['note'],
                            'range': [r['a'], r['b']], 'page': p, **s})
            done += 1
            if done % 50 == 0:
                print(f'  {done}/{len(jobs)}', flush=True)

    results.sort(key=lambda x: (x['src'], x['page']))
    (WORK / 'interiors.json').write_text(json.dumps(results, indent=1))

    hits = [x for x in results if likely(x)]
    show = hits if a.likely else results
    cur = None
    for x in show:
        if x['file'] != cur:
            cur = x['file']
            print(f'\n{x["file"]}  p{x["range"][0]}-{x["range"][1]}  {x["src"][:44]}')
        flag = '  <<<' if likely(x) else ''
        print(f'   p{x["page"]:<4} run={x["run"]:<2} line={x["line"]:.2f} '
              f'm={int(x["marks"])} {x["text"][:74]!r}{flag}')
    print(f'\n{len(hits)} interior pages may start a new question')


if __name__ == '__main__':
    main()
