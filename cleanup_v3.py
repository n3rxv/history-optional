import re

with open('lib/noteContent.ts', 'r') as f:
    c = f.read()

junk_patterns = [
    # "History Optional 2023-24", "History Optional 2024-25" etc
    r'History Optional\s*\d{4}[-–]\d{2,4}[^\n<]*',
    r'History Optional[^\n<]*',
    # "History Foundation 2023-24: ..." (catch any missed variants)
    r'History Foundation\s*\d{4}[-–]\d{2,4}[^\n<]*',
    r'History Foundation[^\n<]*',
    # Any remaining address / office fragments
    r'Office Complex[^\n<]*',
    r'Old Rajinder Nagar[^\n<]*',
    r'Rajinder Nagar[^\n<]*',
    r'\d+(?:st|nd|rd|th)\s*Floor[^\n<]*',
    r'2nd Floor[^\n<]*',
    r'3rd Floor[^\n<]*',
    r'45 Pusa Road[^\n<]*',
    r'Pusa Road[^\n<]*',
    r'Opp\.?\s*Metro Pillar[^\n<]*',
    r'Metro Pillar[^\n<]*',
    r'Karol Bagh[^\n<]*',
    r'New Delhi[-–\s]*\d{6}[^\n<]*',
    r'New Delhi[^\n<]*',
]

for pattern in junk_patterns:
    c = re.sub(pattern, '', c, flags=re.IGNORECASE)

# Clean up empty tags left behind
for _ in range(3):
    c = re.sub(r'<h[1-6]>\s*</h[1-6]>', '', c)
    c = re.sub(r'<p>[\s\-–|,.:;]*</p>', '', c)
    c = re.sub(r'<li>\s*</li>', '', c)
    c = re.sub(r'<ul>\s*</ul>', '', c)
    c = re.sub(r'<ol>\s*</ol>', '', c)

c = re.sub(r'\n{3,}', '\n\n', c)

with open('lib/noteContent.ts', 'w') as f:
    f.write(c)

# Verify
print('Done. Checking...')
checks = [
    'History Optional', 'History Foundation', 'Office Complex',
    'Rajinder Nagar', 'Pusa Road', 'Metro Pillar', 'Karol Bagh',
    'New Delhi', 'Floor,', '2nd Floor', '3rd Floor',
]
with open('lib/noteContent.ts', 'r') as f:
    final = f.read()

found = [x for x in checks if x.lower() in final.lower()]
if found:
    for term in found:
        for m in re.finditer(re.escape(term), final, re.IGNORECASE):
            s, e = max(0, m.start()-30), min(len(final), m.end()+80)
            print(f'  ⚠ Still found "{term}": ...{final[s:e].strip()}...')
else:
    print('  ✓ All clear.')
print(f'  File size: {len(final)/1024/1024:.2f} MB')
