"""
Proposes which PYQs each topper copy should be linked to.

Linking by hand means looking each copy up among 1,584 questions. This script
does the looking up and leaves only the judgement. It also has to cope with
copies that match nothing: a lot of topper copies come from test series, and a
test-series question UPSC never asked has no PYQ to link to.

Every copy is scored against every PYQ three ways, and the scores are blended:

    meaning     Voyage embeddings, which catch a question reworded
    wording     TF-IDF over words and two-word phrases
    spelling    TF-IDF over character runs, which shrugs off OCR slips,
                "Khalji"/"Khilji" and the like

Instruction words ("Critically examine", "Comment") are stripped before the
wording and spelling scores, since the same question carries different ones.
The top 20 PYQs per copy are then reranked by Voyage's reranker.

Each copy lands in one of three groups:

    same      near-verbatim with a PYQ; safe to link after a light check
    none      nothing in the PYQ bank on the same subject; a practice question
    review    something related exists, and a person has to decide

The thresholds were set on the links made by hand. On those, the top
candidate is a hand-made link 81% of the time and the top five hold 91% of
them; the misses are mostly hand links that are looser than the PYQ the
script prefers. Copies that already have links also get a list of
near-verbatim PYQs those links missed.

Nothing here writes to the database. Embeddings and reranks are cached, so a
re-run only pays for copies or PYQs it has not seen.

    python3 scripts/topper/match_pyqs.py          writes $TOPPER_WORK/pyq-match/
    python3 scripts/topper/match_pyqs.py --stats  prints the calibration only
"""
import argparse, csv, hashlib, json, math, os, re, subprocess, sys, time, unicodedata, urllib.request
from collections import Counter
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import work as _work

REPO = Path(__file__).resolve().parents[2]
OUT = _work.WORK / 'pyq-match'
OUT.mkdir(parents=True, exist_ok=True)

EMBED_MODEL = 'voyage-4-large'
RERANK_MODEL = 'rerank-2.5'
SHORTLIST = 20          # PYQs per copy sent to the reranker
KEEP = 5                # candidates per copy written out
W_RERANK = 0.4          # share of the reranker in the final score

SAME_SPELLING = 0.60    # spelling score at or above which a pair is near-verbatim
NONE_RERANK = 0.50      # a copy is 'none' when its best rerank score is below this
NONE_BLEND = 0.45       # ... and its best similarity score is below this too

def _env(name):
    m = re.search(rf'^{name}=["\']?([^"\'\n]+)', (REPO / '.env.local').read_text(), re.M)
    if not m: sys.exit(f'{name} is missing from .env.local')
    return m.group(1)

# ── Data ────────────────────────────────────────────────────────────────────

def load_pyqs():
    text = (REPO / 'lib' / 'pyqData.ts').read_text(encoding='utf-8')
    total = int(re.search(r'Total questions: (\d+)', text).group(1))
    out = []
    for line in text.splitlines():
        if not line.lstrip().startswith('{ id:'): continue
        field = lambda k: re.search(rf'\b{k}: "((?:[^"\\]|\\.)*)"', line).group(1)
        out.append({'id': int(re.search(r'\bid: (\d+)', line).group(1)),
                    'year': int(re.search(r'\byear: (\d+)', line).group(1)),
                    'section': json.loads(f'"{field("section")}"'),
                    'question': json.loads(f'"{field("question")}"')})
    if len(out) != total: sys.exit(f'read {len(out)} PYQs from pyqData.ts, expected {total}')
    return out

