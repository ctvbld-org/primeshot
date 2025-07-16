"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import styles from "./dialog.module.css"
import { Icon } from "../Icon"
import { useTranslation } from "react-i18next"
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-slot="dialog-overlay"
    className={`${styles.overlay} ${className || ''}`}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

function DialogContent({
  className,
  children,
  fullscreen = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  fullscreen?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={`${styles.dialog} ${fullscreen ? styles.fullscreen : ''} ${className || ''}`}
        {...props}
      >
        <div className={styles.content}>
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  const { t } = useTranslation('common')

  return (
    <div
      data-slot="dialog-header"
      className={`${styles.header} ${className || ''}`}
      {...props}
      >
        {children}
      <DialogPrimitive.Close className={styles.closeButton}>
        <Icon variant="cross" size={24} className={styles.closeIcon} />
        <span className="sr-only">{t('buttons.close')}</span>
      </DialogPrimitive.Close>
    </div>
  )
}

function DialogBody({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`${styles.body} ${className || ''}`} {...props}>
      {children}
    </div>
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={`${styles.footer} ${className || ''}`}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={`${styles.title} ${className || ''}`}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={`${styles.description} ${className || ''}`}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogBody,
  DialogTrigger,
}
