// Hardcoded data for features not in database
const HARDCODED_FEATURES = {
    aspect_ratios: {
        basic: { portrait: false, square: true, landscape: false },
        standard: { portrait: true, square: true, landscape: true },
        pro: { portrait: true, square: true, landscape: true }
    },
    support_features: {
        basic: { email: true, chat: false, dedicated: false },
        standard: { email: true, chat: true, dedicated: false },
        pro: { email: true, chat: true, dedicated: true }
    },
    feature_flags: {
        basic: { commercial_use: true, priority_features: false, beta_access: false },
        standard: { commercial_use: true, priority_features: true, beta_access: false },
        pro: { commercial_use: true, priority_features: true, beta_access: true }
    }
};
/**
 * Transforms database subscriptions into pricing table format
 * Uses DB data where available and hardcoded data for missing fields
 */
export function transformPricingData(subscriptions) {
    // Sort subscriptions by price to ensure consistent ordering
    const sortedSubs = [...subscriptions].sort((a, b) => a.monthly_price - b.monthly_price);
    // Find each tier
    const basic = sortedSubs.find(s => s.name === 'basic');
    const standard = sortedSubs.find(s => s.name === 'standard');
    const pro = sortedSubs.find(s => s.name === 'pro');
    if (!basic || !standard || !pro) {
        console.warn('Missing subscription tiers', { basic: !!basic, standard: !!standard, pro: !!pro });
        return [];
    }
    // Helper to format price per credit
    const pricePerCredit = (price, credits, characterTrainingIncluded) => {
        // Adjust credits to account for character training included (30 credits per character)
        const adjustedCredits = credits - (characterTrainingIncluded * 30);
        return `$${(price / adjustedCredits).toFixed(2)}`;
    };
    // Helper for checkmark
    const check = (value) => value ? '✓' : '';
    // Helper for resolution display
    const formatResolution = (quality) => {
        return quality === '1K' ? '1K' : `Upto ${quality}`;
    };
    return [
        {
            category: "comparisonTable.categories.credits",
            features: [
                {
                    name: "comparisonTable.features.creditsPerMonth",
                    basic: "0",
                    standard: String(standard.credits),
                    pro: String(pro.credits)
                },
                {
                    name: "comparisonTable.features.pricePerCredit",
                    basic: pricePerCredit(basic.monthly_price, basic.credits, basic.character_training_included),
                    standard: pricePerCredit(standard.monthly_price, standard.credits, standard.character_training_included),
                    pro: pricePerCredit(pro.monthly_price, pro.credits, pro.character_training_included)
                }
            ]
        },
        {
            category: "comparisonTable.categories.image",
            features: [
                {
                    name: "comparisonTable.features.resolution",
                    basic: formatResolution(basic.max_quality),
                    standard: formatResolution(standard.max_quality),
                    pro: formatResolution(pro.max_quality)
                },
                {
                    name: "comparisonTable.features.portraitAspectRatio",
                    basic: check(HARDCODED_FEATURES.aspect_ratios.basic.portrait),
                    standard: check(HARDCODED_FEATURES.aspect_ratios.standard.portrait),
                    pro: check(HARDCODED_FEATURES.aspect_ratios.pro.portrait)
                },
                {
                    name: "comparisonTable.features.squareAspectRatio",
                    basic: check(HARDCODED_FEATURES.aspect_ratios.basic.square),
                    standard: check(HARDCODED_FEATURES.aspect_ratios.standard.square),
                    pro: check(HARDCODED_FEATURES.aspect_ratios.pro.square)
                },
                {
                    name: "comparisonTable.features.landscapeAspectRatio",
                    basic: check(HARDCODED_FEATURES.aspect_ratios.basic.landscape),
                    standard: check(HARDCODED_FEATURES.aspect_ratios.standard.landscape),
                    pro: check(HARDCODED_FEATURES.aspect_ratios.pro.landscape)
                }
            ]
        },
        {
            category: "comparisonTable.categories.characters",
            features: [
                {
                    name: "comparisonTable.features.included",
                    basic: String(basic.character_training_included),
                    standard: String(standard.character_training_included),
                    pro: String(pro.character_training_included)
                },
                {
                    name: "comparisonTable.features.storage",
                    basic: String(basic.max_characters),
                    standard: `Upto ${standard.max_characters}`,
                    pro: `Upto ${pro.max_characters}`
                }
            ]
        },
        {
            category: "comparisonTable.categories.generation",
            features: [
                {
                    name: "comparisonTable.features.concurrentShoots",
                    basic: String(basic.concurrent_jobs),
                    standard: String(standard.concurrent_jobs),
                    pro: String(pro.concurrent_jobs)
                },
                {
                    name: "comparisonTable.features.commercialUse",
                    basic: check(HARDCODED_FEATURES.feature_flags.basic.commercial_use),
                    standard: check(HARDCODED_FEATURES.feature_flags.standard.commercial_use),
                    pro: check(HARDCODED_FEATURES.feature_flags.pro.commercial_use)
                },
                {
                    name: "comparisonTable.features.priorityFeatures",
                    basic: check(HARDCODED_FEATURES.feature_flags.basic.priority_features),
                    standard: check(HARDCODED_FEATURES.feature_flags.standard.priority_features),
                    pro: check(HARDCODED_FEATURES.feature_flags.pro.priority_features)
                },
                {
                    name: "comparisonTable.features.betaAccess",
                    basic: check(HARDCODED_FEATURES.feature_flags.basic.beta_access),
                    standard: check(HARDCODED_FEATURES.feature_flags.standard.beta_access),
                    pro: check(HARDCODED_FEATURES.feature_flags.pro.beta_access)
                }
            ]
        },
        {
            category: "comparisonTable.categories.support",
            features: [
                {
                    name: "comparisonTable.features.emailSupport",
                    basic: check(HARDCODED_FEATURES.support_features.basic.email),
                    standard: check(HARDCODED_FEATURES.support_features.standard.email),
                    pro: check(HARDCODED_FEATURES.support_features.pro.email)
                },
                {
                    name: "comparisonTable.features.chatSupport",
                    basic: check(HARDCODED_FEATURES.support_features.basic.chat),
                    standard: check(HARDCODED_FEATURES.support_features.standard.chat),
                    pro: check(HARDCODED_FEATURES.support_features.pro.chat)
                },
                {
                    name: "comparisonTable.features.dedicatedSupport",
                    basic: check(HARDCODED_FEATURES.support_features.basic.dedicated),
                    standard: check(HARDCODED_FEATURES.support_features.standard.dedicated),
                    pro: check(HARDCODED_FEATURES.support_features.pro.dedicated)
                }
            ]
        }
    ];
}
