import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { initServerI18n } from '@primeshot/common';
import { getBlogPostBySlug, getAllBlogSlugs } from '@/lib/notion/api';
import { BlogPostContent } from '@/components/blog/BlogPostContent';
import { BlogPostHeader } from '@/components/blog/BlogPostHeader';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import ContentPageHeader from '@/components/ContentPageHeader';

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  
  // Generate params for all locales and all slugs
  const locales = ['en', 'cn', 'es', 'fr', 'pt', 'de', 'jp', 'it', 'nl'];
  const params = locales.flatMap(locale =>
    slugs.map(slug => ({
      locale,
      slug,
    }))
  );

  return params;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  
  const post = await getBlogPostBySlug(slug);
  
  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author || 'Primeshot'],
      images: post.coverImage ? [post.coverImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  const language = locale === 'en' ? 'us' : locale;
  const i18n = initServerI18n(language);

  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="w-full min-h-screen px-3">
      <ContentPageHeader 
        title={post.title}
        backgroundImage={post.coverImage || ""}
      />
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="max-w-3xl px-6 py-8 xl:py-16">
          <article>
            <BlogPostHeader post={post} i18n={i18n} />
            <BlogPostContent content={post.content} />
          </article>
        </div>
      </div>
      <RelatedPosts currentPostId={post.id} tags={post.tags} i18n={i18n} />
    </div>
  );
}

// Enable ISR with 60 second revalidation
export const revalidate = 60;

