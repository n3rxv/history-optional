import type { Metadata } from 'next';
import HistoriographyClient from '@/components/HistoriographyClient';

export const metadata: Metadata = {
  title: 'Historiography Bank — UPSC History Optional',
  description: 'Historiographical debates, contested interpretations and schools of thought for UPSC History Optional. Marxist, Nationalist, Subaltern, Cambridge School and more.',
  alternates: { canonical: 'https://historyoptional.xyz/historiography' },
};

export default async function HistoriographyPage() {
  let initialDebates: any[] = [];

  try {
    const { createServerClient } = await import('@/lib/supabase');
    const db = createServerClient();

    const { data: debatesData } = await db
      .from('debates')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: positionsData } = await db
      .from('positions')
      .select('*');

    if (debatesData) {
      initialDebates = debatesData.map((d: any) => ({
        ...d,
        positions: (positionsData || []).filter((p: any) => p.debate_id === d.id),
      }));
    }
  } catch (e) {
    console.error('Historiography SSR fetch failed:', e);
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://historyoptional.xyz/historiography#webpage",
        "url": "https://historyoptional.xyz/historiography",
        "name": "Historiography Bank — UPSC History Optional",
        "description": "Historiographical debates, contested interpretations and schools of thought for UPSC History Optional.",
        "isPartOf": { "@id": "https://historyoptional.xyz/#website" },
        "inLanguage": "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://historyoptional.xyz" },
          { "@type": "ListItem", "position": 2, "name": "Historiography", "item": "https://historyoptional.xyz/historiography" }
        ]
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <HistoriographyClient initialDebates={initialDebates} />
    </>
  );
}
