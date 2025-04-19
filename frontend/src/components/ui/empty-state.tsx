import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action 
}: EmptyStateProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center text-center p-8 space-y-4">
        {icon && <div className="text-muted-foreground opacity-50">{icon}</div>}
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-md">{description}</p>
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  )
} 