import { NextResponse } from 'next/server';
import { allNotes } from '@/lib/notes';

export async function GET() {
  const base = 'https://historyoptional.xyz';
  const lastMod = new Date().toISOString();

  const mainPages = [
    { url: base, priority: '1.0', changefreq: 'weekly' },
    { url: `${base}/paper1`, priority: '0.9', changefreq: 'weekly' },
    { url: `${base}/paper2`, priority: '0.9', changefreq: 'weekly' },
    { url: `${base}/pyqs`, priority: '0.8', changefreq: 'monthly' },
    { url: `${base}/historiography`, priority: '0.8', changefreq: 'weekly' },
    { url: `${base}/timeline`, priority: '0.7', changefreq: 'monthly' },
    { url: `${base}/evaluate`, priority: '0.7', changefreq: 'monthly' },
    { url: `${base}/chat`, priority: '0.7', changefreq: 'monthly' },
    { url: `${base}/test`, priority: '0.6', changefreq: 'monthly' },
    { url: `${base}/contact`, priority: '0.4', changefreq: 'yearly' },
    { url: `${base}/privacy`, priority: '0.3', changefreq: 'yearly' },
    { url: `${base}/terms`, priority: '0.3', changefreq: 'yearly' },
    { url: `${base}/refund`, priority: '0.3', changefreq: 'yearly' },
    { url: `${base}/notes`, priority: '0.9', changefreq: 'weekly' },
    { url: `${base}/notes/ancient-india`, priority: '0.8', changefreq: 'weekly' },
    { url: `${base}/notes/medieval-india`, priority: '0.8', changefreq: 'weekly' },
    { url: `${base}/notes/modern-india`, priority: '0.8', changefreq: 'weekly' },
    { url: `${base}/notes/world-history`, priority: '0.8', changefreq: 'weekly' },
    { url: `${base}/pyqs/ancient-india`, priority: '0.8', changefreq: 'monthly' },
    { url: `${base}/pyqs/early-medieval`, priority: '0.8', changefreq: 'monthly' },
    { url: `${base}/pyqs/medieval-india`, priority: '0.8', changefreq: 'monthly' },
    { url: `${base}/pyqs/modern-india`, priority: '0.8', changefreq: 'monthly' },
    { url: `${base}/pyqs/world-history`, priority: '0.8', changefreq: 'monthly' },
  ];

  const notesSlugs = [
    'sources-ancient-india','prehistory-protohistory','indus-valley-civilization',
    'megalithic-cultures','aryans-vedic-period','mahajanapadas','mauryan-empire',
    'post-mauryan-period','eastern-india-deccan-south','guptas-vakatakas-vardhanas',
    'regional-states-gupta-era','early-indian-cultural-history','early-medieval-india',
    'cultural-traditions-750-1200','thirteenth-century','fourteenth-century',
    'society-culture-economy-13-14c','fifteenth-sixteenth-century-political',
    'fifteenth-sixteenth-century-society','akbar','mughal-empire-17th-century',
    'economy-society-16-17c','mughal-culture','eighteenth-century',
    'european-penetration-india','british-expansion-india','early-british-raj',
    'economic-impact-british-rule','social-cultural-developments','social-religious-reform',
    'indian-response-british-rule','birth-indian-nationalism','gandhian-nationalism',
    'constitutional-developments','other-strands-national-movement',
    'politics-separatism-partition','post-independence-consolidation',
    'caste-ethnicity-post-1947','economic-development-political-change',
    'enlightenment-modern-ideas','origins-modern-politics','industrialization',
    'nation-state-system','imperialism-colonialism','revolution-counter-revolution',
    'world-wars','world-after-wwii','liberation-colonial-rule',
    'decolonization-underdevelopment','unification-europe','disintegration-soviet-union',
  ];

  const urls = [
    ...mainPages.map(p => `
  <url>
    <loc>${p.url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...notesSlugs.map(slug => `
  <url>
    <loc>${base}/notes/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`),
  ].join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
