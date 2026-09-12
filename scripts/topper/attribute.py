"""
Works out whose booklet a source PDF is.

Three ways, in order of how much they can be trusted:

  1. A divider page whose TEXT LAYER names the topper and rank. Real text, not
     OCR, so there is nothing to misread. This is how History_Topper_Copies.pdf
     is organised, and it is also how that one file is split into three people.
  2. A cover sheet, read as an image. Medieval India.pdf carries no name in its
     filename and says "Name: Samiksha Dwiwedi" on page one.
  3. The filename. Last, because it is the one that has already been wrong:
     "Paper 2 (Modern + World).pdf" belongs to Samiksha and says so nowhere.

The exam YEAR is never inferred. A divider that states "(CSE 2018)" gives it;
otherwise it stays blank and a person fills it in from a verified source. A
rank with the wrong year against a real person's name is not a small error.

    python3 scripts/topper/attribute.py <file.pdf>     what this file says
    python3 scripts/topper/attribute.py --all          every source
"""
import argparse
import re
import sys
from pathlib import Path

import pypdf

SRC = Path.home() / 'Desktop' / 'Topper Copies'

RANK = re.compile(r'\b(?:rank|air)\s*[-–:]?\s*(\d{1,4})\b', re.I)
YEAR = re.compile(r'\bCSE[\s\-]*(20\d{2})\b', re.I)
NOISE = re.compile(
    r'upscpdf|iasscore\.in|www\.|an institute for civil services|test copy|'
    r'ias topper|gs\s*score|^score$|^gs$|^history$|^\W*$', re.I)


def divider_pages(pdf: Path):
    """
    Pages whose text layer carries a rank. In a multi-topper compilation these
    are the section boundaries as well as the attribution.
    """
    reader = pypdf.PdfReader(str(pdf))
    out = []
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ''
        lines = [' '.join(l.split()) for l in text.splitlines() if l.strip()]
        lines = [l for l in lines if not NOISE.search(l)]
        joined = ' | '.join(lines)
        m = RANK.search(joined)
        if not m:
            continue
        # A person's name, not the longest surviving line. Taking the longest
        # gave Vikram Grewal the name "GS Mains 2018: History", which is the
        # paper he sat. A name has no digits and no colon, and is two to four
        # words; that rules out paper titles, institute straplines and ranks.
        def looks_like_a_name(l):
            if RANK.search(l) or YEAR.search(l): return False
            if re.search(r'\d|:', l): return False
            return 2 <= len(l.split()) <= 4
        cands = [l for l in lines if looks_like_a_name(l)]
        name = max(cands, key=len) if cands else ''
        y = YEAR.search(joined)
        out.append({'page': i, 'name': name.title().strip(),
                    'rank': m.group(1), 'year': y.group(1) if y else None})
    return out, len(reader.pages)


def sections(dividers, total):
    """
    One section per topper, not per divider. A compilation repeats the same
    divider before each of that person's test papers, so consecutive dividers
    naming the same person are one run of pages.
    """
    runs = []
    for d in dividers:
        if runs and runs[-1]['name'] == d['name']:
            continue
        runs.append({'name': d['name'], 'rank': d['rank'],
                     'year': d['year'], 'start': d['page']})
    for i, r in enumerate(runs):
        r['end'] = runs[i + 1]['start'] - 1 if i + 1 < len(runs) else total
    return runs


def note_for(run):
    """The note column, or a marked gap where the year is not known."""
    year = run['year'] or '????'
    return f"{run['name']}, AIR-{run['rank']}, {year}"


def report(pdf: Path):
    dividers, total = divider_pages(pdf)
    print(f'\n{pdf.name}  ({total} pages)')
    if not dividers:
        print('  no divider pages in the text layer; needs the cover sheet read')
        return []
    runs = sections(dividers, total)
    for r in runs:
        flag = '' if r['year'] else '   <- year not stated, must be verified'
        print(f"  p{r['start']:>4}-{r['end']:<4} ({r['end'] - r['start'] + 1:>3}p)  "
              f"{note_for(r)}{flag}")
    return runs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf', nargs='?')
    ap.add_argument('--all', action='store_true')
    a = ap.parse_args()

    if a.all:
        srcs = [p for p in sorted(SRC.glob('*.pdf'))
                if not re.match(r'^[A-Za-z-]+-\d+\.pdf$', p.name)]
        for p in srcs:
            try:
                report(p)
            except Exception as e:
                print(f'\n{p.name}: unreadable ({str(e)[:60]})')
    elif a.pdf:
        report(Path(a.pdf) if Path(a.pdf).exists() else SRC / a.pdf)
    else:
        ap.error('give a pdf or --all')


if __name__ == '__main__':
    main()
