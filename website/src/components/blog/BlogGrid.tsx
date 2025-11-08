'use client';

import { BlogPost } from '@/lib/notion/types';
import { BlogCard } from './BlogCard';

interface BlogGridProps {
  posts: BlogPost[];
  hasMore: boolean;
  currentFilter: string;
  translations: {
    noPosts: string;
    loadMore: string;
  };
}

export function BlogGrid({ posts, hasMore, translations }: BlogGridProps) {
  return (
    <section className="px-6 py-8 xl:py-16">
      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-white/60 text-lg">{translations.noPosts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className={post.featured ? 'md:col-span-2' : ''}
            >
              <BlogCard post={post} />
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
            {translations.loadMore}
          </button>
        </div>
      )}
    </section>
  );
}

