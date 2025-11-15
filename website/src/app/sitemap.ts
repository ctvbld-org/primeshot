import { MetadataRoute } from 'next';
import { getAllBlogSlugs } from '@/lib/notion/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://primeshot.ai';
  const locales = ['us', 'gb', 'cn', 'es', 'fr', 'pt', 'de', 'jp', 'it', 'nl'];
  
  // Static pages that exist for all locales
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/explore', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/privacy', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.5, changeFrequency: 'yearly' as const },
  ];

  // Generate sitemap entries for all static pages in all locales
  const staticEntries = staticPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }))
  );

  // Get all blog post slugs
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllBlogSlugs();
    
    // Generate sitemap entries for all blog posts in all locales
    blogEntries = slugs.flatMap((slug) =>
      locales.map((locale) => ({
        url: `${baseUrl}/${locale}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    );
  } catch (error) {
    console.error('Error fetching blog slugs for sitemap:', error);
    // Continue with static pages even if blog fetch fails
  }

  return [...staticEntries, ...blogEntries];
}

