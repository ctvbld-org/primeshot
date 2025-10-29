'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { Icon } from './Icon';
import styles from './PricingCards.module.css';
export function PricingCards({ billingCycle, tiers, currentPlan, showOnlyUpgrades = false, inferenceSettings, loading = false, renderButton, onSelectPlan, className }) {
    const { t } = useTranslation('pricing');
    const tp = (k, o) => String(t(k, o));
    const getCyclePrice = (tier, cycle) => cycle === 'yearly' ? tier.yearly_price : tier.monthly_price;
    const getPerCredit = (tier, cycle) => {
        const credits = tier.credits || 0;
        if (!credits)
            return null;
        const price = getCyclePrice(tier, cycle);
        return Math.round((price / credits) * 100) / 100;
    };
    const getDiscountPct = (tier, cycle) => {
        const price = getCyclePrice(tier, cycle);
        const base = tier.original_price || 0;
        if (!base || base <= price)
            return 0;
        return Math.floor(((base - price) / base) * 100);
    };
    const toQualityLabel = (code) => { var _a; return (((_a = inferenceSettings === null || inferenceSettings === void 0 ? void 0 : inferenceSettings.quality_labels) === null || _a === void 0 ? void 0 : _a[code]) || code); };
    const handleCardClick = (tier) => {
        if (onSelectPlan && !tier.disabled && tier.name !== currentPlan && !loading) {
            onSelectPlan(tier);
        }
    };
    return (_jsx("div", { className: `${styles.grid} ${className || ''}`, children: tiers.map((tier) => {
            const price = billingCycle === 'yearly' ? tier.yearly_price : tier.monthly_price;
            const isRecommended = tier.popular && !showOnlyUpgrades;
            const name = tier.name;
            const isCurrentPlan = !!currentPlan && name === currentPlan;
            const isDisabled = tier.disabled === true;
            return (_jsxs("div", { className: `${styles.card} ${name} ${isRecommended ? styles.cardHighlight : ''}`, children: [isRecommended && (_jsxs("div", { className: styles.recommendedBadge, children: [_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { d: "M8.64134 1.18305C9.42017 0.504882 10.5798 0.504883 11.3587 1.18305L12.9651 2.58189C13.2452 2.82574 13.5857 2.98973 13.951 3.05665L16.0463 3.44048C17.0621 3.62656 17.7851 4.53322 17.7405 5.56497L17.6484 7.69311C17.6324 8.06411 17.7165 8.4326 17.8919 8.75989L18.8982 10.6374C19.3861 11.5476 19.128 12.6782 18.2936 13.2866L16.5723 14.5415C16.2723 14.7602 16.0366 15.0557 15.8901 15.397L15.0496 17.3543C14.6422 18.3032 13.5974 18.8064 12.6014 18.5333L10.5471 17.97C10.189 17.8718 9.81102 17.8718 9.45289 17.97L7.39858 18.5333C6.40263 18.8064 5.35782 18.3032 4.95036 17.3543L4.10991 15.397C3.96339 15.0557 3.72774 14.7602 3.42768 14.5415L1.70644 13.2866C0.871968 12.6782 0.613922 11.5476 1.10178 10.6374L2.10807 8.75989C2.28349 8.4326 2.3676 8.06412 2.35155 7.69311L2.25952 5.56497C2.2149 4.53322 2.93793 3.62656 3.95374 3.44048L6.04902 3.05665C6.41428 2.98973 6.75481 2.82574 7.03487 2.58188L8.64134 1.18305Z", fill: "#FF491C" }), _jsx("path", { d: "M14.1391 6.89648L8.44949 12.5861L5.86328 9.99993", stroke: "white", strokeWidth: "1.37931", strokeLinecap: "round", strokeLinejoin: "round" })] }), tp('subscription.card.recommended')] })), _jsxs("div", { className: styles.cardHead, children: [_jsx("div", { className: styles.iconWrap, children: tier.image_url && (_jsx("img", { src: tier.image_url, alt: tier.display_name, width: 32, height: 32, style: { width: 40, height: 40, objectFit: 'contain' } })) }), getDiscountPct(tier, billingCycle) > 0 && (_jsx("span", { className: styles.discount, children: tp('subscription.card.save', { pct: getDiscountPct(tier, billingCycle) }) }))] }), _jsx("div", { className: styles.cardTitle, children: tier.display_name }), _jsxs("div", { className: styles.priceBlock, children: [_jsxs("div", { className: styles.priceWrap, children: [tier.original_price && tier.original_price > price && (_jsxs("div", { className: styles.originalPrice + ' ' + styles.price, children: ["$", tier.original_price.toFixed(0)] })), _jsxs("div", { className: styles.mainPrice, children: [_jsxs("span", { className: styles.price, children: ["$", price.toFixed(0)] }), _jsx("span", { className: styles.per, children: tp('subscription.card.perMonth') })] })] }), _jsx("div", { className: styles.priceSub, children: tp('subscription.card.billed', { cycle: billingCycle }) })] }), _jsx("div", { className: styles.divider }), _jsxs("div", { className: styles.includedBlock, children: [_jsxs("div", { className: styles.creditsLine, children: [_jsxs("span", { className: styles.creditsCount, children: [tp('subscription.card.creditsCount', { count: tier.credits.toLocaleString() }), ' ', _jsx("span", { className: styles.per, children: tp('subscription.card.perMonthWord') })] }), getPerCredit(tier, billingCycle) !== null && (_jsx("span", { className: styles.perCredit, children: tp('subscription.card.perCredit', { price: `$${getPerCredit(tier, billingCycle).toFixed(2)}` }) }))] }), _jsx("ul", { className: styles.features, children: [
                                    { label: tp('subscription.card.features.quality', { quality: toQualityLabel(String(tier.max_quality)) }) },
                                    { label: tp('subscription.card.features.characterIncluded', { count: tier.character_training_included }) },
                                    { label: tp('subscription.card.features.maxCharacters', { count: tier.max_characters }) },
                                    { label: tp('subscription.card.features.concurrentShoots', { count: tier.concurrent_jobs }) },
                                    { label: tp('subscription.card.features.commercialUse') }
                                ].map((feature, idx) => (_jsxs("li", { className: styles.featureItem, children: [_jsx(Icon, { variant: 'checkmark', size: 16 }), feature.label] }, idx))) })] }), renderButton ? (renderButton(tier, isCurrentPlan, isDisabled)) : (isDisabled ? (_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { className: styles.selectBtn + ' ' + styles.disabled, variant: "primary", size: "sm", onClick: () => handleCardClick(tier), disabled: true, children: tp('subscription.card.button.select') }) }), _jsx(TooltipContent, { side: "top", children: tp('subscription.card.button.disabledTooltip') })] }) })) : (_jsx(Button, { className: styles.selectBtn, variant: "primary", size: "sm", onClick: () => handleCardClick(tier), disabled: isCurrentPlan || loading, children: isCurrentPlan
                            ? tp('subscription.card.button.current')
                            : (loading ? tp('subscription.card.button.processing') : tp('subscription.card.button.select')) })))] }, tier.id));
        }) }));
}
