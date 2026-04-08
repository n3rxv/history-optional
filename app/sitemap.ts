import { MetadataRoute } from 'next'
import { createServerClient } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://historyoptional.xyz'
  const lastMod = new Date()

  const mainPages = [
    { url: base,                          priority: 1.0, changeFrequency: 'weekly'  },
    { url: `${base}/paper1`,              priority: 0.9, changeFrequency: 'weekly'  },
    { url: `${base}/paper2`,              priority: 0.9, changeFrequency: 'weekly'  },
    { url: `${base}/pyqs`,                priority: 0.8, changeFrequency: 'monthly' },
    { url: `${base}/historiography`,      priority: 0.8, changeFrequency: 'weekly'  },
    { url: `${base}/timeline`,            priority: 0.7, changeFrequency: 'monthly' },
    { url: `${base}/evaluate`,            priority: 0.7, changeFrequency: 'monthly' },
    { url: `${base}/chat`,                priority: 0.7, changeFrequency: 'monthly' },
    { url: `${base}/test`,                priority: 0.6, changeFrequency: 'monthly' },
    { url: `${base}/contact`,             priority: 0.4, changeFrequency: 'yearly'  },
  ]

  const notes = [
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
  ]

  // Fetch published posts from Supabase
  let postUrls: MetadataRoute.Sitemap = []
  try {
    const db = createServerClient()
    const { data: posts } = await db
      .from('posts')
      .select('id, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
    if (posts) {
      postUrls = posts.map(post => ({
        url: `${base}/posts/${post.id}`,
        lastModified: new Date(post.published_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))
    }
  } catch {}

  return [
    ...mainPages.map(p => ({
      url: p.url,
      lastModified: lastMod,
      changeFrequency: p.changeFrequency as MetadataRoute.Sitemap[0]['changeFrequency'],
      priority: p.priority,
    })),
    ...notes.map(slug => ({
      url: `${base}/notes/${slug}`,
      lastModified: lastMod,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...postUrls,
  ]
}
