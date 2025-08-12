'use client'

import { createContext, useState, useContext, useCallback, useEffect, type ReactNode } from 'react'
import { Dialog, DialogContent } from '@primeshot/common/web/ui/dialog'
import { DialogHeader, DialogTitle } from '@primeshot/common/web/ui/dialog'

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

  // Derive wrapper props from the provided content element
  const derivedWrapperProps = (() => {
    if (content && typeof content === 'object' && (content as any).type) {
      const el = content as any
      return {
        fullscreen: Boolean(el.props?.fullscreen),
        noContainer: Boolean(el.props?.noContainer),
        selfManaged: Boolean(el.props?.selfManaged || el.props?.wrapWithDialog === false),
      }
    }
    return { fullscreen: false, noContainer: false, selfManaged: false }
  })()

  return (
    <DialogServiceContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      {derivedWrapperProps.selfManaged ? (
        open ? <>{content}</> : null
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent fullscreen={derivedWrapperProps.fullscreen} noContainer={derivedWrapperProps.noContainer}>
            <DialogHeader>
              <DialogTitle style={{position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0}}>
                Dialog
              </DialogTitle>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      )}
    </DialogServiceContext.Provider>
  )
}

export function useDialogService() {
  const ctx = useContext(DialogServiceContext)
  if (!ctx) throw new Error('useDialogService must be used within DialogServiceProvider')
  return ctx
} 