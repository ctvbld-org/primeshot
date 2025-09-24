import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type Environment = 'local' | 'staging' | 'production'

interface EnvironmentConfig {
  url: string
  anonKey: string
  serviceKey: string
}

function getEnvironmentConfig(env: Environment): EnvironmentConfig {
  switch (env) {
    case 'local':
      return {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      }
    case 'staging':
      return {
        url: process.env.STAGING_SUPABASE_URL!,
        anonKey: process.env.STAGING_SUPABASE_ANON_KEY!,
        serviceKey: process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY!,
      }
    case 'production':
      return {
        url: process.env.PRODUCTION_SUPABASE_URL!,
        anonKey: process.env.PRODUCTION_SUPABASE_ANON_KEY!,
        serviceKey: process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY!,
      }
    default:
      throw new Error(`Unknown environment: ${env}`)
  }
}

export function createMultiEnvClient(env: Environment) {
  const config = getEnvironmentConfig(env)
  return createSupabaseClient<Database>(config.url, config.serviceKey)
}

export function getCurrentEnvironment(): Environment {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV
  
  if (vercelEnv === 'staging') return 'staging'
  if (vercelEnv === 'production') return 'production'
  return 'local' // default for development
}

export function getAvailableTargets(): Environment[] {
  const current = getCurrentEnvironment()
  
  switch (current) {
    case 'local':
      return ['staging', 'production']
    case 'staging':
      return ['production']
    case 'production':
      return ['staging']
    default:
      return []
  }
}

export function getEnvironmentLabel(env: Environment): string {
  switch (env) {
    case 'local':
      return 'Local Development'
    case 'staging':
      return 'Staging'
    case 'production':
      return 'Production'
    default:
      return env
  }
} 