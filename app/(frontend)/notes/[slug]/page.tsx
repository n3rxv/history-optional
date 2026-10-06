import { notFound } from 'next/navigation';
import { allNotes } from '@/lib/notes';
import NoteReader from './NoteReader';
import type { Metadata } from 'next';
import { sanitizeNoteHtml } from '@/lib/sanitizeNoteHtml';
import { sectionByName } from '@/components/notes/sections';

/**
 * Prerendered at build and kept until something changes it: a deploy, or an
 * admin saving the note, which revalidates this path (/api/admin/note-content).
 *
 * It used to revalidate hourly so search engines would see admin edits. Most
 * notes are read less than once an hour, so nearly every visit found the page
 * stale and rendered it again, and each render wrote 25-30 ISR units (8 KB
 * each) -- with the other hourly pages, enough to use up the plan's ISR writes
 * and much of its CPU. The English body served here is therefore current, so
 * NoteReader shows it as it is and fetches only the Hindi one.
 */
export function generateStaticParams() {
  return allNotes.map(n => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const note = allNotes.find(n => n.slug === slug);
  if (!note) return {};
  return {
    title: { absolute: `${note.title}: UPSC History Optional Notes` },
    description: `${note.description}. Detailed notes for UPSC History Optional ${note.section}, Paper ${note.paper}.`,
    alternates: { canonical: `https://historyoptional.xyz/notes/${slug}` },
  };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idx = allNotes.findIndex(n => n.slug === slug);
  if (idx < 0) notFound();
  const note = allNotes[idx];

  // Worked out here so the browser is not sent every note's details to find
  // the one before, the one after and the rest of the section.
  const link = (n: (typeof allNotes)[number] | undefined) => (n ? { slug: n.slug, title: n.title } : null);
  const prev = link(allNotes[idx - 1]);
  const next = link(allNotes[idx + 1]);
  const related = allNotes
    .filter(n => n.section === note.section && n.slug !== slug)
    .slice(0, 5)
    .map(n => ({ slug: n.slug, title: n.title }));
  const sectionHref = sectionByName(note.section)?.href ?? '/notes';

  let initialContent = '';

  try {
    const { createServerClient } = await import('@/lib/supabase');
    const db = createServerClient();
    const { data } = await db.from('note_overrides').select('content').eq('slug', slug).maybeSingle();
    if (data?.content) {
      // Same reasoning as /api/note-content: admin-authored HTML is sanitized,
      // the shipped corpus is trusted as source.
      initialContent = sanitizeNoteHtml(data.content);
    } else {
      const mod = await import('@/lib/noteContent');
      const noteContent = mod.noteContent as Record<string, string>;
      initialContent = noteContent[slug] || '';
    }
  } catch {
    try {
      const mod = await import('@/lib/noteContent');
      const noteContent = mod.noteContent as Record<string, string>;
      initialContent = noteContent[slug] || '';
    } catch {}
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `https://historyoptional.xyz/notes/${slug}#article`,
        "headline": `${note.title}: UPSC History Optional Notes`,
        "description": `${note.description}. Detailed notes for UPSC History Optional ${note.section}, Paper ${note.paper}.`,
        "url": `https://historyoptional.xyz/notes/${slug}`,
        "isPartOf": { "@id": "https://historyoptional.xyz/#website" },
        "publisher": {
          "@type": "Organization",
          "name": "historyoptional.xyz",
          "url": "https://historyoptional.xyz",
        },
        "inLanguage": "en-IN",
        "educationalLevel": "competitive-exam",
        "learningResourceType": "study notes",
        "author": {
          "@type": "Organization",
          "name": "historyoptional.xyz",
          "url": "https://historyoptional.xyz"
        },
        "image": {
          "@type": "ImageObject",
          "url": "https://historyoptional.xyz/og-image.png",
          "width": 1200,
          "height": 630
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://historyoptional.xyz/notes/${slug}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://historyoptional.xyz",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": note.section,
            "item": `https://historyoptional.xyz${sectionHref}`,
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": note.title,
            "item": `https://historyoptional.xyz/notes/${slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <NoteReader note={note} initialContent={initialContent} prev={prev} next={next} related={related} />
    </>
  );
}
