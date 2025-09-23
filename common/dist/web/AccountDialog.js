"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogBody } from './ui/dialog';
import { useAuth } from '../hooks/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import { Icon } from './Icon';
import styles from './AccountDialog.module.css';
function getApiUrl(path) {
    if (/^https?:\/\//.test(path))
        return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    // Next.js basePath handling for client-side calls
    try {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/create')) {
            return `/create${normalized}`;
        }
    }
    catch { }
    return normalized;
}
export function AccountDialog({ triggerSlot, onBuyCredits, onSubscribe }) {
    var _a, _b, _c, _d, _e;
    const { user, signOut } = useAuth();
    const { t } = useTranslation('account');
    const [activeTab, setActiveTab] = useState('profile');
    const [open, setOpen] = useState(false);
    // Subscription state
    const [subscription, setSubscription] = useState(null);
    const [creditBalance, setCreditBalance] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    useEffect(() => {
        const loadSubscriptionData = async () => {
            if (!user || !open)
                return;
            setIsLoading(true);
            try {
                const [subRes, balRes] = await Promise.all([
                    fetch(getApiUrl('api/subscription/current')),
                    fetch(getApiUrl('api/credits/balance')),
                ]);
                if (subRes.ok) {
                    const sub = await subRes.json();
                    setSubscription(sub);
                }
                if (balRes.ok) {
                    const { balance } = await balRes.json();
                    setCreditBalance(balance);
                }
            }
            catch (error) {
                console.error('Failed to load subscription data:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadSubscriptionData();
    }, [open, user]);
    if (!user)
        return null;
    const [firstName, lastName] = useMemo(() => {
        const full = user.full_name || '';
        if (!full)
            return ['', ''];
        const parts = full.trim().split(/\s+/);
        return [parts[0] || '', parts.slice(1).join(' ')];
    }, [user.full_name]);
    const openPortal = async (flow) => {
        setIsActionLoading(true);
        try {
            const url = flow === 'cancel'
                ? `api/subscription/customer-portal?flow=cancel&subscriptionId=${(subscription === null || subscription === void 0 ? void 0 : subscription.stripe_subscription_id) || ''}`
                : 'api/subscription/customer-portal';
            const res = await fetch(getApiUrl(url), { method: 'POST' });
            if (!res.ok)
                throw new Error('Failed to open customer portal');
            const { url: portalUrl } = await res.json();
            if (flow === 'cancel') {
                window.location.href = portalUrl;
            }
            else {
                window.open(portalUrl, '_blank', 'noopener,noreferrer');
            }
        }
        catch (error) {
            console.error('Portal error:', error);
        }
        finally {
            setIsActionLoading(false);
        }
    };
    const isCanceled = (subscription === null || subscription === void 0 ? void 0 : subscription.status) === 'canceled' || (subscription === null || subscription === void 0 ? void 0 : subscription.cancel_at_period_end) === true;
    const isFullyCanceled = (subscription === null || subscription === void 0 ? void 0 : subscription.status) === 'canceled';
    const periodEndText = (subscription === null || subscription === void 0 ? void 0 : subscription.current_period_end)
        ? new Date(subscription.current_period_end).toLocaleDateString()
        : undefined;
    const sidebarItems = [
        { key: 'profile', label: 'Profile', icon: _jsx(Icon, { variant: "smilyFace", size: 18 }) },
        { key: 'subscription', label: 'Subscription', icon: _jsx(Icon, { variant: "basket", size: 18 }) },
        { key: 'settings', label: 'Settings', icon: _jsx(Icon, { variant: "idea", size: 18 }) },
        { key: 'support', label: 'Support', icon: _jsx(Icon, { variant: "insights", size: 18 }) },
    ];
    const Trigger = triggerSlot ? triggerSlot : (_jsx("button", { className: styles.avatarButton, children: _jsx(Avatar, { className: styles.avatar, src: (_a = user.avatar_url) !== null && _a !== void 0 ? _a : undefined, alt: (_b = user.email) !== null && _b !== void 0 ? _b : 'avatar', fallback: (user.email || '?').slice(0, 1).toUpperCase() }) }));
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: Trigger }), _jsxs(DialogContent, { className: styles.dialogRoot, children: [_jsx(DialogHeader, { className: styles.headerBar, children: _jsx(DialogTitle, { children: "Account" }) }), _jsx(DialogBody, { className: styles.bodyRoot, children: _jsxs("div", { className: styles.container, children: [_jsxs("aside", { className: styles.sidebar, children: [_jsx("nav", { className: styles.nav, children: sidebarItems.map(item => (_jsxs("button", { className: `${styles.navItem} ${activeTab === item.key ? styles.active : ''}`, onClick: () => setActiveTab(item.key), children: [_jsx("span", { className: styles.navIcon, children: item.icon }), _jsx("span", { children: item.label })] }, item.key))) }), _jsx("div", { className: styles.sidebarFooter, children: _jsx(Button, { variant: "ghost", className: styles.signOut, onClick: () => signOut(), children: "Sign out" }) })] }), _jsxs("main", { className: styles.content, children: [activeTab === 'profile' && (_jsxs("section", { className: styles.section, children: [_jsxs("div", { className: styles.sectionHeader, children: [_jsx("h2", { className: styles.title, children: "Profile" }), _jsx(Avatar, { className: styles.profileAvatar, src: (_c = user.avatar_url) !== null && _c !== void 0 ? _c : undefined, alt: (_d = user.email) !== null && _d !== void 0 ? _d : 'avatar', fallback: (user.email || '?').slice(0, 1).toUpperCase() })] }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: "First name" }), _jsx("span", { className: styles.kvValue, children: firstName || '—' })] }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: "Last name" }), _jsx("span", { className: styles.kvValue, children: lastName || '—' })] }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: "Email" }), _jsxs("span", { className: styles.kvValue, children: [user.email, _jsx("span", { className: styles.providerBadge, children: "G" })] })] })] })), activeTab === 'subscription' && (_jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.title, children: "Subscription" }), _jsxs("div", { className: styles.planRow, children: [_jsxs("div", { className: styles.planLeft, children: [_jsx("span", { className: styles.planDot }), _jsxs("div", { className: styles.planTexts, children: [_jsx("div", { className: styles.planName, children: isLoading ? 'Loading...' : (subscription === null || subscription === void 0 ? void 0 : subscription.plan_name) || 'No plan' }), !isLoading && subscription && (isCanceled ? (_jsxs("div", { className: styles.planSub, children: [_jsx("span", { style: { color: '#ff5e57', marginRight: 8 }, children: "Cancelled" }), !isFullyCanceled && periodEndText && _jsxs("span", { children: ["Expires ", periodEndText] })] })) : (_jsxs("div", { className: styles.planSub, children: ["Renews ", periodEndText] })))] })] }), _jsx("div", { className: styles.planActions, children: !isLoading && (_jsx(_Fragment, { children: !subscription ? (_jsx(Button, { size: "sm", variant: "secondary", onClick: onSubscribe !== null && onSubscribe !== void 0 ? onSubscribe : (() => openPortal()), children: "Subscribe" })) : (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => openPortal(), disabled: isActionLoading, children: isActionLoading ? 'Opening…' : 'Manage' }), isCanceled ? (_jsx(Button, { size: "sm", variant: "ghost", onClick: () => openPortal(), disabled: isActionLoading, children: "Renew" })) : (_jsx(Button, { size: "sm", variant: "ghost", onClick: () => openPortal('cancel'), disabled: isActionLoading, children: "Cancel" }))] })) })) })] }), subscription && (_jsxs("div", { className: styles.creditsBlock, children: [_jsxs("div", { className: styles.creditsHeader, children: [_jsx("span", { children: "Credit Balance" }), _jsx("button", { className: styles.buyCredits, onClick: onBuyCredits !== null && onBuyCredits !== void 0 ? onBuyCredits : (() => openPortal()), children: "Buy credits" })] }), _jsxs("div", { className: styles.creditsValue, children: [isLoading ? '—' : creditBalance !== null && creditBalance !== void 0 ? creditBalance : 0, _jsxs("span", { className: styles.creditsTotal, children: ["/", (_e = subscription === null || subscription === void 0 ? void 0 : subscription.credits_included) !== null && _e !== void 0 ? _e : 0] })] }), _jsx("div", { className: styles.progressBar, children: _jsx("div", { className: styles.progressFill, style: {
                                                                    width: `${Math.max(0, Math.min(100, ((creditBalance !== null && creditBalance !== void 0 ? creditBalance : 0) / ((subscription === null || subscription === void 0 ? void 0 : subscription.credits_included) || 1)) * 100))}%`
                                                                } }) }), (subscription === null || subscription === void 0 ? void 0 : subscription.current_period_end) && (_jsxs("div", { className: styles.creditsReset, children: ["Resets ", new Date(subscription.current_period_end).toLocaleDateString()] }))] }))] })), activeTab === 'settings' && (_jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.title, children: "Settings" }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: "Language" }), _jsx("div", { className: styles.kvValue, children: _jsx(LanguageSwitcher, { variant: "popover" }) })] }), _jsxs("div", { className: styles.deleteBlock, children: [_jsxs("div", { className: styles.deleteTexts, children: [_jsx("div", { className: styles.deleteTitle, children: "Delete account?" }), _jsx("div", { className: styles.deleteSub, children: "This will erase all your data, settings, and history. This action cannot be undone." })] }), _jsx(Button, { variant: "destructive", disabled: true, children: "Delete Account (coming soon)" })] })] })), activeTab === 'support' && (_jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.title, children: "We're here to help" }), _jsxs("div", { className: styles.supportList, children: [_jsxs("div", { className: styles.supportItem, children: [_jsx("div", { className: styles.supportLabel, children: "FAQ's" }), _jsx("a", { className: styles.supportLink, href: "https://help.primeshot.ai", target: "_blank", rel: "noreferrer", children: "Check out our Help Center" })] }), _jsxs("div", { className: styles.supportItem, children: [_jsx("div", { className: styles.supportLabel, children: "DM us" }), _jsx("a", { className: styles.supportLink, href: "https://x.com/primeshotai", target: "_blank", rel: "noreferrer", children: "@primeshotai" })] }), _jsxs("div", { className: styles.supportItem, children: [_jsx("div", { className: styles.supportLabel, children: "Email us" }), _jsx("a", { className: styles.supportLink, href: "mailto:support@primeshot.ai", children: "support@primeshot.ai" })] })] })] }))] })] }) })] })] }));
}
