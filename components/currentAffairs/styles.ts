/** Styles for /current-affairs (ca-) and /posts/[slug] (po-). */

export const CA_CSS = `
.ca { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.ca-hero { padding: clamp(32px, 6vh, 64px) 0 clamp(16px, 3vh, 28px); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-dim) 60%, var(--bg)) 0%, var(--bg) 100%); }
.ca-h1 { font-size: clamp(2.1rem, 4.6vw, 3.2rem); margin: 0 0 var(--space-3); }
.ca-lede { max-width: 680px; }
.ca-section { padding-top: var(--space-6); }
.ca-h2 { margin: 0 0 var(--space-4); font-size: 1.3rem; font-weight: 800; letter-spacing: -0.02em; }
.ca-lead { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: var(--space-5); align-items: center; margin-bottom: var(--space-5); padding: var(--space-4); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); color: var(--text); text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s; }
.ca-lead:hover, .ca-card:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); box-shadow: var(--elev-2); }
.ca-cover { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: var(--radius-lg); background: var(--ds-soft); }
.ca-lead-text { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; padding-right: var(--space-2); }
.ca-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px var(--space-2); font-size: 0.84rem; color: var(--text3); }
.ca-tag { padding: 1px 9px; border-radius: var(--radius-full); background: var(--accent-dim); color: var(--accent-text); font-size: 0.76rem; font-weight: 700; }
.ca-title { margin: 0; font-size: 1.12rem; font-weight: 800; line-height: 1.35; letter-spacing: -0.01em; }
.ca-lead .ca-title { font-size: clamp(1.3rem, 2.4vw, 1.7rem); }
.ca-excerpt { margin: 0; font-size: 0.95rem; line-height: 1.6; color: var(--text2); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.ca-read { display: inline-flex; align-items: center; gap: 6px; margin-top: var(--space-1); font-size: 0.92rem; font-weight: 700; color: var(--accent-text); }
.ca-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }
.ca-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3) var(--space-3) var(--space-4); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); color: var(--text); text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s; }
.ca-card .ca-meta, .ca-card .ca-title, .ca-card .ca-excerpt { padding: 0 var(--space-1); }
.ca-empty { padding: var(--space-8) var(--space-5); border-radius: var(--radius-xl); background: var(--ds-soft); text-align: center; color: var(--text2); }
.ca-cuttings { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-3); }
.ca-cutting { margin: 0; padding: var(--space-3); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-lg); }
.ca-cutting img { display: block; width: 100%; border-radius: var(--radius-md); }
.ca-cutting figcaption { display: flex; flex-direction: column; gap: 2px; margin-top: var(--space-2); font-size: 0.86rem; }
.ca-cutting figcaption span { color: var(--text3); font-size: 0.8rem; }
.ca-admin { margin-top: var(--space-8); padding: var(--space-5); border: 1px dashed color-mix(in srgb, var(--warning-text) 45%, transparent); border-radius: var(--radius-xl); }
.ca-admin-title { margin: 0 0 var(--space-3); font-size: 1rem; font-weight: 800; color: var(--warning-text); }
.ca-drafts { margin: 0 0 var(--space-4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); font-size: 0.92rem; }
.ca-drafts ul { margin: var(--space-2) 0 0; padding-left: 1.1rem; }
.ca-drafts a { color: var(--accent-text); }
@media (max-width: 760px) { .ca-lead { grid-template-columns: minmax(0, 1fr); gap: var(--space-3); } .ca-lead-text { padding: 0 var(--space-1) var(--space-1); } }
@media (prefers-reduced-motion: reduce) { .ca-lead, .ca-card { transition: none; } }
`;

