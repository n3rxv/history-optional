import { allNotes } from '@/lib/notes';
import NoteReader from './NoteReader';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return allNotes.map(n => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const note = allNotes.find(n => n.slug === slug);
  if (!note) return {};
  return {
    title: `${note.title} — UPSC History Optional Notes`,
    description: `${note.description}. Detailed notes for UPSC History Optional ${note.section}, Paper ${note.paper}.`,
    alternates: { canonical: `https://historyoptional.xyz/notes/${slug}` },
  };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = allNotes.find(n => n.slug === slug);

  let initialContent = '';
  try {
    const { createServerClient } = await import('@/lib/supabase');
    const db = createServerClient();
    const { data } = await db.from('note_overrides').select('content').eq('slug', slug).single();
    if (data?.content) {
      initialContent = data.content;
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

  const articleSchema = note ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `https://historyoptional.xyz/notes/${slug}#article`,
        "headline": `${note.title} — UPSC History Optional Notes`,
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
            "item": `https://historyoptional.xyz/paper${note.paper}`,
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
  } : null;

  return (
    <>
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
      <NoteReader slug={slug} initialContent={initialContent} />
    </>
  );
}
