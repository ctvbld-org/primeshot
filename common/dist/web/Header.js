'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/AuthContext';
import { useLanguage } from '../hooks/LanguageContext';
import { SignInModal } from './SignInModal';
import { AccountDialog } from './AccountDialog';
import styles from './Header.module.css';
import { LanguageSwitcher } from './LanguageSwitcher';
export const Header = ({ rightSlot }) => {
    const { isAuthenticated, user } = useAuth();
    const { t } = useTranslation('common');
    const { currentLanguage } = useLanguage();
    const locale = currentLanguage || 'en';
    // Right content can be provided by consumer app via rightSlot
    return (_jsx("header", { className: styles.header, children: _jsxs("div", { className: styles.container, children: [_jsx("div", { className: styles.leftSection, children: _jsx(Link, { href: `/${locale}`, children: _jsx(Image, { src: (`${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg`), alt: t('aria.brandLogo'), width: 32, height: 32 }) }) }), _jsx("div", { className: styles.middleSection, children: _jsxs("nav", { className: styles.nav, children: [_jsx(Link, { href: `/${locale}/explore`, className: styles.navLink, children: t('navigation.explore') }), _jsx(Link, { href: `/${locale}`, className: styles.navLink, children: t('navigation.create') }), isAuthenticated && (user === null || user === void 0 ? void 0 : user.admin) && (_jsx(Link, { href: "/admin", className: styles.navLink + ' ' + styles.adminNavLink, children: t('navigation.admin') }))] }) }), _jsxs("div", { className: styles.rightSection, children: [!isAuthenticated && _jsx(LanguageSwitcher, { variant: "modal", display: "flag" }), rightSlot !== null && rightSlot !== void 0 ? rightSlot : (isAuthenticated ? _jsx(AccountDialog, {}) : _jsx(SignInModal, {}))] })] }) }));
};
export default Header;
