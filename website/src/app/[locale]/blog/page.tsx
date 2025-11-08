import { Metadata } from 'next';
import { initServerI18n } from '@primeshot/common';
import { getBlogPosts } from '@/lib/notion/api';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { BlogHero } from '@/components/blog/BlogHero';

interface BlogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string; page?: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const language = locale === 'en' ? 'us' : locale;
  const i18n = initServerI18n(language);
  
  const title = i18n.t('meta.title', { ns: 'blog' });
  const description = i18n.t('meta.description', { ns: 'blog' });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale } = await params;
  const { filter = 'all' } = await searchParams;
  
  const language = locale === 'en' ? 'us' : locale;
  const i18n = initServerI18n(language);

  // Fetch blog posts
  const { posts, hasMore } = await getBlogPosts({
    limit: 12,
  });

  // Serialize for client component
  const serializedPosts = JSON.parse(JSON.stringify(posts));

  return (
    <div className="w-full min-h-screen px-3">
      <BlogHero title={i18n.t('hero.title', { ns: 'blog' })} />
      <div className="w-full max-w-screen-xl mx-auto">
        <BlogGrid 
          posts={serializedPosts} 
          hasMore={hasMore} 
          currentFilter={filter}
          translations={{
            noPosts: i18n.t('noPosts', { ns: 'blog' }),
            loadMore: i18n.t('loadMore', { ns: 'blog' }),
          }}
        />
      </div>
    </div>
  );
}

// Enable ISR with 60 second revalidation
export const revalidate = 60;

