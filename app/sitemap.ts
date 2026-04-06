import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://historyoptional.xyz'
  const lastMod = new Date()

  return [
    { url: base,                          lastModified: lastMod, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/evaluate`,            lastModified: lastMod, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/historiography`,      lastModified: lastMod, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/pyqs`,                lastModified: lastMod, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/timeline`,            lastModified: lastMod, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/chat`,                lastModified: lastMod, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/paper1`,              lastModified: lastMod, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/paper2`,              lastModified: lastMod, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`,             lastModified: lastMod, changeFrequency: 'yearly',  priority: 0.4 },
  ]
}
