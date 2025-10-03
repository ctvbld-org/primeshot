'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.css';
import { Icon } from './Icon';
export const Footer = ({ aboutHref = '/about', termsHref = '/terms', privacyHref = '/privacy', xHref = 'https://x.com/primeshotai', linkedinHref = 'https://www.linkedin.com/company/primeshotai', instagramHref = 'https://www.instagram.com/primeshotai', }) => {
    const { t } = useTranslation('common');
    const year = new Date().getFullYear();
    return (_jsx("footer", { className: styles.footer, children: _jsxs("div", { className: styles.inner, children: [_jsxs("div", { className: styles.left, children: [_jsx(Link, { href: "/", "aria-label": "Primeshot home", className: styles.logoLink, children: _jsx(Icon, { variant: "primeshotLogo", size: 118, className: styles.logo }) }), _jsx("div", { className: styles.copyright, children: t('footer.copyright', { year }) })] }), _jsxs("div", { className: styles.right, children: [_jsxs("ul", { className: styles.links, children: [_jsx("li", { className: styles.link, children: _jsx("a", { href: aboutHref, children: t('footer.about') }) }), _jsx("li", { className: styles.link, children: _jsx("a", { href: termsHref, children: t('footer.terms') }) }), _jsx("li", { className: styles.link, children: _jsx("a", { href: privacyHref, children: t('footer.privacy') }) })] }), _jsxs("div", { className: styles.socialIcons, children: [_jsx("a", { className: styles.iconLink, href: xHref, target: "_blank", rel: "noopener noreferrer", "aria-label": "X", children: _jsx(Image, { src: `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/email/base-icon-x.png`, alt: "X", width: 24, height: 24, className: styles.icon }) }), _jsx("a", { className: styles.iconLink, href: linkedinHref, target: "_blank", rel: "noopener noreferrer", "aria-label": "LinkedIn", children: _jsx(Image, { src: `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/email/base-icon-ln.png`, alt: "LinkedIn", width: 24, height: 24, className: styles.icon }) }), _jsx("a", { className: styles.iconLink, href: instagramHref, target: "_blank", rel: "noopener noreferrer", "aria-label": "Instagram", children: _jsx(Image, { src: `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/email/base-icon-ig.png`, alt: "Instagram", width: 24, height: 24, className: styles.icon }) })] })] })] }) }));
};
export default Footer;
