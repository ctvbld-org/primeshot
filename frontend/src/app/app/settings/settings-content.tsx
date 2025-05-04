'use client'

import { useTranslation } from 'react-i18next'
import { SettingsForm } from './settings-form'

interface SettingsContentProps {
  userData: { full_name: string | null } | null
}

export function SettingsContent({ userData }: SettingsContentProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('page.title')}</h2>
        <p className="text-muted-foreground">
          {t('page.description')}
        </p>
      </div>

      <SettingsForm initialData={userData} />
    </div>
  )
} 