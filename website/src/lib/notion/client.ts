import { Client } from '@notionhq/client';
import { NotionAPI } from 'notion-client';

// Notion official SDK client (for querying database)
export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Unofficial Notion API client (for rendering pages)
export const notionClient = new NotionAPI();

// Your Notion database ID for blog posts
export const BLOG_DATABASE_ID = process.env.NOTION_BLOG_DATABASE_ID || '';

// Data source ID (retrieved from database)
export const BLOG_DATA_SOURCE_ID = '42ec3dcd-64f1-4bdc-a43f-5fa26a7d856f';

