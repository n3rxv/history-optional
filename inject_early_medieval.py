import re

new_html = open('/home/claude/early_medieval.html', encoding='utf-8').read().strip()

with open('lib/noteContent.ts', encoding='utf-8') as f:
    content = f.read()

pattern = r"('early-medieval-india':\s*`)`"
replacement = lambda m: f"'early-medieval-india': `{new_html}`"

new_content, count = re.subn(pattern, replacement, content)

if count == 0:
    print("ERROR: pattern not found")
else:
    with open('lib/noteContent.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Done. Replaced {count} occurrence(s).")
