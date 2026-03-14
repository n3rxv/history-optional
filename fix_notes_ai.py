"""
AI-powered noteContent.ts fixer using Groq (llama-3.3-70b).
Run this locally in your project root:
    pip install groq
    python fix_notes_ai.py

It will overwrite lib/noteContent.ts with the fixed version.
"""

import re, os, time, sys

try:
    from groq import Groq
except ImportError:
    print("Installing groq...")
    os.system(f"{sys.executable} -m pip install groq -q")
    from groq import Groq

# ── CONFIG ────────────────────────────────────────────────────────────────────
GROQ_API_KEY = "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"
INPUT_FILE   = "lib/noteContent.ts"
BACKUP_FILE  = "lib/noteContent.backup_preAI.ts"
MODEL        = "llama-3.3-70b-versatile"
CHUNK_SIZE   = 6000   # chars per API call
DELAY        = 0.4    # seconds between calls (avoid rate limit)
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM = """You are fixing HTML content for Indian history study notes. The content has text corruption from bad PDF extraction.

ISSUES TO FIX:
1. Garbled/broken words: "see sm orality" → "sees morality", "asa matter" → "as a matter", "thebes tout come sf or" → "the best outcomes for", "tot he" → "to the", "oft he" → "of the", "int he" → "in the", "ont he" → "on the", "att he" → "at the", "bythe" → "by the", "inthe" → "in the"
2. Missing spaces after punctuation: "Earlier,the" → "Earlier, the", "freedom.It" → "freedom. It"  
3. Single/double letter fragments that are clearly broken: "sf or", "sm orality", "tot he", "oft he"
4. Any other obviously garbled or corrupted text

STRICT RULES:
- Return ONLY the fixed HTML. No explanation, no markdown fences, no commentary.
- Do NOT change correct content, historical facts, names, dates, or proper nouns
- Do NOT rewrite or rephrase anything that reads correctly
- Do NOT add or remove HTML tags
- Only fix genuine corruption — if you're unsure, leave it unchanged
- Preserve all whitespace/newlines between tags"""

client = Groq(api_key=GROQ_API_KEY)


def fix_chunk(chunk: str, slug: str, chunk_idx: int) -> str:
    for attempt in range(4):
        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM},
                    {"role": "user",   "content": f"Fix this HTML:\n\n{chunk}"}
                ],
                temperature=0,
                max_tokens=8000,
            )
            result = resp.choices[0].message.content.strip()
            # Strip markdown fences if model adds them
            result = re.sub(r'^```html?\n?', '', result, flags=re.I)
            result = re.sub(r'\n?```$', '', result)
            return result.strip()
        except Exception as e:
            wait = 20 * (attempt + 1)
            print(f"      ⚠ Attempt {attempt+1} failed ({e}), retrying in {wait}s...")
            time.sleep(wait)
    print(f"      ✗ Giving up on chunk {chunk_idx}, keeping original")
    return chunk


def chunk_html(html: str) -> list[str]:
    if len(html) <= CHUNK_SIZE:
        return [html]
    chunks = []
    pos = 0
    while pos < len(html):
        end = pos + CHUNK_SIZE
        if end >= len(html):
            chunks.append(html[pos:])
            break
        # Try to split at a tag boundary
        tag_end = html.rfind('>', pos, end)
        if tag_end > pos + CHUNK_SIZE // 2:
            end = tag_end + 1
        chunks.append(html[pos:end])
        pos = end
    return chunks


def parse_slugs(content: str):
    """Parse slug names and bodies from noteContent.ts"""
    starts = list(re.finditer(r"\n '([\w-]+)':\s*`", content))
    slugs = {}
    order = []
    for i, m in enumerate(starts):
        slug = m.group(1)
        body_start = m.end()
        body_end = starts[i+1].start() if i+1 < len(starts) else len(content)
        body = content[body_start:body_end]
        body = re.sub(r'`\s*,?\s*$', '', body.rstrip())
        slugs[slug] = body
        order.append(slug)
    return slugs, order


def rebuild(slugs: dict, order: list, original: str) -> str:
    """Reconstruct noteContent.ts from fixed slugs"""
    out = "export const noteContent: Record<string, string> = {\n"
    for slug in order:
        body = slugs.get(slug, "")
        # Escape backticks and template literal syntax
        body = body.replace('\\`', '`')   # unescape first
        body = body.replace('`', '\\`')   # then re-escape
        body = body.replace('${', '\\${')
        out += f" '{slug}': `{body}`,\n"
    # Append the suffix (getNoteContent function)
    suffix_m = re.search(r'\}\nexport function getNoteContent', original)
    if suffix_m:
        out += original[suffix_m.start():]
    else:
        out += '}\nexport function getNoteContent(slug: string): string {\nreturn noteContent[slug] || `<h1>Notes Coming Soon</h1><p>This topic is being prepared.</p>`;\n}'
    return out


def main():
    print(f"Reading {INPUT_FILE}...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        original = f.read()

    # Backup
    with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
        f.write(original)
    print(f"Backup saved to {BACKUP_FILE}")

    slugs, order = parse_slugs(original)
    print(f"Parsed {len(order)} slugs\n")

    total_chunks = sum(len(chunk_html(b)) for b in slugs.values())
    print(f"Total API calls needed: {total_chunks}")
    print(f"Estimated time: ~{total_chunks * (DELAY + 1.5) / 60:.0f} minutes\n")

    fixed_slugs = {}
    calls_done = 0
    t_start = time.time()

    for si, slug in enumerate(order):
        body = slugs[slug]
        chunks = chunk_html(body)
        print(f"[{si+1:2d}/{len(order)}] {slug:<50} ({len(body)//1000}K, {len(chunks)} chunks)")

        fixed_chunks = []
        for ci, chunk in enumerate(chunks):
            fixed = fix_chunk(chunk, slug, ci)
            fixed_chunks.append(fixed)
            calls_done += 1
            elapsed = time.time() - t_start
            rate = calls_done / elapsed if elapsed > 0 else 1
            eta = (total_chunks - calls_done) / rate / 60
            print(f"  chunk {ci+1}/{len(chunks)} ✓  |  {calls_done}/{total_chunks} calls  |  ETA {eta:.1f}min")
            time.sleep(DELAY)

        fixed_slugs[slug] = ''.join(fixed_chunks)

    print("\nRebuilding file...")
    new_content = rebuild(fixed_slugs, order, original)

    with open(INPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)

    elapsed = time.time() - t_start
    print(f"\n✅ Done in {elapsed/60:.1f} minutes!")
    print(f"   Original: {len(original)//1024}KB")
    print(f"   Fixed:    {len(new_content)//1024}KB")
    print(f"\nNow run:  git add lib/noteContent.ts && git commit -m 'AI fix all formatting' && git push")


if __name__ == '__main__':
    main()
