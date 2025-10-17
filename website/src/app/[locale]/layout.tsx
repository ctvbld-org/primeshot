import Script from 'next/script'

import type { Metadata } from "next";
import { headers } from "next/headers";
import { AuthProvider, LanguageProvider, I18nProvider } from '@primeshot/common'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { getWebsiteCdnUrl } from '@/lib/utils/cdn'

const SUPPORTED_LOCALES = ['en','cn','es','fr','pt','de','jp','it','nl'] as const;

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host") || "primeshot.ai";
  const protocol = process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === "local" ? "http" : "https";
  return `${protocol}://${host}`;
}

async function getLocaleFromUrl(): Promise<string> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (SUPPORTED_LOCALES.includes(firstSegment as typeof SUPPORTED_LOCALES[number])) {
    return firstSegment;
  }
  
  return 'en'; // Default fallback
}

async function getCurrentPathname(): Promise<string> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const segments = pathname.split('/').filter(Boolean);
  
  // Remove locale from pathname if present
  if (SUPPORTED_LOCALES.includes(segments[0] as typeof SUPPORTED_LOCALES[number])) {
    segments.shift();
  }
  
  return '/' + segments.join('/');
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const baseUrl = await getBaseUrl();
  const currentPathname = await getCurrentPathname();
  
  // Get locale from params with URL fallback
  let locale: string;
  try {
    const resolvedParams = await params;
    locale = resolvedParams.locale;
  } catch {
    // Fallback to URL-based detection if params fail
    locale = await getLocaleFromUrl();
  }
  
  // Ensure locale is valid, fallback to en if not
  const finalLocale = SUPPORTED_LOCALES.includes(locale as typeof SUPPORTED_LOCALES[number]) ? locale : 'en';
  
  // Map locale to OpenGraph locale format
  const ogLocale = finalLocale.replace('-', '_'); // fr-FR -> fr_FR
  
  // Generate hreflang alternate URLs
  const alternateLanguages = Object.fromEntries(
    SUPPORTED_LOCALES.map(lang => [
      lang === 'en' ? 'x-default' : lang,
      `${baseUrl}/${lang}${currentPathname}`
    ])
  );
  
  // Add specific language entries (without x-default)
  SUPPORTED_LOCALES.forEach(lang => {
    alternateLanguages[lang] = `${baseUrl}/${lang}${currentPathname}`;
  });
  
  const canonicalUrl = `${baseUrl}/${finalLocale}${currentPathname}`;
  
  return {
    title: "AI Headshots That Open Doors | Primeshot",
    description: "Make your first impression count. Primeshot turns everyday selfies into stunning, studio-quality AI headshots—crafted to reflect your style, ambition, and story.",
    keywords: ["AI headshots", "professional portraits", "AI photography", "headshot generator", "professional image", "AI portraits", "business headshots"],
    authors: [{ name: "Primeshot" }],
    creator: "Primeshot",
    publisher: "Primeshot",
    applicationName: "Primeshot",
    appleWebApp: {
      capable: true,
      title: "Primeshot",
      statusBarStyle: "black-translucent",
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    themeColor: "#0c1013",
    viewport: {
      width: "device-width",
      initialScale: 1.0,
      maximumScale: 1.0,
      userScalable: false,
      viewportFit: "cover",
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    icons: {
      icon: [
        { url: getWebsiteCdnUrl('favicon.ico') },
        { url: getWebsiteCdnUrl('favicon.svg'), type: 'image/svg+xml' },
        { url: getWebsiteCdnUrl('favicon-96x96.png'), sizes: '96x96', type: 'image/png' }
      ],
      apple: [
        { url: getWebsiteCdnUrl('apple-touch-icon.png'), sizes: '180x180', type: 'image/png' }
      ]
    },
    manifest: getWebsiteCdnUrl('site.webmanifest'),
    openGraph: {
      type: "website",
      locale: ogLocale, // Dynamic locale based on URL
      url: canonicalUrl,
      title: "AI Headshots That Open Doors | Primeshot",
      description: "Make your first impression count. Primeshot turns everyday selfies into stunning, studio-quality AI headshots—crafted to reflect your style, ambition, and story.",
      siteName: "Primeshot",
      images: [
        {
          url: getWebsiteCdnUrl('og-image.webp'),
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
      images: [getWebsiteCdnUrl('og-image.webp')],
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
    other: {
      "locale": finalLocale,
    },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  // Get locale from params with URL fallback
  let locale: string;
  try {
    const resolvedParams = await params;
    locale = resolvedParams.locale;
  } catch {
    // Fallback to URL-based detection if params fail
    locale = await getLocaleFromUrl();
  }
  
  // Ensure locale is valid, fallback to en if not
  const finalLocale = SUPPORTED_LOCALES.includes(locale as typeof SUPPORTED_LOCALES[number]) ? locale : 'en';
  
  
  // Create initial locale data as JSON instead of executable script
  const initialData = {
    locale: finalLocale
  }
  return (
    <>
      <script 
        type="application/json" 
        id="initial-data" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(initialData) }} 
      />
      <I18nProvider>
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </I18nProvider>
      <SpeedInsights/>
      <GoogleAnalytics gaId="G-MHV2EKTQZG" />
      <Analytics />
      {/* Rewardful tracking scripts */}
      {process.env.NEXT_PUBLIC_REWARDFUL_API_KEY && (
        <>
          <Script
            src={`https://r.wdfl.co/rw.js`}
            data-rewardful={process.env.NEXT_PUBLIC_REWARDFUL_API_KEY}
            strategy="beforeInteractive"
          />
          <Script
            id="rewardful-queue"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`
            }}
          />
        </>
      )}
    </>
  )
}
