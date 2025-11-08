import { ExtendedRecordMap } from 'notion-types';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  tags: string[];
  featured: boolean;
  contentType: 'AI' | 'Manual';
  status: 'Draft' | 'Published' | 'Scheduled' | 'In Review' | 'Archived' | 'Editing';
}

export interface BlogPostWithContent extends BlogPost {
  content: ExtendedRecordMap;
}

export interface BlogListResponse {
  posts: BlogPost[];
  hasMore: boolean;
}

