#!/usr/bin/env python3
"""
PDF Notes Extractor
Usage: python3 process_pdfs.py path/to/pdf1.pdf path/to/pdf2.pdf ...
   or: python3 process_pdfs.py pdfs/          (pass a folder)
"""

import sys
import os
import re
import json
import time
import tempfile
import webbrowser
import subprocess
from pathlib import Path
from anthropic import Anthropic

# ── Config ────────────────────────────────────────────────────────────────────
NOTE_CONTENT_PATH = "lib/noteContent.ts"

SYSTEM_PROMPT = """You are a history notes HTML formatter. Convert raw PDF text to clean HTML.

STRICT RULES:
1. Mirror PDF markers EXACTLY:
   - Lines with ●, •, -, * (bullet) → <ul><li>• content</li></ul>
   - Indented sub-lines with ○, ◦ → <ul class="sub-list"><li>◦ content</li></ul>
   - Numbered lines → <ol><li>content</li></ol>
   - Section headings (ALL CAPS or clearly a heading) → <h2>content</h2>
   - Sub-headings → <h3>content</h3>
   - Plain paragraphs → <p>content</p>
2. NEVER add bullets where the PDF has none
3. Keep all historical terms, dates, names exactly as in PDF
4. Use <strong> for bold text if present
5. Return ONLY raw HTML — no markdown, no backticks, no explanation whatsoever"""

SLUG_HINTS = [
    (["source", "handout_02", "handout 02"],          "sources-ancient-india"),
    (["stone age", "prehistory", "protohistory", "handout_03", "handout 03"], "prehistory-protohistory"),
    (["harappan", "indus", "handout_04", "handout 04"], "indus-valley-civilization"),
    (["megalithic", "handout_05", "handout 05"],       "megalithic-cultures"),
    (["aryan", "vedic", "handout_06", "handout 06"],   "aryans-vedic-period"),
    (["mahajanapada", "handout_07", "handout 07"],     "mahajanapadas"),
    (["maurya", "handout_08", "handout 08"],           "mauryan-empire"),
    (["post maurya", "handout_09", "handout 09"],      "post-mauryan-period"),
    (["gupta", "handout_10", "handout 10"],            "gupta-empire"),
    (["sangam", "south india", "handout_11", "handout 11"], "south-india-sangam"),
    (["regional", "handout_12", "handout 12"],         "regional-kingdoms"),
    (["delhi sultanate", "handout_13", "handout 13"],  "delhi-sultanate"),
    (["mughal", "handout_14", "handout 14"],           "mughal-empire"),
    (["bhakti", "sufi", "handout_15", "handout 15"],   "bhakti-sufi"),
    (["maratha", "handout_16", "handout 16"],          "maratha-empire"),
    (["colonial", "handout_17", "handout 17"],         "colonial-economy"),
    (["revolt", "1857", "handout_18", "handout 18"],   "revolt-1857"),
    (["national movement", "handout_19", "handout 19"], "national-movement"),
    (["partition", "independence", "handout_20", "handout 20"], "partition-independence"),
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def detect_slug(filename: str) -> str:
    lower = filename.lower()
    for keywords, slug in SLUG_HINTS:
        if any(k in lower for k in keywords):
            return slug
    base = Path(filename).stem
    return re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")[:50]


def extract_pdf_text(pdf_path: str) -> str:
    """Extract text from PDF using pdfplumber (best) or pypdf fallback."""
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            pages = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return "\n".join(pages)
    except ImportError:
        pass

    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except ImportError:
        pass

    print("  ✗  Neither pdfplumber nor pypdf found.")
    print("     Install with: pip3 install pdfplumber --break-system-packages")
    sys.exit(1)


def call_claude(slug: str, text: str) -> str:
    client = Anthropic()
    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f'Slug: "{slug}"\n\nPDF TEXT:\n{text}'}]
    )
    html = resp.content[0].text.strip()
    # Strip accidental markdown fences
    html = re.sub(r"^```html\n?", "", html)
    html = re.sub(r"\n?```$", "", html)
    return html.strip()


