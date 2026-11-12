import type { Metadata } from 'next';
import Historiography from '@/components/historiography/Historiography';
import { loadDebates, type Debate } from '@/lib/debates';

/**
 * The bank is read here, on the server, and the page is rebuilt daily.
 * Readers do not fetch the bank again from their browsers: the debates change
 * only in the database, and the refetch was a full copy of both tables per
 * visit against the Supabase egress allowance. There is no editor on the site
 * since the admin panel was removed on 12 November 2026.
 */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: 'Historiography Bank: UPSC History Optional' },
  description: 'Historiographical debates, contested interpretations and schools of thought for UPSC History Optional. Marxist, Nationalist, Subaltern, Cambridge School and more.',
  alternates: { canonical: 'https://historyoptional.xyz/historiography' },
};

export default async function HistoriographyPage() {
  let initialDebates: Debate[] = [];
  try {
    initialDebates = await loadDebates();
  } catch (e) {
    console.error('Historiography fetch failed:', e);
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://historyoptional.xyz/historiography#webpage",
        "url": "https://historyoptional.xyz/historiography",
        "name": "Historiography Bank: UPSC History Optional",
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
      <Historiography initialDebates={initialDebates} />
    </>
  );
}
