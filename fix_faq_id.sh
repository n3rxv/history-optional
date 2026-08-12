#!/bin/bash
set -e

python3 - << 'PYEOF'
with open("app/page.tsx") as f:
    src = f.read()

old = "      <HomeFAQ />"
new = '      <div id="faq"><HomeFAQ /></div>'

assert old in src, "String not found!"
with open("app/page.tsx", "w") as f:
    f.write(src.replace(old, new, 1))

print("✓ id=faq added")
PYEOF

git add app/page.tsx
git commit -m "feat: add id=faq anchor to homepage FAQ section"
git push
echo "✓ pushed"
