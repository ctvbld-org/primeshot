"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog';
import { useLanguage } from '../hooks/LanguageContext';
const languageNames = {
    en: 'English',
    zh: '中文',
    es: 'Español',
    fr: 'Français',
    pt: 'Português',
    de: 'Deutsch',
    ja: '日本語',
    it: 'Italiano',
    nl: 'Dutch'
};
export function LanguageSwitcher({ variant = 'popover' }) {
    const { t, i18n } = useTranslation();
    const { currentLanguage, isLoading, setLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const languages = useMemo(() => (i18n.options.supportedLngs || [])
        .filter((lng) => lng !== 'cimode')
        .map(lng => ({ label: languageNames[lng] || lng, value: lng })), [i18n.options.supportedLngs]);
    const selectLang = async (lng) => {
        await setLanguage(lng);
        setOpen(false);
    };
    const LanguageList = () => (_jsx("div", { className: "flex flex-col gap-1", children: languages.map(lang => (_jsxs("button", { className: "flex items-center justify-between cursor-pointer px-3 py-2 text-sm", onClick: () => selectLang(lang.value), children: [_jsx("span", { children: lang.label }), currentLanguage === lang.value && _jsx(Check, { className: "h-4 w-4" })] }, lang.value))) }));
    const TriggerButton = forwardRef((props, ref) => {
        var _a;
        return (_jsxs("button", { ...props, ref: ref, role: "combobox", "aria-expanded": open, className: "flex items-center justify-between cursor-pointer h-8 w-full text-sm", children: [isLoading
                    ? t('loading')
                    : currentLanguage
                        ? (_a = languages.find(l => l.value === currentLanguage)) === null || _a === void 0 ? void 0 : _a.label
                        : t('language'), _jsx(ChevronsUpDown, { className: "ml-1 h-4 w-4 shrink-0 opacity-50" })] }));
    });
    TriggerButton.displayName = 'TriggerButton';
    if (variant === 'modal') {
        return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(TriggerButton, {}) }), _jsxs(DialogContent, { className: "w-[200px] p-2", children: [_jsx(DialogTitle, { children: t('language') }), _jsx(LanguageList, {})] })] }));
    }
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(TriggerButton, {}) }), _jsx(PopoverContent, { className: "w-[100px] p-1", children: _jsx(LanguageList, {}) })] }));
}
