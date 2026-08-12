#!/bin/bash
set -e

python3 - << 'PYEOF'
# ── 1. Navbar.tsx — add custom event listener ─────────────────────────────
with open("components/Navbar.tsx") as f:
    src = f.read()

old = """  // Auto-close premium modal when subscription is confirmed
  useEffect(() => {
    if (subData) {
      setShowPremiumModal(false);
      setNoSubFound(false);
    }
  }, [subData]);"""

new = """  // Auto-close premium modal when subscription is confirmed
  useEffect(() => {
    if (subData) {
      setShowPremiumModal(false);
      setNoSubFound(false);
    }
  }, [subData]);

  // Allow any component to open premium modal via custom event
  useEffect(() => {
    const handler = () => setShowPremiumModal(true);
    window.addEventListener('open-premium-modal', handler);
    return () => window.removeEventListener('open-premium-modal', handler);
  }, []);"""

assert old in src, "Navbar string not found!"
with open("components/Navbar.tsx", "w") as f:
    f.write(src.replace(old, new, 1))
print("✓ Navbar patched")

# ── 2. HomeFAQ.tsx — replace broken /subscribe link with event dispatch ───
with open("components/HomeFAQ.tsx") as f:
    src = f.read()

old_entry = """    link: { href: '/subscribe', label: 'View plans →' },"""
new_entry = """    action: { label: 'View plans →' },"""

old_render = """                  {faq.link && (
                    <>
                      {' '}
                      <a
                        href={faq.link.href}
                        style={{
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      >
                        {faq.link.label}
                      </a>
                    </>
                  )}"""

new_render = """                  {faq.action && (
                    <>
                      {' '}
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-premium-modal'))}
                        style={{
                          color: 'var(--accent)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          textDecoration: 'underline',
                        }}
                      >
                        {faq.action.label}
                      </button>
                    </>
                  )}"""

assert old_entry in src, "FAQ entry not found!"
assert old_render in src, "FAQ render not found!"
src = src.replace(old_entry, new_entry, 1)
src = src.replace(old_render, new_render, 1)
with open("components/HomeFAQ.tsx", "w") as f:
    f.write(src)
print("✓ HomeFAQ patched")
PYEOF

git add components/Navbar.tsx components/HomeFAQ.tsx
git commit -m "fix: View plans in FAQ opens premium modal instead of /subscribe"
git push
echo "✓ pushed"
