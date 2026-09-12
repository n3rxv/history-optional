"""
Reads the printed question off the first page of an answer booklet.

Tesseract is good enough to FIND a question and nowhere near good enough to
store one: it renders "Q.3 (a) Analyse Vedic sacrifice" as "NG <13 a) Analyse
Vedi sare as tual". That string would become a row heading and the input to
PYQ matching, so it has to be right rather than nearly right.

House rules, matching the 376 rows already in the table: no leading serial
("7.b)", "Q.2 (a)"), no trailing marks tag ("[15 Marks]"), question verbatim
otherwise, quotation marks kept.
"""
import base64, json, os, re, subprocess, sys, tempfile, urllib.request, hashlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

MODEL = os.environ.get('READQ_MODEL', 'claude-sonnet-5')
WORK = _work.WORK

def env():
    for line in open('.env.local'):
        m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
        if m and not os.environ.get(m.group(1)):
            os.environ[m.group(1)] = m.group(2).strip('"\'')
env()

PROMPT = """This is the top of a scanned UPSC History answer booklet page. Any
printed text is the question paper; everything handwritten is the candidate's
answer and must be ignored completely.

Decide whether a NEW exam question STARTS on this page.

It is a new question only if the printed text is a full exam question: it
carries a directive such as Discuss, Examine, Analyse, Comment, Evaluate,
Critically examine, or it carries a marks allocation such as [15 Marks].

The map question IS a question. A page reading "Identify the following places
marked on the map supplied to you and write a short note of about 30 words on
each of them" is the start of a question and must be transcribed. Do not
confuse it with its sub-items, described next.

It is NOT a new question if the printed text is any of:
- a sub-item of a map question, e.g. "(ii) Ancient port and NBPW site",
  "(xv) Palaeolithic site", "(xix) Inscription and Temple Site". These are
  roman-numeral labels naming one place each, with no directive and no marks,
  and they belong to the map question that started on an earlier page.
- a running header or footer, e.g. "LevelUp IAS", "SELFSTUDYHISTORY.COM",
  "FULL TEST III MODERN INDIA", "Copyright", "Don't write in this area",
  a page number.
- a cover sheet, instructions to candidates, or an evaluation comments page.

If a new question does start here, transcribe it exactly, and:
- drop the leading serial ("7.b)", "Q.2 (a)", "4.b) |"),
- drop the trailing marks tag ("[15 Marks]", "[15x2.5= 30 Marks]"),
- keep its wording, spelling and quotation marks verbatim.

Reply with the question text alone, or exactly NONE.
"""

def upright(im, deg=None):
    """
    Turns a scanned page by `deg`, or by whatever tesseract's orientation
    detector suggests.

    Not used by default, and that is the point. Some booklets really are
    scanned sideways, but the detector is unreliable on handwriting: it read a
    perfectly upright Sattwik page as 180 with a confidence of 0.32, and acting
    on that turned a working page upside down. Applying it everywhere trades a
    known problem for an unknown one across every source.

    So rotation is a REPAIR, not a default. It is tried only on pages that
    already yielded nothing, where a wrong guess costs nothing because there
    was nothing to lose, and a right one recovers a question.
    """
    if deg is None:
        small = im.copy()
        small.thumbnail((900, 900))
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
            small.save(f.name); tmp = f.name
        try:
            r = subprocess.run(['tesseract', tmp, 'stdout', '--psm', '0'],
                               capture_output=True, text=True, timeout=60)
            m = re.search(r'^Rotate:\s*(\d+)', r.stdout, re.M)
            deg = int(m.group(1)) % 360 if m else 0
        except Exception:
            deg = 0
        finally:
            os.unlink(tmp)
    return im.rotate(-deg, expand=True) if deg else im


