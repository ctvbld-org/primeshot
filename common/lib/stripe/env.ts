export type StripeEnv = 'dev' | 'staging' | 'production'

export function getStripeEnv(): StripeEnv {
  const env = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV : undefined
  if (env === 'production') return 'staging'
  if (env === 'staging') return 'staging'
  return 'dev'
}