export const PO_CSS = `
.po { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.po-wrap { max-width: 760px; padding-top: clamp(20px, 4vh, 40px); }
.po-back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: var(--space-4); font-size: 0.92rem; font-weight: 600; color: var(--text2); text-decoration: none; }
.po-back:hover { color: var(--accent-text); }
.po-cover { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: var(--radius-xl); margin-bottom: var(--space-5); background: var(--ds-soft); }
.po-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px var(--space-2); margin-bottom: var(--space-2); font-size: 0.88rem; color: var(--text3); }
.po-tag { padding: 1px 9px; border-radius: var(--radius-full); background: var(--accent-dim); color: var(--accent-text); font-size: 0.78rem; font-weight: 700; }
.po-h1 { margin: 0 0 var(--space-3); font-size: clamp(1.8rem, 4.4vw, 2.6rem); font-weight: 800; line-height: 1.15; letter-spacing: -0.025em; }
.po-lede { margin: 0 0 var(--space-6); font-size: 1.12rem; line-height: 1.6; color: var(--text2); }
.po-prose { font-size: 1.05rem; line-height: 1.8; color: var(--text); overflow-wrap: anywhere; }
.po-prose > * + * { margin-top: 1em; }
.po-prose h1, .po-prose h2 { margin-top: 1.6em; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.015em; line-height: 1.3; }
.po-prose h3, .po-prose h4 { margin-top: 1.4em; font-size: 1.15rem; font-weight: 800; line-height: 1.35; }
.po-prose p, .po-prose ul, .po-prose ol, .po-prose blockquote { margin-bottom: 0; }
.po-prose ul, .po-prose ol { padding-left: 1.3rem; }
.po-prose li + li { margin-top: 0.4em; }
.po-prose a { color: var(--accent-text); text-decoration: underline; text-underline-offset: 3px; }
.po-prose blockquote { margin-left: 0; padding: var(--space-3) var(--space-4); border-left: 3px solid var(--accent); border-radius: 0 var(--radius-lg) var(--radius-lg) 0; background: var(--ds-soft); color: var(--text2); }
.po-prose img { max-width: 100%; height: auto; border-radius: var(--radius-lg); }
.po-prose iframe { width: 100%; aspect-ratio: 16 / 9; height: auto; border: 0; border-radius: var(--radius-lg); }
.po-prose table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
.po-prose th, .po-prose td { padding: 8px 10px; border: 1px solid var(--border); text-align: left; }
.po-more { margin-top: var(--space-10); padding-top: var(--space-6); border-top: 1px solid var(--border); }
.po-more h2 { margin: 0 0 var(--space-4); font-size: 1.15rem; font-weight: 800; }
.po-more-list { display: flex; flex-direction: column; gap: var(--space-3); }
.po-more-item { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-3); align-items: center; padding: var(--space-2); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--ds-card); color: var(--text); text-decoration: none; }
.po-more-item:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.po-more-item img { width: 120px; aspect-ratio: 16 / 9; object-fit: cover; border-radius: var(--radius-md); background: var(--ds-soft); }
.po-more-item strong { font-size: 0.98rem; line-height: 1.35; }
.po-more-item span { display: block; margin-top: 2px; font-size: 0.82rem; color: var(--text3); }
.po-admin { margin-bottom: var(--space-5); }
.po-admin-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); padding: var(--space-3) var(--space-4); border: 1px dashed color-mix(in srgb, var(--warning-text) 45%, transparent); border-radius: var(--radius-lg); font-size: 0.9rem; color: var(--warning-text); }
.po-admin-edit { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--border2); border-radius: var(--radius-xl); background: var(--ds-card); }
.po-admin-edit label { display: flex; flex-direction: column; gap: 4px; font-size: 0.84rem; font-weight: 700; color: var(--text2); }
.po-admin-edit input:not([type=checkbox]) { padding: 8px 12px; border: 1px solid var(--border2); border-radius: var(--radius-md); background: var(--bg); color: var(--text); font: inherit; font-size: 0.95rem; font-weight: 500; }
.po-admin-edit .po-admin-check { flex-direction: row; align-items: center; gap: 8px; }
.po-admin-label { font-size: 0.84rem; font-weight: 700; color: var(--text2); }
.po-admin-body { min-height: 240px; padding: var(--space-4); border: 1px solid var(--border2); border-radius: var(--radius-md); background: var(--bg); outline: none; }
.po-admin-actions { display: flex; justify-content: flex-end; align-items: center; gap: var(--space-2); }
.po-admin-err { color: var(--danger-text); font-size: 0.9rem; }
@media (max-width: 640px) { .po-prose { font-size: 1rem; } .po-more-item { grid-template-columns: 96px minmax(0, 1fr); } .po-more-item img { width: 96px; } }
`;
