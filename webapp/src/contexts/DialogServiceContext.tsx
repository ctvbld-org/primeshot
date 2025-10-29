'use client'

import { createContext, useState, useContext, useCallback, useEffect, type ReactNode } from 'react'
import { Dialog, DialogContent } from '@primeshot/common/web/ui/dialog'
import { DialogTitle, DialogDescription, DialogHeader } from '@primeshot/common/web/ui/dialog'

interface DialogServiceValue {
  openDialog: (content: ReactNode, options?: { title?: string; description?: string }) => void
  closeDialog: () => void
  hideHeader: boolean
}

const DialogServiceContext = createContext<DialogServiceValue | undefined>(undefined)

export const dialogServiceSingleton: DialogServiceValue = {
  openDialog: () => console.warn('DialogService not ready'),
  closeDialog: () => {},
  hideHeader: true
}

export function DialogServiceProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState<ReactNode>(null)
  const [title, setTitle] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState<string | undefined>(undefined)

  const openDialog = useCallback((node: ReactNode, options?: { title?: string; description?: string }) => {
    setContent(node)
    setTitle(options?.title)
    setDescription(options?.description)
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
        hideHeader: Boolean(el.props?.hideHeader),
        panelKeepOpen: Boolean(el.props?.panelKeepOpen),
        dialogContentClassName: (el.props?.dialogContentClassName || (el.type && (el.type as any).dialogContentClassNameDefault)) as string | undefined,
      }
    }
    return { fullscreen: false, noContainer: false, selfManaged: false, hideHeader: false, panelKeepOpen: false, dialogContentClassName: undefined }
  })()

  return (
    <DialogServiceContext.Provider value={{ openDialog, closeDialog, hideHeader: derivedWrapperProps.hideHeader }}>
      {children}
      {derivedWrapperProps.selfManaged ? (
        open ? <>{content}</> : null
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent fullscreen={derivedWrapperProps.fullscreen} noContainer={derivedWrapperProps.noContainer} panelKeepOpen={derivedWrapperProps.panelKeepOpen} contentClassName={derivedWrapperProps.dialogContentClassName}>
            {/* Always include accessible title/description (visually hidden) */}
            <DialogTitle style={{position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0}}>
              {title ?? 'Dialog'}
            </DialogTitle>
            <DialogDescription style={{position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0}}>
              {description ?? 'Content'}
            </DialogDescription>
            {!derivedWrapperProps.hideHeader && <DialogHeader />}
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