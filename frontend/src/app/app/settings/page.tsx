import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'
import { useTranslation } from 'react-i18next'

export default async function SettingsPage() {
  const { t } = useTranslation('settings')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

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