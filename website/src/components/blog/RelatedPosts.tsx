import { i18n } from 'i18next';
import { getBlogPosts } from '@/lib/notion/api';
import { BlogCard } from './BlogCard';

interface RelatedPostsProps {
  currentPostId: string;
  tags: string[];
  i18n: i18n;
}

export async function RelatedPosts({ currentPostId, tags, i18n }: RelatedPostsProps) {
  const t = (key: string) => i18n.t(key, { ns: 'blog' });

  // Fetch posts to find related ones (in a real app, you'd filter by tags)
  const { posts } = await getBlogPosts({ limit: 20 });
  
  // Filter out current post and find related by tags
  const relatedPosts = posts
    .filter((post) => post.id !== currentPostId)
    .filter((post) => post.tags.some((tag) => tags.includes(tag)))
    .slice(0, 3);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-screen-xl mx-auto px-6 py-8 xl:py-16">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">{t('relatedPosts')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {relatedPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