def open_preview(slug: str, html: str):
    """Write an HTML preview file and open it in the default browser."""
    preview_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Preview — {slug}</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ background: #e8e4dc; font-family: Georgia, serif; padding: 48px 24px; }}
  .paper {{
    background: #fffef8;
    max-width: 760px;
    margin: 0 auto;
    padding: 56px 64px;
    border-radius: 2px;
    box-shadow: 0 4px 32px rgba(0,0,0,0.18);
    font-size: 15px;
    line-height: 1.8;
    color: #1a1a1a;
  }}
  .slug-label {{
    font-family: monospace;
    font-size: 11px;
    color: #999;
    letter-spacing: 0.15em;
    margin-bottom: 28px;
    text-transform: uppercase;
  }}
  h2 {{ font-size: 20px; font-weight: 700; margin: 24px 0 10px; color: #111;
        border-bottom: 1px solid #ddd; padding-bottom: 5px; }}
  h3 {{ font-size: 16px; font-weight: 600; margin: 18px 0 8px; color: #222; }}
  p  {{ margin: 10px 0; }}
  ul {{ margin: 6px 0 6px 22px; }}
  ul.sub-list {{ margin-left: 40px; }}
  li {{ margin: 4px 0; }}
  ol {{ margin: 6px 0 6px 26px; }}
  strong {{ font-weight: 700; }}
  .note {{
    margin-top: 40px;
    padding: 14px 20px;
    background: #f5f0e8;
    border-left: 3px solid #c9a84c;
    font-size: 13px;
    color: #555;
    font-family: monospace;
  }}
</style>
</head>
<body>
  <div class="paper">
    <div class="slug-label">slug: {slug}</div>
    {html}
    <div class="note">
      ↩ Go back to your terminal and type <strong>y</strong> to approve or <strong>n</strong> to reject.
    </div>
  </div>
</body>
</html>"""

    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".html", delete=False,
        prefix=f"preview_{slug}_"
    )
    tmp.write(preview_html)
    tmp.flush()
    tmp.close()
    webbrowser.open(f"file://{tmp.name}")
    return tmp.name


def inject_into_notecontent(slug: str, html: str, filepath: str):
    with open(filepath, "r") as f:
        content = f.read()

    pattern = rf"('{re.escape(slug)}':\s*`)([^`]*)(`)"
    if not re.search(pattern, content, flags=re.DOTALL):
        print(f"  ✗  Slug '{slug}' not found in {filepath}")
        print(f"     Make sure the skeleton has this slug.")
        return False

    new_content = re.sub(
        pattern,
        lambda m: f"'{slug}': `{html}`",
        content,
        flags=re.DOTALL
    )

    with open(filepath, "w") as f:
        f.write(new_content)
    return True


# ── Main ──────────────────────────────────────────────────────────────────────

def collect_pdfs(args):
    pdfs = []
    for arg in args:
        p = Path(arg)
        if p.is_dir():
            pdfs.extend(sorted(p.glob("*.pdf")))
        elif p.suffix.lower() == ".pdf" and p.exists():
            pdfs.append(p)
        else:
            print(f"  ⚠  Skipping '{arg}' (not a PDF or folder)")
    return pdfs


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 process_pdfs.py file1.pdf file2.pdf ...")
        print("   or: python3 process_pdfs.py pdfs_folder/")
        sys.exit(1)

    pdfs = collect_pdfs(sys.argv[1:])
    if not pdfs:
        print("No PDFs found.")
        sys.exit(1)

    if not os.path.exists(NOTE_CONTENT_PATH):
        print(f"✗  Cannot find {NOTE_CONTENT_PATH}")
        print("   Run this script from your project root (history-optional/)")
        sys.exit(1)

    print(f"\n{'─'*50}")
    print(f"  Found {len(pdfs)} PDF(s) to process")
    print(f"{'─'*50}\n")

    approved = []
    rejected = []
    preview_files = []

    for i, pdf_path in enumerate(pdfs, 1):
        name = pdf_path.name
        slug = detect_slug(name)

        print(f"[{i}/{len(pdfs)}] {name}")
        print(f"       slug  → {slug}")

        # Let user override slug
        override = input(f"       Press Enter to keep slug, or type a new one: ").strip()
        if override:
            slug = override

        print(f"       Extracting text...", end=" ", flush=True)
        text = extract_pdf_text(str(pdf_path))
        print(f"✓ ({len(text)} chars)")

        print(f"       Sending to Claude...", end=" ", flush=True)
        try:
            html = call_claude(slug, text)
            print(f"✓")
        except Exception as e:
            print(f"✗ Error: {e}")
            rejected.append((slug, name))
            continue

        print(f"       Opening preview in browser...")
        tmp_file = open_preview(slug, html)
        preview_files.append(tmp_file)

        # Wait for user
        while True:
            ans = input(f"       Approve? [y/n]: ").strip().lower()
            if ans in ("y", "n"):
                break

        if ans == "y":
            print(f"       Injecting into {NOTE_CONTENT_PATH}...", end=" ", flush=True)
            ok = inject_into_notecontent(slug, html, NOTE_CONTENT_PATH)
            if ok:
                print("✓")
                approved.append((slug, name))
            else:
                rejected.append((slug, name))
        else:
            print(f"       Skipped.")
            rejected.append((slug, name))

        print()

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"{'─'*50}")
    print(f"  Done!  {len(approved)} approved  |  {len(rejected)} rejected")
    print(f"{'─'*50}")

    if approved:
        print("\n  Approved slugs:")
        for slug, name in approved:
            print(f"    ✓  {slug}  ({name})")

        print("\n  Push to git:")
        slugs_joined = ", ".join(s for s, _ in approved)
        print(f'    git add lib/noteContent.ts')
        print(f'    git commit -m "Add notes: {slugs_joined}"')
        print(f'    git push')

    if rejected:
        print("\n  Rejected / errored slugs:")
        for slug, name in rejected:
            print(f"    ✗  {slug}  ({name})")

    # Cleanup temp preview files
    for f in preview_files:
        try:
            os.unlink(f)
        except Exception:
            pass

    print()


if __name__ == "__main__":
    main()
