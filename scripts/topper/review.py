"""
Builds a review page for the slice plan, locally.

Scrolling past 600 questions in a terminal is no way to check them. This
writes an HTML file listing, per source, each question with its page range,
the topper's name and the filename it will get, colouring everything that
deserves a look: questions recovered by repair, map questions that will be
dropped, and rows that will be skipped as duplicates.

Nothing is uploaded and the database is not touched. Read-only.

    python3 scripts/topper/review.py         writes review.html
    python3 scripts/topper/review.py --open  writes it and opens the browser
"""
import argparse
import html
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

HERE = Path(__file__).parent
WORK = _work.WORK
OUT = Path.home() / 'Desktop' / 'topper-review.html'

_s = importlib.util.spec_from_file_location('build', HERE / 'build.py')
build = importlib.util.module_from_spec(_s)
_s.loader.exec_module(build)

CSS = """
body{background:#0b0b0b;color:#e6e6e6;font:14px/1.65 -apple-system,system-ui,sans-serif;
  max-width:1140px;margin:0 auto;padding:40px 24px 90px}
h1{font-size:1.7rem;margin:0 0 .2em;color:#fff}
.sub{color:#8d8d8d;margin:0 0 2.2em}
h2{font-size:1rem;margin:2.4em 0 .1em;color:#fff;font-weight:600}
.note{color:#7ab3f5;font-size:.82rem;margin-bottom:.7em}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;color:#8d8d8d;font-size:.68rem;text-transform:uppercase;
  letter-spacing:.08em;border-bottom:1px solid #262626;padding:6px 10px 6px 0;font-weight:600}
td{padding:6px 10px 6px 0;border-bottom:1px solid #161616;vertical-align:top}
td.n{font-family:ui-monospace,monospace;font-size:12px;color:#8d8d8d;white-space:nowrap}
.file{font-family:ui-monospace,monospace;font-size:12px;color:#d0d0d0;white-space:nowrap}
.q{color:#e6e6e6}
.tag{font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;
  padding:1px 6px;border-radius:3px;margin-left:7px;white-space:nowrap}
.map{background:#3a2a12;color:#e8b84b}
.rep{background:#12301c;color:#5fd08a}
.dup{background:#3a1620;color:#f08098}
.cards{display:flex;gap:26px;flex-wrap:wrap;margin:0 0 2.4em;
  border:1px solid #262626;border-radius:8px;padding:18px 22px}
.card b{display:block;font-size:1.5rem;font-family:ui-monospace,monospace;color:#fff}
.card span{color:#8d8d8d;font-size:.72rem;text-transform:uppercase;letter-spacing:.07em}
"""


def rows_for(scan_path):
    """The same logic as build.py, reporting instead of writing."""
    d = json.loads(scan_path.read_text())
    src = d['file']
    pdf = build.SRC / src
    out = []

    multi = None
    try:
        multi = build.sections_of(pdf, d['pages'])
    except Exception:
        pass

    if multi:
        blocks = [(note, [s for s in d['starts'] if lo <= s <= hi], hi)
                  for note, lo, hi in multi]
    else:
        note = build.note_for_source(src)
        if not note:
            return src, None, []
        blocks = [(note, d['starts'], d['pages'])]

    by_page = {r['page']: r for r in d['rows']}
    note_seen = blocks[0][0] if blocks else None
    for note, starts, last in blocks:
        if not starts:
            continue
        stem = build.stem_for(note)
        for a, b in build.ranges(starts, last):
            row = by_page.get(a, {})
            q = row.get('q') or ''
            out.append({
                'note': note, 'stem': stem, 'a': a, 'b': b, 'q': q,
                'map': build.is_map(q), 'repaired': bool(row.get('repaired')),
            })
    return src, note_seen, out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--open', action='store_true')
    a = ap.parse_args()

    scans = sorted(WORK.glob('scan-*.json'))
    sections, totals, per_topper = [], {'q': 0, 'map': 0, 'rep': 0, 'pages': 0}, {}
    counters = {}

    for sp in scans:
        src, note, rows = rows_for(sp)
        d = json.loads(sp.read_text())
        totals['pages'] += d['pages']
        body = []
        for r in rows:
            if r['map']:
                totals['map'] += 1
                name = '(map, drop)'
            else:
                counters[r['stem']] = counters.get(r['stem'], build.peek_number(r['stem']) - 1) + 1
                name = f"{r['stem']}-{counters[r['stem']]}.pdf"
                totals['q'] += 1
                per_topper[r['note']] = per_topper.get(r['note'], 0) + 1
            if r['repaired']:
                totals['rep'] += 1
            tags = ''
            if r['map']:
                tags += '<span class="tag map">map, drop</span>'
            if r['repaired']:
                tags += '<span class="tag rep">repaired</span>'
            body.append(
                f'<tr><td class="file">{html.escape(name)}</td>'
                f'<td class="n">p{r["a"]}-{r["b"]} ({r["b"] - r["a"] + 1}p)</td>'
                f'<td class="n">{html.escape(r["note"].split(",")[0])}</td>'
                f'<td class="q">{html.escape(r["q"][:150])}{tags}</td></tr>')
        if not rows:
            body.append('<tr><td colspan="4" class="n">attribution nahi mili, '
                        'ye source skip hoga</td></tr>')
        sections.append(
            f'<h2>{html.escape(src)}</h2>'
            f'<div class="note">{html.escape(note or "no note string")} '
            f'&middot; {d["pages"]} pages</div>'
            f'<table><tr><th>file</th><th>pages</th><th>topper</th><th>question</th></tr>'
            + ''.join(body) + '</table>')

    cards = ''.join(
        f'<div class="card"><b>{v:,}</b><span>{k}</span></div>'
        for k, v in [('questions', totals['q']), ('map dropped', totals['map']),
                     ('repaired', totals['rep']), ('pages read', totals['pages']),
                     ('sources', len(scans))])
    topper_rows = ''.join(
        f'<tr><td>{html.escape(k)}</td><td class="n">{v}</td></tr>'
        for k, v in sorted(per_topper.items(), key=lambda kv: -kv[1]))

    OUT.write_text(
        f'<!doctype html><meta charset="utf-8"><title>Topper copies review</title>'
        f'<style>{CSS}</style>'
        f'<h1>Topper copies, slice plan</h1>'
        f'<p class="sub">Nothing has been uploaded. This only shows which question '
        f'covers which pages, and under what filename.</p>'
        f'<div class="cards">{cards}</div>'
        f'<h2>per topper</h2><table>{topper_rows}</table>'
        + ''.join(sections), encoding='utf-8')

    print(f'{totals["q"]} questions, {totals["map"]} map dropped, '
          f'{totals["rep"]} repaired')
    print(f'written: {OUT}')
    if a.open:
        subprocess.run(['open', str(OUT)])


if __name__ == '__main__':
    main()
