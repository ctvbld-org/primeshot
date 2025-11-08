# Blog Integration Quick Start

## ✅ What's Been Implemented

I've successfully integrated a Notion-based blog system into your website. Here's what's ready:

### 📁 Files Created

**Notion Integration:**
- `website/src/lib/notion/client.ts` - Notion API client setup
- `website/src/lib/notion/types.ts` - TypeScript types for blog posts
- `website/src/lib/notion/api.ts` - API functions to fetch posts

**Blog Pages:**
- `website/src/app/[locale]/blog/page.tsx` - Blog listing page
- `website/src/app/[locale]/blog/[slug]/page.tsx` - Individual post pages
- `website/src/app/[locale]/blog/sitemap.ts` - Blog sitemap for SEO

**Blog Components:**
- `website/src/components/blog/BlogHero.tsx` - Hero section
- `website/src/components/blog/BlogGrid.tsx` - Post grid with filters
- `website/src/components/blog/BlogCard.tsx` - Individual post card
- `website/src/components/blog/BlogPostHeader.tsx` - Post header
- `website/src/components/blog/BlogPostContent.tsx` - Notion content renderer
- `website/src/components/blog/RelatedPosts.tsx` - Related posts section

**Translations (10 languages):**
- All blog UI text translated: US, CN, ES, FR, DE, IT, PT, JP, NL, GB

**Configuration:**
- Updated `next.config.ts` with Notion image domains
- Created `.env.blog.example` with required environment variables

### 🎨 Features

✅ Full Notion content rendering (headings, images, code, tables, lists, etc.)
✅ Multi-language support (all 10 locales)
✅ Responsive design matching your site's dark theme
✅ ISR (Incremental Static Regeneration) - updates every 60 seconds
✅ SEO-optimized with metadata, Open Graph, Twitter cards
✅ Blog sitemap for search engines
✅ Featured posts filter
✅ Related posts based on tags
✅ Cover images support
✅ Clean URLs (no "AI-generated" labels)

## 🚀 Next Steps

### 1. Set Up Notion (5 minutes)

**Create Database:**
1. Go to [notion.so](https://notion.so)
2. Create a new page: "Blog Posts"
3. Add a full-page database
4. Add these properties:

| Property | Type | Options |
|----------|------|---------|
| Title | Title | (default) |
| Slug | Rich text | e.g., "my-first-post" |
| Status | Select | draft, published, archived |
| Description | Rich text | Short excerpt |
| Published At | Date | Publication date |
| Author | Rich text | Author name |
| Tags | Multi-select | Categories/tags |
| Featured | Checkbox | Mark as featured |
| Content Type | Select | ai, manual (internal only) |

**Create Integration:**
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "+ New integration"
3. Name: "Primeshot Blog"
4. Capabilities: ✅ Read content, ✅ Read user
5. Copy the token (starts with `secret_`)

**Connect Database:**
1. Open your database
2. Click "..." → "Add connections"
3. Select "Primeshot Blog"

### 2. Configure Environment Variables

Add to `website/.env.local`:

```bash
NOTION_TOKEN=secret_your_token_here
NOTION_BLOG_DATABASE_ID=your_database_id_here
```

**Find Database ID:**
- Open database in Notion
- URL: `notion.so/workspace/DATABASE_ID?v=...`
- Copy the 32-character ID

### 3. Create Test Content

In your Notion database:
1. Add a new page
2. Fill in:
   - Title: "Welcome to Our Blog"
   - Slug: "welcome"
   - Status: "published"
   - Published At: Today
   - Author: "Primeshot Team"
   - Tags: "Announcement"
   - Featured: ✅ (check it)
3. Write some content in the page (headings, paragraphs, images, etc.)
4. Optionally add a cover image

### 4. Test Locally

```bash
cd website
npm run dev
```

Visit:
- Blog listing: `http://localhost:4000/en/blog`
- Your post: `http://localhost:4000/en/blog/welcome`

### 5. SEObot Integration (Optional)

**Sign Up:**
1. Go to [seobotai.com](https://seobotai.com)
2. Choose a plan (starts at $49/mo)
3. Complete onboarding

**Configure:**
1. In SEObot: Settings → Integrations
2. Select "Notion"
3. Connect your account
4. Select "Blog Posts" database
5. Map fields:
   - Title → Title
   - Slug → Slug
   - Content → Page content
   - Status → "draft" (for review) or "published"
   - Content Type → "ai"
6. Set publishing schedule

**Workflow:**
1. SEObot creates posts in Notion (status: draft)
2. Review in Notion
3. Edit if needed
4. Change status to "published"
5. Live on website in 60 seconds!

## 📖 Blog URLs

Once deployed:
- `https://primeshot.ai/en/blog` - English blog
- `https://primeshot.ai/cn/blog` - Chinese blog
- `https://primeshot.ai/es/blog` - Spanish blog
- etc. (all 10 languages)

## 🎯 Content Strategy

### Manual Posts (Notion):
- Product announcements
- Case studies
- Feature releases
- Behind-the-scenes
- Founder updates

### AI Posts (SEObot):
- How-to guides
- Tutorials
- SEO-optimized articles
- Industry tips
- Long-tail keyword content

**Note:** Visitors won't see which is which - it's all just "blog content"!

## 📚 Full Documentation

See `docs/notion-blog-integration.md` for:
- Detailed setup instructions
- Database schema
- API reference
- Troubleshooting
- Advanced features

## 🔄 How It Works

```
User writes in Notion
      ↓
Notion API (official)
      ↓
Next.js fetches posts
      ↓
ISR caches for 60s
      ↓
Blog page renders
      ↓
Notion content displayed
```

## ✨ What Makes This Special

1. **No Code Deployment**: Content editors don't need Git or deployments
2. **Rich Content**: Full Notion blocks (code, tables, embeds, etc.)
3. **Hybrid Approach**: Mix manual and AI content seamlessly
4. **Review Workflow**: AI content can be reviewed before publishing
5. **Multi-language**: Blog available in all 10 languages
6. **SEO Optimized**: Proper metadata, sitemaps, structured data
7. **Fast Updates**: ISR means content updates in 60 seconds max

## 🛠 Customization

### Change Revalidation Time:
In blog pages, change:
```typescript
export const revalidate = 60; // seconds
```

### Modify Styling:
Edit `website/src/components/blog/BlogPostContent.tsx` for Notion content styles

### Add Categories:
Modify `BlogGrid.tsx` to add more filter options

### Enable Comments:
Add Disqus, giscus, or other comment systems to `BlogPostContent.tsx`

## 🚨 Important Notes

1. **Notion Token**: Keep it secret! Don't commit to Git
2. **Image URLs**: Notion images expire; use external hosting for production
3. **Database Structure**: Don't change property names without updating code
4. **Status Field**: Only "published" posts appear on website
5. **Slug Field**: Must be unique and URL-friendly

## 📞 Support Resources

- Full docs: `docs/notion-blog-integration.md`
- Notion API: [developers.notion.com](https://developers.notion.com)
- SEObot docs: [seobotai.com](https://seobotai.com)
- Next.js ISR: [nextjs.org/docs](https://nextjs.org/docs)

---

**Ready to go!** Set up your Notion database and start writing. 🎉

