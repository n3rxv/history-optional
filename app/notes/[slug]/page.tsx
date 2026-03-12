import { allNotes } from '@/lib/notes';
import NoteReader from './NoteReader';

export function generateStaticParams() {
  return allNotes.map(n => ({ slug: n.slug }));
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <NoteReader slug={slug} />;
}