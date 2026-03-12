import re

with open('lib/noteContent.ts', 'r') as f:
    c = f.read()

# ─── 1. FIX MERGED WORDS (camelCase-style merges from bad PDF extraction) ─────
# Pattern: lowercase letter immediately followed by uppercase = missing space
# e.g. "remarkablewastheelaborate" → words run together
# We fix this by inserting space before each uppercase that follows a lowercase
# BUT we must not break HTML tags or existing proper words

def fix_merged_words(text):
    # Only apply inside text content, not inside HTML tags
    # Split on HTML tags and process only text nodes
    parts = re.split(r'(<[^>]+>)', text)
    result = []
    for part in parts:
        if part.startswith('<'):
            result.append(part)
        else:
            # Fix runs of lowercase+uppercase that indicate merged words
            # e.g. "remarkablewasthe" - hard to detect without dictionary
            # Better approach: fix specific known patterns
            # Insert space when: lowercase char followed immediately by uppercase
            # (this catches most PDF merge issues)
            fixed = re.sub(r'([a-z])([A-Z])', r'\1 \2', part)
            # Also fix when a word ends and another starts without space
            # Pattern: letter followed by letter where there should be a space
            # Look for runs of 15+ chars with no space (likely merged)
            def split_long_merged(m):
                word = m.group(0)
                if len(word) < 15:
                    return word
                # Try to split at likely word boundaries using common patterns
                # Insert space before common word starts
                word = re.sub(r'(and|the|was|for|with|that|this|from|into|over|under|after|before|among|their|there|these|those|which|when|where|while|then|than|also|such|some|have|been|were|they|said|more|most|many|each|both|only|very|well|will|can|may|must|shall|upon|about|above|below|between|through|during|within|without|toward|against|because|although|however|therefore|moreover|perhaps|whether|another|further|several|already|always|never|often|still|again|every|other|other|place|place|time|year|part|form|area|made|make|took|take|gave|give|came|come|went|went|used|uses|held|hold|kept|keep|led|lead|saw|seen|known|shown|given|taken|found|left|brought|called|named|known|since|later|early|later|period|century|state|power|rule|king|army|land|war|trade|tax|law|court|city|town|village|region|system|policy|class|caste|social|political|economic|cultural|religious|military|local|central|foreign|british|indian|muslim|hindu|english|french|dutch|portuguese|modern|ancient|medieval|imperial|colonial)\b', r' \1', word, flags=re.IGNORECASE)
                return word
            fixed = re.sub(r'[a-zA-Z]{15,}', split_long_merged, fixed)
            result.append(fixed)
    return ''.join(result)

# ─── 2. FIX BULLET FORMATTING ─────────────────────────────────────────────────
# Current state: • and ○ are inside <p> tags or <li> tags without hierarchy
# We need:
#   • main point  →  <ul class="main-points"><li>...</li></ul>
#   ○ sub-point   →  nested <ul class="sub-points"><li>...</li></ul>

def fix_bullets_in_slug(html):
    # Step 1: Fix merged words
    html = fix_merged_words(html)

    # Step 2: Normalize bullet characters inside <p> and <li> tags
    # Convert <p>• text</p> → structured list items
    # Convert <p>○ text</p> → structured sub-list items
    # Also handle cases where bullet is mid-paragraph (PDF extraction artifact)
    
    lines = html.split('\n')
    output = []
    in_main_ul = False
    in_sub_ul = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            output.append(line)
            continue

        # Extract text from <p> or <li> tags
        p_match = re.match(r'^<p>(.*)</p>$', stripped, re.DOTALL)
        li_match = re.match(r'^<li>(.*)</li>$', stripped, re.DOTALL)
        inner = None
        tag_type = None
        if p_match:
            inner = p_match.group(1).strip()
            tag_type = 'p'
        elif li_match:
            inner = li_match.group(1).strip()
            tag_type = 'li'

        if inner is not None:
            # Check if it starts with a filled bullet • (main point)
            if inner.startswith('•') or inner.startswith('●'):
                text = inner.lstrip('•●').strip()
                if not text:
                    continue
                if in_sub_ul:
                    output.append('</ul>')
                    in_sub_ul = False
                if not in_main_ul:
                    output.append('<ul class="main-points">')
                    in_main_ul = True
                output.append(f'<li>{text}</li>')

            # Check if it starts with hollow bullet ○ (sub-point)
            elif inner.startswith('○') or inner.startswith('◦') or inner.startswith('o ') and len(inner) > 2:
                text = inner.lstrip('○◦').strip()
                if inner.startswith('o '):
                    text = inner[2:].strip()
                if not text:
                    continue
                if not in_sub_ul:
                    if not in_main_ul:
                        # Sub-point without parent - open main ul first
                        output.append('<ul class="main-points">')
                        in_main_ul = True
                    output.append('<ul class="sub-points">')
                    in_sub_ul = True
                output.append(f'<li>{text}</li>')

            else:
                # Regular paragraph - close any open lists
                if in_sub_ul:
                    output.append('</ul>')
                    in_sub_ul = False
                if in_main_ul:
                    output.append('</ul>')
                    in_main_ul = False
                output.append(line)
        else:
            # It's a heading or other tag
            if in_sub_ul:
                output.append('</ul>')
                in_sub_ul = False
            if in_main_ul:
                output.append('</ul>')
                in_main_ul = False
            output.append(line)

    # Close any still-open lists
    if in_sub_ul:
        output.append('</ul>')
    if in_main_ul:
        output.append('</ul>')

    return '\n'.join(output)


# ─── 3. PROCESS EACH SLUG ────────────────────────────────────────────────────
def process_slug_content(m):
    slug = m.group(1)
    content = m.group(2)
    fixed = fix_bullets_in_slug(content)
    return f"  '{slug}': `{fixed}`,"

c = re.sub(
    r"  '([\w-]+)':\s*`(.*?)`\s*,",
    process_slug_content,
    c,
    flags=re.DOTALL
)

with open('lib/noteContent.ts', 'w') as f:
    f.write(c)

print('Done. Verifying...')
with open('lib/noteContent.ts', 'r') as f:
    final = f.read()

main_ul = len(re.findall(r'class="main-points"', final))
sub_ul = len(re.findall(r'class="sub-points"', final))
print(f'Main bullet lists: {main_ul}')
print(f'Sub-bullet lists:  {sub_ul}')
print(f'File size: {len(final)/1024/1024:.2f} MB')
