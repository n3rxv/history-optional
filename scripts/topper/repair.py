"""
Finds transcriptions that came out wrong and reads those pages again, taller.

The crop is a third of the page, which is right for most booklets and wrong for
the ones where the printed question sits lower, under a running header or a
part-marker. When that happens the model reads only the tail of the question
and returns something like "Comment." or "Elaborate." That is a plausible
sentence, so nothing downstream would notice; it would simply become a row
heading that says nothing.

Length catches it. A real exam question is a sentence with a subject; a bare
directive is the tail of one. Suspect rows are read again from a taller strip,
and only replaced if the second read is longer and no longer suspect.

    python3 scripts/topper/repair.py            report what looks wrong
    python3 scripts/topper/repair.py --apply    re-read and rewrite the scans
"""
import argparse
import importlib.util
import json
import os
import re
import sys
import time
import concurrent.futures as cf
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

for line in open('.env.local'):
    m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
    if m and not os.environ.get(m.group(1)):
        os.environ[m.group(1)] = m.group(2).strip('"\'')


def load(name):
    spec = importlib.util.spec_from_file_location(name, HERE / f'{name}.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


readq = load('readq')

SRC = Path.home() / 'Desktop' / 'Topper Copies'
WORK = _work.WORK

MIN_CHARS = 30

# What to try, cheapest first. A taller crop reaches under a running header;
# the turns handle booklets scanned sideways or upside down. Order matters
# only for cost, since the first result that is a real question wins.
ATTEMPTS = [(0.55, 0), (0.40, 270), (0.40, 90), (0.40, 180)]

WORKERS = 8

# A booklet is "sparse" when it spends far too many pages per question.
#
# The first version measured questions per page, which was wrong: it counted
# History_Topper_Copies (64 questions, 551 pages) as sparse and sent all 551
# pages back to be re-read for nothing. That file is a GS Mains compilation
# where one answer runs 8-9 pages, which is entirely normal.
#
# Pages per question separates them cleanly:
#   sectional test          ~3 pages/question
#   full length paper       ~9 pages/question
#   Samiksha Modern Sec VI  15 pages/question   <- rotated pages
#   Sattwik Medieval III    26 pages, 0 questions
PAGES_PER_QUESTION_LIMIT = 12


def is_sparse(d) -> bool:
    if d['pages'] < 10:
        return False
    if not d['starts']:
        return True
    return d['pages'] / len(d['starts']) > PAGES_PER_QUESTION_LIMIT

# A question that is nothing but its own directive is the tail of one that got
# cropped off above.
BARE = re.compile(
    r'^\W*(comment|discuss|elaborate|explain|analyse|analyze|examine|evaluate|'
    r'critically examine|critically analyse|substantiate|justify)\W*$', re.I)


# Sometimes the model explains its reasoning instead of returning the
# question: "The printed text on this page is a full exam question as it
# contains a directive..." That reads as plausible prose, so nothing
# downstream stops it, and it would go straight into the database and become
# a heading on the website.
NARRATION = re.compile(
    r'^(the printed text|this page|the page|the question on this|there is no|'
    r'i (can|cannot|am)|based on the|the image shows|no printed question)',
    re.I)


def suspect(q: str) -> str | None:
    if not q:
        return None
    s = q.strip()
    if BARE.match(s):
        return 'bare directive'
    if NARRATION.match(s):
        return 'model narrating, not transcribing'
    if len(s) < MIN_CHARS:
        return f'only {len(s)} chars'
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    a = ap.parse_args()
    apply_changes = a.apply

    # Count the work first. Progress means nothing without it: "142 done"
    # says nothing until you know how many there are in total.
    scans = sorted(WORK.glob('scan-*.json'))
    todo = 0
    for sp in scans:
        dd = json.loads(sp.read_text())
        sp_sparse = is_sparse(dd)
        for r in dd['rows']:
            if suspect(r.get('q')) or (r.get('ocr_says_start') and not r.get('q')) \
               or (sp_sparse and not r.get('q')):
                todo += 1

    prog = WORK / 'repair-progress.txt'
    started = time.time()
    seen = 0

    def tick(label):
        el = max(time.time() - started, 1)
        rate = seen / el
        eta = (todo - seen) / rate / 60 if rate > 0 else 0
        bar = '#' * int(34 * seen / max(todo, 1))
        prog.write_text(
            f'  REPAIR\n'
            f'  [{bar:<34}] {seen}/{todo} pages  {100 * seen / max(todo, 1):5.1f}%\n\n'
            f'  recovered      {fixed:>5}\n'
            f'  rate           {rate * 60:>5.0f} pages/min\n'
            f'  eta            {eta:>5.0f} min\n'
            f'  kharcha        ${seen * 4 * 0.00055:>5.2f}  (upto 4 tries per page)\n\n'
            f'  abhi           {label[:58]}\n')

    total = fixed = 0

    def attempt(job):
        """One page, every attempt, until a real question comes back."""
        pdf, page = job
        for frac, deg in ATTEMPTS:
            try:
                got = readq.read_question(pdf, page, frac=frac, rotate=deg)
            except Exception:
                continue
            if got.upper().startswith('NONE') or suspect(got):
                continue
            return page, frac, deg, got
        return page, None, None, None

    for scan_path in scans:
        d = json.loads(scan_path.read_text())
        pdf = SRC / d['file']
        sparse = is_sparse(d)
        if sparse:
            print(f'{d["file"]}: {len(d["starts"])} questions in {d["pages"]} pages, '
                  f're-reading every page', flush=True)

        by_page = {r['page']: r for r in d['rows']}
        jobs = []
        for row in d['rows']:
            why = suspect(row.get('q'))
            if not why and row.get('ocr_says_start') and not row.get('q'):
                why = 'ocr disagreed'
            if not why and sparse and not row.get('q'):
                why = 'sparse booklet'
            if why:
                jobs.append((row['page'], why))

        if not jobs or not pdf.exists():
            continue
        total += len(jobs)

        # A dry run must not spend money.
        #
        # This check was dropped while parallelising, and the "just show me"
        # command quietly started making API calls. A command that only
        # produces a report should never cost anything; that should have been
        # obvious from the start.
        if not apply_changes:
            for pg, why in jobs:
                row = by_page[pg]
                print(f'{d["file"]} p{pg}: {why}  {(row.get("q") or "")!r}')
            continue

        # Network-bound work, so threads. Run serially, 705 pages came to an
        # estimated 79 minutes; scan.py does the same work on 8 threads and
        # this should have done the same from the beginning.
        changed = False
        with cf.ThreadPoolExecutor(WORKERS) as ex:
            futs = {ex.submit(attempt, (pdf, pg)): (pg, why) for pg, why in jobs}
            for f in cf.as_completed(futs):
                pg, why = futs[f]
                page, frac, deg, got = f.result()
                seen += 1
                if seen % 5 == 0:
                    tick(d['file'])
                if not got:
                    continue
                row = by_page[pg]
                old_q = row.get('q') or ''
                if old_q and len(got) <= len(old_q):
                    continue
                tag = 'RECOVERED' if not old_q else 'IMPROVED '
                extra = f' rot{deg}' if deg else ''
                print(f'  {tag} p{pg}{extra}  {got[:74]}', flush=True)
                row['q'] = got
                row['repaired'] = True
                changed = True
                fixed += 1

        if changed:
            # `starts` has to be rebuilt.
            #
            # It was not, and that was the worst kind of bug: repair wrote the
            # recovered question into the row, but build.py reads only
            # `starts` when slicing. So every recovered question was written
            # to the right place and then silently ignored. No error, no
            # warning, just wasted work.
            d['starts'] = sorted(r['page'] for r in d['rows'] if r.get('q'))
            scan_path.write_text(json.dumps(d, indent=1))

    if not a.apply:
        print(f'\n{total} suspect transcriptions. Nothing changed. '
              f'Re-run with --apply to re-read them.')
    else:
        tick('done')
        prog.write_text(prog.read_text().replace('REPAIR\n', 'REPAIR KHATAM\n'))
        print(f'\n{fixed} of {total} repaired.')


if __name__ == '__main__':
    main()
