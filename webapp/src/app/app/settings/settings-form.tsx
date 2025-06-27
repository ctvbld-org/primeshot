'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Button } from '@primeshot/common/web/ui/button'
import { Input } from '@primeshot/common/web/ui/input'
import { Label } from '@primeshot/common/web/ui/label'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { useState } from 'react'
import { updateUserSchema } from '@/lib/schemas'
import { useTranslation } from 'react-i18next'

interface SettingsFormProps {
  initialData: {
    full_name: string | null
  } | null
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const { t } = useTranslation('settings')
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState(initialData?.full_name || '')
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data } = await supabase.auth.getUser()
     
      if (!data.user) throw new Error(t('form.profile.toast.error.notAuthenticated'))

      // Validate input
      const validatedData = updateUserSchema.parse({
        full_name: fullName
      })

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update(validatedData)
        .eq('id', data.user.id)

      if (error) throw error

      toast({
        title: t('form.profile.toast.success.title'),
        description: t('form.profile.toast.success.description')
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('form.profile.toast.error.title'),
        description: t('form.profile.toast.error.description'),
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('form.profile.title')}</CardTitle>
        <CardDescription>
          {t('form.profile.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('form.profile.fullName.label')}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('form.profile.fullName.placeholder')}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('form.profile.submit.saving') : t('form.profile.submit.default')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 