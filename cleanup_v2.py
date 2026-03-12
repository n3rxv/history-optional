import re

with open('lib/noteContent.ts', 'r') as f:
    c = f.read()

# ─── STRIP ALL INSTITUTIONAL JUNK ─────────────────────────────────────────────
junk_patterns = [
    # Address variants
    r'Office Complex\s*\d*[,\s]*\d*(?:st|nd|rd|th)?\s*Floor[^\n<]*',
    r'\d+(?:st|nd|rd|th)\s*Floor[^\n<]*',
    r'Old Rajinder Nagar[^\n<]*',
    r'Rajinder Nagar[^\n<]*',
    r'2nd Floor,?\s*45 Pusa Road[^\n<]*',
    r'45 Pusa Road[^\n<]*',
    r'Pusa Road[^\n<]*',
    r'Opp\.?\s*Metro Pillar\s*\d+[^\n<]*',
    r'Metro Pillar[^\n<]*',
    r'Karol Bagh[^\n<]*',
    r'New Delhi[-–\s]*\d{6}[^\n<]*',
    r'New Delhi[^\n<]*',
    # History Foundation header lines (all year variants)
    r'History Foundation\s*\d{4}[-–]\d{2,4}\s*:?[^\n<]*',
    r'History Foundation[^\n<]*',
    # Handout / Lecture labels
    r'Handout\s*[-–]?\s*\d+[^\n<]*',
    r'Lecture\s*[-–]?\s*\d+[^\n<]*',
    # Institute names
    r'LevelUp\s*IAS[^\n<]*',
    r'Level\s*Up\s*IAS[^\n<]*',
    r'Levelup\s*IAS[^\n<]*',
    # People
    r'Niruv\s*Bhardwaj[^\n<]*',
    r'niruvbhardwaj[^\n<]*',
    # Contact
    r'Email\s*:[^\n<]*',
    r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}[^\n<]*',
    r'Ph\s*:\s*[\d\s,|+\-()]+',
    r'\+91[-\s]*\d[\d\s\-]*',
    r'0804524849[12]',
    r'7041021151',
    # Catch-all: any line that's just an address/location fragment
    r'(?:^|\n)\s*(?:Plot|Door|Flat|Block|Sector|Phase|Building|Complex|Tower|House|Shop)\s*(?:No\.?|#)?\s*\d+[^\n<]{0,80}(?=\n|<)',
]

for pattern in junk_patterns:
    c = re.sub(pattern, '', c, flags=re.IGNORECASE)

# ─── CLEAN UP EMPTY/ORPHANED TAGS ─────────────────────────────────────────────
for _ in range(3):  # multiple passes to catch nested empties
    c = re.sub(r'<h[1-6]>\s*</h[1-6]>', '', c)
    c = re.sub(r'<p>[\s\-–|,.:;]*</p>', '', c)
    c = re.sub(r'<li>\s*</li>', '', c)
    c = re.sub(r'<ul>\s*</ul>', '', c)
    c = re.sub(r'<ol>\s*</ol>', '', c)

# ─── COLLAPSE EXTRA BLANK LINES ───────────────────────────────────────────────
c = re.sub(r'\n{3,}', '\n\n', c)

with open('lib/noteContent.ts', 'w') as f:
    f.write(c)

# ─── VERIFY ───────────────────────────────────────────────────────────────────
print('Done. Checking for remaining junk...')

checks = [
    '2nd Floor', 'Pusa Road', 'Karol Bagh', 'History Foundation',
    'Handout -', 'Handout–', 'LevelUp', 'Metro Pillar',
    'Old Rajinder', 'Rajinder Nagar', 'Office Complex',
    'New Delhi', '3rd Floor', '1st Floor', '2nd Floor',
]

with open('lib/noteContent.ts', 'r') as f:
    final = f.read()

found = [x for x in checks if x.lower() in final.lower()]
if found:
    print(f'  ⚠ Still found: {found}')
    # Show context for each
    for term in found:
        for m in re.finditer(re.escape(term), final, re.IGNORECASE):
            start = max(0, m.start() - 40)
            end = min(len(final), m.end() + 80)
            print(f'    → ...{final[start:end].strip()}...')
else:
    print('  ✓ All institutional junk removed.')

print(f'  File size: {len(final)/1024/1024:.2f} MB')
