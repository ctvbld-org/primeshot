import React from 'react';
interface Props {
    variant?: 'popover' | 'modal';
    /** What to show in the trigger: label only, flag only, or flag + label */
    display?: 'label' | 'flag' | 'flag-label';
    /** Render flags as SVGs or emoji */
    flagStyle?: 'svg' | 'emoji';
    /** Flag size in px */
    flagSize?: number;
    /** Show flags alongside labels in the list */
    showListFlags?: boolean;
    /** Optional override: map language code to ISO 3166-1 alpha-2 country code */
    countryByLang?: Partial<Record<string, string>>;
    /** Optional icon rendered at the end of the trigger content */
    endIcon?: React.ReactNode;
    /** Optional className for the component */
    className?: string;
}
export declare function LanguageSwitcher({ variant, display, flagStyle, flagSize, showListFlags, countryByLang, endIcon, className }: Props): import("react/jsx-runtime").JSX.Element;
export {};
