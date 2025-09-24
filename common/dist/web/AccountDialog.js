"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
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
    const providerVariant = useMemo(() => {
        var _a, _b, _c;
        const raw = ((_b = (_a = user === null || user === void 0 ? void 0 : user.identities) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.provider) || ((_c = user === null || user === void 0 ? void 0 : user.app_metadata) === null || _c === void 0 ? void 0 : _c.provider);
        const p = String(raw || '').toLowerCase();
        if (p.includes('google'))
            return 'google';
        if (p.includes('linkedin'))
            return 'linkedin';
        if (p.includes('apple'))
            return 'apple';
        if (p.includes('azure') || p.includes('microsoft'))
            return 'microsoft';
        return undefined;
    }, [user]);
    // Edit state
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileInputRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        setEditFirstName(firstName);
        setEditLastName(lastName);
        setAvatarFile(null);
        if (avatarPreview)
            URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
        setIsDirty(false);
    }, [open, firstName, lastName]);
    const handleCancel = () => {
        setEditFirstName(firstName);
        setEditLastName(lastName);
        setAvatarFile(null);
        if (avatarPreview)
            URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
        setIsDirty(false);
    };
    const handleSave = async () => {
        var _a, _b;
        try {
            setIsSaving(true);
            let avatarUrl;
            if (avatarFile) {
                const fd = new FormData();
                fd.append('file', avatarFile);
                const up = await fetch(getApiUrl('api/account/avatar'), { method: 'POST', body: fd });
                if (!up.ok)
                    throw new Error('Failed to upload avatar');
                const { url } = await up.json();
                avatarUrl = url;
            }
            const res = await fetch(getApiUrl('api/account/profile'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName: editFirstName, lastName: editLastName, avatarUrl })
            });
            if (!res.ok)
                throw new Error('Failed to update profile');
            // Optimistically update local UI
            setIsDirty(false);
            setAvatarFile(null);
            if (avatarPreview)
                URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
            // Ask global auth context to refresh merged user data
            try {
                // optional chaining in case older context version lacks method
                ;
                (_b = (_a = useAuth()) === null || _a === void 0 ? void 0 : _a.refreshUser) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
            catch { }
        }
        catch (e) {
            console.error(e);
            alert('Failed to save changes');
        }
        finally {
            setIsSaving(false);
        }
    };
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
        { key: 'profile', label: 'Profile' },
        { key: 'subscription', label: 'Subscription' },
        { key: 'settings2', label: 'Settings' },
        { key: 'help', label: 'Support' },
    ];
    const Trigger = triggerSlot ? triggerSlot : (_jsx("button", { className: styles.avatarButton, children: _jsx(Avatar, { className: styles.avatar, src: (_a = user.avatar_url) !== null && _a !== void 0 ? _a : undefined, alt: (_b = user.email) !== null && _b !== void 0 ? _b : 'avatar', fallback: (user.email || '?').slice(0, 1).toUpperCase() }) }));
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: Trigger }), _jsxs(DialogContent, { className: styles.dialogRoot, children: [_jsxs(DialogHeader, { className: styles.headerBar, hideClose: isDirty, children: [_jsx("div", { className: styles.headerCol, children: isDirty && (_jsx(Button, { variant: "secondary", size: "sm", onClick: handleCancel, className: styles.headerButton, children: "Cancel" })) }), _jsx(DialogTitle, { className: styles.headerCol + ' ' + styles.headerTitle, children: "Account" }), _jsx("div", { className: styles.headerCol, children: isDirty && (_jsx(Button, { variant: "primary", size: "sm", onClick: handleSave, disabled: isSaving, className: styles.headerButton, children: isSaving ? 'Saving…' : 'Save' })) })] }), _jsx(DialogBody, { className: styles.bodyRoot, children: _jsxs("div", { className: styles.container, children: [_jsxs("aside", { className: styles.sidebar, children: [_jsx("nav", { className: styles.nav, children: sidebarItems.map(item => (_jsxs("button", { className: `${styles.navItem} ${activeTab === item.key ? styles.active : ''}`, onClick: () => setActiveTab(item.key), children: [_jsx("span", { className: styles.navIcon, children: _jsx(Icon, { variant: item.key, size: 18 }) }), _jsx("span", { children: item.label })] }, item.key))) }), _jsx("select", { className: styles.mobileSelect, value: activeTab, onChange: (e) => setActiveTab(e.target.value), "aria-label": "Select section", children: sidebarItems.map(item => (_jsx("option", { value: item.key, children: item.label }, item.key))) }), _jsx("div", { className: styles.sidebarFooter, children: _jsxs(Button, { variant: "ghost", className: styles.signOut, onClick: () => signOut(), children: [_jsx(Icon, { variant: "logout", size: 18 }), "Sign out"] }) })] }), _jsxs("main", { className: styles.content, children: [activeTab === 'profile' && (_jsxs("section", { className: styles.section, children: [_jsxs("div", { className: styles.sectionHeader, children: [_jsx("h2", { className: styles.title, children: "Profile" }), _jsx("div", { style: { position: 'relative' }, children: _jsx(Avatar, { className: styles.profileAvatar, src: (_c = (avatarPreview !== null && avatarPreview !== void 0 ? avatarPreview : user.avatar_url)) !== null && _c !== void 0 ? _c : undefined, alt: (_d = user.email) !== null && _d !== void 0 ? _d : 'avatar', fallback: (user.email || '?').slice(0, 1).toUpperCase(), onClick: () => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, style: { cursor: 'pointer' } }) }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", style: { display: 'none' }, onChange: (e) => {
                                                                var _a;
                                                                const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
                                                                if (!file)
                                                                    return;
                                                                setAvatarFile(file);
                                                                const url = URL.createObjectURL(file);
                                                                setAvatarPreview(url);
                                                                setIsDirty(true);
                                                            } })] }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: "First name" }), _jsx("input", { className: styles.kvValue, value: editFirstName, onChange: (e) => { setEditFirstName(e.target.value); setIsDirty(true); } })] }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: "Last name" }), _jsx("input", { className: styles.kvValue, value: editLastName, onChange: (e) => { setEditLastName(e.target.value); setIsDirty(true); } })] }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: "Email" }), _jsxs("span", { className: styles.kvValue, children: [user.email, providerVariant && (_jsx("span", { className: styles.providerBadge, "aria-label": providerVariant, title: providerVariant, children: _jsx(Icon, { variant: providerVariant, size: 11 }) }))] })] })] })), activeTab === 'subscription' && (_jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.title, children: "Subscription" }), _jsxs("div", { className: styles.planRow, children: [_jsxs("div", { className: styles.planLeft, children: [_jsx("span", { className: styles.planDot, children: (subscription === null || subscription === void 0 ? void 0 : subscription.plan_image_url) && (_jsx("img", { src: subscription.plan_image_url, alt: "plan", style: { width: 32, height: 32, objectFit: 'cover', borderRadius: 4 } })) }), _jsxs("div", { className: styles.planTexts, children: [_jsx("div", { className: styles.planName, children: isLoading ? 'Loading...' : subscription ? `${subscription.plan_name} Plan` : 'No plan' }), !isLoading && subscription && (isCanceled ? (_jsxs("div", { className: styles.planSub, children: [_jsx("span", { style: { color: '#ff5e57', marginRight: 8 }, children: "Cancelled" }), !isFullyCanceled && periodEndText && _jsxs("span", { children: ["Expires ", periodEndText] })] })) : (_jsxs("div", { className: styles.planSub, children: ["Renews ", periodEndText] })))] })] }), _jsx("div", { className: styles.planActions, children: !isLoading && (_jsx(_Fragment, { children: !subscription ? (_jsx(Button, { size: "sm", variant: "secondary", onClick: onSubscribe !== null && onSubscribe !== void 0 ? onSubscribe : (() => openPortal()), children: "Subscribe" })) : (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => openPortal(), disabled: isActionLoading, children: isActionLoading ? 'Opening…' : 'Manage' }), isCanceled ? (_jsx(Button, { size: "sm", variant: "ghost", onClick: () => openPortal(), disabled: isActionLoading, children: "Renew" })) : (_jsx(Button, { size: "sm", variant: "ghost", onClick: () => openPortal('cancel'), disabled: isActionLoading, children: "Cancel" }))] })) })) })] }), subscription && (_jsxs("div", { className: styles.creditsBlock, children: [_jsxs("div", { className: styles.creditsHeader, children: [_jsx("span", { children: "Credit Balance" }), _jsx(Button, { variant: "ghost", size: "sm", className: styles.buyCredits, onClick: onBuyCredits !== null && onBuyCredits !== void 0 ? onBuyCredits : (() => openPortal()), children: "Buy credits" })] }), _jsxs("div", { className: styles.creditsValue, children: [isLoading ? '—' : creditBalance !== null && creditBalance !== void 0 ? creditBalance : 0, _jsxs("span", { className: styles.creditsTotal, children: ["/", (_e = subscription === null || subscription === void 0 ? void 0 : subscription.credits_included) !== null && _e !== void 0 ? _e : 0] })] }), _jsx("div", { className: styles.progressBar, children: _jsx("div", { className: styles.progressFill, style: {
                                                                    width: `${Math.max(0, Math.min(100, ((creditBalance !== null && creditBalance !== void 0 ? creditBalance : 0) / ((subscription === null || subscription === void 0 ? void 0 : subscription.credits_included) || 1)) * 100))}%`
                                                                } }) }), (subscription === null || subscription === void 0 ? void 0 : subscription.current_period_end) && (_jsxs("div", { className: styles.creditsReset, children: ["Resets ", new Date(subscription.current_period_end).toLocaleDateString()] }))] }))] })), activeTab === 'settings2' && (_jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.title, children: "Settings" }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: "Language" }), _jsx("div", { className: styles.kvValue, children: _jsx(LanguageSwitcher, { variant: "popover" }) })] }), _jsxs("div", { className: styles.deleteBlock, children: [_jsxs("div", { className: styles.deleteTexts, children: [_jsx("div", { className: styles.deleteTitle, children: "Delete account?" }), _jsx("div", { className: styles.deleteSub, children: "This will erase all your data, settings, and history. This action cannot be undone." })] }), _jsx(Button, { variant: "destructive", size: "sm", disabled: true, children: "Delete Account (coming soon)" })] })] })), activeTab === 'help' && (_jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.title, children: "We're here to help" }), _jsx("p", { className: styles.description, children: "Got questions or need assistance? We\u2019re ready to support you every step of the way. We typically respond within 24 hours." }), _jsxs("div", { className: styles.supportList, children: [_jsxs("div", { className: styles.supportItem, children: [_jsx("div", { className: styles.supportLabel, children: "FAQ's" }), _jsxs("p", { className: styles.supportDescription, children: ["Check out our ", _jsx("a", { className: styles.supportLink, href: "https://help.primeshot.ai", target: "_blank", rel: "noreferrer", children: "Help Center" }), " for quick answers to common questions."] })] }), _jsxs("div", { className: styles.supportItem, children: [_jsxs("div", { className: styles.supportLabel, children: [_jsx(Icon, { variant: "x", size: 18 }), "DM US"] }), _jsx("a", { className: styles.supportLink, href: "https://x.com/primeshotai", target: "_blank", rel: "noreferrer", children: "@primeshotai" })] }), _jsxs("div", { className: styles.supportItem, children: [_jsxs("div", { className: styles.supportLabel, children: [_jsx(Icon, { variant: "email", size: 18 }), "Email us"] }), _jsx("a", { className: styles.supportLink, href: "mailto:support@primeshot.ai", children: "support@primeshot.ai" })] })] })] }))] }), _jsx("div", { className: styles.dialogFooter, children: _jsxs(Button, { variant: "ghost", className: styles.signOut, onClick: () => signOut(), children: [_jsx(Icon, { variant: "logout", size: 18 }), "Sign out"] }) })] }) })] })] }));
}