def load_copies():
    """Copies and their current links, read with a read-only transaction."""
    sql = """select json_agg(json_build_object('id', c.id, 'question', c.question, 'file', c.drive_file_id,
               'note', c.note, 'pyq_ids', (select coalesce(json_agg(m.pyq_id order by m.pyq_id), '[]'::json)
               from topper_copy_pyq_map m where m.topper_copy_id = c.id)) order by c.id) from topper_copies c"""
    env = dict(os.environ, PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=20000')
    r = subprocess.run(['psql', _env('SUPABASE_DB_URL'), '-X', '-q', '-t', '-A', '-c', sql],
                       capture_output=True, text=True, env=env)
    if r.returncode: sys.exit('reading topper_copies failed: ' + re.sub(r'postgres(ql)?://\S+', '[db-url]', r.stderr))
    return json.loads(r.stdout)

# ── Voyage, cached ──────────────────────────────────────────────────────────

def _voyage(path, body):
    req = urllib.request.Request('https://api.voyageai.com/v1/' + path, json.dumps(body).encode(),
                                 {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _env('VOYAGE_API_KEY')})
    for attempt in range(5):
        try: return json.load(urllib.request.urlopen(req, timeout=120))
        except Exception as e:
            if attempt == 4: raise
            print(f'  voyage {path} retry: {e}', flush=True); time.sleep(3 * (attempt + 1))

def _key(*parts): return hashlib.sha1('\x1f'.join(map(str, parts)).encode()).hexdigest()

def embed(texts):
    path = OUT / 'embeds.npz'
    cache = {}
    if path.exists():
        z = np.load(path); cache = dict(zip(z['keys'], z['vecs']))
    keys = [_key(EMBED_MODEL, t) for t in texts]
    todo = sorted({k: t for k, t in zip(keys, texts) if k not in cache}.items())
    for i in range(0, len(todo), 128):
        part = todo[i:i + 128]
        d = _voyage('embeddings', {'model': EMBED_MODEL, 'input': [t for _, t in part], 'input_type': 'document'})
        for (k, _), x in zip(part, sorted(d['data'], key=lambda x: x['index'])): cache[k] = np.array(x['embedding'], np.float32)
        print(f'  embedded {i + len(part)}/{len(todo)}', flush=True)
    if todo: np.savez(path, keys=np.array(list(cache)), vecs=np.stack(list(cache.values())))
    V = np.stack([cache[k] for k in keys])
    return V / np.linalg.norm(V, axis=1, keepdims=True)

def rerank(query, docs, ids, cache):
    k = _key(RERANK_MODEL, query, *ids)
    if k not in cache:
        d = _voyage('rerank', {'model': RERANK_MODEL, 'query': query, 'documents': docs})
        cache[k] = [[ids[x['index']], x['relevance_score']] for x in d['data']]
    return dict(cache[k])

# ── Wording and spelling ────────────────────────────────────────────────────

DIRECTIVES = re.compile(r'\b(' + '|'.join([
    r'critically (examine|evaluate|analy[sz]e|assess|discuss|comment|review)', r'examine critically',
    r'comment( upon| on)?( this| the)?( statement| view)?', r'do you agree( with)?( this| the)?( view| statement)?',
    r'give reasons( in support of your answer)?', r'write (a )?short (essay|notes?) on', r'in the light of (this|the above) statement',
    r'give your (answer|views)', r'with suitable examples', r'in your opinion', r'how far', r'to what extent', r'account for',
    r'bring out', r'your answer', r'in support of', r'discuss', r'examine', r'elucidate', r'explain', r'evaluate', r'analy[sz]e',
    r'assess', r'highlight', r'describe', r'elaborate', r'justify', r'substantiate', r'illustrate', r'trace', r'delineate',
    r'enumerate', r'identify', r'outline', r'explicate', r'clarify', r'state']) + r')\b')
STOP = set("""a an the of in on and or to for with by as at from is are was were be been being this that these those it its
their his her they them which what who whom how why when where whether do does did not no but into than then so such
upon over under about also any all can could would should may might has have had will shall very more most""".split())

def _words(s):
    s = unicodedata.normalize('NFKC', s).lower()
    s = re.sub(r'\(\s*\d+\s*(marks?|words?)\s*\)|\b\d+\s*(marks|words)\b', ' ', s)
    s = DIRECTIVES.sub(' ', re.sub(r"[‘’`´']", '', s))
    return [w for w in re.sub(r'[^a-z0-9 ]+', ' ', s).split() if w not in STOP and len(w) > 1]

def _phrases(s):
    w = _words(s); return w + [a + '_' + b for a, b in zip(w, w[1:])]

def _runs(s):
    t = ' ' + ' '.join(_words(s)) + ' '
    return [t[i:i + n] for n in (3, 4, 5) for i in range(len(t) - n + 1)]

def _tfidf(docs):
    df = Counter(g for d in docs for g in set(d)); n = len(docs)
    col = {g: i for i, g in enumerate(df)}
    idf = np.array([math.log((n + 1) / (df[g] + 1)) + 1 for g in df], np.float32)
    M = np.zeros((n, len(col)), np.float32)
    for r, d in enumerate(docs):
        for g, c in Counter(d).items(): M[r, col[g]] = (1 + math.log(c)) * idf[col[g]]
    return M / (np.linalg.norm(M, axis=1, keepdims=True) + 1e-9)

def similarity(cq, pq):
    """copies × PYQs matrices: the blended similarity, and the spelling score alone."""
    n = len(pq)
    W = _tfidf([_phrases(q) for q in pq + cq]); G = _tfidf([_runs(q) for q in pq + cq])
    meaning = embed(cq) @ embed(pq).T
    spelling = G[n:] @ G[:n].T
    return 0.5 * meaning + 0.25 * (W[n:] @ W[:n].T) + 0.25 * spelling, spelling

# ── Run ─────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stats', action='store_true', help='print the calibration against hand links and stop')
    a = ap.parse_args()

    pyqs, copies = load_pyqs(), load_copies()
    by_id = {p['id']: p for p in pyqs}
    print(f'{len(copies)} copies, {sum(1 for c in copies if c["pyq_ids"])} linked; {len(pyqs)} PYQs')
    blend, spelling = similarity([c['question'] for c in copies], [p['question'] for p in pyqs])

    cache_path = OUT / 'rerank.json'
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    rows = []
    for r, c in enumerate(copies):
        short = [int(j) for j in np.argsort(-blend[r])[:SHORTLIST]]
        rr = rerank(c['question'], [pyqs[j]['question'] for j in short], [pyqs[j]['id'] for j in short], cache)
        cands = sorted(({'pyq_id': pyqs[j]['id'], 'score': round(W_RERANK * rr[pyqs[j]['id']] + (1 - W_RERANK) * float(blend[r, j]), 3),
                         'rerank': round(rr[pyqs[j]['id']], 3), 'similarity': round(float(blend[r, j]), 3),
                         'spelling': round(float(spelling[r, j]), 3)} for j in short), key=lambda x: -x['score'])
        verbatim = [x['pyq_id'] for x in cands if x['spelling'] >= SAME_SPELLING]
        if verbatim: group = 'same'
        elif max(x['rerank'] for x in cands) < NONE_RERANK and max(x['similarity'] for x in cands) < NONE_BLEND: group = 'none'
        else: group = 'review'
        rows.append({**c, 'group': group, 'verbatim': verbatim, 'candidates': cands[:KEEP],
                     'missed': [i for i in verbatim if i not in c['pyq_ids']]})
        if r % 100 == 99: cache_path.write_text(json.dumps(cache))
    cache_path.write_text(json.dumps(cache))

    # Calibration against the hand links
    linked = [x for x in rows if x['pyq_ids']]
    top1 = sum(x['candidates'][0]['pyq_id'] in x['pyq_ids'] for x in linked)
    gold = [(x, g) for x in linked for g in x['pyq_ids']]
    in5 = sum(g in [y['pyq_id'] for y in x['candidates']] for x, g in gold)
    print(f'hand-linked copies: top candidate is a hand link {top1 / len(linked):.0%}; top {KEEP} hold {in5 / len(gold):.0%} of hand links')
    print(f'hand-linked copies the rules would call "none": {sum(x["group"] == "none" for x in linked)} of {len(linked)}')
    unl = [x for x in rows if not x['pyq_ids']]
    print(f'unlinked copies: {len(unl)}  ' + '  '.join(f'{g} {sum(x["group"] == g for x in unl)}' for g in ('same', 'review', 'none')))
    gaps = [x for x in linked if x['missed']]
    print(f'linked copies missing a near-verbatim PYQ: {len(gaps)} ({sum(len(x["missed"]) for x in gaps)} links)')
    if a.stats: return

    (OUT / 'candidates.json').write_text(json.dumps(rows, indent=1, ensure_ascii=False))
    with open(OUT / 'review.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['group', 'topper', 'copy_id', 'copy_question', 'linked_now', 'rank', 'pyq_id', 'pyq_year', 'pyq_question',
                    'score', 'rerank', 'spelling'])
        order = {'same': 0, 'review': 1, 'none': 2}
        for x in sorted(rows, key=lambda x: (bool(x['pyq_ids']), order[x['group']], x['note'] or '', x['question'])):
            for k, y in enumerate(x['candidates'][:3 if x['group'] != 'none' else 1], 1):
                p = by_id[y['pyq_id']]
                w.writerow([x['group'], x['note'], x['id'], x['question'] if k == 1 else '', ' '.join(map(str, x['pyq_ids'])) if k == 1 else '',
                            k, p['id'], p['year'], p['question'], y['score'], y['rerank'], y['spelling']])
    print(f'wrote {OUT / "candidates.json"} and {OUT / "review.csv"}')

if __name__ == '__main__':
    main()
