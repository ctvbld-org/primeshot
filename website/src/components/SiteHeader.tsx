'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@primeshot/common'

export function SiteHeader() {
  const pathname = usePathname()

  // Hide header on home page (/)
  if (pathname === '/') return null
  return <Header />
} 