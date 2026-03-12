import re

with open('lib/noteContent.ts', 'r') as f:
    c = f.read()

# ─── 1. PATTERNS TO STRIP ────────────────────────────────────────────────────
junk_patterns = [
    # Address line
    r'2nd Floor,?\s*45 Pusa Road[^\n<]*',
    r'Opp\.?\s*Metro Pillar\s*\d+[^\n<]*',
    r'Karol Bagh[^\n<]*',
    r'New Delhi[-–\s]*\d{6}[^\n<]*',
    # Email lines
    r'Email\s*:[^\n<]*',
    r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}[^\n<]*',
    # History Foundation header lines like:
    # "History Foundation 2024-25: Ancient History/Handout - 06"
    # "History Foundation 2023-24: Ancient History/Handout - 23"
    r'History Foundation\s*\d{4}[-–]\d{2,4}\s*:[^\n<]*',
    # Generic handout/lecture labels
    r'Handout\s*[-–]?\s*\d+[^\n<]*',
    r'Lecture\s*[-–]?\s*\d+[^\n<]*',
    # Phone numbers
    r'Ph\s*:\s*[\d\s,|+\-()]+',
    r'\+91[-\s]*\d[\d\s\-]*',
    r'0804524849[12]',
    r'7041021151',
    # Institute names
    r'LevelUp\s*IAS[^\n<]*',
    r'Level\s*Up\s*IAS[^\n<]*',
    r'Niruv\s*Bhardwaj[^\n<]*',
    r'niruvbhardwaj[^\n<]*',
    r'students@\S+',
    # Pusa Road / address variants
    r'Pusa\s*Road[^\n<]*',
    r'Metro\s*Pillar[^\n<]*',
]

for pattern in junk_patterns:
    c = re.sub(pattern, '', c, flags=re.IGNORECASE)

# ─── 2. CLEAN UP EMPTY TAGS LEFT BEHIND ──────────────────────────────────────
c = re.sub(r'<h[1-6]>\s*</h[1-6]>', '', c)
c = re.sub(r'<p>\s*[,.\-–|]*\s*</p>', '', c)
c = re.sub(r'<li>\s*</li>', '', c)
c = re.sub(r'<ul>\s*</ul>', '', c)
c = re.sub(r'<ol>\s*</ol>', '', c)
# Remove tags that now only contain whitespace/punctuation after strip
c = re.sub(r'<p>[\s\-–|,.:;]*</p>', '', c)

