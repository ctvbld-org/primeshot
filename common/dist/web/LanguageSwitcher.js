"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from './ui/dialog';
import { useLanguage } from '../hooks/LanguageContext';
import { Button } from './ui/button';
import ReactCountryFlag from 'react-country-flag';
import styles from './LanguageSwitcher.module.css';
import { Icon } from './Icon';
const baseLanguageMeta = {
    'en-GB': { label: 'English', countryCode: 'GB', country: 'United Kingdom' },
    zh: { label: '中文', countryCode: 'CN', country: '中国' },
    es: { label: 'Español', countryCode: 'ES', country: 'España' },
    fr: { label: 'Français', countryCode: 'FR', country: 'France' },
    pt: { label: 'Português', countryCode: 'PT', country: 'Portugal' },
    de: { label: 'Deutsch', countryCode: 'DE', country: 'Deutschland' },
    ja: { label: '日本語', countryCode: 'JP', country: '日本' },
    it: { label: 'Italiano', countryCode: 'IT', country: 'Italia' },
    nl: { label: 'Dutch', countryCode: 'NL', country: 'Nederland' }
};
export function LanguageSwitcher({ variant = 'popover', display = 'label', flagStyle = 'svg', flagSize = 16, showListFlags = true, countryByLang, endIcon }) {
    const { t, i18n } = useTranslation();
    const { currentLanguage, isLoading, setLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const languageMeta = useMemo(() => {
        if (!countryByLang)
            return baseLanguageMeta;
        const entries = Object.entries(baseLanguageMeta).map(([lng, meta]) => [
            lng,
            { ...meta, countryCode: countryByLang[lng] || meta.countryCode }
        ]);
        return Object.fromEntries(entries);
    }, [countryByLang]);
    const languages = useMemo(() => {
        const supported = (i18n.options.supportedLngs || []).filter((lng) => lng !== 'cimode');
        return supported.map(lng => { var _a; return ({ label: ((_a = languageMeta[lng]) === null || _a === void 0 ? void 0 : _a.label) || lng, value: lng }); });
    }, [i18n.options.supportedLngs, languageMeta]);
    const renderFlag = (lng, size = flagSize, className) => {
        var _a;
        if (!lng)
            return null;
        const cc = (_a = languageMeta[lng]) === null || _a === void 0 ? void 0 : _a.countryCode;
        if (!cc)
            return null;
        return (_jsx(ReactCountryFlag, { countryCode: cc, svg: flagStyle === 'svg', "aria-label": cc, className: className, style: { width: size, height: size, borderRadius: 6 } }));
    };
    const selectLang = async (lng) => {
        await setLanguage(lng);
        setOpen(false);
    };
    const LanguageList = () => (_jsx("div", { className: styles.list, children: languages.map(lang => {
            var _a;
            return (_jsxs(Button, { variant: "ghost", size: "lg", className: styles.listButton + (currentLanguage === lang.value ? ' ' + styles.active : ''), onClick: () => selectLang(lang.value), children: [_jsxs("span", { className: styles.listButtonLabel, children: [showListFlags && renderFlag(lang.value, flagSize), _jsx("span", { className: styles.language, children: lang.label }), _jsx("span", { className: styles.country, children: (_a = languageMeta[lang.value]) === null || _a === void 0 ? void 0 : _a.country })] }), currentLanguage === lang.value && _jsx(Icon, { variant: "checkmark", className: styles.checkIcon })] }, lang.value));
        }) }));
    const TriggerButton = forwardRef((props, ref) => {
        var _a;
        const currentLabel = currentLanguage
            ? (_a = languages.find(l => l.value === currentLanguage)) === null || _a === void 0 ? void 0 : _a.label
            : undefined;
        let content = t('language');
        if (isLoading) {
            content = "";
        }
        else if (currentLanguage) {
            if (display === 'flag') {
                content = _jsx(_Fragment, { children: renderFlag(currentLanguage) });
            }
            else if (display === 'flag-label') {
                content = (_jsxs("span", { className: styles.triggerContent, children: [renderFlag(currentLanguage), _jsx("span", { children: currentLabel })] }));
            }
            else {
                content = currentLabel;
            }
        }
        return (_jsxs(Button, { ...props, variant: "ghost", size: "sm", ref: ref, role: "combobox", "aria-expanded": open, children: [content, endIcon] }));
    });
    TriggerButton.displayName = 'TriggerButton';
    if (variant === 'modal') {
        return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(TriggerButton, {}) }), _jsxs(DialogContent, { className: styles.dialogContent, noContainer: true, fullscreen: true, children: [_jsx(DialogHeader, {}), _jsx(LanguageList, {})] })] }));
    }
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(TriggerButton, {}) }), _jsx(PopoverContent, { className: styles.popoverContent, children: _jsx(LanguageList, {}) })] }));
}
