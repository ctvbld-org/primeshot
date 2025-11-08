import { getAllBlogSlugs } from '@/lib/notion/api';

export default async function sitemap() {
  const baseUrl = 'https://primeshot.ai';
  const locales = ['en', 'cn', 'es', 'fr', 'pt', 'de', 'jp', 'it', 'nl'];
  
  // Get all blog post slugs
  const slugs = await getAllBlogSlugs();
  
  // Generate sitemap entries for all blog posts in all locales
  const blogPosts = slugs.flatMap((slug) => 
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  // Add blog index pages for all locales
  const blogIndexes = locales.map((locale) => ({
    url: `${baseUrl}/${locale}/blog`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...blogIndexes, ...blogPosts];
}

