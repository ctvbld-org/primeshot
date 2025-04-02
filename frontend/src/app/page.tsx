'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/app')
      } else {
        router.replace('/auth/signin')
      }
    }
  }, [isLoading, isAuthenticated, router])

  // Show nothing while redirecting
  return null
}
