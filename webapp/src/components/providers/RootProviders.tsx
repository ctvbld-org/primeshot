'use client'

import React from 'react'
import { AuthProvider } from '@primeshot/common'
import { LanguageProvider } from '@primeshot/common'
import I18nProvider from '@/components/providers/I18nProvider'
import { QueryProvider } from '@/components/providers/query-provider'
import { BannerProvider } from '@primeshot/common/web/ui/use-banner'
import { DialogServiceProvider } from '@/contexts/DialogServiceContext'
import { InferenceQueueProvider } from '@/contexts/inference-queue-context'
import { IntentHandler } from '@/components/providers/intent-handler'
import QueryParamCleaner from '@/components/shared/QueryParamCleaner'
import { Header } from '@primeshot/common'
import { CreditsHeaderRight } from '@/components/header/CreditsHeaderRight'
import { Toaster } from '@primeshot/common/web/ui/toaster'

export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <I18nProvider>
        <LanguageProvider>
          <QueryProvider>
            <BannerProvider>
              <DialogServiceProvider>
                <InferenceQueueProvider>
                  <IntentHandler />
                  <QueryParamCleaner />
                  <Header rightSlot={<CreditsHeaderRight />} />
                  {children}
                  <Toaster />
                </InferenceQueueProvider>
              </DialogServiceProvider>
            </BannerProvider>
          </QueryProvider>
        </LanguageProvider>
      </I18nProvider>
    </AuthProvider>
  )
}


