'use client'

import { createContext, useState, useContext, useCallback, useEffect, type ReactNode } from 'react'
import { Dialog, DialogContent } from '@primeshot/common/web/ui/dialog'

interface DialogServiceValue {
  openDialog: (content: ReactNode) => void
  closeDialog: () => void
}

const DialogServiceContext = createContext<DialogServiceValue | undefined>(undefined)

export const dialogServiceSingleton: DialogServiceValue = {
  openDialog: () => console.warn('DialogService not ready'),
  closeDialog: () => {}
}

export function DialogServiceProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState<ReactNode>(null)

  const openDialog = useCallback((node: ReactNode) => {
    setContent(node)
    setOpen(true)
  }, [])

  const closeDialog = useCallback(() => setOpen(false), [])

  // expose to singleton so non-React files can call it
  useEffect(() => {
    dialogServiceSingleton.openDialog = openDialog
    dialogServiceSingleton.closeDialog = closeDialog
  }, [openDialog, closeDialog])

  return (
    <DialogServiceContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>{content}</DialogContent>
      </Dialog>
    </DialogServiceContext.Provider>
  )
}

export function useDialogService() {
  const ctx = useContext(DialogServiceContext)
  if (!ctx) throw new Error('useDialogService must be used within DialogServiceProvider')
  return ctx
} 