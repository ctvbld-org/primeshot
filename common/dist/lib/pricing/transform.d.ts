import { SubscriptionTier, PricingCategory } from './types';
/**
 * Transforms database subscriptions into pricing table format
 * Uses DB data where available and hardcoded data for missing fields
 */
export declare function transformPricingData(subscriptions: SubscriptionTier[]): PricingCategory[];
