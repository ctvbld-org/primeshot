import { notion, notionClient, BLOG_DATABASE_ID, BLOG_DATA_SOURCE_ID } from './client';
import { BlogPost, BlogPostWithContent, BlogListResponse } from './types';
import { QueryDataSourceResponse } from '@notionhq/client/build/src/api-endpoints';

// Helper to extract people (for Author field)
function getPeople(property: any): string {
  if (!property) return '';
  
  // If it's a people property
  if (property.type === 'people' && Array.isArray(property.people)) {
    return property.people
      .map((person: any) => person.name || '')
      .filter(Boolean)
      .join(', ');
  }
  
  // If it's a rich_text property
  if (property.type === 'rich_text' && Array.isArray(property.rich_text)) {
    return getPlainText(property.rich_text);
  }
  
  // If it's a select property
  if (property.type === 'select' && property.select?.name) {
    return String(property.select.name);
  }
  
  return '';
}

// Helper to extract text from Notion rich text
function getPlainText(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return '';
  return richText.map((text: any) => text.plain_text || '').join('');
}

// Helper to extract cover image
function getCoverImage(cover: any): string {
  if (!cover) return '';
  if (cover.type === 'external' && cover.external?.url) return String(cover.external.url);
  if (cover.type === 'file' && cover.file?.url) return String(cover.file.url);
  return '';
}

// Helper to extract array values from multi-select
function getMultiSelect(property: any): string[] {
  if (!property || property.type !== 'multi_select') return [];
  return (property.multi_select || []).map((item: any) => String(item.name || ''));
}

// Helper to extract select value
function getSelect(property: any): string {
  if (!property || property.type !== 'select' || !property.select?.name) return '';
  return String(property.select.name);
}

// Helper to extract status value
function getStatus(property: any): string {
  if (!property || property.type !== 'status' || !property.status?.name) return '';
  return String(property.status.name);
}

// Helper to extract checkbox value
function getCheckbox(property: any): boolean {
  if (!property || property.type !== 'checkbox') return false;
  return Boolean(property.checkbox);
}

// Helper to extract date
function getDate(property: any): string {
  if (!property || property.type !== 'date' || !property.date?.start) return '';
  return String(property.date.start);
}

// Transform Notion page to BlogPost
function transformNotionPage(page: any): BlogPost {
  try {
    // CRITICAL: Extract primitives IMMEDIATELY without touching nested objects
    const pageId = page && page.id ? String(page.id) : '';
    const createdTime = page && page.created_time ? String(page.created_time) : new Date().toISOString();
    const editedTime = page && page.last_edited_time ? String(page.last_edited_time) : new Date().toISOString();
    
    const props = page && page.properties ? page.properties : {};
    
    // Extract cover URL directly
    let coverUrl = '';
    if (page && page.cover) {
      if (page.cover.type === 'external' && page.cover.external && page.cover.external.url) {
        coverUrl = String(page.cover.external.url);
      } else if (page.cover.type === 'file' && page.cover.file && page.cover.file.url) {
        coverUrl = String(page.cover.file.url);
      }
    }
    
    // Extract all text values
    const slugText = getPlainText(props.Slug && props.Slug.rich_text ? props.Slug.rich_text : (props.slug && props.slug.rich_text ? props.slug.rich_text : []));
    const titleText = getPlainText(props.Title && props.Title.title ? props.Title.title : (props.Name && props.Name.title ? props.Name.title : []));
    const descText = getPlainText(props.Description && props.Description.rich_text ? props.Description.rich_text : (props.Summary && props.Summary.rich_text ? props.Summary.rich_text : []));
    const authorText = getPeople(props.Author);
    
    // Extract date
    let publishDate = '';
    const publishProp = props['Publish Date'] || props.Date;
    if (publishProp && publishProp.type === 'date' && publishProp.date && publishProp.date.start) {
      publishDate = String(publishProp.date.start);
    }
    
    // Extract tags
    let tagList: string[] = [];
    if (props.Tags && props.Tags.type === 'multi_select' && Array.isArray(props.Tags.multi_select)) {
      tagList = props.Tags.multi_select.map((t: any) => t && t.name ? String(t.name) : '').filter(Boolean);
    }
    
    // Extract featured
    let isFeatured = false;
    if (props.Featured && props.Featured.type === 'checkbox') {
      isFeatured = Boolean(props.Featured.checkbox);
    }
    
    // Extract content type
    let contentTypeStr = 'Manual';
    if (props['Content Type'] && props['Content Type'].type === 'select' && props['Content Type'].select && props['Content Type'].select.name) {
      const ct = String(props['Content Type'].select.name);
      if (ct === 'AI' || ct === 'Manual') contentTypeStr = ct;
    }
    
    // Extract status
    let statusStr = 'Published';
    if (props.Status && props.Status.type === 'status' && props.Status.status && props.Status.status.name) {
      const st = String(props.Status.status.name);
      if (['Draft', 'Published', 'Scheduled', 'In Review', 'Archived', 'Editing'].includes(st)) {
        statusStr = st;
      }
    }
    
    // Return completely new object with ONLY primitives
    return {
      id: pageId,
      slug: slugText || pageId,
      title: titleText || 'Untitled',
      description: descText,
      coverImage: coverUrl,
      publishedAt: publishDate || createdTime,
      updatedAt: editedTime,
      author: authorText || 'Primeshot',
      tags: tagList,
      featured: isFeatured,
      contentType: contentTypeStr as 'AI' | 'Manual',
      status: statusStr as any,
    };
  } catch (error) {
    console.error('Error transforming page:', error);
    return {
      id: 'error',
      slug: 'error',
      title: 'Error loading post',
      description: '',
      coverImage: '',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'Primeshot',
      tags: [],
      featured: false,
      contentType: 'Manual',
      status: 'Draft',
    };
  }
}

