import React from 'react'
import { Coins, Package, Wallet } from 'lucide-react'
import { STRIPE_REFERENCE } from '@/lib/constants/stripe-reference'

export type CreditCostsMap = Record<string, number>

export function extractQualityCosts(creditCosts: CreditCostsMap = {}, limit: number = 3) {
  return Object.entries(creditCosts)
    .filter(([k]) => k.startsWith('IMAGE_GENERATION_'))
    .map(([k, v]) => ({ quality: k.replace('IMAGE_GENERATION_', ''), cost: Number(v) }))
    .sort((a, b) => a.cost - b.cost)
    .slice(0, limit)
}

export const getTrainingCost = (creditCosts?: CreditCostsMap) => creditCosts?.['CHARACTER_TRAINING']

export function getStripeEnv(): 'test' | 'production' {
  if (typeof process !== 'undefined' && process.env.VERCEL_TARGET_ENV) {
    return process.env.VERCEL_TARGET_ENV === 'production' ? 'production' : 'test'
  }
  return (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') ? 'production' : 'test'
}

export function getPriceIdForCredits(credits: number): string | null {
  const env = getStripeEnv()
  const map: Record<number, keyof typeof STRIPE_REFERENCE[typeof env]['creditPacks']> = {
    90: 'credits_90',
    180: 'credits_180',
    360: 'credits_360',
  }
  const key = map[credits]
  return key ? STRIPE_REFERENCE[env].creditPacks[key].price : null
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
  if (days >= 365) return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`
  if (days >= 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''}`
  return `${days} day${days > 1 ? 's' : ''}`
}


