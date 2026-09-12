"""
Finds where each question begins inside a topper's answer booklet.

The booklets are scans, so there is no text layer to read. What makes them
tractable is that the question is PRINTED and the answer is HANDWRITTEN:
tesseract reads the former cleanly and the latter as noise. So a page whose
top strip OCRs into real English starts a question, and a page whose top strip
OCRs into rubbish continues the previous one.

Nothing here reads the handwriting, and nothing here rewrites a PDF. This
stage only decides where the cuts go.

Both the render and the OCR are cached on disk, and the scored features of
every page are written to features.json. That matters more than it sounds:
tuning the thresholds is then instant, because it re-scores saved features
instead of re-OCR'ing seven hundred pages.

    python3 scripts/topper/detect.py --validate    measure against hand splits
    python3 scripts/topper/detect.py <file.pdf>    boundaries for one booklet
"""
import argparse, json, os, re, subprocess, sys, tempfile, hashlib, time
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work
from multiprocessing import Pool

SRC   = Path.home() / 'Desktop' / 'Topper Copies'
WORK  = _work.WORK
CACHE = WORK / 'cache'
DPI = 120
TOP_FRACTION = 0.30
WORKERS = 7                      # of 8 cores, leaving one for the machine

RE_MARKS = re.compile(r'[\[\(]\s*\d{1,3}\s*(?:x\s*[\d.]+\s*=\s*\d+\s*)?marks?\s*[\]\)\}]', re.I)
RE_QNUM  = re.compile(r'^\W{0,4}(?:Q\W{0,3})?\d{1,2}\s*[.\):]?\s*(?:\(?[a-e]\)?)?[\s.)]', re.I)

def _lexicon():
    """
    English, widened by the vocabulary of the exam itself.

    The system dictionary does not contain Harappan, Rajatarangini, Din-i-Ilahi
    or Akbar, so a printed history question breaks its own word-run on exactly
    the terms that prove it is a question. lib/pyqData.ts is 1,584 UPSC history
    questions, which is a ready-made lexicon of this vocabulary and costs
    nothing to reuse. Handwriting gains nothing from it, so the gap widens.
    """
    words = set()
    p = '/usr/share/dict/words'
    if os.path.exists(p):
        words |= {w.strip().lower() for w in open(p, encoding='utf-8', errors='ignore')
                  if len(w.strip()) > 2}
    pyq = Path(__file__).resolve().parents[2] / 'lib' / 'pyqData.ts'
    if pyq.exists():
        for m in re.finditer(r'question: "((?:[^"\\]|\\.)*)"', pyq.read_text(encoding='utf-8')):
            try: q = json.loads('"' + m.group(1) + '"')
            except Exception: q = m.group(1)
            words |= {w.lower() for w in re.findall(r"[A-Za-z][A-Za-z'-]{2,}", q)}
    return words
DICT = _lexicon()

def strip_text(pdf: Path, page: int) -> str:
    """Top third of a page as OCR'd text. Cached, because OCR is the slow part."""
    key = hashlib.md5(f'{pdf}:{page}:{DPI}:{TOP_FRACTION}'.encode()).hexdigest()[:16]
    # v2: text is cached with its line breaks intact, because the `line`
    # feature needs them. Bumping the suffix rather than clearing the cache
    # keeps the expensive pdftoppm renders and re-runs only tesseract.
    txt = CACHE / f'{key}.v2.txt'
    if txt.exists():
        return txt.read_text(encoding='utf-8')
    CACHE.mkdir(parents=True, exist_ok=True)
    # The full render and the crop are kept as separate files. They used to be
    # the same file, which meant a second run cropped an already-cropped image
    # down to nine per cent of the page: the question was gone and recall fell
    # to fifteen per cent. A cache entry must never be a lossy version of what
    # the next run expects to read.
    full = CACHE / f'{key}.full.png'
    strip = CACHE / f'{key}.strip.png'
    if not strip.exists():
        if not full.exists():
            subprocess.run(['pdftoppm', '-png', '-r', str(DPI), '-f', str(page), '-l', str(page),
                            '-singlefile', str(pdf), str(CACHE / f'{key}.full')],
                           check=True, capture_output=True)
        from PIL import Image
        im = Image.open(full)
        im.crop((0, 0, im.width, int(im.height * TOP_FRACTION))).save(strip)
        full.unlink(missing_ok=True)          # the strip is all we ever read again
    r = subprocess.run(['tesseract', str(strip), 'stdout', '--psm', '6'],
                       capture_output=True, text=True)
    out = '\n'.join(' '.join(l.split()) for l in r.stdout.splitlines() if l.strip())
    txt.write_text(out, encoding='utf-8')
    return out

