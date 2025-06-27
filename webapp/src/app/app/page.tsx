'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AppRoot() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/app/shoot')
  }, [router])

  return null
} 