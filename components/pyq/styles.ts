/**
 * Styles for the PYQ pages: the hero they share, the list's search bar and
 * filters, and the question cards, which the section pages use too.
 */

export const PYQ_HERO_CSS = `
.pl { background: var(--bg); min-height: 70vh; }
.pl-hero { padding: clamp(20px, 4vh, 44px) 0 clamp(20px, 3vh, 32px); background: linear-gradient(180deg, color-mix(in srgb, var(--w) 70%, var(--bg)) 0%, var(--bg) 100%); }
.pl-hero-row { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-6); }
.pl-hero-main { min-width: 0; }
.pl-hero-side { flex-shrink: 0; padding-bottom: var(--space-1); }
.pl-title { display: flex; align-items: center; gap: var(--space-3); margin: var(--space-4) 0 var(--space-2); }
.pl-title .ds-h1 { font-size: clamp(1.9rem, 4vw, 2.8rem); }
.pl-icon { width: 48px; height: 48px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 14px; background: var(--ds-card); color: var(--t); border: 1px solid var(--border); box-shadow: var(--elev-1); }
.pl-lede { max-width: 720px; }
.pl-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-4); }
.pl-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-4); }
.pl-chips a { display: inline-flex; align-items: center; gap: 7px; min-height: 34px; padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font-size: 0.86rem; text-decoration: none; transition: border-color 0.15s, color 0.15s; }
.pl-chips a:hover { border-color: var(--st); color: var(--text); }
.pl-chips a span { width: 8px; height: 8px; border-radius: 50%; background: var(--st); }
.pl-body { padding: var(--space-2) 0 clamp(48px, 9vh, 96px); }
.pl-browse { margin-top: var(--space-10); padding-top: var(--space-6); border-top: 1px solid var(--border); }
.pl-browse h2 { margin: 0 0 var(--space-3); font-size: 0.95rem; font-weight: 700; color: var(--text2); }
@media (max-width: 760px) {
  .pl-hero-row { flex-direction: column; align-items: stretch; gap: var(--space-4); }
  .pl-hero-side { padding-bottom: 0; }
}
/* On a phone the list should start on the first screen: one sentence, a
   smaller ring, and the other sections left to the PYQ list's tabs. */
@media (max-width: 640px) {
  .pl-more, .pl-siblings { display: none; }
  .pl-hero-side .sr { padding: var(--space-2) var(--space-4) var(--space-2) var(--space-2); }
  .pl-hero-side .sr svg { width: 54px; height: 54px; }
}
`;

