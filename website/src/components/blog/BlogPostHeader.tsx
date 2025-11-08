import Image from 'next/image';
import { i18n } from 'i18next';
import { BlogPost } from '@/lib/notion/types';

interface BlogPostHeaderProps {
  post: BlogPost;
  i18n: i18n;
}

export function BlogPostHeader({ post, i18n }: BlogPostHeaderProps) {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="mb-8">
      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs bg-white/10 text-white rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {post.description && (
        <p className="text-white/60 text-lg leading-tight mb-4">{post.description}</p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-white/40 text-sm">
        <span>{post.author}</span>
        <span>•</span>
        <time>{formattedDate}</time>
      </div>
    </header>
  );
}

