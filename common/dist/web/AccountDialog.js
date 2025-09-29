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
    // Simple basePath handling - no locale routing in webapp
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH === '/' ? '' : process.env.NEXT_PUBLIC_BASE_PATH;
    return `${basePath || ''}${normalized}`;
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
                const { key } = await up.json();
                // Store only the S3 key in DB (e.g., user-images/<id>/avatar.webp)
                avatarUrl = key;
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
            alert(t('errors.failedToSave'));
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
        { key: 'profile', label: t('navigation.profile') },
        { key: 'subscription', label: t('navigation.subscription') },
        { key: 'settings2', label: t('navigation.settings') },
        { key: 'help', label: t('navigation.support') },
    ];
    const Trigger = triggerSlot ? triggerSlot : (_jsx("button", { className: styles.avatarButton, children: _jsx(Avatar, { className: styles.avatar, src: (_a = user.avatar_url) !== null && _a !== void 0 ? _a : undefined, alt: (_b = user.email) !== null && _b !== void 0 ? _b : t('accessibility.avatar'), fallback: (user.email || '?').slice(0, 1).toUpperCase() }) }));
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: Trigger }), _jsxs(DialogContent, { className: styles.dialogRoot, children: [_jsxs(DialogHeader, { className: styles.headerBar, hideClose: isDirty, children: [_jsx("div", { className: styles.headerCol, children: isDirty && (_jsx(Button, { variant: "secondary", size: "sm", onClick: handleCancel, className: styles.headerButton, children: t('buttons.cancel') })) }), _jsx(DialogTitle, { className: styles.headerCol + ' ' + styles.headerTitle, children: t('dialog.title') }), _jsx("div", { className: styles.headerCol, children: isDirty && (_jsx(Button, { variant: "primary", size: "sm", onClick: handleSave, disabled: isSaving, className: styles.headerButton, children: isSaving ? t('buttons.saving') : t('buttons.save') })) })] }), _jsx(DialogBody, { className: styles.bodyRoot, children: _jsxs("div", { className: styles.container, children: [_jsxs("aside", { className: styles.sidebar, children: [_jsx("nav", { className: styles.nav, children: sidebarItems.map(item => (_jsxs("button", { className: `${styles.navItem} ${activeTab === item.key ? styles.active : ''}`, onClick: () => setActiveTab(item.key), children: [_jsx("span", { className: styles.navIcon, children: _jsx(Icon, { variant: item.key, size: 18 }) }), _jsx("span", { children: item.label })] }, item.key))) }), _jsx("select", { className: styles.mobileSelect, value: activeTab, onChange: (e) => setActiveTab(e.target.value), "aria-label": t('dialog.selectSection'), children: sidebarItems.map(item => (_jsx("option", { value: item.key, children: item.label }, item.key))) }), _jsx("div", { className: styles.sidebarFooter, children: _jsxs(Button, { variant: "ghost", className: styles.signOut, onClick: () => signOut(), children: [_jsx(Icon, { variant: "logout", size: 18 }), t('buttons.signOut')] }) })] }), _jsxs("main", { className: styles.content, children: [activeTab === 'profile' && (_jsxs("section", { className: styles.section, children: [_jsxs("div", { className: styles.sectionHeader, children: [_jsx("h2", { className: styles.title, children: t('profile.title') }), _jsx("div", { style: { position: 'relative' }, children: _jsx(Avatar, { className: styles.profileAvatar, src: (_c = (avatarPreview !== null && avatarPreview !== void 0 ? avatarPreview : user.avatar_url)) !== null && _c !== void 0 ? _c : undefined, alt: (_d = user.email) !== null && _d !== void 0 ? _d : t('accessibility.avatar'), fallback: (user.email || '?').slice(0, 1).toUpperCase(), onClick: () => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, style: { cursor: 'pointer' } }) }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", style: { display: 'none' }, onChange: (e) => {
                                                                var _a;
                                                                const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
                                                                if (!file)
                                                                    return;
                                                                setAvatarFile(file);
                                                                const url = URL.createObjectURL(file);
                                                                setAvatarPreview(url);
                                                                setIsDirty(true);
                                                            } })] }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: t('profile.firstName') }), _jsx("input", { className: styles.kvValue, value: editFirstName, onChange: (e) => { setEditFirstName(e.target.value); setIsDirty(true); } })] }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: t('profile.lastName') }), _jsx("input", { className: styles.kvValue, value: editLastName, onChange: (e) => { setEditLastName(e.target.value); setIsDirty(true); } })] }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: t('profile.email') }), _jsxs("span", { className: styles.kvValue, children: [user.email, providerVariant && (_jsx("span", { className: styles.providerBadge, "aria-label": providerVariant, title: providerVariant, children: _jsx(Icon, { variant: providerVariant, size: 11 }) }))] })] })] })), activeTab === 'subscription' && (_jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.title, children: t('subscription.title') }), _jsxs("div", { className: styles.planRow, children: [_jsxs("div", { className: styles.planLeft, children: [_jsx("span", { className: styles.planDot, children: (subscription === null || subscription === void 0 ? void 0 : subscription.plan_image_url) && (_jsx("img", { src: subscription.plan_image_url, alt: t('accessibility.plan'), style: { width: 32, height: 32, objectFit: 'cover', borderRadius: 4 } })) }), _jsxs("div", { className: styles.planTexts, children: [_jsx("div", { className: styles.planName, children: isLoading ? t('subscription.loading') : subscription ? `${subscription.plan_name}${t('subscription.planSuffix')}` : t('subscription.noPlan') }), !isLoading && subscription && (isCanceled ? (_jsxs("div", { className: styles.planSub, children: [_jsx("span", { style: { color: '#ff5e57', marginRight: 8 }, children: t('subscription.cancelled') }), !isFullyCanceled && periodEndText && _jsx("span", { children: t('subscription.expires', { date: periodEndText }) })] })) : (_jsx("div", { className: styles.planSub, children: t('subscription.renews', { date: periodEndText }) })))] })] }), _jsx("div", { className: styles.planActions, children: !isLoading && (_jsx(_Fragment, { children: !subscription ? (_jsx(Button, { size: "sm", variant: "secondary", onClick: onSubscribe !== null && onSubscribe !== void 0 ? onSubscribe : (() => openPortal()), children: t('buttons.subscribe') })) : (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => openPortal(), disabled: isActionLoading, children: isActionLoading ? t('buttons.opening') : t('buttons.manage') }), isCanceled ? (_jsx(Button, { size: "sm", variant: "ghost", onClick: () => openPortal(), disabled: isActionLoading, children: t('buttons.renew') })) : (_jsx(Button, { size: "sm", variant: "ghost", onClick: () => openPortal('cancel'), disabled: isActionLoading, children: t('buttons.cancel') }))] })) })) })] }), subscription && (_jsxs("div", { className: styles.creditsBlock, children: [_jsxs("div", { className: styles.creditsHeader, children: [_jsx("span", { children: t('subscription.creditBalance') }), _jsx(Button, { variant: "ghost", size: "sm", className: styles.buyCredits, onClick: onBuyCredits !== null && onBuyCredits !== void 0 ? onBuyCredits : (() => openPortal()), children: t('buttons.buyCredits') })] }), _jsxs("div", { className: styles.creditsValue, children: [isLoading ? '—' : creditBalance !== null && creditBalance !== void 0 ? creditBalance : 0, _jsxs("span", { className: styles.creditsTotal, children: ["/", (_e = subscription === null || subscription === void 0 ? void 0 : subscription.credits_included) !== null && _e !== void 0 ? _e : 0] })] }), _jsx("div", { className: styles.progressBar, children: _jsx("div", { className: styles.progressFill, style: {
                                                                    width: `${Math.max(0, Math.min(100, ((creditBalance !== null && creditBalance !== void 0 ? creditBalance : 0) / ((subscription === null || subscription === void 0 ? void 0 : subscription.credits_included) || 1)) * 100))}%`
                                                                } }) }), (subscription === null || subscription === void 0 ? void 0 : subscription.current_period_end) && (_jsx("div", { className: styles.creditsReset, children: t('subscription.resets', { date: new Date(subscription.current_period_end).toLocaleDateString() }) }))] }))] })), activeTab === 'settings2' && (_jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.title, children: t('settings.title') }), _jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: t('settings.language') }), _jsx("div", { className: styles.kvValue, children: _jsx(LanguageSwitcher, { variant: "popover", className: styles.languageSwitcher, endIcon: _jsx(Icon, { variant: "chevronDown", size: 18 }) }) })] }), _jsxs("div", { className: styles.deleteBlock, children: [_jsxs("div", { className: styles.deleteTexts, children: [_jsx("div", { className: styles.deleteTitle, children: t('settings.deleteAccount.title') }), _jsx("div", { className: styles.deleteSub, children: t('settings.deleteAccount.description') })] }), _jsx(Button, { variant: "destructive", size: "sm", disabled: true, children: t('buttons.deleteAccount') })] })] })), activeTab === 'help' && (_jsxs("section", { className: styles.section, children: [_jsx("h2", { className: styles.title, children: t('support.title') }), _jsx("p", { className: styles.description, children: t('support.description') }), _jsxs("div", { className: styles.supportList, children: [_jsxs("div", { className: styles.supportItem, children: [_jsx("div", { className: styles.supportLabel, children: t('support.faq') }), _jsx("p", { className: styles.supportDescription, children: t('support.faqDescription', {
                                                                        helpCenter: _jsx("a", { className: styles.supportLink, href: "https://help.primeshot.ai", target: "_blank", rel: "noreferrer", children: t('support.helpCenter') })
                                                                    }) })] }), _jsxs("div", { className: styles.supportItem, children: [_jsxs("div", { className: styles.supportLabel, children: [_jsx(Icon, { variant: "x", size: 18 }), t('support.dmUs')] }), _jsx("a", { className: styles.supportLink, href: "https://x.com/primeshotai", target: "_blank", rel: "noreferrer", children: "@primeshotai" })] }), _jsxs("div", { className: styles.supportItem, children: [_jsxs("div", { className: styles.supportLabel, children: [_jsx(Icon, { variant: "email", size: 18 }), t('support.emailUs')] }), _jsx("a", { className: styles.supportLink, href: "mailto:support@primeshot.ai", children: "support@primeshot.ai" })] })] })] }))] }), _jsx("div", { className: styles.dialogFooter, children: _jsxs(Button, { variant: "ghost", className: styles.signOut, onClick: () => signOut(), children: [_jsx(Icon, { variant: "logout", size: 18 }), t('buttons.signOut')] }) })] }) })] })] }));
}
