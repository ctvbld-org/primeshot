# Blog Integration Checklist

Use this checklist to get your blog live!

## ☐ Phase 1: Notion Setup (15 minutes)

### Create Database
- [ ] Log into Notion (or create account)
- [ ] Create new page called "Blog Posts"
- [ ] Convert to full-page database
- [ ] Add required properties:
  - [ ] Title (Title type) ✅ Default
  - [ ] Slug (Rich text)
  - [ ] Status (Select: draft, published, archived)
  - [ ] Published At (Date)
- [ ] Add optional properties:
  - [ ] Description (Rich text)
  - [ ] Author (Rich text)
  - [ ] Tags (Multi-select)
  - [ ] Featured (Checkbox)
  - [ ] Content Type (Select: ai, manual)

### Create Integration
- [ ] Visit https://www.notion.so/my-integrations
- [ ] Click "+ New integration"
- [ ] Name: "Primeshot Blog"
- [ ] Select workspace
- [ ] Set capabilities:
  - [ ] ✅ Read content
  - [ ] ✅ Read user information
  - [ ] ❌ Insert content
  - [ ] ❌ Update content
- [ ] Click "Submit"
- [ ] **COPY TOKEN** (save somewhere safe!)

### Connect Database to Integration
- [ ] Open "Blog Posts" database
- [ ] Click "..." menu (top right)
- [ ] Click "Add connections"
- [ ] Select "Primeshot Blog"
- [ ] Click "Confirm"

---

## ☐ Phase 2: Environment Configuration (2 minutes)

### Get Database ID
- [ ] Open your database in Notion
- [ ] Look at URL: `notion.so/workspace/DATABASE_ID?v=...`
- [ ] Copy the 32-character DATABASE_ID
- [ ] Example: `1234567890abcdef1234567890abcdef`

### Add Environment Variables
- [ ] Open `website/.env.local`
- [ ] Add these lines:
```bash
NOTION_TOKEN=secret_your_token_from_step_1
NOTION_BLOG_DATABASE_ID=your_database_id_from_above
```
- [ ] Save file
- [ ] **DO NOT commit** this file to Git!

---

## ☐ Phase 3: Create Test Content (10 minutes)

### First Blog Post
- [ ] Open Notion database
- [ ] Click "+ New" to create page
- [ ] Fill in properties:
  - [ ] Title: "Welcome to Our Blog"
  - [ ] Slug: "welcome"
  - [ ] Status: "published"
  - [ ] Published At: Today's date
  - [ ] Author: "Primeshot Team"
  - [ ] Tags: "Announcement"
  - [ ] Featured: ✅ Check it
  - [ ] Content Type: "manual"
- [ ] Open the page
- [ ] Add content:
  - [ ] Add heading: "# Welcome"
  - [ ] Write some paragraphs
  - [ ] Add an image (optional)
  - [ ] Add a list or code block (optional)
- [ ] Optionally add cover image (click "Add cover")

### Second Post (Featured)
- [ ] Create another post
- [ ] Fill all fields (different slug!)
- [ ] Set Featured: ✅
- [ ] Status: "published"
- [ ] Add rich content

### Third Post (Regular)
- [ ] Create one more post
- [ ] Leave Featured unchecked
- [ ] Status: "published"
- [ ] Add content

---

## ☐ Phase 4: Local Testing (5 minutes)

### Start Development Server
- [ ] Open terminal
- [ ] Run:
```bash
cd website
npm run dev
```
- [ ] Wait for server to start

### Test Blog Pages
- [ ] Visit `http://localhost:4000/en/blog`
- [ ] Verify:
  - [ ] All 3 posts appear
  - [ ] Filter buttons work (All / Featured)
  - [ ] Post cards show title, description, tags
  - [ ] Featured posts have badge
- [ ] Click a post
- [ ] Verify:
  - [ ] Post opens correctly
  - [ ] Content renders properly
  - [ ] Images load (if added)
  - [ ] Meta info shows (author, date)
  - [ ] Related posts appear (if applicable)

### Test Filters
- [ ] On `/en/blog`, click "Featured"
- [ ] Verify only featured posts show
- [ ] Click "All Posts"
- [ ] Verify all posts show

### Test Other Languages
- [ ] Visit `http://localhost:4000/cn/blog`
- [ ] Verify UI is translated
- [ ] Visit `http://localhost:4000/es/blog`
- [ ] Verify UI is translated

