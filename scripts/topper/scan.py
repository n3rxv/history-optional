"""
Reads every page of a booklet and reports where each question begins.

One model call per page does both jobs at once: whether a printed question
starts here, and what it says. Splitting those into a cheap detector and an
expensive reader was the original design, and measurement killed it. The
tesseract heuristic topped out at 90.7% recall against the hand splits, which
means roughly one question in eleven silently welded onto its neighbour, while
a page costs $0.004 to read properly. The heuristic survives only as a free
second opinion: where it and the model disagree, the page is worth a look.

    python3 scripts/topper/scan.py "<source>.pdf"
"""
import json, os, sys, concurrent.futures as cf
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

sys.path.insert(0, str(Path(__file__).parent))
import importlib.util
_s = importlib.util.spec_from_file_location('readq', Path(__file__).parent / 'readq.py')
readq = importlib.util.module_from_spec(_s); _s.loader.exec_module(readq)
_d = importlib.util.spec_from_file_location('detect', Path(__file__).parent / 'detect.py')
detect = importlib.util.module_from_spec(_d); _d.loader.exec_module(detect)

SRC  = Path.home() / 'Desktop' / 'Topper Copies'
WORK = _work.WORK
THREADS = 8          # network-bound, so threads not processes

def page(pdf: Path, p: int) -> dict:
    try:
        q = readq.read_question(pdf, p)
    except Exception as e:
        return {'page': p, 'q': None, 'error': str(e)[:120]}
    q = None if q.strip().upper().startswith('NONE') else q
    # free second opinion from the local heuristic
    try:
        h = detect.is_start(detect.features(detect.strip_text(pdf, p)))
    except Exception:
        h = None
    return {'page': p, 'q': q, 'ocr_says_start': h}

def scan(name: str):
    pdf = Path(name) if os.path.exists(name) else SRC / name
    n = detect.npages(pdf)
    print(f'{pdf.name}: {n} pages, reading with {THREADS} threads', flush=True)
    rows = [None] * n
    done = 0
    with cf.ThreadPoolExecutor(THREADS) as ex:
        futs = {ex.submit(page, pdf, p): p for p in range(1, n + 1)}
        for f in cf.as_completed(futs):
            r = f.result(); rows[r['page'] - 1] = r; done += 1
            if done % 5 == 0: print(f'  {done}/{n}', flush=True)

    starts = [r['page'] for r in rows if r.get('q')]
    print(f'\nquestions found: {len(starts)}  at pages {starts}\n')
    for r in rows:
        if r.get('error'): print(f'  p{r["page"]:02d} ERROR {r["error"]}'); continue
        flag = ' ' if r['ocr_says_start'] == bool(r['q']) else '!'
        if r['q']: print(f'{flag} p{r["page"]:02d} START  {r["q"][:96]}')
        else:      print(f'{flag} p{r["page"]:02d} .')
    dis = sum(1 for r in rows if r.get('ocr_says_start') != bool(r.get('q')))
    print(f'\nheuristic disagreed on {dis}/{n} pages (marked !)')
    out = WORK / f'scan-{pdf.stem}.json'
    out.write_text(json.dumps({'file': pdf.name, 'pages': n, 'starts': starts, 'rows': rows}, indent=1))
    print(f'saved {out}')

if __name__ == '__main__':
    for a in sys.argv[1:]: scan(a)
