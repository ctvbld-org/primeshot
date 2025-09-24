import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type Environment = 'local' | 'staging' | 'production'

interface EnvironmentConfig {
  url: string
  anonKey: string
  serviceKey: string
}

function firstNonEmpty(varNames: string[], context: string): string {
  for (const name of varNames) {
    const v = (process.env[name] || '').trim()
    if (v) return v
  }
  throw new Error(`${varNames[0]} is required for ${context}`)
}

function getEnvironmentConfig(env: Environment): EnvironmentConfig {
  switch (env) {
    case 'local':
      return {
        url: firstNonEmpty(['NEXT_PUBLIC_SUPABASE_URL'], 'local'),
        anonKey: firstNonEmpty(['NEXT_PUBLIC_SUPABASE_ANON_KEY'], 'local'),
        serviceKey: firstNonEmpty(['SUPABASE_SERVICE_ROLE_KEY'], 'local'),
      }
    case 'staging':
      return {
        url: firstNonEmpty(['STAGING_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'], 'staging'),
        anonKey: firstNonEmpty(['STAGING_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'], 'staging'),
        serviceKey: firstNonEmpty(['STAGING_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'], 'staging'),
      }
    case 'production':
      return {
        url: firstNonEmpty(['PRODUCTION_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'], 'production'),
        anonKey: firstNonEmpty(['PRODUCTION_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'], 'production'),
        serviceKey: firstNonEmpty(['PRODUCTION_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'], 'production'),
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