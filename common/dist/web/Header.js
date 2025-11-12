'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/AuthContext';
import { SignInModal } from './SignInModal';
import { AccountDialog } from './AccountDialog';
import styles from './Header.module.css';
import { Icon } from './Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Skeleton } from './ui/skeleton';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { SUPPORTED_LANGUAGES } from '../i18n';
export const Header = ({ rightSlot }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const { t } = useTranslation('common');
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    // Wait for hydration to complete before rendering auth-dependent UI
    useEffect(() => {
        setMounted(true);
    }, []);
    const isActive = (href) => {
        if (!pathname)
            return false;
        // Get the full URL path (e.g., when webapp is served at /create, this will be /create)
        // while Next.js pathname might be / due to basePath
        const fullPathname = typeof window !== 'undefined' ? window.location.pathname : pathname;
        // Helper to remove locale prefix from any pathname
        const removeLocalePrefix = (path) => {
            for (const locale of SUPPORTED_LANGUAGES) {
                if (path === `/${locale}` || path.startsWith(`/${locale}/`)) {
                    return path.slice(locale.length + 1) || '/';
                }
            }
            return path;
        };
        // Remove locale prefix from both paths
        const nextPathnameWithoutLocale = removeLocalePrefix(pathname);
        const fullPathnameWithoutLocale = removeLocalePrefix(fullPathname);
        // Check against both paths (handles webapp served via rewrite with basePath)
        const checkPath = (path) => {
            if (href === '/')
                return path === '/';
            return path === href || path.startsWith(href + '/');
        };
        return checkPath(nextPathnameWithoutLocale) || checkPath(fullPathnameWithoutLocale);
    };
    const handleMobileNavClick = () => {
        setMobileMenuOpen(false);
    };
    // Define navigation items
    const navItems = [
        { href: '/explore', labelKey: 'navigation.explore', desktopClass: styles.exploreNavLink },
        { href: '/create', labelKey: 'navigation.create', desktopClass: styles.createNavLink },
        { href: '/pricing', labelKey: 'navigation.pricing', desktopClass: styles.pricingNavLink },
        { href: '/blog', labelKey: 'navigation.blog', desktopClass: styles.blogNavLink },
    ];
    // Add admin link if user is admin
    if (isAuthenticated && (user === null || user === void 0 ? void 0 : user.admin)) {
        navItems.push({ href: '/admin', labelKey: 'navigation.admin', desktopClass: styles.adminNavLink });
    }
    return (_jsx("header", { className: styles.header, children: _jsxs("div", { className: styles.container, children: [_jsx("div", { className: styles.leftSection, children: _jsx("a", { href: "/", children: _jsx(Image, { src: (`${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg`), alt: t('aria.brandLogo'), width: 32, height: 32, priority: true }) }) }), _jsx("div", { className: styles.middleSection, children: _jsx("nav", { className: styles.nav, children: !mounted || isLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton })] })) : (_jsx(_Fragment, { children: navItems.map((item) => (_jsx("a", { href: item.href, "aria-current": isActive(item.href) ? 'page' : undefined, className: styles.navLink + ' ' +
                                    item.desktopClass + ' ' +
                                    (isActive(item.href) ? styles.navLinkActive : ''), children: t(item.labelKey) }, item.href))) })) }) }), _jsx("div", { className: styles.rightSection, children: !mounted || isLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: styles.rightSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.rightSkeleton + ' ' + styles.skeleton })] })) : (_jsxs(_Fragment, { children: [!isAuthenticated && _jsx(LanguageSwitcher, { variant: "modal", display: "flag" }), rightSlot !== null && rightSlot !== void 0 ? rightSlot : (isAuthenticated ? _jsx(AccountDialog, {}) : _jsx(SignInModal, {})), _jsxs(Dialog, { open: mobileMenuOpen, onOpenChange: setMobileMenuOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", className: styles.hamburgerButton, "aria-label": t('navigation.menu'), children: _jsx(Icon, { variant: "menu", size: 20 }) }) }), _jsxs(DialogContent, { className: styles.mobileNavDialog, noContainer: true, fullscreen: true, children: [_jsx(DialogHeader, {}), _jsx("div", { className: styles.mobileNavList, children: navItems.map((item) => (_jsxs("a", { href: item.href, "aria-current": isActive(item.href) ? 'page' : undefined, className: styles.mobileNavItem + (isActive(item.href) ? ' ' + styles.mobileNavItemActive : ''), onClick: handleMobileNavClick, children: [_jsx("span", { className: styles.mobileNavLabel, children: t(item.labelKey) }), isActive(item.href) && _jsx(Icon, { variant: "checkmark", className: styles.mobileNavCheck })] }, item.href))) })] })] })] })) })] }) }));
};
export default Header;
