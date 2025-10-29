# Technical Context

## Supabase Configuration
- Project ID: uwwmpfyhbakrxmlmkqut
- Project Location: supabase/

## Development Environment
- Next.js 13+ with App Router
- TypeScript
- Shadcn/UI for components
- Supabase for backend services

## CDN & Asset Management
- CloudFront CDN configured via `NEXT_PUBLIC_AWS_DISTRIBUTION` environment variable
- All website public assets served from CloudFront under `/website-images/` path
- Shared app assets served from CloudFront under `/app-images/` path
- CDN utility functions in `website/src/lib/utils/cdn.ts`:
  - `getCdnUrl(path)` - for website-specific assets
  - `getAppCdnUrl(path)` - for shared app assets
- Automatic fallback to local paths when CDN not configured

### CloudFront Structure
```
${NEXT_PUBLIC_AWS_DISTRIBUTION}/
  ├── app-images/          (shared app assets)
  └── website-images/      (all website public folder contents)
      ├── email/
      ├── icons/
      ├── landing-page-*.webp
      ├── favicon.*
      └── ... (all other public assets)
```

## Key Dependencies
- Next.js
- Supabase Client
- Shadcn/UI
- TypeScript

## Technical Constraints
- Must follow Next.js 13+ app directory structure
- Must use TypeScript for type safety
- Must use Supabase for all backend operations
- All static assets must use CDN helper functions for URLs 