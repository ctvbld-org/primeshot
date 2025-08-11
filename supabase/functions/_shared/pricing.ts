/**
 * SUPABASE EDGE FUNCTIONS PRICING CONFIGURATION
 * 
 * Database-backed pricing system for Supabase Edge Functions.
 * Credit costs, subscription tiers, and credit packs are fetched from the database.
 * 
 * This file provides a cached interface to the pricing tables:
 * - credit_costs: Cost per operation (image generation, character training)
 * - subscriptions: Subscription tier details
 * - credit_packs: Credit pack configurations
 */

export type Quality = '1K' | '2K' | '4K';

let cachedCreditCosts: Record<string, number> | null = null;
let cachedSubscriptions: any[] | null = null;
let lastCreditCostsFetchTime = 0;
let lastSubscriptionsFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCreditCosts(supabase: any): Promise<Record<string, number>> {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (cachedCreditCosts && (now - lastCreditCostsFetchTime) < CACHE_TTL) {
    return cachedCreditCosts;
  }

  try {
    const { data: creditCosts, error } = await supabase
      .from('credit_costs')
      .select('type, value');

    if (error) {
      console.error('Error fetching credit costs from DB:', error);
      // Fallback to defaults if DB fetch fails
      return {
        'IMAGE_GENERATION_1K': 1,
        'IMAGE_GENERATION_2K': 2,
        'IMAGE_GENERATION_4K': 3,
        'CHARACTER_TRAINING': 30
      };
    }

    // Transform to key-value format
    const costsMap = creditCosts.reduce((acc: Record<string, number>, cost: any) => {
      acc[cost.type] = cost.value;
      return acc;
    }, {} as Record<string, number>);

    // Cache the results
    cachedCreditCosts = costsMap;
    lastCreditCostsFetchTime = now;

    return costsMap;
  } catch (error) {
    console.error('Failed to fetch credit costs:', error);
    // Fallback to defaults
    return {
      'IMAGE_GENERATION_1K': 1,
      'IMAGE_GENERATION_2K': 2,
      'IMAGE_GENERATION_4K': 3,
      'CHARACTER_TRAINING': 30
    };
  }
}

async function getSubscriptions(supabase: any): Promise<any[]> {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (cachedSubscriptions && (now - lastSubscriptionsFetchTime) < CACHE_TTL) {
    return cachedSubscriptions.slice();
  }

  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*');

    if (error) {
      console.error('Error fetching subscriptions from DB:', error);
      return [];
    }

    // Cache the results
    cachedSubscriptions = subscriptions || [];
    lastSubscriptionsFetchTime = now;

    return cachedSubscriptions || [];
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return [];
  }
}

/**
 * Get subscription limits from database
 */
export async function getSubscriptionLimits(supabase: any, planName: string): Promise<{
  character_training_included: number;
  concurrent_jobs: number; // inference concurrency
  concurrent_trainings: number; // training concurrency
  max_characters: number;
  max_resolution: string;
} | null> {
  try {
    const subscriptions = await getSubscriptions(supabase);
    const subscription = subscriptions.find(sub => sub.name === planName);

    if (!subscription) {
      console.error(`Subscription plan not found: ${planName}`);
      return null;
    }

    return {
      character_training_included: subscription.character_training_included,
      concurrent_jobs: subscription.concurrent_jobs,
      concurrent_trainings: subscription.concurrent_trainings ?? 2,
      max_characters: subscription.max_characters,
      max_resolution: subscription.max_resolution
    };
  } catch (error) {
    console.error('Failed to fetch subscription limits:', error);
    return null;
  }
}

/**
 * Get credit cost for Character training
 */
export async function getCharacterTrainingCost(supabase: any): Promise<number> {
  const costs = await getCreditCosts(supabase);
  return costs['CHARACTER_TRAINING'] || 30; // Fallback for compatibility
}

/**
 * Get credit cost for image generation
 */
export async function getImageGenerationCost(supabase: any, quality: Quality): Promise<number> {
  const costs = await getCreditCosts(supabase);
  return costs[`IMAGE_GENERATION_${quality}`] || 1;
}

/**
 * Calculate credit cost for image generation
 */
export async function calculateImageCreditCost(supabase: any, quality: Quality = '1K', batchSize: number = 1): Promise<number> {
  const cost = await getImageGenerationCost(supabase, quality);
  return cost * batchSize;
}

/**
 * Calculate total credit cost for any operation
 */
export async function calculateCreditCost(
  supabase: any,
  operationType: 'image_generation' | 'character_training',
  options?: { quality?: Quality; batchSize?: number }
): Promise<number> {
  switch (operationType) {
    case 'image_generation':
      return await calculateImageCreditCost(supabase, options?.quality || '1K', options?.batchSize || 1);
    case 'character_training':
      return await getCharacterTrainingCost(supabase);
    default:
      throw new Error(`Unknown operation type: ${operationType}`);
  }
}
