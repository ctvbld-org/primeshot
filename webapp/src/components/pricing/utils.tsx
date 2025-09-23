import React from 'react'
import { Coins, Package, Wallet } from 'lucide-react'
import { STRIPE_REFERENCE } from '@primeshot/common/lib/stripe/stripe-reference'
import { getStripeEnv } from '@primeshot/common/lib/stripe/env'
import i18n from '@/i18n'

export type CreditCostsMap = Record<string, number>

export function extractQualityCosts(creditCosts: CreditCostsMap = {}, limit: number = 3) {
  return Object.entries(creditCosts)
    .filter(([k]) => k.startsWith('IMAGE_GENERATION_'))
    .map(([k, v]) => ({ quality: k.replace('IMAGE_GENERATION_', ''), cost: Number(v) }))
    .sort((a, b) => a.cost - b.cost)
    .slice(0, limit)
}

export const getTrainingCost = (creditCosts?: CreditCostsMap) => creditCosts?.['CHARACTER_TRAINING']

export { getStripeEnv }

export function getPriceIdForCredits(credits: number): string | null {
  const env = getStripeEnv()
  const packs: any = (STRIPE_REFERENCE as any)[env]?.creditPacks ?? {}

  // Fast path: exact key like "credits_276"
  const exactKey = `credits_${credits}`
  if (packs[exactKey]?.price) return packs[exactKey].price as string

  // Fallback: scan keys and match numeric part for robustness
  for (const key of Object.keys(packs)) {
    if (!key.startsWith('credits_')) continue
    const n = Number(key.slice('credits_'.length))
    if (Number.isFinite(n) && n === credits) {
      return packs[key]?.price ?? null
    }
  }
  return null
}

export const getPackIcon = (credits: number, size: 5 | 6 = 5) => {
  const cls = `w-${size} h-${size}`
  if (credits >= 360) return <Wallet className={cls} />
  if (credits >= 180) return <Package className={cls} />
  return <Coins className={cls} />
}

export const getPackColor = (credits: number) =>
  credits >= 360 ? 'text-purple-500' : credits >= 180 ? 'text-blue-500' : 'text-green-500'

export const formatCredits = (n: number) => n.toLocaleString()

export function formatValidity(days: number) {
  if (days >= 365) {
    const years = Math.floor(days / 365)
    return i18n.t('duration.year', { count: years })
  }
  if (days >= 30) {
    const months = Math.floor(days / 30)
    return i18n.t('duration.month', { count: months })
  }
  return i18n.t('duration.day', { count: days })
}


