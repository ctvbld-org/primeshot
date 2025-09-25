import { Inter } from 'next/font/google'
import { carb } from '@/fonts'
import './globals.css'

import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

// Root layout only used for API routes and static files
// All pages use [locale]/layout.tsx with proper metadata and locale detection

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Root layout only provides children - no HTML structure
  // The [locale]/layout.tsx handles the complete HTML structure with proper locale detection
  return children;
}
