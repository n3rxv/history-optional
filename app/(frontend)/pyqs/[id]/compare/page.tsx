import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pyqs } from '@/lib/pyqData';
import PyqCompare from '@/components/pyq/PyqCompare';

/**
 * Two toppers' answers to one question, side by side. The server finds the
 * question; the page used to load the whole question bank in the browser for it.
 */

type Params = { id: string };

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const pyq = pyqs.find((q) => String(q.id) === id);
  if (!pyq) return {};
  const shortQ = pyq.question.length > 60 ? `${pyq.question.slice(0, 57).trimEnd()}…` : pyq.question;
  return {
    title: `Toppers’ answers compared: ${shortQ}`,
    description: `Read two UPSC toppers' answers to this History Optional question (${pyq.year}, ${pyq.marks} marks) side by side.`,
    alternates: { canonical: `https://historyoptional.xyz/pyqs/${pyq.id}/compare` },
  };
}

export default async function ComparePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const pyq = pyqs.find((q) => String(q.id) === id);
  if (!pyq) notFound();
  const { question, year, marks, section, topic } = pyq;
  return <PyqCompare pyq={{ id: pyq.id, question, year, marks, section, topic }} />;
}
