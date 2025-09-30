'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/AuthContext';
import { SignInModal } from './SignInModal';
import { AccountDialog } from './AccountDialog';
import styles from './Header.module.css';
import { LanguageSwitcher } from './LanguageSwitcher';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';
export const Header = ({ rightSlot }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const { t } = useTranslation('common');
    return (_jsx("header", { className: styles.header, children: _jsxs("div", { className: styles.container, children: [_jsx("div", { className: styles.leftSection, children: _jsx(Link, { href: "/create", children: _jsx(Image, { src: (`${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg`), alt: t('aria.brandLogo'), width: 32, height: 32 }) }) }), _jsx("div", { className: styles.middleSection, children: _jsx("nav", { className: styles.nav, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.navLinkSkeleton + ' ' + styles.skeleton })] })) : (_jsxs(_Fragment, { children: [_jsx(Link, { href: "/explore", className: styles.navLink, children: t('navigation.explore') }), _jsx(Link, { href: "/create", className: styles.navLink, children: t('navigation.create') }), isAuthenticated && (user === null || user === void 0 ? void 0 : user.admin) && (_jsx(Link, { href: "/admin", className: styles.navLink + ' ' + styles.adminNavLink, children: t('navigation.admin') }))] })) }) }), _jsx("div", { className: styles.rightSection, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: styles.rightSkeleton + ' ' + styles.skeleton }), _jsx(Skeleton, { className: styles.rightSkeleton + ' ' + styles.skeleton })] })) : (_jsxs(_Fragment, { children: [!isAuthenticated && _jsx(LanguageSwitcher, { variant: "modal", display: "flag" }), rightSlot !== null && rightSlot !== void 0 ? rightSlot : (isAuthenticated ? _jsx(AccountDialog, {}) : _jsx(SignInModal, {}))] })) })] }) }));
};
export default Header;
