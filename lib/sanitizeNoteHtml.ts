import sanitizeHtmlLib from 'sanitize-html';

/**
 * Server-side sanitizer for admin-authored note HTML.
 *
 * Note bodies come from two places with very different trust levels:
 *
 *   lib/noteContent.ts    version-controlled source. Anyone who can change it
 *                         already has repository access and could alter the
 *                         application itself, so sanitizing it on every read
 *                         would cost CPU on every note view while defending
 *                         against nobody. Not sanitized.
 *
 *   note_overrides        written through /api/admin/note-content, gated by
 *                         isAdminAuthed -- an HMAC of an expiry with no
 *                         subject and no revocation list. A leaked admin token
 *                         therefore means stored XSS on every note page, served
 *                         to every reader. This is what gets sanitized.
 *
 * Applied on write so nothing dangerous is stored, and again on read so rows
 * written before this existed are covered without a migration.
 *
 * This is deliberately not lib/sanitizeHtml.ts. That one is DOMPurify and
 * needs a browser DOM; note bodies are server-rendered, and pulling jsdom into
 * the lambdas to reach DOMPurify would cost far more than it returns.
 */

const OPTIONS: sanitizeHtmlLib.IOptions = {
  // The note corpus is prose: headings, lists, tables, emphasis, and the
  // <mark> elements the highlighter injects.
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'div', 'span', 'br', 'hr',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
    'blockquote', 'q', 'cite', 'code', 'pre', 'a', 'img', 'figure', 'figcaption',
  ],
  allowedAttributes: {
    // `id` anchors the table of contents; `class` carries highlight colours
    // (mark.hl-yellow); `style` is used throughout the corpus for list indents.
    '*': ['id', 'class', 'style'],
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Inline images in note content are legitimate; scripts are not, and no
  // scheme other than these can appear in a src.
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  // Only declarations the corpus actually uses. Anything else is dropped
  // rather than passed through, which closes CSS-based exfiltration.
  allowedStyles: {
    '*': {
      'padding-left': [/^\d+(\.\d+)?(em|px|rem|%)$/],
      'margin-left': [/^\d+(\.\d+)?(em|px|rem|%)$/],
      'text-align': [/^(left|right|center|justify)$/],
      'font-weight': [/^(normal|bold|[1-9]00)$/],
      'font-style': [/^(normal|italic)$/],
      'text-decoration': [/^(none|underline|line-through)$/],
      color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^rgba\(/],
      'background-color': [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^rgba\(/],
    },
  },
  // script and style are dropped along with their contents, rather than the
  // tags being stripped and the code left behind as text.
  nonTextTags: ['script', 'style', 'textarea', 'noscript', 'iframe', 'object', 'embed'],
  transformTags: {
    // A note that links out should not hand the opener to the destination.
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target
        ? { ...attribs, rel: 'noopener noreferrer' }
        : attribs,
    }),
  },
};

export function sanitizeNoteHtml(html: string): string {
  if (!html) return '';
  return sanitizeHtmlLib(html, OPTIONS);
}
