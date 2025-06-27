"use client"

import React, { useState, useMemo, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import { useLanguage } from '../hooks/LanguageContext'

const languageNames: Record<string, string> = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
  ja: '日本語',
  it: 'Italiano',
  nl: 'Dutch'
}

interface Props {
  variant?: 'popover' | 'modal'
}

export function LanguageSwitcher({ variant = 'popover' }: Props) {
  const { t, i18n } = useTranslation()
  const { currentLanguage, isLoading, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)

  const languages = useMemo(
    () =>
      (i18n.options.supportedLngs || [])
        .filter((lng: string) => lng !== 'cimode')
        .map(lng => ({ label: languageNames[lng] || lng, value: lng })),
    [i18n.options.supportedLngs]
  )

  const selectLang = async (lng: string) => {
    await setLanguage(lng)
    setOpen(false)
  }

  const LanguageList = () => (
    <div className="flex flex-col gap-1">
      {languages.map(lang => (
        <button
          key={lang.value}
          className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm"
          onClick={() => selectLang(lang.value)}
        >
          <span>{lang.label}</span>
          {currentLanguage === lang.value && <Check className="h-4 w-4" />}
        </button>
      ))}
    </div>
  )

  const TriggerButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => (
      <button
        {...props}
        ref={ref}
        role="combobox"
        aria-expanded={open}
        className="flex items-center justify-between cursor-pointer h-8 w-full text-sm"
      >
        {isLoading
          ? t('loading')
          : currentLanguage
          ? languages.find(l => l.value === currentLanguage)?.label
          : t('language')}
        <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
      </button>
    )
  )
  TriggerButton.displayName = 'TriggerButton'

  if (variant === 'modal') {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <TriggerButton />
        </DialogTrigger>
        <DialogContent className="w-[200px] p-2">
          <DialogTitle>{t('language')}</DialogTitle>
          <LanguageList />
        </DialogContent>
      </Dialog>
    )
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
  )
} 