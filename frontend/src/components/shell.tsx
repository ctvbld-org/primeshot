import * as React from "react"
import { cn } from "@/lib/utils"

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function Shell({
  children,
  header,
  footer,
  className,
  ...props
}: ShellProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)} {...props}>
      {header && <header>{header}</header>}
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
      {footer && <footer>{footer}</footer>}
    </div>
  )
} 