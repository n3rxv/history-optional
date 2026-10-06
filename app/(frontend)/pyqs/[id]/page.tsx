import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pyqs } from '@/lib/pyqData';
import PyqDetail from '@/components/pyq/PyqDetail';
import { pyqSection, topicName } from '@/components/pyq/sections';

/**
 * One past question. The server finds it and its neighbours and sends only
 * those: the page used to be a client page that loaded the whole question
 * bank, 600 KB, to show one question, and every question shared the list's
 * title in search results.
 */

type Params = { id: string };

// Each question is rendered the first time it is opened, then served as a
// static page.
export async function generateStaticParams() {
  return [];
}

function find(id: string) {
  const i = pyqs.findIndex((q) => String(q.id) === id);
  return i < 0 ? null : { i, pyq: pyqs[i] };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const found = find(id);
  if (!found) return {};
  const { pyq } = found;
  const section = pyqSection(pyq.section)?.name ?? pyq.section;
  const shortQ = pyq.question.length > 70 ? `${pyq.question.slice(0, 67).trimEnd()}…` : pyq.question;
  return {
    title: `${shortQ} (PYQ ${pyq.year})`,
    description: `UPSC History Optional ${pyq.year}, ${section}, ${pyq.marks} marks, on ${topicName(pyq.topic)}: ${pyq.question.slice(0, 140)}`,
    alternates: { canonical: `https://historyoptional.xyz/pyqs/${pyq.id}` },
  };
}

export default async function PyqPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const found = find(id);
  if (!found) notFound();
  const { i, pyq } = found;

  // The same topic, newest first, leaving this one out.
  const sameTopic = pyqs.filter((q) => q.topic === pyq.topic);
  const related = sameTopic
    .filter((q) => q.id !== pyq.id)
    .sort((a, b) => b.year - a.year)
    .slice(0, 5)
    .map(({ id, question, year, marks }) => ({ id, question, year, marks }));
  // Neighbours in the book's order.
  const peek = (j: number) => (j >= 0 && j < pyqs.length ? { id: pyqs[j].id, question: pyqs[j].question } : null);

  return <PyqDetail pyq={pyq} related={related} prev={peek(i - 1)} next={peek(i + 1)} topicCount={sameTopic.length} />;
}