export const PYQ_LIST_CSS = `
.pq { display: grid; grid-template-columns: minmax(0, 1fr) 270px; gap: var(--space-8); align-items: start; }
.pq-main { min-width: 0; }
/* The section pages have no sticky filters; a heading jumped to lands below the navbar. */
.pq-static .pq-topic-block { scroll-margin-top: 84px; }
.pq-static .pq-aside { margin-top: var(--space-6); }

/* Beside the list: progress, and an index of what is in it */
.pq-aside { position: sticky; top: 84px; display: flex; flex-direction: column; gap: var(--space-3); max-height: calc(100vh - 104px); margin-top: var(--space-3); }
.pq-side { padding: var(--space-4); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.pq-side h2 { margin: 0 0 var(--space-2); font-size: 0.95rem; font-weight: 800; }
.pq-side-big { margin: 0; font-size: 0.9rem; color: var(--text2); }
.pq-side-big strong { font-size: 1.5rem; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; margin-right: 2px; }
.pq-side-bar { height: 6px; margin: var(--space-3) 0; border-radius: 6px; background: var(--ds-soft); overflow: hidden; }
.pq-side-bar span { display: block; height: 100%; min-width: 0; border-radius: inherit; background: var(--success-text); transition: width 0.3s; }
.pq-side-pick { width: 100%; justify-content: center; }
.pq-side-note { margin: 0; font-size: 0.86rem; color: var(--success-text, var(--text2)); }
.pq-side-jumps { display: flex; flex-direction: column; min-height: 0; padding-right: var(--space-2); }
.pq-jump { list-style: none; margin: 0 calc(-1 * var(--space-2)) 0 0; padding: 0 var(--space-2) 0 0; overflow-y: auto; min-height: 0; overscroll-behavior: contain; scrollbar-width: thin; position: relative; }
.pq-jump ol { list-style: none; margin: 0 0 var(--space-2); padding: 0; }
.pq-jump-sec { display: flex; align-items: center; gap: 8px; padding: var(--space-2) 8px 4px; font-size: 0.78rem; font-weight: 700; color: var(--t, var(--text3)); }
.pq-jump-sec i { width: 8px; height: 8px; border-radius: 50%; background: var(--t); flex-shrink: 0; }
.pq-jump button, .pq-jump a { display: flex; align-items: baseline; gap: var(--space-2); width: 100%; padding: 5px 8px; border: 0; border-radius: var(--radius-md); background: none; font: inherit; font-size: 0.86rem; line-height: 1.35; text-align: left; color: var(--text2); text-decoration: none; cursor: pointer; }
.pq-jump button:hover, .pq-jump a:hover { background: var(--ds-soft); color: var(--text); }
.pq-jump button.on { background: var(--w, var(--accent-dim)); color: var(--t, var(--accent-text)); font-weight: 700; }
.pq-jump-name { flex: 1; min-width: 0; }
.pq-jump-n { flex-shrink: 0; font-size: 0.78rem; font-weight: 500; color: var(--text3); font-variant-numeric: tabular-nums; }
.pq-jump-n.all { color: var(--success-text, var(--text3)); font-weight: 700; }

/* Search and filters */
.pq-bar { position: sticky; top: 60px; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); padding: var(--space-3) 0; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.pq-search { flex: 1 1 320px; display: flex; align-items: center; gap: var(--space-2); height: 48px; padding: 0 var(--space-2) 0 var(--space-4); background: var(--ds-card); border: 1.5px solid var(--border2); border-radius: var(--radius-full); color: var(--text3); transition: border-color 0.15s, box-shadow 0.15s; }
.pq-search:focus-within { border-color: color-mix(in srgb, var(--accent) 65%, transparent); box-shadow: 0 0 0 4px var(--accent-glow); }
.pq-search input { flex: 1; min-width: 0; height: 100%; border: none; outline: none; background: none; color: var(--text); font-size: 1rem; }
.pq-search input::-webkit-search-cancel-button { display: none; }
.pq-clear { width: 32px; height: 32px; border: none; border-radius: 50%; background: var(--ds-soft); color: var(--text3); cursor: pointer; font-size: 0.8rem; }
.pq-tabs { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.pq-tab { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); padding: 9px 14px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.92rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background 0.18s, color 0.18s, box-shadow 0.18s; }
.pq-tab span { min-width: 24px; padding: 1px 7px; border-radius: var(--radius-full); background: var(--ds-card); font-size: 0.76rem; font-weight: 600; color: var(--text3); }
.pq-tab.on { background: var(--ds-card); color: var(--t, var(--text)); box-shadow: var(--elev-1); }
.pq-tab.on span { background: var(--w, var(--accent-dim)); color: var(--t, var(--accent-text)); }
.pq-selects { display: flex; flex-wrap: wrap; gap: var(--space-2); width: 100%; }
.pq-select {
  appearance: none; -webkit-appearance: none; min-width: 0; height: 40px; padding: 0 34px 0 14px;
  background: var(--ds-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 13px center;
  border: 1px solid var(--border2); border-radius: var(--radius-full);
  color: var(--text); font: inherit; font-size: 0.9rem; font-weight: 500; cursor: pointer; text-overflow: ellipsis;
  transition: border-color 0.15s;
}
.pq-select:hover { border-color: var(--border3); }
.pq-select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.pq-select.set { border-color: color-mix(in srgb, var(--accent) 50%, transparent); background-color: var(--accent-dim); color: var(--accent-text); font-weight: 600; }
.pq-select-topic { flex: 1 1 260px; max-width: 380px; }

.pq-status { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2) var(--space-3); margin: var(--space-2) 0; font-size: 0.95rem; color: var(--text2); }
.pq-status strong { color: var(--text); font-weight: 600; }
.pq-status-done { color: var(--success-text); font-weight: 600; }
.pq-status-end { display: inline-flex; align-items: center; gap: var(--space-3); }
.pq-view { display: inline-flex; padding: 3px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.pq-view button { padding: 5px 12px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.84rem; font-weight: 600; cursor: pointer; }
.pq-view button.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.pq-reset { background: none; border: none; padding: 4px 0; font: inherit; font-size: 0.9rem; font-weight: 600; color: var(--accent-text); cursor: pointer; white-space: nowrap; }

/* Groups: section, topic and sub-topic, or year */
.pq-group { padding-top: var(--space-6); }
.pq-section-head { display: flex; align-items: center; flex-wrap: wrap; gap: 6px var(--space-3); margin: 0 0 var(--space-2); font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; }
.pq-section-head > span:last-child { font-size: 0.86rem; font-weight: 500; letter-spacing: 0; color: var(--text3); }
.pq-section-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--t); }
.pq-year-head { display: flex; align-items: baseline; gap: var(--space-2); margin: 0 0 var(--space-3); font-size: 1.35rem; font-weight: 800; letter-spacing: -0.02em; }
.pq-year-head span { font-size: 0.86rem; font-weight: 500; letter-spacing: 0; color: var(--text3); }
.pq-topic-block { padding: var(--space-5) 0 var(--space-2); border-top: 1px solid var(--border); }
.pq-group > .pq-topic-block:first-of-type { border-top: none; padding-top: var(--space-2); }
.pq-topic-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px var(--space-3); }
.pq-topic-head h3, .pq-topic-title { margin: 0; font-size: 1.1rem; font-weight: 800; letter-spacing: -0.01em; color: var(--t); }
.pq-topic-count { font-size: 0.86rem; color: var(--text3); }
.pq-topic-count .all, .pq-topic-count span { color: var(--success-text); font-weight: 600; }
.pq-only { margin-left: auto; background: none; border: none; padding: 0; font: inherit; font-size: 0.84rem; font-weight: 600; color: var(--accent-text); cursor: pointer; }
.pq-only:hover { text-decoration: underline; text-underline-offset: 3px; }
.pq-syllabus { margin: 4px 0 0; font-size: 0.82rem; line-height: 1.5; color: var(--text3); }
.pq-sub { margin-top: var(--space-4); }
.pq-sub-head { margin: 0 0 var(--space-2); font-size: 0.9rem; font-weight: 700; color: var(--text2); }
.pq-cards { display: flex; flex-direction: column; gap: var(--space-3); }

/* A question */
.pq-card {
  position: relative; display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-4) var(--space-5);
  background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pq-card:hover { border-color: color-mix(in srgb, var(--t) 45%, transparent); box-shadow: var(--elev-2); }
.pq-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; font-size: 0.82rem; color: var(--text3); }
.pq-sec { font-weight: 700; color: var(--t); }
.pq-year-tag { font-weight: 700; color: var(--text2); }
.pq-src { padding: 1px 9px; border-radius: var(--radius-full); background: var(--ds-soft); color: var(--text2); font-weight: 600; }
.pq-marks { margin-left: auto; padding: 2px 10px; border-radius: var(--radius-full); background: var(--ds-soft); color: var(--text2); font-weight: 600; }
.pq-q { margin: 0; font-size: 1.02rem; font-weight: 500; line-height: 1.6; }
.pq-q a { color: var(--text); text-decoration: none; }
/* The whole card opens the question; the topic, the tick and the write link sit above. */
.pq-q a::after { content: ''; position: absolute; inset: 0; border-radius: inherit; }
.pq-q a:focus-visible { outline: none; }
.pq-card:has(.pq-q a:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
.pq-q mark { background: color-mix(in srgb, var(--premium-text) 26%, transparent); color: inherit; border-radius: 3px; padding: 0 1px; }
.pq-foot { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2) var(--space-3); margin-top: 2px; }
.pq-foot-end { margin-left: auto; display: inline-flex; align-items: center; gap: var(--space-4); }
.pq-topic { position: relative; z-index: 1; min-width: 0; padding: 3px 11px; border-radius: var(--radius-full); border: 1px solid var(--border); background: var(--ds-soft); color: var(--text2); font: inherit; font-size: 0.8rem; text-align: left; cursor: pointer; transition: border-color 0.15s, color 0.15s; }
.pq-topic:hover, .pq-topic.on { border-color: color-mix(in srgb, var(--t) 45%, transparent); color: var(--t); background: var(--w); }
.pq-tick { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border: 1px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: border-color 0.15s, color 0.15s, background 0.15s; }
.pq-tick:hover { border-color: var(--success-text); color: var(--success-text); }
.pq-tick.on { border-color: color-mix(in srgb, var(--success-text) 40%, transparent); background: var(--success-wash); color: var(--success-text); }
.pq-write { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; font-size: 0.88rem; font-weight: 600; color: var(--accent-text); text-decoration: none; }
.pq-write:hover { text-decoration: underline; text-underline-offset: 3px; }
.pq-more { display: flex; justify-content: center; padding: var(--space-6) 0 0; }

.pq-empty { padding: var(--space-8) 0; color: var(--text2); }
.pq-empty p { margin: 0 0 var(--space-4); }
.pq-empty-ask { display: flex; flex-direction: column; gap: 4px; max-width: 560px; padding: var(--space-5); }
.pq-empty-ask strong { color: var(--accent-text); }
.pq-empty-ask span { font-size: 0.92rem; color: var(--text2); }

@media (max-width: 1100px) { .pq { gap: var(--space-6); grid-template-columns: minmax(0, 1fr) 240px; } }
@media (max-width: 1000px) { .pq { grid-template-columns: minmax(0, 1fr); } .pq-aside { display: none; } }
@media (max-width: 900px) { .pq-bar { position: static; } }
@media (max-width: 640px) {
  .pq-bar { gap: var(--space-2); }
  .pq-search { flex-basis: 100%; height: 46px; }
  .pq-tabs { display: flex; width: 100%; }
  .pq-tab { flex: 1; padding: 8px 4px; font-size: 0.84rem; }
  .pq-tab span { display: none; }
  .pq-selects { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .pq-select-topic, .pq-select-status { grid-column: 1 / -1; max-width: none; }
  .pq-select { font-size: 0.86rem; }
  .pq-card { padding: var(--space-4); }
  .pq-q { font-size: 1rem; }
  .pq-foot-end { width: 100%; justify-content: space-between; margin-left: 0; }
  .pq-section-head { font-size: 1.25rem; }
  .pq-only { margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) { .pq-card, .pq-select, .pq-tab, .pq-side-bar span { transition: none; } }
`;
