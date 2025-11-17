export interface SubscriptionTier {
    id: number;
    name: string;
    display_name: string;
    description: string;
    original_price: number;
    monthly_price: number;
    yearly_price: number;
    credits: number;
    max_quality: string;
    character_training_included: number;
    concurrent_jobs: number;
    max_characters: number;
    features: string[];
    popular: boolean;
    disabled?: boolean;
    image_url?: string;
    created_at: string;
    updated_at: string;
}
export interface CreditPack {
    id: number;
    name: string;
    credits: number;
    price: number;
    validity_days: number;
    image_url?: string;
    created_at: string;
    updated_at: string;
}
export type CreditCosts = Record<string, number>;
export interface PricingData {
    subscriptions: SubscriptionTier[];
    creditPacks: CreditPack[];
    creditCosts: CreditCosts;
}
export interface PricingFeature {
    name: string;
    free: string;
    basic: string;
    standard: string;
    pro: string;
    ultimate: string;
}
export interface PricingCategory {
    category: string;
    features: PricingFeature[];
}