# ─── 3. SLUG → FALLBACK HEADINGS FROM SYLLABUS ───────────────────────────────
# If a slug's content has no <h1> or <h2> at all, inject a heading from syllabus.
slug_headings = {
    'sources-ancient-india':            'Sources of Ancient Indian History',
    'prehistory-protohistory':          'Prehistory and Protohistory',
    'indus-valley-civilization':        'Indus Valley Civilization (Harappan Culture)',
    'megalithic-cultures':              'Megalithic Cultures',
    'aryans-vedic-period':              'Aryans and the Vedic Period',
    'mahajanapadas':                    'Mahajanapadas, Rise of Buddhism & Jainism',
    'mauryan-empire':                   'Mauryan Empire',
    'post-mauryan-period':              'Post-Mauryan Period',
    'guptas-vakatakas-vardhanas':       'Guptas, Vakatakas and Vardhanas',
    'regional-states-gupta-era':        'Regional States during Gupta Era',
    'eastern-india-deccan-south':       'Early State & Society — East, Deccan & South',
    'early-indian-cultural-history':    'Early Indian Cultural History',
    'early-medieval-india':             'Early Medieval India',
    'cultural-traditions-750-1200':     'Cultural Traditions, 750–1200 CE',
    'thirteenth-century':               'The Thirteenth Century',
    'fourteenth-century':               'The Fourteenth Century',
    'society-culture-economy-13-14c':   'Society, Culture and Economy (13th–14th Century)',
    'fifteenth-sixteenth-century-political': 'Political Developments: 15th–16th Century',
    'fifteenth-sixteenth-century-society':   'Society and Culture: 15th–16th Century',
    'akbar':                            'Akbar',
    'mughal-empire-17th-century':       'Mughal Empire in the 17th Century',
    'economy-society-16-17c':           'Economy and Society: 16th–17th Century',
    'mughal-culture':                   'Mughal Culture',
    'eighteenth-century':               'The Eighteenth Century',
    'european-penetration-india':       'European Penetration into India',
    'british-expansion-india':          'British Expansion in India',
    'early-british-raj':                'Early Structure of the British Raj',
    'economic-impact-british-rule':     'Economic Impact of British Rule',
    'social-cultural-developments':     'Social and Cultural Developments',
    'social-religious-reform':          'Social and Religious Reform Movements',
    'indian-response-british-rule':     'Indian Response to British Rule',
    'birth-indian-nationalism':         'Birth of Indian Nationalism',
    'gandhian-nationalism':             'Gandhian Nationalism',
    'constitutional-developments':      'Constitutional Developments',
    'other-strands-national-movement':  'Other Strands of the National Movement',
    'politics-separatism-partition':    'Politics of Separatism and Partition',
    'post-independence-consolidation':  'Post-Independence Consolidation',
    'caste-ethnicity-post-1947':        'Caste and Ethnicity after 1947',
    'economic-development-political-change': 'Economic Development and Political Change',
    'enlightenment-modern-ideas':       'Enlightenment and Modern Ideas',
    'origins-modern-politics':          'Origins of Modern Politics',
    'industrialization':                'Industrialization',
    'nation-state-system':              'The Nation-State System',
    'imperialism-colonialism':          'Imperialism and Colonialism',
    'revolution-counter-revolution':    'Revolution and Counter-Revolution',
    'world-wars':                       'The World Wars',
    'world-after-wwii':                 'The World after World War II',
    'liberation-colonial-rule':         'Liberation from Colonial Rule',
    'decolonization-underdevelopment':  'Decolonization and Underdevelopment',
    'unification-europe':               'Unification of Europe',
    'disintegration-soviet-union':      'Disintegration of the Soviet Union',
    # Medieval extras
    'bhakti-sufi':                      'Bhakti and Sufi Movements',
    'marathas':                         'The Marathas',
    'delhi-sultanate':                  'The Delhi Sultanate',
    'provincial-kingdoms':              'Provincial Kingdoms: Bahmani and Vijayanagara',
    'mughal-empire':                    'The Mughal Empire',
    'indian-nationalism-early':         'Early Indian Nationalism',
    'gandhi-national-movement':         'Gandhian National Movement',
    'towards-independence':             'Towards Independence',
    'world-history':                    'World History',
    'gupta-empire':                     'The Gupta Empire',
    'post-gupta-period':                'Post-Gupta Period',
    'early-structure-british-raj':      'Early Structure of the British Raj',
}

def inject_heading_if_missing(slug, html, heading):
    """If html has no h1/h2, prepend the syllabus heading as h1."""
    if not re.search(r'<h[12]', html):
        return f'<h1>{heading}</h1>\n' + html
    return html

# Process each slug block in the TS file
def fix_slug(m):
    slug = m.group(1)
    content = m.group(2)
    if slug in slug_headings:
        content = inject_heading_if_missing(slug, content, slug_headings[slug])
    return f"  '{slug}': `{content}`,"

c = re.sub(
    r"  '([\w-]+)':\s*`(.*?)`\s*,",
    fix_slug,
    c,
    flags=re.DOTALL
)

# ─── 4. COLLAPSE REPEATED BLANK LINES ────────────────────────────────────────
c = re.sub(r'\n{3,}', '\n\n', c)

with open('lib/noteContent.ts', 'w') as f:
    f.write(c)

print('Done. Verifying...')

# Quick sanity check
with open('lib/noteContent.ts', 'r') as f:
    final = f.read()

remaining_junk = []
for check in ['2nd Floor', 'Pusa Road', 'Karol Bagh', 'History Foundation', 'Handout -', 'LevelUp IAS', 'Metro Pillar']:
    if check.lower() in final.lower():
        remaining_junk.append(check)

if remaining_junk:
    print(f'WARNING - still found: {remaining_junk}')
else:
    print('All junk removed successfully.')

import re as _re
slug_count = len(_re.findall(r"'[\w-]+':\s*`", final))
headings_present = len(_re.findall(r'<h[12]', final))
print(f'Slugs: {slug_count} | Headings in content: {headings_present}')
print(f'File size: {len(final)/1024/1024:.2f} MB')
