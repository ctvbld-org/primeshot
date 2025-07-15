'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from 'next/image';
import { useAuth } from '../hooks/AuthContext';
import { SignInModal } from './SignInModal';
import { AccountDialog } from './AccountDialog';
export const Header = ({ rightSlot }) => {
    const { isAuthenticated, user } = useAuth();
    return (_jsx("header", { className: "w-full h-14 border-b border-gray-200 flex items-center px-4", children: _jsxs("div", { className: "flex items-center gap-8 w-full max-w-6xl mx-auto", children: [_jsx("a", { href: "/", children: _jsx(Image, { src: "/logo-primeshot.svg", alt: "Primeshot", width: 32, height: 32 }) }), _jsxs("nav", { className: "flex gap-6 text-sm font-medium", children: [_jsx("a", { href: "/explore", children: "Explore" }), _jsx("a", { href: "/create", children: "Create" }), _jsx("a", { href: "/use-cases", children: "Use Cases" }), _jsx("a", { href: "/pricing", children: "Pricing" }), isAuthenticated && (user === null || user === void 0 ? void 0 : user.admin) && (_jsx("a", { href: "/admin/dashboard", className: "text-purple-600 font-semibold", children: "Admin" }))] }), _jsx("div", { className: "flex-1" }), rightSlot !== null && rightSlot !== void 0 ? rightSlot : (isAuthenticated ? _jsx(AccountDialog, {}) : _jsx(SignInModal, {}))] }) }));
};
export default Header;