---

## ☐ Phase 5: Production Deployment (10 minutes)

### Commit Changes
- [ ] **VERIFY `.env.local` is in `.gitignore`**
- [ ] Git status check
- [ ] Commit all new files
- [ ] Push to repository

### Set Environment Variables on Vercel/Hosting
- [ ] Log into hosting dashboard (Vercel/etc)
- [ ] Go to project settings
- [ ] Add environment variables:
  - [ ] `NOTION_TOKEN` = your token
  - [ ] `NOTION_BLOG_DATABASE_ID` = your database ID
- [ ] Apply to all environments (production, preview)
- [ ] Save

### Deploy
- [ ] Trigger deployment (automatic or manual)
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors

### Test Production
- [ ] Visit `https://primeshot.ai/en/blog`
- [ ] Verify posts load
- [ ] Test on mobile
- [ ] Test filters
- [ ] Test individual posts
- [ ] Check different languages

### Verify SEO
- [ ] Check `https://primeshot.ai/en/blog/sitemap.xml`
- [ ] Verify all posts listed
- [ ] View page source - check meta tags
- [ ] Test Open Graph (share on social media)

---

## ☐ Phase 6: SEObot Setup (Optional - 20 minutes)

### Sign Up
- [ ] Go to https://seobotai.com
- [ ] Choose plan ($49/mo minimum)
- [ ] Complete signup and payment

### Connect Notion
- [ ] In SEObot dashboard: Settings → Integrations
- [ ] Select "Notion"
- [ ] Connect Notion account
- [ ] Grant permissions
- [ ] Select "Blog Posts" database

### Configure Publishing
- [ ] Map fields:
  - [ ] Title → Title
  - [ ] Slug → Slug
  - [ ] Content → Page content
  - [ ] Status → "draft" (recommended for review)
  - [ ] Content Type → "ai"
  - [ ] Tags → Auto or custom
- [ ] Set publishing frequency
- [ ] Configure content topics/keywords
- [ ] Save settings

### Test AI Generation
- [ ] Trigger first post generation
- [ ] Check Notion database
- [ ] Verify post created with status="draft"
- [ ] Review content
- [ ] Edit if needed
- [ ] Change status to "published"
- [ ] Wait 60 seconds
- [ ] Check website - post should appear!

---

## ☐ Phase 7: Content Strategy (Ongoing)

### Define Topics
- [ ] List 10-20 core topics for your blog
- [ ] Identify keywords to target
- [ ] Plan mix of manual vs AI content

### Create Content Calendar
- [ ] Plan 2-4 posts per week
- [ ] Schedule major announcements (manual)
- [ ] Set SEObot to fill gaps (AI)

### Setup Analytics
- [ ] Add Google Analytics events for blog
- [ ] Track:
  - [ ] Page views per post
  - [ ] Time on page
  - [ ] Scroll depth
  - [ ] Click-through to signup/pricing

### Promote Posts
- [ ] Share on social media
- [ ] Add to email newsletter
- [ ] Link from homepage
- [ ] Cross-link between posts

---

## ✅ Success Criteria

You'll know it's working when:
- ✅ Blog loads at /[locale]/blog on all languages
- ✅ Posts created in Notion appear within 60 seconds
- ✅ Filters work correctly
- ✅ Images load properly
- ✅ Mobile responsive
- ✅ SEO metadata present
- ✅ No console errors
- ✅ Content looks great

---

## 🚨 Troubleshooting

If something doesn't work:

1. **Check Environment Variables**
   - Are they set correctly?
   - Did you restart the dev server?
   - Are they set in production?

2. **Check Notion**
   - Is database shared with integration?
   - Is Status = "published"?
   - Is Published At not in future?

3. **Check Console**
   - Any error messages?
   - Network tab shows 200 responses?

4. **Try ISR**
   - Wait 60 seconds
   - Hard refresh (Cmd+Shift+R)
   - Clear cache

5. **Read Docs**
   - `docs/blog-quick-start.md`
   - `docs/notion-blog-integration.md`
   - `BLOG_INTEGRATION_SUMMARY.md`

---

## 📞 Getting Help

- **Notion API Issues:** developers.notion.com
- **SEObot Issues:** seobotai.com/support
- **Next.js ISR:** nextjs.org/docs
- **Code Issues:** Check component files

---

**Estimated Total Time: 60-90 minutes**

Good luck! 🚀

