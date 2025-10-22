'use client'

// Re-export from common with webapp's Supabase client
import { StyleDataProvider as CommonStyleDataProvider } from '@primeshot/common'
import { createClient } from '@/lib/supabase/client'
import { ReactNode, useMemo } from 'react'

export function StyleDataProvider({ children }: { children: ReactNode }) {
  const supabaseClient = useMemo(() => createClient(), [])
  
  return (
    <CommonStyleDataProvider supabaseClient={supabaseClient}>
      {children}
    </CommonStyleDataProvider>
  )
}

// Re-export hooks and types
export {
  useStyleData,
  useStylesFromContext,
  useScenesFromContext,
  useWardrobesFromContext,
  useColorsFromContext,
} from '@primeshot/common'
