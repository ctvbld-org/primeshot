'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/ui/avatar'
import style from './page.module.css'

type Gender = 'male' | 'female' | null;

interface FormData {
  full_name: string;
  gender: Gender;
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation(['profile', 'common'])
  const { fetchProfile, updateProfile } = useUserProfile()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    gender: null
  })

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }

    const loadProfile = async () => {
      const profile = await fetchProfile(user.id)
      if (profile) {
        setFormData({
          full_name: profile.full_name || '',
          gender: profile.gender
        })
      }
    }

    loadProfile()
  }, [user, fetchProfile, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      await updateProfile(user.id, formData)
      toast({
        title: t('success.title', '', { ns: 'common' }),
        description: t('completionModal.toast.success.description', '', { ns: 'profile' })
      })
      // Always redirect to shoot page after successful profile update
      router.push('/app/shoot')
    } catch (error) {
      toast({
        title: t('error.title', '', { ns: 'common' }),
        description: error instanceof Error ? error.message : t('completionModal.toast.error.description', '', { ns: 'profile' })
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={style.container}>
        <div className={style.profileContainer}>
            <Avatar
                className={style.avatar}
                src={user?.avatar_url}
                fallback={
                    <svg width="52" height="53" viewBox="0 0 72 73" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M36 36.5C44.6985 36.5 51.75 29.4485 51.75 20.75C51.75 12.0515 44.6985 5 36 5C27.3015 5 20.25 12.0515 20.25 20.75C20.25 29.4485 27.3015 36.5 36 36.5Z" fill="url(#paint0_linear_542_2674)"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M34.7461 67.6165C25.1415 61.0673 17.1537 52.142 11.4582 41.5954C11.238 41.1727 11.1901 40.6717 11.3258 40.2101C11.4614 39.7485 11.7686 39.3668 12.1753 39.1546L23.3123 33.3124C24.0914 32.9063 25.0315 33.2143 25.4639 34.0173C31.0945 44.105 39.4204 52.1608 49.3701 57.1481C45.7006 61.1002 41.637 64.6106 37.2521 67.6165C36.4854 68.1282 35.5128 68.1282 34.7461 67.6165Z" fill="url(#paint1_linear_542_2674)"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M37.2529 67.616C46.8587 61.0684 54.8469 52.1428 60.5408 41.5949C60.7616 41.1733 60.8106 40.6732 60.6766 40.2118C60.5426 39.7503 60.2372 39.368 59.8319 39.1541L48.6867 33.3119C47.9076 32.9058 46.9674 33.2138 46.5351 34.0168C40.9056 44.1056 32.5794 52.1617 22.6289 57.1476C26.2962 61.1024 30.36 64.613 34.7469 67.616C35.5136 68.1277 36.4862 68.1277 37.2529 67.616Z" fill="#44E3C9"/>
                        <defs>
                            <linearGradient id="paint0_linear_542_2674" x1="36" y1="10.2353" x2="36" y2="42.574" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#44E3C9"/>
                            <stop offset="0.82" stopColor="#229D89"/>
                            </linearGradient>
                            <linearGradient id="paint1_linear_542_2674" x1="26.9477" y1="41.5954" x2="35.6124" y2="64.7662" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#44E3C9"/>
                            <stop offset="0.62" stopColor="#189681"/>
                            </linearGradient>
                        </defs>
                    </svg>
                }
            />
            <div className={style.profileContainer}>
                <h2 className={style.title}>{t('completionModal.title', '', { ns: 'profile' })}</h2>
                <p className={style.description}>{t('completionModal.description', '', { ns: 'profile' })}</p>
            </div>
            <form onSubmit={handleSubmit} className={style.form}>
                <Input
                    className={style.input}
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder={t('completionModal.form.fullName.label', '', { ns: 'profile' })}
                    required
                />

                <div className={style.genderGrid}>
                    <label className={formData.gender === 'male' ? style.genderOptionSelected : style.genderOption}>
                        <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
                        className="sr-only"
                        required
                        />
                        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.501 3.5V5H18.4404L12.6741 10.7664C11.4644 9.82654 9.94205 9.3831 8.41693 9.52635C6.89181 9.6696 5.47863 10.3888 4.46515 11.5374C3.45167 12.6861 2.91411 14.1778 2.96192 15.7089C3.00973 17.24 3.63933 18.6953 4.7225 19.7785C5.80567 20.8616 7.26097 21.4912 8.79206 21.539C10.3231 21.5868 11.8149 21.0493 12.9635 20.0358C14.1122 19.0223 14.8314 17.6091 14.9746 16.084C15.1179 14.5589 14.6744 13.0365 13.7346 11.8269L19.501 6.06058V11H21.001V3.5H13.501ZM9.00095 20C8.11094 20 7.24091 19.7361 6.50089 19.2416C5.76087 18.7471 5.18409 18.0443 4.84349 17.2221C4.5029 16.3998 4.41379 15.495 4.58742 14.6221C4.76105 13.7492 5.18964 12.9474 5.81897 12.318C6.44831 11.6887 7.25013 11.2601 8.12305 11.0865C8.99596 10.9128 9.90076 11.0019 10.723 11.3425C11.5453 11.6831 12.2481 12.2599 12.7426 12.9999C13.237 13.74 13.501 14.61 13.501 15.5C13.4996 16.6931 13.0251 17.8369 12.1815 18.6805C11.3379 19.5242 10.194 19.9987 9.00095 20Z" fill="currentColor"/>
                        </svg>
                        <span className={style.genderLabel}>{t('completionModal.form.gender.options.male', '', { ns: 'profile' })}</span>
                    </label>

                    <label className={formData.gender === 'female' ? style.genderOptionSelected : style.genderOption}>
                        <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
                        className="sr-only"
                        required
                        />
                        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.75 15.4481C14.2643 15.2573 15.649 14.4966 16.6221 13.3208C17.5953 12.1451 18.0838 10.6426 17.9882 9.11938C17.8927 7.59612 17.2202 6.16654 16.1077 5.12165C14.9952 4.07676 13.5263 3.49512 12 3.49512C10.4738 3.49512 9.00486 4.07676 7.89236 5.12165C6.77985 6.16654 6.10736 7.59612 6.01179 9.11938C5.91621 10.6426 6.40472 12.1451 7.37789 13.3208C8.35106 14.4966 9.73572 15.2573 11.25 15.4481V17H7.50001V18.5H11.25V21.5H12.75V18.5H16.5V17H12.75V15.4481ZM7.50001 9.50003C7.50001 8.61002 7.76393 7.73999 8.2584 6.99997C8.75286 6.25994 9.45567 5.68317 10.2779 5.34257C11.1002 5.00198 12.005 4.91287 12.8779 5.0865C13.7508 5.26013 14.5527 5.68872 15.182 6.31805C15.8113 6.94739 16.2399 7.74921 16.4135 8.62213C16.5872 9.49504 16.4981 10.3998 16.1575 11.2221C15.8169 12.0444 15.2401 12.7472 14.5001 13.2416C13.7601 13.7361 12.89 14 12 14C10.8069 13.9987 9.6631 13.5242 8.81947 12.6806C7.97584 11.8369 7.50132 10.6931 7.50001 9.50003Z" fill="currentColor"/>
                        </svg>
                        <span className={style.genderLabel}>{t('completionModal.form.gender.options.female', '', { ns: 'profile' })}</span>
                    </label>
                </div>

                <Button variant="primary" size="lg" type="submit" className={style.submitButton} disabled={isLoading}>
                    {isLoading ? t('buttons.saving', '', { ns: 'common' }) : t('buttons.save', '', { ns: 'common' })}
                </Button>
            </form>
        </div>
    </div>
  )
} 