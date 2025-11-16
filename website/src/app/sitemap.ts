import { MetadataRoute } from 'next';
import { getAllBlogSlugs } from '@/lib/notion/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://primeshot.ai';
  // Use 'us' as the canonical locale to avoid duplicate content issues
  const canonicalLocale = 'us';
  
  // Static pages - only canonical versions
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/explore', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/privacy', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.5, changeFrequency: 'yearly' as const },
  ];

  // Generate sitemap entries for static pages (canonical locale only)
  const staticEntries = staticPages.map((page) => ({
    url: `${baseUrl}/${canonicalLocale}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // Get all blog post slugs
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllBlogSlugs();
    
    // Generate sitemap entries for blog posts (canonical locale only)
    blogEntries = slugs.map((slug) => ({
      url: `${baseUrl}/${canonicalLocale}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching blog slugs for sitemap:', error);
    // Continue with static pages even if blog fetch fails
  }

  return [...staticEntries, ...blogEntries];
}

