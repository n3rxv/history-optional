"""
Separates the several questions hidden inside one block of text.

GS Score and LevelUp papers print three questions on a page, and the model
reads all three into a single string. Leaving it that way means three
questions in one heading on the site, and PYQ matching breaking, since a
string holding three questions matches no single PYQ.

There are two ways to cut, and the order matters:

  1. If the text carries (a) (b) (c) labels, cut only on those. That is the
     strongest signal available. Cutting on directives here backfires: in
     "(a) Whether the Vedic people co-existed ... sources. Explain. (b) How far..."
     the "Explain." belongs to question (a), it does not begin a new one.

  2. With no labels, cut at sentence ends: a directive followed by a full stop
     ("Examine."), a question mark, or a following sentence that itself opens
     with a directive.

This is not fully correct, and it should not try to be. Its job is to propose;
the decision is made by eye.
"""
import re

# An (a) (b) (c) style label, with or without a question number in front
LABEL = re.compile(r'(?:(?<=^)|(?<=[\s.;:]))\(?\s*([a-e])\s*\)\s*(?=[A-Z"“\'‘0-9])')

TAIL = (r'Examine|Comment|Discuss|Evaluate|Elucidate|Explain|Substantiate|Justify|'
        r'Analyse|Analyze|Assess|Elaborate|critically|Trace|Delineate|Highlight|'
        r'Describe')
HEAD = (r'Discuss|Examine|Comment|Analyse|Analyze|Evaluate|Elucidate|Explain|'
        r'Trace|Assess|Describe|Critically|Give an account|Write notes|Highlight|'
        r'Delineate|Identify|How far|To what extent|Do you agree|What factors')

END = re.compile(rf'(?:\b(?:{TAIL})\.|\?)(\s+)(?=["“\'‘A-Z0-9])')
NEW = re.compile(rf'\.(\s+)(?=(?:{HEAD})\b)')

# How short a real question can be.
#
# This counted characters at first, and "Examine." and "Comment." became
# questions of their own because they carried a directive. They are not
# questions, they are the tail of the one before. Counting words separates
# them cleanly: no real question is shorter than six words, and a bare
# directive is always one or two.
MIN_WORDS = 6


def _too_small(part: str) -> bool:
    return len(part.split()) < MIN_WORDS


def split_questions(q: str) -> list[str]:
    q = ' '.join((q or '').split())
    if not q:
        return []

    labels = [m.start() for m in LABEL.finditer(q)]
    if len(labels) >= 2:
        cuts = labels
    else:
        cuts = sorted({m.start(1) for m in END.finditer(q)} |
                      {m.start(1) for m in NEW.finditer(q)})

    parts, prev = [], 0
    for c in cuts:
        parts.append(q[prev:c].strip())
        prev = c
    parts.append(q[prev:].strip())

    out: list[str] = []
    for p in [x for x in parts if x]:
        # Fold a leftover fragment into the part before it. A fragment that
        # carries its own question mark or directive is a question in its own
        # right though, however short: '"The middle class is the people".
        # Comment.' is 33 characters and is a whole question.
        if out and _too_small(p):
            out[-1] = f'{out[-1]} {p}'
        else:
            out.append(p)

    # The first fragment has nothing before it to fold into. That is how the
    # "4." in "4. (a) What kind of..." became a question of its own and the
    # block counted four parts instead of three. A question number left
    # standing alone joins the part after it.
    if len(out) > 1 and _too_small(out[0]):
        out[1] = f'{out[0]} {out[1]}'
        out = out[1:]
    return out


def strip_label(q: str) -> str:
    """Strip a leading (a)/(b)/4. label, per the house rule."""
    return re.sub(r'^\s*\(?\s*\d{0,2}\s*[.\)]?\s*\(?\s*[a-e]\s*\)\s*', '', q).strip()
