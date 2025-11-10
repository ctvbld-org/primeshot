# Notion Blog Integration Guide

This guide will help you set up the Notion-based blog system for your Primeshot website.

## Overview

The blog system uses Notion as a headless CMS, allowing you to write content in Notion and automatically display it on your website. This works for both manually written articles and AI-generated content from SEObot.

## Architecture

```
┌─────────────────────────────────┐
│      Notion Database            │
│  (Blog Posts with Properties)   │
└────────────┬────────────────────┘
             │
             │ Notion API
             ↓
┌─────────────────────────────────┐
│   Next.js Website (/blog)       │
│  - Listing Page                 │
│  - Individual Post Pages        │
│  - ISR (60s revalidation)       │
└─────────────────────────────────┘
```

## Step 1: Set Up Notion Database

### 1.1 Create a Notion Account
- Go to [notion.so](https://notion.so) and create an account if you don't have one

### 1.2 Create Blog Database
1. In Notion, create a new page called "Blog Posts"
2. Add a database (full page database)
3. Configure the following properties:

| Property Name | Type | Required | Description |
|--------------|------|----------|-------------|
| Title | Title | ✅ | Post title |
| Slug | Rich text | ✅ | URL slug (e.g., "my-first-post") |
| Status | Select | ✅ | Options: "draft", "published", "archived" |
| Description | Rich text | ❌ | Short description/excerpt |
| Published At | Date | ✅ | Publication date |
| Author | Rich text | ❌ | Author name (default: "Primeshot") |
| Tags | Multi-select | ❌ | Content tags/categories |
| Featured | Checkbox | ❌ | Mark as featured post |
| Content Type | Select | ❌ | Options: "ai", "manual" (for internal use) |

### 1.3 Add Cover Images (Optional)
- Click on a page and select "Add cover" to add a cover image
- You can upload images or use URLs

## Step 2: Create Notion Integration

### 2.1 Create Integration
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "+ New integration"
3. Name it "Primeshot Blog"
4. Select your workspace
5. Set capabilities:
   - ✅ Read content
   - ✅ Read user information (for author)
   - ❌ Insert content (not needed)
   - ❌ Update content (not needed)
6. Click "Submit"
7. Copy the **Internal Integration Token** (starts with `secret_`)

### 2.2 Share Database with Integration
1. Open your "Blog Posts" database in Notion
2. Click "..." menu (top right)
3. Click "Add connections"
4. Select "Primeshot Blog" integration
5. Click "Confirm"

## Step 3: Configure Environment Variables

Add these to your `website/.env.local` file:

```bash
# Notion Configuration
NOTION_TOKEN=secret_your_notion_integration_token_here
NOTION_BLOG_DATABASE_ID=your_database_id_here
```

### Finding Your Database ID:
1. Open your database in Notion
2. Look at the URL: `https://www.notion.so/workspace/DATABASE_ID?v=...`
3. The `DATABASE_ID` is the 32-character string between the workspace name and `?v=`
4. Example: `https://www.notion.so/myworkspace/1234567890abcdef1234567890abcdef?v=...`
   - Database ID: `1234567890abcdef1234567890abcdef`

## Step 4: Integrate SEObot (Optional)

### 4.1 Sign Up for SEObot
1. Go to [seobotai.com](https://seobotai.com)
2. Sign up for an account (starts at $49/month)
3. Complete onboarding

### 4.2 Configure SEObot to Publish to Notion
1. In SEObot dashboard, go to Settings → Integrations
2. Select "Notion" as your CMS
3. Connect your Notion account
4. Select your "Blog Posts" database
5. Configure field mapping:
   - Title → Title
   - Slug → Slug
   - Content → Page content
   - Status → "published" (or "draft" for review)
   - Content Type → "ai"
   - Tags → Auto-generated or custom
6. Set up publishing schedule

## Step 5: Test the Integration

### 5.1 Create Test Post in Notion
1. Add a new page to your database
2. Fill in required fields:
   - Title: "Test Blog Post"
   - Slug: "test-blog-post"
   - Status: "published"
   - Published At: Today's date
3. Add some content to the page
4. Optional: Add a cover image

### 5.2 Run Development Server
```bash
cd website
npm run dev
```

### 5.3 Visit Blog Pages
- Blog listing: `http://localhost:4000/en/blog`
- Individual post: `http://localhost:4000/en/blog/test-blog-post`

## Step 6: Content Workflow

### For Manual Posts:
1. Create new page in Notion database
2. Write content in Notion (use all blocks: headings, images, code, etc.)
3. Fill in metadata (title, slug, tags, etc.)
4. Set Status to "published"
5. Post appears on website within 60 seconds (ISR)

### For AI-Generated Posts (SEObot):
1. SEObot automatically creates posts in Notion
2. Review in Notion (Status: "draft")
3. Edit if needed
4. Change Status to "published"
5. Post appears on website

## Notion Database Schema Reference

```typescript
interface NotionBlogPost {
  // Page properties
  id: string
  cover: { type: 'external' | 'file', url: string }
  
  // Database properties
  properties: {
    Title: { title: [{ plain_text: string }] }
    Slug: { rich_text: [{ plain_text: string }] }
    Status: { select: { name: 'draft' | 'published' | 'archived' } }
    Description: { rich_text: [{ plain_text: string }] }
    'Published At': { date: { start: string } }
    Author: { rich_text: [{ plain_text: string }] }
    Tags: { multi_select: [{ name: string }] }
    Featured: { checkbox: boolean }
    'Content Type': { select: { name: 'ai' | 'manual' } }
  }
  
  // Page content (blocks)
  content: NotionBlock[]
}
```

## File Structure

```
website/
├── src/
│   ├── app/
│   │   └── [locale]/
│   │       └── blog/
│   │           ├── page.tsx              # Blog listing
│   │           ├── [slug]/
│   │           │   └── page.tsx          # Individual post
│   │           └── sitemap.ts            # Blog sitemap
│   ├── components/
│   │   └── blog/
│   │       ├── BlogCard.tsx             # Post card component
│   │       ├── BlogGrid.tsx             # Post grid with filters
│   │       ├── BlogHero.tsx             # Hero section
│   │       ├── BlogPostContent.tsx      # Notion content renderer
│   │       ├── BlogPostHeader.tsx       # Post header
│   │       └── RelatedPosts.tsx         # Related posts section
│   └── lib/
│       └── notion/
│           ├── client.ts                # Notion client setup
│           ├── types.ts                 # TypeScript types
│           └── api.ts                   # API functions
├── .env.local                           # Environment variables
└── package.json
```

## Features

### Implemented:
- ✅ Notion database integration
- ✅ Blog listing page with filters (All, Featured)
- ✅ Individual blog post pages
- ✅ Full Notion block rendering (images, code, tables, etc.)
- ✅ ISR (Incremental Static Regeneration) - 60s
- ✅ SEO metadata
- ✅ Multi-language support (10 languages)
- ✅ Cover images
- ✅ Tags and categories
- ✅ Related posts
- ✅ Blog sitemap
- ✅ Responsive design
- ✅ Dark mode styling

### Content Type (Internal):
- The `Content Type` field exists in the database for internal tracking
- It's NOT displayed on the website (visitors don't see if content is AI or manual)
- Use it to organize your content behind the scenes

## Troubleshooting

### "Error fetching blog posts"
- Check that `NOTION_TOKEN` is correct
- Verify `NOTION_BLOG_DATABASE_ID` is correct
- Ensure database is shared with integration

### Posts not appearing
- Check that Status is "published"
- Check that Published At date is not in the future
- Wait up to 60 seconds for ISR to refresh

### Images not loading
- Notion image URLs expire after a while
- Use external image URLs (Cloudinary, Imgix, etc.) for production
- Or re-upload images periodically

### Styling issues
- The Notion renderer uses custom CSS in `BlogPostContent.tsx`
- Modify the styles there to match your design

## Next Steps

1. **Create initial content**: Add 5-10 blog posts to your database
2. **Set up SEObot**: Configure automatic content generation
3. **Customize styling**: Adjust colors and typography in components
4. **Add analytics**: Track blog post views
5. **Enable comments**: Add comment system (Disqus, giscus, etc.)
6. **Newsletter integration**: Capture emails from blog readers
7. **RSS feed**: Add RSS feed for subscribers

## Support

- Notion API Docs: [developers.notion.com](https://developers.notion.com)
- SEObot Docs: [seobotai.com/docs](https://seobotai.com)
- Next.js ISR: [nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration)


