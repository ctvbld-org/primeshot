'use client'

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@primeshot/common/web/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from '@primeshot/common/web/ui/dialog';
import { useLanguage } from '@primeshot/common/hooks';
import React from 'react';

// Language name mapping
const languageNames: Record<string, string> = {
  en: 'English',   // ~1.5B total speakers
  zh: '中文',      // ~1.1B total speakers
  es: 'Español',   // ~550M total speakers
  fr: 'Français',  // ~280M total speakers
  pt: 'Português', // ~270M total speakers
  de: 'Deutsch',   // ~185M total speakers
  ja: '日本語',    // ~130M total speakers
  it: 'Italiano',  // ~85M total speakers
  nl: 'Dutch'      // ~30M total speakers
};

interface LanguageSwitcherProps {
  variant?: 'popover' | 'modal';
}

export function LanguageSwitcher({ variant = 'popover' }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const { currentLanguage, isLoading, setLanguage } = useLanguage();

  // Get languages dynamically from i18n config
  const languages = React.useMemo(() => 
    (i18n.options.supportedLngs || [])
      .filter((lng: string) => lng !== 'cimode') // Filter out i18next's internal language
      .map((lng: string) => ({
        label: languageNames[lng] || lng,
        value: lng
      })), [i18n.options.supportedLngs]);

  const handleLanguageChange = async (newValue: string) => {
    await setLanguage(newValue);
    setOpen(false);
  };

  const LanguageList = () => (
    <div className="flex flex-col gap-1">
      {languages.map((language) => (
        <button
          key={language.value}
          className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm"
          onClick={() => handleLanguageChange(language.value)}
        >
          <span>{language.label}</span>
          {currentLanguage === language.value && (
            <Check className="h-4 w-4" />
          )}
        </button>
      ))}
    </div>
  );

  const TriggerButton = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
  >((props, ref) => (
    <button
      {...props}
      ref={ref}
      role="combobox"
      aria-expanded={open}
      className="flex items-center justify-between cursor-pointer h-8 w-full text-sm font-normal"
    >
      {isLoading ? (
        t('loading')
      ) : currentLanguage ? (
        languages.find((language) => language.value === currentLanguage)?.label
      ) : (
        t('language')
      )}
      <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
    </button>
  ));
  TriggerButton.displayName = 'TriggerButton';

  if (variant === 'modal') {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <TriggerButton />
        </DialogTrigger>
        <DialogContent className="w-[200px] p-2">
          <DialogTitle>
            {t('language')}
          </DialogTitle>
          <LanguageList />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TriggerButton />
      </PopoverTrigger>
      <PopoverContent className="w-[100px] p-1">
        <LanguageList />
      </PopoverContent>
    </Popover>
  );
} 