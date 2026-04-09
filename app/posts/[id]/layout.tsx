import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`https://historyoptional.xyz/api/admin/blog-posts/${id}`, { cache: 'no-store' });
    const { data } = await res.json();
    if (!data) return {};
    return {
      title: `${data.title} — History Optional`,
      description: data.excerpt || `${data.title}. UPSC History Optional current affairs and notes.`,
      openGraph: {
        title: data.title,
        description: data.excerpt || '',
        images: data.cover_image ? [data.cover_image] : [],
      },
    };
  } catch {
    return {};
  }
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
