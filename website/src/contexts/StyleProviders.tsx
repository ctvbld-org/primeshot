'use client'

import { ReactNode, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StyleDataProvider as CommonStyleDataProvider, StyleSelectionProvider } from '@primeshot/common'
import { createClient } from '@/lib/supabase/client'

export function StyleProviders({ children }: { children: ReactNode }) {
  const supabaseClient = useMemo(() => createClient(), [])
  
  // Create QueryClient instance for React Query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes - shorter to prevent stale cache issues across deploys
        gcTime: 1000 * 60 * 30, // 30 minutes - enough for session, not too long for deploys
      },
    },
  }))
  
  return (
    <QueryClientProvider client={queryClient}>
      <CommonStyleDataProvider supabaseClient={supabaseClient}>
        <StyleSelectionProvider>
          {children}
        </StyleSelectionProvider>
      </CommonStyleDataProvider>
    </QueryClientProvider>
  )
}

