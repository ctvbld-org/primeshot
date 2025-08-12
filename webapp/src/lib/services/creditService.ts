import { createClient } from '@/lib/supabase/server'
import { getApiUrl } from '@/lib/api/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil' as any
})

export interface CreditOperation {
  type: 'image_generation' | 'character_training'
  quality?: '1K' | '2K' | '4K'
  nbTakes?: number
  metadata?: Record<string, any>
}

export interface SubscriptionPlan {
  id: string
  name: string
  amount: number
  interval: string
  planName: string
  creditsIncluded: number
  maxQuality: string
  characterTrainingIncluded: number
  concurrentJobs: number
  maxCharacters: number
}

export interface CreditPack {
  id: string
  name: string
  amount: number
  credits: number
  validityDays: number
}

export class CreditService {
  private async getSupabase() {
    return await createClient()
  }
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static cacheExpiry = 5 * 60 * 1000 // 5 minutes

  private async getCreditCosts(): Promise<{
    IMAGE_GENERATION_1K: number
    IMAGE_GENERATION_2K: number
    IMAGE_GENERATION_4K: number
    CHARACTER_TRAINING: number
  }> {
    const cacheKey = 'credit_costs'
    const cached = CreditService.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CreditService.cacheExpiry) {
      return cached.data
    }

