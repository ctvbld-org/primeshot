import './globals.css'

// Root layout only used for API routes and static files
// All pages use [locale]/layout.tsx with proper metadata and locale detection

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Root layout only provides children - no HTML structure
  // The [locale]/layout.tsx handles the complete HTML structure with proper locale detection
  return children;
}
