import { ReactNode } from 'react';
import type { SubscriptionTier } from '../lib/pricing/types';
export type { SubscriptionTier } from '../lib/pricing/types';
export interface PricingCardsProps {
    billingCycle: 'monthly' | 'yearly';
    tiers: SubscriptionTier[];
    currentPlan?: string | null;
    showOnlyUpgrades?: boolean;
    inferenceSettings?: {
        quality_labels?: Record<string, string>;
    };
    loading?: boolean;
    renderButton?: (tier: SubscriptionTier, isCurrentPlan: boolean, isDisabled: boolean) => ReactNode;
    onSelectPlan?: (tier: SubscriptionTier) => void;
    className?: string;
}
export declare function PricingCards({ billingCycle, tiers, currentPlan, showOnlyUpgrades, inferenceSettings, loading, renderButton, onSelectPlan, className }: PricingCardsProps): import("react/jsx-runtime").JSX.Element;
