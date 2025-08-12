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
let cachedInferenceSettings: Record<string, any> | null = null;
let cachedLastUpdated: string | null = null;
let lastCreditCostsFetchTime = 0;
let lastSubscriptionsFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // legacy TTL fallback if version detection fails

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
 * Fetch inference settings as a combined object
 */
export async function getInferenceSettings(supabase: any): Promise<{
  qualities: string[];
  quality_labels: Record<string, string>;
  nb_takes_options: number[];
  aspect_ratios: string[];
  defaults: { quality: string; nb_takes: number; aspect_ratio: string };
}> {
  // If cached and version unchanged, return cached
  const version = await getPricingLastUpdated(supabase);
  if (cachedInferenceSettings && cachedLastUpdated === version) {
    return cachedInferenceSettings as any;
  }

  const { data, error } = await supabase
    .from('inference_settings')
    .select('key, value');

  if (error) {
    console.error('Error fetching inference settings:', error);
    // Provide safe defaults if DB temporarily unavailable
    return {
      qualities: ['1K','2K','4K'],
      quality_labels: { '1K': 'Basic', '2K': 'Standard', '4K': 'High' },
      nb_takes_options: [5,15,20],
      aspect_ratios: ['4:5','16:9','1:1','3:4'],
      defaults: { quality: '1K', nb_takes: 5, aspect_ratio: '4:5' }
    };
  }

  const map = Object.create(null);
  for (const row of (data || [])) map[row.key] = row.value;
  const settings = {
    qualities: map['qualities'] || ['1K','2K','4K'],
    quality_labels: map['quality_labels'] || { '1K': 'Basic', '2K': 'Standard', '4K': 'High' },
    nb_takes_options: map['nb_takes_options'] || [5,15,20],
    aspect_ratios: map['aspect_ratios'] || ['4:5','16:9','1:1','3:4'],
    defaults: map['defaults'] || { quality: '1K', nb_takes: 5, aspect_ratio: '4:5' },
  } as const;

  cachedInferenceSettings = settings as any;
  cachedLastUpdated = version;
  return settings as any;
}

/**
 * Compute a single last_updated across pricing-related tables.
 * When this value changes, caches are invalidated.
 */
export async function getPricingLastUpdated(supabase: any): Promise<string> {
  const { data, error } = await supabase.rpc('get_pricing_last_updated');
  if (error || !data) {
    // Fallback: use time-based TTL behavior
    const now = Date.now();
    if (!lastSubscriptionsFetchTime || (now - lastSubscriptionsFetchTime) > CACHE_TTL) {
      lastSubscriptionsFetchTime = now;
    }
    return String(lastSubscriptionsFetchTime);
  }
  return data as string;
}

/**
 * Get subscription limits from database
 */
export async function getSubscriptionLimits(supabase: any, planName: string): Promise<{
  character_training_included: number;
  concurrent_jobs: number; // inference concurrency
  concurrent_trainings: number; // training concurrency
  max_characters: number;
  max_quality: string;
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
      max_quality: subscription.max_quality
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
export async function calculateImageCreditCost(supabase: any, quality: Quality = '1K', nbTakes: number = 1): Promise<number> {
  const cost = await getImageGenerationCost(supabase, quality);
  return cost * nbTakes;
}

/**
 * Calculate total credit cost for any operation
 */
export async function calculateCreditCost(
  supabase: any,
  operationType: 'image_generation' | 'character_training',
  options?: { quality?: Quality; nbTakes?: number }
): Promise<number> {
  switch (operationType) {
    case 'image_generation':
      return await calculateImageCreditCost(supabase, options?.quality || '1K', options?.nbTakes || 1);
    case 'character_training':
      return await getCharacterTrainingCost(supabase);
    default:
      throw new Error(`Unknown operation type: ${operationType}`);
  }
}
