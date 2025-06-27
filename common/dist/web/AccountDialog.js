"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogBody } from './ui/dialog';
import { useAuth } from '../hooks/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import Image from 'next/image';
import { Button } from './ui/button';
export function AccountDialog() {
    var _a;
    const { user, signOut } = useAuth();
    const { t } = useTranslation();
    if (!user)
        return null;
    return (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsx("button", { className: "h-8 w-8 rounded-full overflow-hidden border border-gray-200", children: _jsx(Image, { src: (_a = user.avatar_url) !== null && _a !== void 0 ? _a : '/avatar-default.png', alt: "avatar", width: 32, height: 32 }) }) }), _jsxs(DialogContent, { className: "w-72 p-0", children: [_jsx(DialogHeader, { className: "p-4", children: _jsx(DialogTitle, { children: t('account.title', { defaultValue: 'Account' }) }) }), _jsxs(DialogBody, { className: "p-4 flex flex-col gap-4", children: [_jsx("div", { className: "text-sm", children: user.email }), _jsx(LanguageSwitcher, { variant: "popover" }), _jsx(Button, { variant: "ghost", onClick: () => signOut(), children: t('buttons.signOut', { defaultValue: 'Sign out' }) })] })] })] }));
}
