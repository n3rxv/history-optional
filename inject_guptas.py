import re

with open('lib/noteContent.ts', encoding='utf-8') as f:
    content = f.read()

new_html = open('/home/claude/guptas.html', encoding='utf-8').read().strip()

pattern = r"('guptas-vakatakas-vardhanas':\s*`)`"
result = re.sub(pattern, lambda m: m.group(1) + new_html + '`', content)

if result == content:
    print("ERROR: slug 'guptas-vakatakas-vardhanas' not found or pattern did not match.")
else:
    with open('lib/noteContent.ts', 'w', encoding='utf-8') as f:
        f.write(result)
    print("SUCCESS: 'guptas-vakatakas-vardhanas' injected into noteContent.")
