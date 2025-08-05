/**
 * SINGLE SOURCE OF TRUTH FOR ALL PRICING CONFIGURATION
 *
 * This file contains ALL pricing configuration and supports environment variable overrides.
 * All other files should import from this file - NO DUPLICATION!
 *
 * Environment Variables (with fallbacks to defaults):
 * - CREDIT_COST_1K (default: 1)
 * - CREDIT_COST_2K (default: 2)
 * - CREDIT_COST_4K (default: 3)
 * - CREDIT_COST_FACE_MODEL_TRAINING (default: 30)
 */
export type Resolution = '1K' | '2K' | '4K';
export interface SubscriptionTierConfig {
    id: string;
    name: string;
    displayName: string;
    description: string;
    originalPrice: number;
    monthlyPrice: number;
    yearlyPrice: number;
    credits: number;
    maxResolution: Resolution;
    faceModelTrainingIncluded: number;
    concurrentJobs: number;
    maxFaceModels: number;
    features: string[];
    popular: boolean;
}
export interface CreditPackConfig {
    id: string;
    name: string;
    credits: number;
    price: number;
    validityDays: number;
    costPerCredit: number;
    savings?: string;
}
export interface CreditCosts {
    IMAGE_GENERATION: {
        [K in Resolution]: number;
    };
    FACE_MODEL_TRAINING: number;
}
export declare function fetchSubscriptionTiers(supabaseClient: any): Promise<any>;
export declare function fetchCreditPacks(supabaseClient: any): Promise<any>;
export declare function fetchCreditCosts(supabaseClient: any): Promise<any>;
export declare const SUBSCRIPTION_TIERS_CONFIG: SubscriptionTierConfig[];
export declare const CREDIT_PACKS_CONFIG: CreditPackConfig[];
export declare const CREDIT_COSTS_CONFIG: CreditCosts;
export declare function getLaunchDiscount(tierId: string): {
    originalPrice: number;
    discountedPrice: number;
    savings: number;
} | null;
export declare function getYearlyDiscount(tierId: string): {
    originalPrice: number;
    yearlyPrice: number;
    savings: string;
} | null;
export declare function calculateImageCredits(resolution: Resolution, batchSize?: number): number;
export declare function getFaceModelTrainingCost(): number;
export declare function getFaceModelLimit(planName: string): number;
