import type { Metadata } from 'next';
import HistoriographyClient from '@/components/HistoriographyClient';

/**
 * Prerendered at build; the debates in this HTML are what the database held
 * then, and a deploy refreshes them. Readers always get the current debates:
 * HistoriographyClient refetches on mount.
 *
 * It used to revalidate hourly for search engines' sake. At 285 KB of HTML and
 * 195 KB of RSC payload, each render wrote about 60 ISR units, and nothing in
 * the app edits the debates -- they change in the database by hand -- so the
 * hourly renders were rewriting the same page.
 */

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
