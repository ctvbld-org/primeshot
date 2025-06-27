import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import Image from 'next/image';
export const Header = ({ rightSlot }) => {
    return (_jsx("header", { className: "w-full h-14 border-b border-gray-200 flex items-center px-4", children: _jsxs("div", { className: "flex items-center gap-8 w-full max-w-6xl mx-auto", children: [_jsx(Link, { href: "/", children: _jsx(Image, { src: "/logo.svg", alt: "Primeshot", width: 32, height: 32 }) }), _jsxs("nav", { className: "flex gap-6 text-sm font-medium", children: [_jsx(Link, { href: "/explore", children: "Explore" }), _jsx(Link, { href: "/create", children: "Create" }), _jsx(Link, { href: "/use-cases", children: "Use Cases" }), _jsx(Link, { href: "/pricing", children: "Pricing" })] }), _jsx("div", { className: "flex-1" }), rightSlot] }) }));
};
export default Header;
