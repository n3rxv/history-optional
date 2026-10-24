/**
 * Light or dark, chosen anywhere on the site (the navbar's button, the
 * profile page). The bootstrap in app/layout.tsx reads the stored choice
 * before paint; this writes it, and the navbar watches data-theme so its own
 * button follows a change made elsewhere.
 */
export function applyTheme(dark: boolean) {
  const theme = dark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('ho-theme', theme); } catch { /* private mode: for this visit only */ }
  // The browser bar takes the page's own ground, read back from the theme.
  const ground = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (ground) document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', ground));
}

export function isDarkTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}
