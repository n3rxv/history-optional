"""
Re-reads every page rotated, to recover questions missed on sideways pages.

The scan read pages upright. In a booklet that was scanned rotated, the
printed question never fell inside the crop at all, and the page looked like
an ordinary answer page. Both detectors stayed silent and no error was raised.

This is established, not suspected: 6 of the 15 questions in Samiksha's Modern
Sectional VI were missed for this reason, and three more turned up inside
Medieval Full Test II.

Checking the /Rotate flag is not enough. The two files that lost the most
questions carry no flag at all: the scan itself is crooked and the PDF knows
nothing about it. So every page of every source is re-read both ways here.

Runs tesseract only. No API, no cost.

    python3 scripts/topper/sweep_rot.py
"""
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

from PIL import Image

SRC = Path.home() / 'Desktop' / 'Topper Copies'
WORK = _work.WORK
CACHE = WORK / 'rot-cache'
WORKERS = 7
TOP = 0.34

# Reliable signs of a question. The marks tag is the strongest: handwriting
# never produces "[10 Marks]", it is always printed.
MARKS = re.compile(r'[\[\(\{]\s*\d{1,3}\s*(?:x\s*[\d.]+\s*=\s*\d+\s*)?marks?\s*[\]\)\}]', re.I)
DIRECTIVE = re.compile(
    r'\b(discuss|examine|analyse|analyze|comment|elaborate|evaluate|explain|'
    r'critically|substantiate|justify|elucidate|assess|how far|to what extent|'
    r'do you agree)\b', re.I)
NOISE = re.compile(
    r'upscpdf|prepcareer|vikas ahlawat|selfstudyhistory|levelup|copyright|'
    r'gs\s*score|don.t write|candidates must|max\.?\s*marks|time allowed|'
    r'instructions|history test series|india with|afghanistan|write on|'
    r'this margin|former civil servant', re.I)


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


def ocr(pdf: Path, page: int, deg: int) -> str:
    key = hashlib.md5(f'{pdf}:{page}:{deg}:r'.encode()).hexdigest()[:12]
    CACHE.mkdir(parents=True, exist_ok=True)
    txt = CACHE / f'{key}.txt'
    if txt.exists():
        return txt.read_text()
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(['pdftoppm', '-png', '-scale-to', '1700', '-f', str(page),
                        '-l', str(page), '-singlefile', str(pdf), f'{d}/p'],
                       check=True, capture_output=True)
        im = Image.open(f'{d}/p.png')
        if deg:
            im = im.rotate(-deg, expand=True)
        im.crop((0, 0, im.width, int(im.height * TOP))).save(f'{d}/c.png')
        r = subprocess.run(['tesseract', f'{d}/c.png', 'stdout', '--psm', '6'],
                           capture_output=True, text=True)
    out = '\n'.join(' '.join(l.split()) for l in r.stdout.splitlines() if l.strip())
    txt.write_text(out)
    return out


def question_line(text: str):
    """The best line on the page that looks like a printed question."""
    best = None
    for line in text.splitlines():
        if NOISE.search(line):
            continue
        toks = re.findall(r"[A-Za-z][A-Za-z'-]{2,}", line)
        if len(toks) < 7:
            continue
        eng = sum(1 for w in toks if w.lower().strip("'-") in DICT) / len(toks)
        if eng < 0.72:
            continue
        # marks tag or directive, or this could just be tidy handwriting
        strong = bool(MARKS.search(line)) or bool(DIRECTIVE.search(line))
        score = eng + (0.5 if MARKS.search(line) else 0) + (0.25 if DIRECTIVE.search(line) else 0)
        if strong and (best is None or score > best[0]):
            best = (score, round(eng, 2), len(toks), ' '.join(line.split())[:110])
    return best


def main():
    scans = sorted(WORK.glob('scan-*.json'))
    jobs = []
    known = {}
    for sp in scans:
        d = json.loads(sp.read_text())
        known[d['file']] = set(d['starts'])
        for r in d['rows']:
            if r.get('q'):
                continue                      # a question was already found here
            jobs.append((d['file'], r['page']))

    print(f'{len(jobs)} pages, har ek 270 aur 90 par\n', flush=True)
    out = []

    def go(job):
        name, page = job
        for deg in (270, 90):
            try:
                hit = question_line(ocr(SRC / name, page, deg))
            except Exception:
                hit = None
            if hit:
                return name, page, deg, hit
        return name, page, None, None

    import time
    prog = WORK / 'sweep-progress.txt'
    started = time.time()
    done = 0

    def tick(now_on, last_hit):
        el = max(time.time() - started, 1)
        rate = done / el
        eta = (len(jobs) - done) / rate / 60 if rate else 0
        bar = '#' * int(34 * done / max(len(jobs), 1))
        prog.write_text(
            f'  ROTATED PAGE SWEEP\n'
            f'  [{bar:<34}] {done}/{len(jobs)}  {100 * done / max(len(jobs), 1):5.1f}%\n\n'
            f'  missed questions found {len(out):>5}\n'
            f'  rate                   {rate * 60:>5.0f} pages/min\n'
            f'  eta                    {eta:>5.0f} min\n'
            f'  cost                   $0.00  (all local, no API)\n\n'
            f'  now on                 {now_on[:56]}\n'
            f'  last hit               {last_hit[:56]}\n')

    last_hit = '-'
    with cf.ThreadPoolExecutor(WORKERS) as ex:
        for name, page, deg, hit in ex.map(go, jobs):
            done += 1
            if hit:
                out.append({'src': name, 'page': page, 'rot': deg,
                            'eng': hit[1], 'toks': hit[2], 'text': hit[3]})
                last_hit = f'{name[:34]} p{page}'
                print(f'  HIT {name[:40]} p{page} rot{deg}  {hit[3][:62]}', flush=True)
            if done % 10 == 0:
                tick(name, last_hit)
    tick('khatam', last_hit)
    prog.write_text(prog.read_text().replace('KA SWEEP', 'KA SWEEP - KHATAM'))

    out.sort(key=lambda x: (x['src'], x['page']))
    (WORK / 'rot_candidates.json').write_text(json.dumps(out, indent=1))
    print(f'\n{len(out)} pages me ghumi hui haalat me question mila\n')
    cur = None
    for x in out:
        if x['src'] != cur:
            cur = x['src']
            print(f'\n{cur}')
        print(f'  p{x["page"]:<4} rot{x["rot"]} eng={x["eng"]:.2f}  {x["text"][:92]!r}')


if __name__ == '__main__':
    main()
