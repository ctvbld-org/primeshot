import { Inter } from 'next/font/google'
import { carb } from '@/fonts'
import './globals.css'

import type { Metadata } from "next";
import { headers } from "next/headers";
import { GoogleAnalytics } from '@next/third-parties/google';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { SiteHeader } from '@/components/SiteHeader'
import { AuthProvider } from '@primeshot/common'
import { LanguageProvider } from '@primeshot/common'
import { I18nInitializer } from '@/components/I18nInitializer'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host") || "primeshot.ai";
  const protocol = process.env.VERCEL_TARGET_ENV === "local" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getBaseUrl();
  
  return {
    title: "AI Headshots That Open Doors | Primeshot",
    description: "Make your first impression count. Primeshot turns everyday selfies into stunning, studio-quality AI headshots—crafted to reflect your style, ambition, and story.",
    keywords: ["AI headshots", "professional portraits", "AI photography", "headshot generator", "professional image", "AI portraits", "business headshots"],
    authors: [{ name: "Primeshot" }],
    creator: "Primeshot",
    publisher: "Primeshot",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' }
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
      ]
    },
    manifest: '/site.webmanifest',
    openGraph: {
      type: "website",
      locale: "en_US",
      url: baseUrl,
      title: "AI Headshots That Open Doors | Primeshot",
      description: "Make your first impression count. Primeshot turns everyday selfies into stunning, studio-quality AI headshots—crafted to reflect your style, ambition, and story.",
      siteName: "Primeshot",
      images: [
        {
          url: new URL("/og-image.webp", baseUrl).toString(),
          width: 1200,
          height: 630,
          alt: "Primeshot - AI Headshots",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "AI Headshots That Open Doors | Primeshot",
      description: "Make your first impression count. Primeshot turns everyday selfies into stunning, studio-quality AI headshots—crafted to reflect your style, ambition, and story.",
      creator: "@primeshotai",
      images: [new URL("/og-image.webp", baseUrl).toString()],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "your-google-site-verification", // Add your Google Search Console verification code
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${carb.variable} bg-[#0c1013]`}>
      <head>
        <meta name="theme-color" content="#0c1013" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="canonical" href="https://primeshot.ai" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="apple-mobile-web-app-title" content="Primeshot" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-[#0c1013] min-h-screen`}
      >
        <I18nInitializer>
          <AuthProvider>
            <LanguageProvider>
              <SiteHeader />
              {children}
            </LanguageProvider>
          </AuthProvider>
        </I18nInitializer>
        <SpeedInsights/>
        <GoogleAnalytics gaId="G-MHV2EKTQZG" />
      </body>
    </html>
  );
}
