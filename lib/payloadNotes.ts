import 'server-only';
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';

/**
 * Note bodies out of Payload, rendered to the HTML the reader already styles.
 *
 * Every caller falls back to the old path (note_overrides, then the shipped
 * corpus) when this returns null, so a Payload outage, a missing document or a
 * bad conversion degrades to exactly the behaviour that shipped before. Set
 * NOTES_FROM_PAYLOAD=0 to turn it off entirely without a deploy.
 *
 * Lexical to HTML was measured against the original corpus before this was
 * switched on: tag counts matched (h2 11/11, h3 18/18, p 15/15, strong
 * 172/172, ul 58/58) and 97% of text survived, the remainder being whitespace
 * normalisation and nested list items being flattened.
 */
export const PAYLOAD_READS_ENABLED = process.env.NOTES_FROM_PAYLOAD !== '0';

type Lang = 'en' | 'hi';

export async function getNoteHtmlFromPayload(slug: string, lang: Lang): Promise<string | null> {
  if (!PAYLOAD_READS_ENABLED) return null;

  try {
    const [{ getPayload }, { default: config }] = await Promise.all([
      import('payload'),
      import('@payload-config'),
    ]);
    const payload = await getPayload({ config });

    const found = await payload.find({
      collection: 'notes',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      // draft: false is what keeps an in-progress edit away from readers.
      draft: false,
    });

    const doc = found.docs[0] as
      | { content?: unknown; contentHi?: unknown; _status?: string }
      | undefined;
    if (!doc) return null;
    if (doc._status && doc._status !== 'published') return null;

    // Hindi is incomplete for some topics, so it falls back to English here
    // exactly as the old route did.
    const tree = lang === 'hi' ? (doc.contentHi ?? doc.content) : doc.content;
    if (!tree) return null;

    const html = convertLexicalToHTML({
      data: tree as Parameters<typeof convertLexicalToHTML>[0]['data'],
      disableContainer: true,
    });

    // An empty or near-empty render means the conversion failed, and serving
    // that would blank a note. Fall back instead.
    return html && html.replace(/<[^>]*>/g, '').trim().length > 20 ? html : null;
  } catch {
    return null;
  }
}
