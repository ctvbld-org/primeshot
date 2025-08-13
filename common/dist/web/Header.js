'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from 'next/image';
import { useAuth } from '../hooks/AuthContext';
import { SignInModal } from './SignInModal';
import { AccountDialog } from './AccountDialog';
import styles from './Header.module.css';
export const Header = ({ rightSlot }) => {
    const { isAuthenticated, user } = useAuth();
    // Right content can be provided by consumer app via rightSlot
    return (_jsx("header", { className: styles.header, children: _jsxs("div", { className: styles.container, children: [_jsx("div", { className: styles.leftSection, children: _jsx("a", { href: "/", children: _jsx(Image, { src: "/logo-primeshot.svg", alt: "Primeshot", width: 32, height: 32 }) }) }), _jsx("div", { className: styles.middleSection, children: _jsxs("nav", { className: styles.nav, children: [_jsx("a", { href: "/explore", className: styles.navLink, children: "Explore" }), _jsx("a", { href: "/create", className: styles.navLink, children: "Create" }), _jsx("a", { href: "/use-cases", className: styles.navLink, children: "Use Cases" }), _jsx("a", { href: "/pricing", className: styles.navLink, children: "Pricing" }), isAuthenticated && (user === null || user === void 0 ? void 0 : user.admin) && (_jsx("a", { href: "/dashboard", className: styles.adminNavLink, children: "Admin" }))] }) }), _jsx("div", { className: styles.rightSection, children: rightSlot !== null && rightSlot !== void 0 ? rightSlot : (isAuthenticated ? _jsx(AccountDialog, {}) : _jsx(SignInModal, {})) })] }) }));
};
export default Header;
