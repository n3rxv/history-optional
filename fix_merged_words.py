import re

with open('lib/noteContent.ts', 'r') as f:
    c = f.read()

# ─── COMMON ENGLISH + HISTORY WORDS FOR BOUNDARY DETECTION ───────────────────
# We'll use these to split merged runs like "centurybasedon" → "century based on"
WORDS = sorted([
    # Articles / prepositions / conjunctions
    'the','and','for','with','from','into','onto','upon','over','under',
    'after','before','during','within','without','between','among','against',
    'toward','above','below','about','along','around','across','through',
    'because','although','however','therefore','moreover','whether','that',
    'this','these','those','which','when','where','while','then','than',
    'also','such','some','both','each','only','very','well','even','just',
    'not','but','yet','nor','so','or','an','in','on','at','by','to','of',
    'as','up','out','off','all','its','his','her','our','their','they',
    'were','been','have','has','had','was','are','will','can','may','must',
    'shall','did','does','do','said','says','made','make','took','take',
    'gave','give','came','come','went','gone','used','held','kept','led',
    'saw','seen','known','shown','given','taken','found','left','brought',
    'called','named','since','later','early','period','century','centuries',
    # Historical / academic
    'state','power','rule','king','kings','army','land','war','trade','tax',
    'law','court','city','town','village','region','system','policy','class',
    'caste','social','political','economic','cultural','religious','military',
    'local','central','foreign','british','indian','muslim','hindu','english',
    'french','dutch','portuguese','modern','ancient','medieval','imperial',
    'colonial','dynasty','empire','kingdom','republic','province','district',
    'based','which','compiled','written','known','called','named','referred',
    'now','lost','found','used','formed','ruled','built','established',
    'developed','included','contains','contains','following','important',
    'significant','major','minor','main','primary','secondary','various',
    'different','similar','same','other','another','further','several',
    'already','always','never','often','still','again','every','many','most',
    'more','less','much','few','little','large','small','great','new','old',
    'first','second','third','fourth','fifth','sixth','seventh','eighth',
    'ninth','tenth','last','next','previous','following','above','below',
    'north','south','east','west','northern','southern','eastern','western',
    'india','china','europe','asia','africa','america','world','century',
    'literature','philosophy','religion','tradition','movement','reform',
    'revolt','rebellion','revolution','administration','government','society',
    'culture','economy','agriculture','industry','commerce','education',
    'science','art','music','poetry','architecture','sculpture','painting',
    'vedic','aryan','dravidian','sanskrit','prakrit','pali','persian','arabic',
    'compiled','texts','works','sources','accounts','records','inscriptions',
    'manuscripts','chronicles','biographies','commentaries','treatises',
    'were','purvas','angas','sutras','upanishads','brahmanas','vedas',
], key=len, reverse=True)  # longest first so greedy match works correctly

def split_merged(token):
    """
    Recursively split a merged token like 'centurybasedon'
    into 'century based on' using known word list.
    """
    if len(token) < 8:
        return token
    
    result = _split(token.lower())
    if result:
        # Preserve original capitalisation of the first letter
        rejoined = ' '.join(result)
        if token[0].isupper():
            rejoined = rejoined[0].upper() + rejoined[1:]
        return rejoined
    return token

def _split(s, memo={}):
    if s in memo:
        return memo[s]
    if not s:
        return []
    # Try each known word as a prefix
    for word in WORDS:
        if s.startswith(word) and len(s) > len(word):
            rest = _split(s[len(word):])
            if rest is not None:
                memo[s] = [word] + rest
                return memo[s]
    # No split found — return None (keep as-is)
    memo[s] = None
    return None

def fix_merged_words_in_text(text):
    """
    Find tokens that are suspiciously long (15+ chars, all alpha, no spaces)
    and try to split them.
    """
    def try_fix(m):
        token = m.group(0)
        # Skip if it looks like a proper noun / name / technical term
        # (we only fix all-lowercase runs that are clearly merged)
        if not re.match(r'^[a-z]{15,}$', token):
            return token
        fixed = split_merged(token)
        return fixed
    
    return re.sub(r'[a-zA-Z]{15,}', try_fix, text)

def fix_text_node(text):
    # Fix merged lowercase runs
    text = fix_merged_words_in_text(text)
    
    # Also fix specific patterns we know from the PDF:
    # digit immediately followed by letter with no space: "5thcentury" → "5th century"
    text = re.sub(r'(\d(?:st|nd|rd|th)?)([a-zA-Z])', r'\1 \2', text)
    # letter immediately followed by digit (rare but happens): "centuryAD300" 
    text = re.sub(r'([a-zA-Z])(\d)', r'\1 \2', text)
    # Fix "14Purvas" → "14 Purvas" style
    text = re.sub(r'(\d+)([A-Z][a-z])', r'\1 \2', text)
    
    return text

# ─── PROCESS ONLY TEXT NODES (NOT HTML TAGS) ─────────────────────────────────
def fix_html_content(html):
    # Split on HTML tags, fix only the text parts
    parts = re.split(r'(<[^>]+>)', html)
    fixed = []
    for part in parts:
        if part.startswith('<'):
            fixed.append(part)
        else:
            fixed.append(fix_text_node(part))
    return ''.join(fixed)

# ─── APPLY TO ALL SLUGS ───────────────────────────────────────────────────────
print('Fixing merged words across all slugs...')

def process_slug(m):
    slug = m.group(1)
    content = m.group(2)
    fixed = fix_html_content(content)
    if fixed != content:
        pass  # changed
    return f"  '{slug}': `{fixed}`,"

c = re.sub(
    r"  '([\w-]+)':\s*`(.*?)`\s*,",
    process_slug,
    c,
    flags=re.DOTALL
)

with open('lib/noteContent.ts', 'w') as f:
    f.write(c)

print('Done.')
print(f'File size: {len(c)/1024/1024:.2f} MB')

# Show a sample to verify
sample_check = [
    ('centurybasedon',    'century based on'),
    ('whicharenowlost',   'which are now lost'),
    ('14Purvas',          '14 Purvas'),
    ('5thcentury',        '5th century'),
]
print('\nSpot check (these specific strings should be gone):')
for bad, good in sample_check:
    found = bad.lower() in c.lower()
    print(f'  "{bad}" still present: {found}')
