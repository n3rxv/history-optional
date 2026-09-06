// Verifies the DOMPurify sanitizer blocks what the previous four-regex
// implementation let through. Run under a DOM via jsdom.
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).Element = dom.window.Element;
(globalThis as any).Node = dom.window.Node;

const { sanitizeHtml } = await import('../lib/sanitizeHtml');

// The implementation being replaced, for comparison.
const oldSanitize = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');

let fails = 0;
/**
 * Parses the result and looks for anything that can execute, rather than
 * grepping for "alert". Escaped text containing the word is harmless, and a
 * string check both false-positives on that and would miss a payload using
 * any other function name.
 */
const executable = (html: string): string | null => {
  const d = new JSDOM(`<!doctype html><body>${html}</body>`).window.document;
  if (d.querySelector('script, iframe, object, embed')) return 'active element present';
  for (const el of Array.from(d.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      if (/^on/i.test(attr.name)) return `event handler ${attr.name}`;
      if (/^\s*javascript:/i.test(attr.value.replace(/\s+/g, ''))) return `javascript: in ${attr.name}`;
    }
  }
  return null;
};

const blocks = (name: string, payload: string) => {
  const out = sanitizeHtml(payload);
  const vector = executable(out);
  const oldLeaked = executable(oldSanitize(payload)) !== null;
  if (vector) fails++;
  console.log(`  ${vector ? 'FAIL' : 'PASS'}  ${name}${oldLeaked ? '   (old sanitizer LEAKED this)' : ''}`);
  if (vector) console.log(`        ${vector} -> ${out}`);
};
const keeps = (name: string, payload: string, must: string) => {
  const out = sanitizeHtml(payload);
  const ok = out.includes(must);
  if (!ok) fails++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        got: ${out}`);
};

console.log('\nblocks injection');
blocks('unquoted event handler', '<img src=x onerror=alert(1)>');
blocks('svg onload', '<svg/onload=alert(1)>');
blocks('quoted handler', '<div onclick="alert(1)">hi</div>');
blocks('script tag', '<script>alert(1)</script>');
blocks('nested script tag', '<scr<script>ipt>alert(1)</script>');
blocks('javascript: href', '<a href="javascript:alert(1)">x</a>');
blocks('obfuscated javascript: href', '<a href="java&#115;cript:alert(1)">x</a>');
blocks('iframe srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>');
blocks('body onload', '<body onload=alert(1)>');
blocks('details ontoggle', '<details open ontoggle=alert(1)>');

console.log('\npreserves real content');
keeps('bold', '<p>The <strong>Mauryan</strong> state.</p>', '<strong>Mauryan</strong>');
keeps('table', '<table><tbody><tr><td>Akbar</td></tr></tbody></table>', '<td>Akbar</td>');
keeps('heading id for the TOC', '<h2 id="toc-0-sources">Sources</h2>', 'id="toc-0-sources"');
keeps('highlight class', '<mark class="hl-yellow">iqta</mark>', 'class="hl-yellow"');
keeps('inline style from the note corpus', '<li style="padding-left:2em">x</li>', 'padding-left');
keeps('safe link', '<a href="https://example.com">x</a>', 'href="https://example.com"');

const relOut = sanitizeHtml('<a href="https://example.com" target="_blank">x</a>');
const relOk = relOut.includes('rel="noopener noreferrer"');
if (!relOk) fails++;
console.log(`  ${relOk ? 'PASS' : 'FAIL'}  target=_blank gets rel=noopener`);

// The citation control.
// ALLOW_DATA_ATTR:false once stripped data-citation, which left the "Source #N"
// span looking like a link while the click did nothing. The class survived, so
// nothing on the page suggested a fault. These pin the one attribute the chat
// UI reads, and pin that nothing else was re-admitted alongside it.
console.log('\ncitation references');

const citeOut = sanitizeHtml('<span class="chat-citation" data-citation="1,2">Source #1</span>');
const citeOk = citeOut.includes('data-citation="1,2"') && citeOut.includes('chat-citation');
if (!citeOk) fails++;
console.log(`  ${citeOk ? 'PASS' : 'FAIL'}  data-citation survives, so the passage can be opened`);

const otherData = sanitizeHtml('<span data-foo="x" data-whatever="y">t</span>');
const otherOk = !/data-/.test(otherData);
if (!otherOk) fails++;
console.log(`  ${otherOk ? 'PASS' : 'FAIL'}  other data-* attributes are still stripped`);

const citeEvil = sanitizeHtml('<span data-citation="1" onclick="alert(1)">x</span>');
const citeEvilOk = !/onclick/i.test(citeEvil);
if (!citeEvilOk) fails++;
console.log(`  ${citeEvilOk ? 'PASS' : 'FAIL'}  an event handler beside it is still removed`);

console.log(`\n${fails === 0 ? 'ALL PASS' : fails + ' FAILED'}`);
process.exit(fails === 0 ? 0 : 1);
