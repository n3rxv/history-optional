"""
Prints the current state of the scan once, then exits.

It does not loop, so Claude Code will not push it into the background. Run it
again whenever you want another look.

    python3 scripts/topper/status.py          once
    python3 scripts/topper/status.py --loop   every 5 seconds, ctrl-C to stop
"""
import glob
import json
import os
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

SRC = Path.home() / 'Desktop' / 'Topper Copies'
WORK = _work.WORK
PAGE_CACHE = WORK / 'pagecounts.json'
RATE = 0.00055          # dollars per page, measured on mistral-medium


def page_counts():
    """
    Page count per source, cached.

    Without the cache this opened all 50 PDFs every time, one of which is 551
    pages, and simply showing the status took several seconds. Page counts do
    not change, so working them out once is enough.
    """
    cache = {}
    if PAGE_CACHE.exists():
        try:
            cache = json.loads(PAGE_CACHE.read_text())
        except Exception:
            cache = {}
    changed = False
    import logging
    logging.getLogger('pypdf').setLevel(logging.ERROR)
    import pypdf
    for p in SRC.glob('*.pdf'):
        if re.match(r'^[A-Za-z-]+-\d+\.pdf$', p.name):
            continue
        if p.name in cache:
            continue
        try:
            cache[p.name] = len(pypdf.PdfReader(str(p)).pages)
        except Exception:
            cache[p.name] = 0
        changed = True
    if changed:
        WORK.mkdir(parents=True, exist_ok=True)
        PAGE_CACHE.write_text(json.dumps(cache))
    return cache


def render():
    counts = page_counts()
    srcs = sorted(counts)
    scans = sorted(glob.glob(str(WORK / 'scan-*.json')))
    data = []
    for f in scans:
        try:
            data.append(json.load(open(f)))
        except Exception:
            pass

    done_stems = {Path(f).stem[5:] for f in scans}
    left = [s for s in srcs if Path(s).stem not in done_stems]

    pages = sum(x['pages'] for x in data)
    qs = sum(len(x['starts']) for x in data)
    left_pages = sum(counts[s] for s in left)

    # When the run started, taken from the oldest scan file.
    #
    # This used the log's ctime at first, which was wrong: ctime changes on
    # every write, so writing a line to the log reset "elapsed" to almost
    # nothing and the rate read 65,587 pages/min.
    mtimes = [os.path.getmtime(f) for f in scans]
    elapsed = max(time.time() - min(mtimes), 1) if mtimes else 1
    rate = pages / elapsed

    width = 40
    frac = len(scans) / len(srcs) if srcs else 0
    out = []
    out.append(f'  [{"#" * int(width * frac):<{width}}] {len(scans)}/{len(srcs)} sources  {frac:5.1%}')
    out.append('')
    out.append(f'  pages read       {pages:>6,}')
    out.append(f'  questions found  {qs:>6,}')
    out.append(f'  pages left       {left_pages:>6,}')
    if rate > 0.01:
        out.append(f'  rate             {rate * 60:>6.0f} pages/min')
        out.append(f'  eta              {left_pages / rate / 60:>6.0f} min')
    out.append(f'  kharcha          ${pages * RATE:>6.2f}  of $9.99')
    out.append('')
    if left:
        out.append(f'  abhi chal rahi   {left[0][:58]}')
        if len(left) > 1:
            out.append(f'  baaki            {len(left) - 1} sources')
    else:
        out.append('  SAB KHATAM')
    out.append('')
    out.append('  abhi abhi hui:')
    recent = sorted(data, key=lambda x: -os.path.getmtime(
        str(WORK / f'scan-{x["file"][:-4]}.json')))[:5]
    for x in recent:
        out.append(f'    {len(x["starts"]):>3} q  {x["pages"]:>3}p  {x["file"][:52]}')
    return '\n'.join(out)


# Claude Code pushes a command into the background after 120 seconds, where
# its output stops being visible. So the loop stops itself at 110: it stays on
# screen, never goes background, and you run it again.
LOOP_SECONDS = 110

if __name__ == '__main__':
    if '--loop' in sys.argv:
        end = time.time() + LOOP_SECONDS
        try:
            while time.time() < end:
                left = int(end - time.time())
                print('\033[2J\033[H' + render()
                      + f'\n  (stops on its own in {left}s, '
                        f'run it again)', flush=True)
                time.sleep(5)
        except KeyboardInterrupt:
            pass
    else:
        print(render())
