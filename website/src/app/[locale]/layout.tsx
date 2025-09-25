import { Inter } from 'next/font/google'
import { carb } from '@/fonts'
import '../globals.css'

import type { Metadata } from "next";
import { headers } from "next/headers";
import { AuthProvider, LanguageProvider, I18nProvider } from '@primeshot/common'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const SUPPORTED_LOCALES = ['en','cn','es','fr','pt','de','jp','it','nl'] as const;

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

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
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
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
      locale: ogLocale, // Dynamic locale based on URL
      url: canonicalUrl,
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
  
  
  // Create a robust seedScript that ensures locale consistency
  const seedScript = `(function() {
    try {
      var locale = ${JSON.stringify(finalLocale)};
      // Set the locale in localStorage before any i18n initialization
      localStorage.setItem('i18nextLng', locale);
      // Also set it as a global variable for immediate access
      window.__INITIAL_LOCALE__ = locale;
      // Set document language to match
      document.documentElement.lang = locale;
    } catch (e) {
      // Silently handle errors
    }
  })();`
  return (
    <html lang={finalLocale} className={`${carb.variable} bg-[#0c1013]`}>
      <head>
        <meta name="theme-color" content="#0c1013" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="apple-mobile-web-app-title" content="Primeshot" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: seedScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#0c1013] min-h-screen`}>
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
      </body>
    </html>
  )
}
