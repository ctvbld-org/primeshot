# Primeshot Admin Portal

Admin portal for managing Primeshot platform data and analytics.

## Features

- **Dashboard**: Real-time analytics for users, subscriptions, and usage
  - User growth metrics
  - Subscription distribution charts
  - Usage trends (generations & trainings)
  - Top users leaderboard

- **Styles Management**: CRUD operations for style configuration
  - Styles, wardrobes, scenes, and colors
  - Image upload with WebP conversion
  - Translation support via Anthropic Claude
  - Multi-select for array fields

- **Subscriptions Management**: Manage pricing and plans
  - Subscription tiers
  - Credit packs
  - Credit costs
  - Translation support for all tables

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```

3. Add required environment variables:
- Supabase credentials
- AWS S3 credentials for image uploads
- Anthropic API key for translations

4. Run the development server:
```bash
npm run dev
```

The admin portal will be available at http://localhost:3001

## Authentication

Only users with `admin: true` in the users table can access the admin portal. Non-admin users will be redirected to the main application.

## Technology Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- React Query for data fetching
- Recharts for data visualization
- Tanstack Table for data tables
- Supabase for database
- AWS S3 for image storage