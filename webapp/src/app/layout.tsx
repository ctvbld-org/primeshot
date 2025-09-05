import { Inter } from 'next/font/google'
import { carb } from '@/fonts'
import './globals.css'

import RootProviders from '@/components/providers/RootProviders'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${carb.variable} ${inter.className} dark`}>
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  )
}
