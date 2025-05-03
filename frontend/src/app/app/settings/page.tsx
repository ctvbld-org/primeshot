import { createClient } from '@/lib/supabase/server'
import { SettingsContent } from './settings-content'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return <SettingsContent userData={userData} />
} 