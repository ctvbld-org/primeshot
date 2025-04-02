# Primeshot Frontend

Primeshot is an AI-powered headshot generator that transforms regular photos into professional headshots. This is the frontend application built with Next.js 14, using the App Router architecture.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: 
  - [Tailwind CSS](https://tailwindcss.com) for utility-first CSS
  - [Stylus](https://stylus-lang.com) for component-specific styles
  - [Shadcn UI](https://ui.shadcn.com) & [Radix UI](https://www.radix-ui.com) for component foundations
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs)
- **Authentication & Database**: [Supabase](https://supabase.com)
- **Image Storage**: [Amazon S3](https://aws.amazon.com/s3)
- **Development Tools**:
  - [ESLint](https://eslint.org) for code linting
  - [Prettier](https://prettier.io) for code formatting

## Prerequisites

Before you begin, ensure you have the following:

- Node.js 18.17 or later
- npm or yarn package manager
- Supabase project with credentials
- Amazon S3 bucket and credentials

## Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Amazon S3
NEXT_PUBLIC_AWS_REGION=your_aws_region
NEXT_PUBLIC_S3_BUCKET=your_s3_bucket_name
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/primeshot.git
cd primeshot/frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable React components
│   ├── lib/                 # Utility functions and configurations
│   ├── store/              # Zustand store definitions
│   ├── styles/             # Global styles and Tailwind config
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
└── supabase/              # Supabase configurations and migrations
```

## Key Features

- **Authentication**: Email magic link and Google OAuth via Supabase
- **User Management**: Profile settings and account management
- **Image Processing**: AI-powered headshot generation
- **Storage**: Secure image storage with Amazon S3
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Development Guidelines

- Follow the TypeScript strict mode guidelines
- Use functional components with hooks
- Implement proper error handling and loading states
- Write clean, self-documenting code with appropriate comments
- Follow the established project structure for new features

## Styling Conventions

- Use Tailwind CSS for layout and basic styling
- Create `.module.styl` files for component-specific styles
- Follow BEM naming convention for custom CSS classes
- Avoid inline styles unless absolutely necessary

## State Management

- Use Zustand for global state management
- Keep state logic simple and close to where it's used
- Implement proper loading and error states
- Use React Query for server state management

## Testing

Run the test suite:
```bash
npm run test
# or
yarn test
```

## Building for Production

Build the application:
```bash
npm run build
# or
yarn build
```

Start the production server:
```bash
npm run start
# or
yarn start
```

## Deployment

The application is configured for deployment on Vercel:

1. Push your changes to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Follow the code review process

## License

[MIT License](LICENSE)

