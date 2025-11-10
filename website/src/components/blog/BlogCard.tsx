import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from '@/lib/notion/types';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="h-full bg-white/5 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors">
        {post.coverImage && (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-6">
          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs bg-white/10 text-white rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
            {post.title}
          </h3>

          {/* Description */}
          {post.description && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-3">
              {post.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{post.author}</span>
            <span>{formattedDate}</span>
          </div>

          {/* Badge for content type */}
          {post.featured && (
            <div className="mt-4 inline-block px-3 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">
              Featured
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}


