"""
Lists only the questions that are genuinely new, for checking.

This differs from review.py. review.py showed everything, including the 300
already in the database. This shows only the 305 that would be added, since
those are the ones worth checking.

Long page ranges are coloured differently. That is what caught two of Aditya
Kaushik's files: p17-26 held a question that only ran to p19, and p41-46 had
two separate questions run together. A long range is not automatically wrong,
GS Mains answers really do run 8-9 pages, but those are the ones to look at.

No API calls and no cost. Local files and a database snapshot only.

    python3 scripts/topper/unique_page.py
"""
import html
import json
from collections import Counter
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

WORK = _work.WORK
OUT = Path.home() / 'Desktop' / 'topper-unique.html'

# Ranges longer than this deserve a look. A sectional test answer runs 3-4
# pages and a full length paper 8-9, so anything over 7 is surfaced and
# anything over 10 is highlighted harder.
LOOK = 7
HARD = 10

CSS = """
body{background:#0b0b0b;color:#e6e6e6;font:14px/1.6 -apple-system,system-ui,sans-serif;
  max-width:1180px;margin:0 auto;padding:40px 24px 90px}
h1{font-size:1.7rem;margin:0 0 .15em;color:#fff}
.sub{color:#8d8d8d;margin:0 0 2em;max-width:70ch}
h2{font-size:1rem;margin:2.6em 0 .6em;color:#fff;font-weight:600;
  border-bottom:1px solid #262626;padding-bottom:.4em}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;color:#8d8d8d;font-size:.66rem;text-transform:uppercase;
  letter-spacing:.08em;padding:6px 10px 6px 0;font-weight:600}
td{padding:7px 10px 7px 0;border-bottom:1px solid #161616;vertical-align:top}
td.n{font-family:ui-monospace,monospace;font-size:12px;color:#8d8d8d;white-space:nowrap}
td.f{font-family:ui-monospace,monospace;font-size:12px;color:#d0d0d0;white-space:nowrap}
tr.look td.n{color:#e8b84b}
tr.hard td.n{color:#f08098;font-weight:700}
.tag{font-size:.6rem;text-transform:uppercase;letter-spacing:.06em;padding:1px 6px;
  border-radius:3px;margin-left:7px;white-space:nowrap;background:#12301c;color:#5fd08a}
.cards{display:flex;gap:30px;flex-wrap:wrap;border:1px solid #262626;
  border-radius:8px;padding:18px 24px;margin-bottom:1.6em}
.card b{display:block;font-size:1.5rem;font-family:ui-monospace,monospace;color:#fff}
.card span{color:#8d8d8d;font-size:.7rem;text-transform:uppercase;letter-spacing:.07em}
.warn{border:1px solid #3a2a12;background:#1a1408;border-radius:8px;
  padding:14px 18px;margin-bottom:2em;color:#e8b84b;font-size:13px;max-width:80ch}
"""


def main():
    uniq = json.loads((WORK / 'unique.json').read_text())
    look = [r for r in uniq if r['pages'] >= LOOK]
    src_file = json.loads((WORK / 'db_snapshot.json').read_text())

    cards = ''.join(
        f'<div class="card"><b>{v}</b><span>{k}</span></div>'
        for k, v in [('naye questions', len(uniq)),
                     ('pehle se the', len(src_file)),
                     ('baad me total', len(uniq) + len(src_file)),
                     (f'{LOOK}+ pages, dekhna hai', len(look)),
                     ('repair se aaye', sum(1 for r in uniq if r['rep']))])

    by_note = {}
    for r in uniq:
        by_note.setdefault(r['note'], []).append(r)

    sections = []
    for note in sorted(by_note, key=lambda k: -len(by_note[k])):
        rows = []
        for r in sorted(by_note[note], key=lambda x: (x['src'], x['a'])):
            cls = 'hard' if r['pages'] >= HARD else ('look' if r['pages'] >= LOOK else '')
            tag = '<span class="tag">repaired</span>' if r['rep'] else ''
            rows.append(
                f'<tr class="{cls}"><td class="f">{html.escape(r["file"])}</td>'
                f'<td class="n">p{r["a"]}-{r["b"]}</td>'
                f'<td class="n">{r["pages"]}p</td>'
                f'<td class="n">{html.escape(r["src"][:34])}</td>'
                f'<td>{html.escape(r["q"][:170])}{tag}</td></tr>')
        sections.append(
            f'<h2>{html.escape(note)} &middot; {len(by_note[note])} naye</h2>'
            f'<table><tr><th>file</th><th>pages</th><th></th><th>source</th>'
            f'<th>question</th></tr>{"".join(rows)}</table>')

    OUT.write_text(
        '<!doctype html><meta charset="utf-8"><title>New topper questions</title>'
        f'<style>{CSS}</style>'
        '<h1>New questions only</h1>'
        '<p class="sub">Anything already in the database is left out. This is the '
        'list that would be uploaded. Nothing has been uploaded yet.</p>'
        f'<div class="cards">{cards}</div>'
        f'<div class="warn"><b>{len(look)} rows span {LOOK} pages or more.</b> '
        'Those may hold two questions run together, as two of Aditya Kaushik\'s '
        'files did. Yellow means worth a look, red means longer than '
        f'{HARD} pages. A long range is not automatically wrong: GS Mains answers '
        'really do run 8-9 pages.</div>'
        + ''.join(sections), encoding='utf-8')

    print(f'{len(uniq)} new questions, {len(look)} spanning {LOOK}+ pages')
    for n, c in Counter(r['note'] for r in uniq).most_common():
        print(f'  {c:>4}  {n}')
    print(f'\nwritten: {OUT}')


if __name__ == '__main__':
    main()
