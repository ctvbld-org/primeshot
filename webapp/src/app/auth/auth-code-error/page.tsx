'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next';
import { getCdnUrl } from '@/lib/utils/cdn';

export default function AuthCodeErrorPage() {
  const { t } = useTranslation('auth');
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center space-y-2 gap-4">
          <Image
            src={getCdnUrl('assets/logo-primeshot.svg')}
            alt="Primeshot"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <h1 className="text-2xl font-semibold">{t('authCodeError.title')}</h1>
          <p className="text-sm text-white">
            {t('authCodeError.description')}
          </p>
        </div>

        <Link
          href="/auth/signin"
          className="text-sm text-primary hover:underline"
        >
          {t('authCodeError.backLink')}
        </Link>
      </div>
    </div>
  )
} 