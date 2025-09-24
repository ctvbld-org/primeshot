"use client"

import React, { useState, useMemo, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { useLanguage } from '../hooks/LanguageContext'
import { Button } from './ui/button'
import ReactCountryFlag from 'react-country-flag'
import styles from './LanguageSwitcher.module.css'
import { Icon } from './Icon'

const baseLanguageMeta: Record<string, { label: string; countryCode: string; country: string }> = {
  'en-GB': { label: 'English', countryCode: 'GB', country: 'United Kingdom' },
  zh: { label: '中文', countryCode: 'CN', country: '中国' },
  es: { label: 'Español', countryCode: 'ES', country: 'España' },
  fr: { label: 'Français', countryCode: 'FR', country: 'France' },
  pt: { label: 'Português', countryCode: 'PT', country: 'Portugal' },
  de: { label: 'Deutsch', countryCode: 'DE', country: 'Deutschland' },
  ja: { label: '日本語', countryCode: 'JP', country: '日本' },
  it: { label: 'Italiano', countryCode: 'IT', country: 'Italia' },
  nl: { label: 'Dutch', countryCode: 'NL', country: 'Nederland' }
}

interface Props {
  variant?: 'popover' | 'modal'
  /** What to show in the trigger: label only, flag only, or flag + label */
  display?: 'label' | 'flag' | 'flag-label'
  /** Render flags as SVGs or emoji */
  flagStyle?: 'svg' | 'emoji'
  /** Flag size in px */
  flagSize?: number
  /** Show flags alongside labels in the list */
  showListFlags?: boolean
  /** Optional override: map language code to ISO 3166-1 alpha-2 country code */
  countryByLang?: Partial<Record<string, string>>
  /** Optional icon rendered at the end of the trigger content */
  endIcon?: React.ReactNode
}

export function LanguageSwitcher({
  variant = 'popover',
  display = 'label',
  flagStyle = 'svg',
  flagSize = 16,
  showListFlags = true,
  countryByLang,
  endIcon
}: Props) {
  const { t, i18n } = useTranslation()
  const { currentLanguage, isLoading, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)

  const languageMeta = useMemo(() => {
    if (!countryByLang) return baseLanguageMeta
    const entries = Object.entries(baseLanguageMeta).map(([lng, meta]) => [
      lng,
      { ...meta, countryCode: countryByLang[lng] || meta.countryCode }
    ]) as [string, { label: string; countryCode: string; country: string }][]
    return Object.fromEntries(entries)
  }, [countryByLang])

  const languages = useMemo(() => {
    const supported = (i18n.options.supportedLngs || []).filter((lng: string) => lng !== 'cimode')
    return supported.map(lng => ({ label: languageMeta[lng]?.label || lng, value: lng }))
  }, [i18n.options.supportedLngs, languageMeta])

  const renderFlag = (lng?: string, size = flagSize, className?: string) => {
    if (!lng) return null
    const cc = languageMeta[lng]?.countryCode
    if (!cc) return null
    return (
      <ReactCountryFlag
        countryCode={cc}
        svg={flagStyle === 'svg'}
        aria-label={cc}
        className={className}
        style={{ width: size, height: size, borderRadius: 6 }}
      />
    )
  }

  const selectLang = async (lng: string) => {
    await setLanguage(lng)
    setOpen(false)
  }

  const LanguageList = () => (
    <div className={styles.list}>
      {languages.map(lang => (
        <Button
          variant="ghost"
          size="lg"
          key={lang.value}
          className={styles.listButton + (currentLanguage === lang.value ? ' ' + styles.active : '')}
          onClick={() => selectLang(lang.value)}
        >
          <span className={styles.listButtonLabel}>
            {showListFlags && renderFlag(lang.value, flagSize)}
            <span className={styles.language}>{lang.label}</span><span className={styles.country}>{languageMeta[lang.value]?.country}</span>
          </span>
          {currentLanguage === lang.value && <Icon variant="checkmark" className={styles.checkIcon} />}
        </Button>
      ))}
    </div>
  )

  const TriggerButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => {
      const currentLabel = currentLanguage
        ? languages.find(l => l.value === currentLanguage)?.label
        : undefined

      let content: React.ReactNode = t('language')

      if (isLoading) {
        content = ""
      } else if (currentLanguage) {
        if (display === 'flag') {
          content = <>{renderFlag(currentLanguage)}</>
        } else if (display === 'flag-label') {
          content = (
            <span className={styles.triggerContent}>
              {renderFlag(currentLanguage)}
              <span>{currentLabel}</span>
            </span>
          )
        } else {
          content = currentLabel
        }
      }

      return (
        <Button
          {...props}
          variant="ghost"
          size="sm"
          ref={ref}
          role="combobox"
          aria-expanded={open}
        >
          {content}
          {endIcon}
        </Button>
      )
    }
  )
  TriggerButton.displayName = 'TriggerButton'

  if (variant === 'modal') {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <TriggerButton />
        </DialogTrigger>
        <DialogContent className={styles.dialogContent} noContainer fullscreen>
          <DialogHeader>
          </DialogHeader>
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
      <PopoverContent className={styles.popoverContent}>
        <LanguageList />
      </PopoverContent>
    </Popover>
  )
} 