def strip_png(pdf: Path, page: int = 1, frac: float = 0.32, rotate: int = 0) -> bytes:
    """Top `frac` of a page, optionally turned by `rotate` degrees first."""
    key = hashlib.md5(f'{pdf}:{page}:{frac}:{rotate}:q:v4'.encode()).hexdigest()[:12]
    WORK.mkdir(parents=True, exist_ok=True)
    out = WORK / f'q{key}.png'
    if not out.exists():
        stem = WORK / f'q{key}'
        # -scale-to, not -r. These scans vary enormously in stored resolution:
        # one Samiksha booklet renders to 4355x6248 at 150dpi and takes 103
        # seconds a page, while a Nausheen page takes 3. Capping the long edge
        # gives the same legibility for a printed question line and makes the
        # worst file twelve times faster instead of dominating the whole run.
        subprocess.run(['pdftoppm', '-png', '-scale-to', '2000',
                        '-f', str(page), '-l', str(page),
                        '-singlefile', str(pdf), str(stem)], check=True, capture_output=True)
        from PIL import Image
        im = Image.open(out)
        if rotate:
            im = upright(im, rotate)
        im.crop((0, 0, im.width, int(im.height * frac))).save(out)
    return out.read_bytes()

# Sometimes the model explains its reasoning instead of returning the question:
#   'The printed text on the page is: "The events in Prague..."'
#   'The printed text on this page is a sub-item of a question (5.d)...'
# The first is recoverable, the question is sitting inside the quotes. The
# second holds no question at all. Letting either through would have put the
# whole sentence into the database as a question and onto the website as a
# heading.
NARRATION = re.compile(
    r'^\s*(?:the printed text|the text|this page|the page)\b[^:"“]{0,80}',
    re.I)
QUOTED = re.compile(r'[:\-]\s*[“"\'](.+)[”"\']\s*$', re.S)


def clean_question(text: str) -> str:
    """Strip the narration and pull out the real question, else NONE."""
    s = ' '.join((text or '').split())
    if not s or s.upper().startswith('NONE'):
        return 'NONE'
    if not NARRATION.match(s):
        return s
    m = QUOTED.search(s)
    if m and len(m.group(1)) >= 30:
        return m.group(1).strip()
    return 'NONE'


BACKEND = os.environ.get('READQ_BACKEND', 'mistral')

def read_question(pdf: Path, page: int = 1, frac: float = 0.32, rotate: int = 0) -> str:
    """
    Reads the printed question, through whichever backend is configured.

    Mistral is the default. It matched the Anthropic path exactly on the test
    booklet (7 of 7, no false positives) at a seventh of the cost, and more to
    the point its credits are prepaid with auto-recharge off, so the work
    cannot produce a new bill.
    """
    if BACKEND == 'mistral':
        import importlib.util
        _s = importlib.util.spec_from_file_location('mistral', Path(__file__).parent / 'mistral.py')
        _m = importlib.util.module_from_spec(_s); _s.loader.exec_module(_m)
        globals()['_mistral'] = globals().get('_mistral') or _m
        return clean_question(
            globals()['_mistral'].read_question_mistral(strip_png(pdf, page, frac, rotate), PROMPT))
    return _read_question_anthropic(pdf, page, frac, rotate)

def _read_question_anthropic(pdf: Path, page: int = 1, frac: float = 0.32, rotate: int = 0) -> str:
    img = base64.b64encode(strip_png(pdf, page, frac, rotate)).decode()
    body = json.dumps({
        'model': MODEL, 'max_tokens': 600,
        'messages': [{'role': 'user', 'content': [
            {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/png', 'data': img}},
            {'type': 'text', 'text': PROMPT}]}]
    }).encode()
    req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, headers={
        'content-type': 'application/json',
        'x-api-key': os.environ['ANTHROPIC_API_KEY'],
        'anthropic-version': '2023-06-01'})
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.load(r)
    txt = ''.join(b.get('text', '') for b in d.get('content', [])).strip()
    return clean_question(txt)

if __name__ == '__main__':
    SRC = Path.home() / 'Desktop' / 'Topper Copies'
    for name in sys.argv[1:]:
        print(f'{name}\t{read_question(SRC / name)}', flush=True)
