#!/bin/bash
# Run this from your history-optional project root
# It deletes one-off scripts and archives junk files

echo "🧹 Starting cleanup..."

# ── 1. Delete fix_*.js files (ran once, done) ──────────────────────────
echo "Deleting fix_* scripts..."
rm -f fix_chat_autosend.js
rm -f fix_font_import.js
rm -f fix_fontload.js
rm -f fix_header.js
rm -f fix_header2.js
rm -f fix_no_italic.js
rm -f fix_pdf3.js
rm -f fix_pdf4.js
rm -f fix_pdf_design.js
rm -f fix_use_times.js

# ── 2. Delete inject_*.py files (content already injected into DB) ──────
echo "Deleting inject_* scripts..."
rm -f inject_*.py

# ── 3. Delete patch_v*.py files (patches already applied) ───────────────
echo "Deleting patch_* scripts..."
rm -f patch_*.py

# ── 4. Delete one-off utility scripts ───────────────────────────────────
echo "Deleting one-off utility scripts..."
rm -f diagnose.py
rm -f check_slug.py
rm -f check_var.py
rm -f rewrite_timeline.py
rm -f fix_final.py
rm -f fix2.py
rm -f fix3.py
rm -f fix_imperialism_slug.py
rm -f fix_slugs.py
rm -f fix_timeline.py
rm -f fix_delimiters.py
rm -f fix_handout14.py
rm -f fix_handout15.py
rm -f fix_handout16.py
rm -f fix_handout17.py
rm -f fix_handout18.py
rm -f fix_handout19.py
rm -f fix_handout20.py
rm -f fix_handout21.py
rm -f fix_handout22.py
rm -f fix_handout23.py
rm -f fix_handout25.py
rm -f fix_inject.py
rm -f fix_loader.py

# ── 5. Delete handout HTML files from root (content already in DB) ───────
echo "Deleting root-level handout HTML files..."
rm -f handout*_content.html

# ── 6. Delete tarballs / backups from root ──────────────────────────────
echo "Deleting tarballs and backups..."
rm -f historiography.tar.gz
rm -f history-optional.tar.gz
rm -f history-optional-src.tar.gz
rm -f auth-changes.tar.gz
rm -f dedo.tar.gz
rm -f project.zip

# ── 7. Delete stale root-level tsx files ────────────────────────────────
echo "Deleting stale root tsx files..."
rm -f historiography_page.tsx

# ── 8. Move seed_script.js to a scripts/ folder ─────────────────────────
echo "Moving seed_script.js to scripts/..."
mkdir -p scripts
mv seed_script.js scripts/ 2>/dev/null || true

# ── 9. Delete pdfcoffee download leftovers ───────────────────────────────
rm -f pdfcoffee.com_*.pdf 2>/dev/null || true
rm -f "A History of Ancient and Early Medieval In"* 2>/dev/null || true
rm -f "From Plassey to Partition by Sekhar Band"* 2>/dev/null || true

# ── 10. Commit the cleanup ───────────────────────────────────────────────
echo ""
echo "✅ Cleanup done! Committing..."
git add -A
git commit -m "chore: remove one-off migration scripts and root clutter"
git push

echo ""
echo "🎉 Done! Your root should now only have:"
echo "   app/  components/  hooks/  lib/  public/  scripts/"
echo "   middleware.ts  next.config.ts  package.json  vercel.json  tsconfig.json"