    try {
      const res = await fetch(getApiUrl('api/pricing/credit-costs'))
      if (!res.ok) throw new Error('Failed to fetch credit costs')
      const data = await res.json()
      CreditService.cache.set(cacheKey, { data, timestamp: Date.now() })
      return data
    } catch {
      // Fallback defaults
      return {
        IMAGE_GENERATION_1K: 1,
        IMAGE_GENERATION_2K: 2,
        IMAGE_GENERATION_4K: 3,
        CHARACTER_TRAINING: 30
      }
    }
  }

  /**
   * Get current credit balance for a user
   */
  async getCurrentBalance(userId: string): Promise<number> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .rpc('get_user_available_credits', { user_uuid: userId })

    if (error) {
      console.error('Error getting credit balance:', error)
      throw new Error('Failed to get credit balance')
    }

    return data || 0
  }

  /**
   * Check if user has sufficient credits for operation
   */
  async hasEnoughCredits(userId: string, requiredCredits: number): Promise<boolean> {
    const balance = await this.getCurrentBalance(userId)
    return balance >= requiredCredits
  }

  /**
   * Calculate credit cost based on operation type and parameters
   * Uses centralized CREDIT_COSTS configuration from pricing constants
   */
  async calculateCreditCost(operation: CreditOperation): Promise<number> {
    const costs = await this.getCreditCosts()
    switch (operation.type) {
      case 'image_generation': {
        const quality = operation.quality || '1K'
        const nbTakes = operation.nbTakes || 1
        const key = `IMAGE_GENERATION_${quality}` as keyof typeof costs
        return (costs[key] || 1) * nbTakes
      }
      case 'character_training':
        return costs.CHARACTER_TRAINING
      default:
        throw new Error(`Unknown operation type: ${operation.type}`)
    }
  }

  /**
   * Spend credits for an operation (uses database FIFO function)
   */
  async spendCredits(userId: string, operation: CreditOperation): Promise<void> {
    const creditCost = await this.calculateCreditCost(operation)
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .rpc('spend_user_credits', {
        p_user_id: userId,
        p_amount: creditCost,
        p_usage_type: operation.type,
        p_description: `Credits spent on ${operation.type}`,
        p_metadata: operation.metadata || {}
      })

    if (error || !data) {
      console.error('Error spending credits:', error)
      throw new Error('Failed to spend credits - insufficient balance or system error')
    }
  }

  /**
   * Award credits to user (from subscription or credit pack)
   */
  async awardCredits(
    userId: string,
    amount: number,
    sourceType: 'subscription' | 'credit_pack' | 'admin',
    sourceId: string,
    expiresAt: Date,
    description?: string
  ): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        credits: amount,
        transaction_type: 'earned',
        source_type: sourceType,
        source_id: sourceId,
        expires_at: expiresAt.toISOString(),
        description: description || `Credits awarded from ${sourceType}`,
        metadata: {}
      })

    if (error) {
      console.error('Error awarding credits:', error)
      throw new Error('Failed to award credits')
    }
  }

  /**
   * Get user's current subscription plan details from Stripe
   */
  async getUserPlanDetails(userId: string): Promise<SubscriptionPlan | null> {
    const supabase = await this.getSupabase()
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_price_id, plan_name')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!subscription) return null

    return await this.getPlanByPriceId(subscription.stripe_price_id)
  }

  /**
   * Get all subscription plans from Stripe (with caching)
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const cacheKey = 'subscription_plans'
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const prices = await stripe.prices.list({
        active: true,
        type: 'recurring',
        expand: ['data.product']
      })

      const plans: SubscriptionPlan[] = prices.data.map(price => {
        const product = price.product as Stripe.Product
        return {
          id: price.id,
          name: product.name,
          amount: price.unit_amount || 0,
          interval: price.recurring?.interval || 'month',
          planName: product.metadata.plan_name || '',
          creditsIncluded: parseInt(product.metadata.credits_included || '0'),
          maxQuality: product.metadata.max_quality || '1K',
                characterTrainingIncluded: parseInt(product.metadata.character_training_included || '0'),
      concurrentJobs: parseInt(product.metadata.concurrent_jobs || '1'),
      maxCharacters: parseInt(product.metadata.max_characters || '1')
        }
      })

      this.setCached(cacheKey, plans)
      return plans
    } catch (error) {
      console.error('Error fetching subscription plans from Stripe:', error)
      throw new Error('Failed to fetch subscription plans')
    }
  }

  /**
   * Get all credit packs from Stripe (with caching)
   */
  async getCreditPacks(): Promise<CreditPack[]> {
    const cacheKey = 'credit_packs'
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const prices = await stripe.prices.list({
        active: true,
        type: 'one_time',
        expand: ['data.product']
      })

      const packs: CreditPack[] = prices.data
        .filter(price => {
          const product = price.product as Stripe.Product
          return product.metadata.tier_type === 'credit_pack'
        })
        .map(price => {
          const product = price.product as Stripe.Product
          return {
            id: price.id,
            name: product.name,
            amount: price.unit_amount || 0,
            credits: parseInt(product.metadata.credits || '0'),
            validityDays: parseInt(product.metadata.validity_days || '60')
          }
        })

      this.setCached(cacheKey, packs)
      return packs
    } catch (error) {
      console.error('Error fetching credit packs from Stripe:', error)
      throw new Error('Failed to fetch credit packs')
    }
  }

  /**
   * Get specific plan by Stripe price ID
   */
  async getPlanByPriceId(priceId: string): Promise<SubscriptionPlan | null> {
    const plans = await this.getSubscriptionPlans()
    return plans.find(plan => plan.id === priceId) || null
  }

  /**
   * Get specific credit pack by Stripe price ID
   */
  async getPackByPriceId(priceId: string): Promise<CreditPack | null> {
    const packs = await this.getCreditPacks()
    return packs.find(pack => pack.id === priceId) || null
  }

  /**
   * Check if user can generate images at specified quality
   */
  async canGenerateAtQuality(userId: string, quality: '1K' | '2K' | '4K'): Promise<boolean> {
    const planDetails = await this.getUserPlanDetails(userId)
    if (!planDetails) return false

    const qualityHierarchy = { '1K': 1, '2K': 2, '4K': 3 }
    const userMaxLevel = qualityHierarchy[planDetails.maxQuality as keyof typeof qualityHierarchy]
    const requestedLevel = qualityHierarchy[quality]

    return requestedLevel <= userMaxLevel
  }

  /**
   * Check if user is within concurrent job limits
   */
  async checkConcurrentJobLimit(userId: string): Promise<boolean> {
    const planDetails = await this.getUserPlanDetails(userId)
    if (!planDetails) return false

    // Check current running jobs
    const supabase = await this.getSupabase()
    const { count } = await supabase
      .from('training_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'running')

    return (count || 0) < planDetails.concurrentJobs
  }

  /**
   * Check if user is within Character limits
   */
  async checkCharacterLimit(userId: string): Promise<boolean> {
    const planDetails = await this.getUserPlanDetails(userId)
    if (!planDetails) return false

    // Check current LoRA count
    const supabase = await this.getSupabase()
    const { count } = await supabase
      .from('training_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')

    return (count || 0) < planDetails.maxCharacters
  }

  /**
   * Get credit transaction history for user
   */
  async getCreditHistory(userId: string, limit: number = 50): Promise<any[]> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error getting credit history:', error)
      throw new Error('Failed to get credit history')
    }

    return data || []
  }

  /**
   * Get credit usage analytics for user
   */
  async getCreditUsageStats(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('credit_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('Error getting usage stats:', error)
      throw new Error('Failed to get usage stats')
    }

    return {
      totalCreditsUsed: data?.reduce((sum: number, usage: any) => sum + usage.credits_used, 0) || 0,
      imageGeneration: data?.filter((u: any) => u.usage_type === 'image_generation').length || 0,
      characterTraining: data?.filter((u: any) => u.usage_type === 'character_training').length || 0,
      byQuality: {
        '1K': data?.filter((u: any) => u.quality === '1K').reduce((sum: number, u: any) => sum + u.credits_used, 0) || 0,
        '2K': data?.filter((u: any) => u.quality === '2K').reduce((sum: number, u: any) => sum + u.credits_used, 0) || 0,
        '4K': data?.filter((u: any) => u.quality === '4K').reduce((sum: number, u: any) => sum + u.credits_used, 0) || 0
      }
    }
  }

  // Cache management
  private getCached(key: string) {
    const cached = CreditService.cache.get(key)
    if (cached && Date.now() - cached.timestamp < CreditService.cacheExpiry) {
      return cached.data
    }
    return null
  }

  private setCached(key: string, data: any) {
    CreditService.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Clear Stripe data cache (useful for webhook updates)
   */
  static clearCache() {
    CreditService.cache.clear()
  }
}

// Export singleton instance
export const creditService = new CreditService() 