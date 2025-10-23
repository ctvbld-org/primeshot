'use client'

// Stub for website
import { createContext, useContext, ReactNode } from 'react'

const DialogServiceContext = createContext<any>({
  openSubscriptionDialog: () => {},
  openCreditPackDialog: () => {}
})

export function useDialogService() {
  const context = useContext(DialogServiceContext)
  if (!context) {
    return {
      openSubscriptionDialog: () => {},
      openCreditPackDialog: () => {}
    }
  }
  return context
}

export function DialogServiceProvider({ children }: { children: ReactNode }) {
  const value = {
    openSubscriptionDialog: () => {},
    openCreditPackDialog: () => {}
  }
  return (
    <DialogServiceContext.Provider value={value}>
      {children}
    </DialogServiceContext.Provider>
  )
}

