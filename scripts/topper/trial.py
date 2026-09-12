"""
Measures one backend against a booklet whose true boundaries are known.

Nausheen's Ancient India sectional test has questions starting on pages
3, 10, 13, 16, 20, 22 and 25. That was established by reading the pages, and
the Anthropic path reproduced it exactly. Any backend that wants the job has
to match it, and report what it cost to do so.

    python3 scripts/topper/trial.py
"""
import concurrent.futures as cf
import importlib.util
import os
import re
import sys
from pathlib import Path

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
mistral = load('mistral')

SRC = Path.home() / 'Desktop' / 'Topper Copies'
PDF = SRC / 'Nausheen_Sectional-Test-VII_Ancient-India.pdf'
TRUE = {3, 10, 13, 16, 20, 22, 25}

# mistral-medium list price per million tokens
IN_RATE, OUT_RATE = 0.4, 2.0


def one(p):
    try:
        return p, mistral.read_question_mistral(readq.strip_png(PDF, p), readq.PROMPT)
    except Exception as e:
        return p, f'ERROR {str(e)[:90]}'


def main():
    print(f'model: {mistral.MODEL}', flush=True)
    res = {}
    with cf.ThreadPoolExecutor(6) as ex:
        for p, q in ex.map(one, range(1, 28)):
            res[p] = q

    found = []
    for p in sorted(res):
        q = res[p]
        if q.startswith('ERROR'):
            print(f'  p{p:02d} {q}')
            continue
        if q and not q.upper().startswith('NONE'):
            found.append(p)
            print(f'{"ok " if p in TRUE else "FP "} p{p:02d} {q[:84]}')

    print(f'\nfound  {sorted(found)}')
    print(f'true   {sorted(TRUE)}')
    print(f'missed {sorted(TRUE - set(found))}   '
          f'false positives {sorted(set(found) - TRUE)}')

    u = mistral.usage()
    cost = (u['in'] / 1e6) * IN_RATE + (u['out'] / 1e6) * OUT_RATE
    per = cost / max(u['calls'], 1)
    print(f"\ntokens in {u['in']}, out {u['out']}, over {u['calls']} pages")
    print(f'cost this run     : ${cost:.4f}')
    print(f'per page          : ${per:.5f}')
    print(f'895 pages would be: ${per * 895:.2f}  of a $9.99 balance')


if __name__ == '__main__':
    main()