// Get all published blog posts
export async function getBlogPosts(options?: {
  limit?: number;
  startCursor?: string;
}): Promise<BlogListResponse> {
  if (!BLOG_DATABASE_ID) {
    console.error('NOTION_BLOG_DATABASE_ID is not configured');
    return { posts: [], hasMore: false };
  }

  try {
    const filter: any = {
      property: 'Status',
      status: {
        equals: 'Published',
      },
    };

    const response: QueryDataSourceResponse = await notion.dataSources.query({
      data_source_id: BLOG_DATA_SOURCE_ID,
      filter,
      sorts: [
        {
          property: 'Publish Date',
          direction: 'descending',
        },
      ],
      page_size: options?.limit || 10,
      start_cursor: options?.startCursor,
    });

    // CRITICAL: Extract only what we need immediately, don't hold reference to response
    const resultsArray = response && response.results && Array.isArray(response.results) ? response.results : [];
    const hasMorePages = response && typeof response.has_more === 'boolean' ? response.has_more : false;

    
    // Process each result individually and discard the original
    const posts: BlogPost[] = [];
    for (const page of resultsArray) {
      try {
        const post = transformNotionPage(page);
        posts.push(post);
      } catch (err) {
        console.error('Error transforming page:', err);
      }
    }
    
    // FINAL STEP: Create completely new objects with only primitives
    const cleanPosts = posts.map(p => ({
      id: String(p.id),
      slug: String(p.slug),
      title: String(p.title),
      description: String(p.description),
      coverImage: String(p.coverImage),
      publishedAt: String(p.publishedAt),
      updatedAt: String(p.updatedAt),
      author: String(p.author),
      tags: Array.isArray(p.tags) ? p.tags.map(t => String(t)) : [],
      featured: Boolean(p.featured),
      contentType: String(p.contentType) as 'AI' | 'Manual',
      status: String(p.status) as any,
    }));

    // Return ONLY primitives
    return {
      posts: cleanPosts,
      hasMore: hasMorePages,
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return { posts: [], hasMore: false };
  }
}

// Get a single blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPostWithContent | null> {
  if (!BLOG_DATABASE_ID) {
    console.error('NOTION_BLOG_DATABASE_ID is not configured');
    return null;
  }

  try {
    // Query database for the post with this slug
    const response: QueryDataSourceResponse = await notion.dataSources.query({
      data_source_id: BLOG_DATA_SOURCE_ID,
      filter: {
        and: [
          {
            property: 'Slug',
            rich_text: {
              equals: slug,
            },
          },
          {
            property: 'Status',
            status: {
              equals: 'Published',
            },
          },
        ],
      },
    });

    if (response.results.length === 0) {
      return null;
    }

    const page = response.results[0];
    const post = transformNotionPage(page);

    // Fetch page content using unofficial API (for rendering)
    const content = await notionClient.getPage(page.id);

    return {
      ...post,
      content,
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

// Get all slugs for static generation
export async function getAllBlogSlugs(): Promise<string[]> {
  if (!BLOG_DATABASE_ID) {
    console.error('NOTION_BLOG_DATABASE_ID is not configured');
    return [];
  }

  try {
    const slugs: string[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const response: QueryDataSourceResponse = await notion.dataSources.query({
        data_source_id: BLOG_DATA_SOURCE_ID,
        filter: {
          property: 'Status',
          status: {
            equals: 'Published',
          },
        },
        start_cursor: startCursor,
      });

      const pageSlugs = response.results.map((page: any) => {
        const props = page.properties;
        return getPlainText(props.Slug?.title || props.slug?.rich_text) || page.id;
      });

      slugs.push(...pageSlugs);
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return slugs;
  } catch (error) {
    console.error('Error fetching blog slugs:', error);
    return [];
  }
}

// Get featured posts
export async function getFeaturedPosts(limit = 3): Promise<BlogPost[]> {
  const response = await getBlogPosts({ limit });
  // Filter featured posts client-side
  return response.posts.filter(post => post.featured);
}