def features(text: str) -> dict:
    """
    The whole-strip English ratio turned out to be the wrong measure: printed
    question and handwritten answer share the strip, so the handwriting dilutes
    the ratio and a real question scores 0.3 as often as 0.6. Measured on the
    hand splits, it separated the two classes barely at all.

    What does separate them is that a printed line is CONTIGUOUS real words.
    Handwriting OCRs to noise that never yields a run of them, whatever its
    overall ratio. So `run` (longest consecutive in-lexicon words) and `line`
    (the most word-like single line) are the features that carry the decision;
    the old ratio is kept only as a weak tiebreak.
    """
    toks = re.findall(r"[A-Za-z][A-Za-z'-]{2,}", text)
    known = [w for w in toks if w.lower().strip("'-") in DICT]

    run = cur = 0
    for w in toks:
        cur = cur + 1 if w.lower().strip("'-") in DICT else 0
        run = max(run, cur)

    line_ratio, line_toks = 0.0, 0
    for ln in text.splitlines():
        lt = re.findall(r"[A-Za-z][A-Za-z'-]{2,}", ln)
        if len(lt) < 5: continue
        r = sum(1 for w in lt if w.lower().strip("'-") in DICT) / len(lt)
        if r > line_ratio: line_ratio, line_toks = r, len(lt)

    return {
        'text': ' '.join(text.split())[:200],
        'tokens': len(toks),
        'english': round(len(known) / len(toks), 3) if toks else 0.0,
        'run': run,
        'line': round(line_ratio, 3),
        'line_toks': line_toks,
        'marks': bool(RE_MARKS.search(text)),
        'qnum': bool(RE_QNUM.search(text)),
    }

def is_start(f: dict) -> bool:
    """
    A printed line is a run of consecutive real words; handwriting noise never
    is, whatever its overall ratio. `run` and `line` carry the decision, and
    the marks tag and question number rescue a page whose scan came out badly.

    Tuned for recall over precision deliberately: a miss welds two questions
    into one PDF and hides until someone opens it, while a false alarm cuts an
    answer in two and is obvious at a glance on the review page.
    """
    if f['run'] >= 5: return True
    if f['line'] >= 0.70 and f['line_toks'] >= 6: return True
    if f['marks'] and f['run'] >= 3: return True
    if f['qnum'] and f['run'] >= 3: return True
    return False

def npages(pdf: Path) -> int:
    import pypdf
    return len(pypdf.PdfReader(str(pdf)).pages)

def _job(t):
    path, page, label = t
    try:
        f = features(strip_text(Path(path), page))
    except Exception as e:
        f = {'text': f'ERROR {e}', 'tokens': 0, 'english': 0.0, 'marks': False, 'qnum': False}
    f['file'] = Path(path).name; f['page'] = page; f['label'] = label
    return f

def validate():
    """
    Ground truth for free: page 1 of every hand-split file is a known question
    start, and every interior page is a known continuation.
    """
    WORK.mkdir(parents=True, exist_ok=True)
    splits = sorted(p for p in SRC.glob('*.pdf') if re.match(r'^[A-Za-z-]+-\d+\.pdf$', p.name))
    tasks = []
    for f in splits:
        n = npages(f)
        tasks.append((str(f), 1, 1))
        for p in range(2, n + 1):
            tasks.append((str(f), p, 0))          # every interior page, not a sample
    total = len(tasks)
    prog = WORK / 'progress.txt'
    prog.write_text(f'0/{total} starting\n')
    print(f'{len(splits)} hand-split files, {total} pages to read, {WORKERS} workers')
    print(f'live: tail -f {prog}\n', flush=True)

    done = 0; t0 = time.time(); results = []
    with Pool(WORKERS) as pool:
        for f in pool.imap_unordered(_job, tasks, chunksize=4):
            results.append(f); done += 1
            if done % 5 == 0 or done == total:
                el = time.time() - t0
                rate = done / el if el else 0
                eta = (total - done) / rate if rate else 0
                hit  = sum(1 for r in results if r['label'] == 1 and is_start(r))
                miss = sum(1 for r in results if r['label'] == 1 and not is_start(r))
                fa   = sum(1 for r in results if r['label'] == 0 and is_start(r))
                bar = '#' * int(30 * done / total)
                prog.write_text(
                    f'[{bar:<30}] {done}/{total} pages  {100*done/total:5.1f}%\n'
                    f'{rate:.1f} pages/s   eta {eta/60:4.1f} min\n'
                    f'starts found {hit}   missed {miss}   false alarms {fa}\n')
    (WORK / 'features.json').write_text(json.dumps(results))
    prog.write_text(f'[{"#"*30}] {total}/{total} pages  100.0%  done in {(time.time()-t0)/60:.1f} min\n')
    report(results)

