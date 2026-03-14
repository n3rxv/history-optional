import re

with open('lib/noteContent.ts', 'r', encoding='utf-8') as f:
    content = f.read()

with open('/home/claude/post-mauryan.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Escape backticks and backslashes for template literal safety
html_escaped = html.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

pattern = r"('post-mauryan-period':\s*)`\s*`"
replacement = lambda m: m.group(1) + '`' + html_escaped + '`'

new_content, count = re.subn(pattern, replacement, content)

if count == 0:
    print("ERROR: pattern not found")
else:
    with open('lib/noteContent.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"SUCCESS: injected into post-mauryan-period ({count} replacement)")
