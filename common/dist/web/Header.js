'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/AuthContext';
import { SignInModal } from './SignInModal';
import { AccountDialog } from './AccountDialog';
import styles from './Header.module.css';
import { Icon } from './Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
export const Header = ({ rightSlot }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const { t } = useTranslation('common');
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isActive = (href) => {
        if (!pathname)
            return false;
        if (href === '/')
            return pathname === '/';
        return pathname === href || pathname.startsWith(href + '/');
    };
    const handleMobileNavClick = () => {
        setMobileMenuOpen(false);
    };
    return (_jsx("header", { className: styles.header, children: _jsxs("div", { className: styles.container, children: [_jsx("div", { className: styles.leftSection, children: _jsx(Link, { href: "/", children: _jsx(Image, { src: (`${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg`), alt: t('aria.brandLogo'), width: 32, height: 32 }) }) }), _jsx("div", { className: styles.middleSection, children: _jsx("nav", { className: styles.nav, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton })] })) : (_jsxs(_Fragment, { children: [_jsx("a", { href: "/explore", "aria-current": isActive('/explore') ? 'page' : undefined, className: styles.navLink + ' ' +
                                        styles.exploreNavLink + ' ' +
                                        (isActive('/explore') ? styles.navLinkActive : ''), children: t('navigation.explore') }), _jsx(Link, { href: "/", "aria-current": isActive("/create") ? 'page' : undefined, className: styles.navLink + ' ' +
                                        styles.createNavLink + ' ' +
                                        (isActive("/create") ? styles.navLinkActive : ''), children: t('navigation.create') }), _jsx("a", { href: "/pricing", className: styles.navLink + ' ' + styles.pricingNavLink, children: "Pricing" }), isAuthenticated && (user === null || user === void 0 ? void 0 : user.admin) && (_jsx("a", { href: "/admin", "aria-current": isActive('/admin') ? 'page' : undefined, className: styles.navLink + ' ' +
                                        styles.adminNavLink + ' ' +
                                        (isActive('/admin') ? styles.navLinkActive : ''), children: t('navigation.admin') }))] })) }) }), _jsx("div", { className: styles.rightSection, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: styles.rightSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.rightSkeleton + ' ' + styles.skeleton })] })) : (_jsxs(_Fragment, { children: [!isAuthenticated && _jsx(LanguageSwitcher, { variant: "modal", display: "flag" }), rightSlot !== null && rightSlot !== void 0 ? rightSlot : (isAuthenticated ? _jsx(AccountDialog, {}) : _jsx(SignInModal, {})), _jsxs(Dialog, { open: mobileMenuOpen, onOpenChange: setMobileMenuOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", className: styles.hamburgerButton, "aria-label": t('navigation.menu'), children: _jsx(Icon, { variant: "menu", size: 20 }) }) }), _jsxs(DialogContent, { className: styles.mobileNavDialog, noContainer: true, fullscreen: true, children: [_jsx(DialogHeader, {}), _jsxs("div", { className: styles.mobileNavList, children: [_jsxs("a", { href: "/explore", "aria-current": isActive('/explore') ? 'page' : undefined, className: styles.mobileNavItem + (isActive('/explore') ? ' ' + styles.mobileNavItemActive : ''), onClick: handleMobileNavClick, children: [_jsx("span", { className: styles.mobileNavLabel, children: t('navigation.explore') }), isActive('/explore') && _jsx(Icon, { variant: "checkmark", className: styles.mobileNavCheck })] }), _jsxs(Link, { href: "/", "aria-current": isActive("/create") ? 'page' : undefined, className: styles.mobileNavItem + (isActive("/create") ? ' ' + styles.mobileNavItemActive : ''), onClick: handleMobileNavClick, children: [_jsx("span", { className: styles.mobileNavLabel, children: t('navigation.create') }), isActive("/create") && _jsx(Icon, { variant: "checkmark", className: styles.mobileNavCheck })] }), _jsxs("a", { href: "/pricing", "aria-current": isActive('/pricing') ? 'page' : undefined, className: styles.mobileNavItem + (isActive('/pricing') ? ' ' + styles.mobileNavItemActive : ''), onClick: handleMobileNavClick, children: [_jsx("span", { className: styles.mobileNavLabel, children: "Pricing" }), isActive('/pricing') && _jsx(Icon, { variant: "checkmark", className: styles.mobileNavCheck })] }), isAuthenticated && (user === null || user === void 0 ? void 0 : user.admin) && (_jsxs("a", { href: "/admin", "aria-current": isActive('/admin') ? 'page' : undefined, className: styles.mobileNavItem + (isActive('/admin') ? ' ' + styles.mobileNavItemActive : ''), onClick: handleMobileNavClick, children: [_jsx("span", { className: styles.mobileNavLabel, children: t('navigation.admin') }), isActive('/admin') && _jsx(Icon, { variant: "checkmark", className: styles.mobileNavCheck })] }))] })] })] })] })) })] }) }));
};
export default Header;
