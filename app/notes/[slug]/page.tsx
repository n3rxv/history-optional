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
  };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = allNotes.find(n => n.slug === slug);
  
  // Load note content server-side for SEO
  let initialContent = '';
  try {
    // Check cloud override first
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

  return <NoteReader slug={slug} initialContent={initialContent} />;
}