def report(results):
    tp = [r for r in results if r['label'] == 1 and is_start(r)]
    fn = [r for r in results if r['label'] == 1 and not is_start(r)]
    fp = [r for r in results if r['label'] == 0 and is_start(r)]
    tn = [r for r in results if r['label'] == 0 and not is_start(r)]
    print('\n--- question starts (page 1 of each hand-split file) ---')
    print(f'  found  : {len(tp)}')
    print(f'  missed : {len(fn)}      recall {len(tp)/(len(tp)+len(fn)):.1%}')
    print('--- continuations (every interior page) ---')
    print(f'  skipped     : {len(tn)}')
    print(f'  false alarms: {len(fp)}   precision {len(tp)/(len(tp)+len(fp)):.1%}')
    print('\nMISSED (would weld two questions into one file):')
    for r in sorted(fn, key=lambda r: -r['tokens'])[:15]:
        print(f'  {r["file"]:32s} en={r["english"]:.2f} tok={r["tokens"]:3d} m={int(r["marks"])} q={int(r["qnum"])} {r["text"][:70]!r}')
    print('\nFALSE ALARMS (would cut one answer in two):')
    for r in sorted(fp, key=lambda r: -r['english'])[:15]:
        print(f'  {r["file"]:32s} p{r["page"]} en={r["english"]:.2f} tok={r["tokens"]:3d} {r["text"][:70]!r}')

def retune():
    """Re-score saved features with the current thresholds. No OCR, instant."""
    report(json.loads((WORK / 'features.json').read_text()))

def sweep():
    """
    Search the threshold grid against the hand splits.

    The two errors are not worth the same. A miss welds two questions into one
    PDF and stays invisible until somebody opens the file; a false alarm cuts an
    answer in half and is obvious at a glance on the review page. So this ranks
    by recall and treats precision as a budget rather than a goal: find the
    highest recall that still keeps false alarms down to something a person can
    skim, and report the frontier so the trade is visible rather than assumed.
    """
    rows = json.loads((WORK / 'features.json').read_text())
    pos = [r for r in rows if r['label'] == 1]
    neg = [r for r in rows if r['label'] == 0]

    def rule(f, run_hi, line_hi, line_tok, run_aid):
        if f['run'] >= run_hi: return True
        if f['line'] >= line_hi and f['line_toks'] >= line_tok: return True
        if (f['marks'] or f['qnum']) and f['run'] >= run_aid: return True
        return False

    best = []
    for run_hi in (3, 4, 5, 6, 7, 8):
        for line_hi in (0.60, 0.65, 0.70, 0.75, 0.80, 0.85):
            for line_tok in (5, 6, 8, 10):
                for run_aid in (2, 3, 4, 5, 99):
                    p = sum(1 for f in pos if rule(f, run_hi, line_hi, line_tok, run_aid))
                    n = sum(1 for f in neg if rule(f, run_hi, line_hi, line_tok, run_aid))
                    best.append((p / len(pos), p / (p + n) if p + n else 0, n,
                                 (run_hi, line_hi, line_tok, run_aid)))

    best.sort(key=lambda x: (-x[0], x[2]))
    print(f'{len(pos)} known starts, {len(neg)} known continuations\n')
    print(f'{"recall":>7} {"prec":>6} {"false alarms":>13}   run_hi line_hi line_tok run_aid')
    seen = set()
    for recall, prec, n, params in best:
        k = round(recall, 3)
        if k in seen: continue          # one row per recall level, the cheapest
        seen.add(k)
        print(f'{recall:7.1%} {prec:6.1%} {n:13d}   {params}')
        if len(seen) >= 14: break

def detect(pdf: Path):
    n = npages(pdf)
    rows = [_job((str(pdf), p, -1)) for p in range(1, n + 1)]
    for r in rows: r['start'] = is_start(r)
    print(json.dumps({'file': pdf.name, 'pages': n,
                      'starts': [r['page'] for r in rows if r['start']],
                      'detail': rows}, indent=1))

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf', nargs='?')
    ap.add_argument('--validate', action='store_true')
    ap.add_argument('--retune', action='store_true')
    ap.add_argument('--sweep', action='store_true')
    a = ap.parse_args()
    if a.validate: validate()
    elif a.retune: retune()
    elif a.sweep: sweep()
    elif a.pdf: detect(Path(a.pdf) if os.path.exists(a.pdf) else SRC / a.pdf)
    else: ap.error('give a pdf, --validate, --retune or --sweep')
