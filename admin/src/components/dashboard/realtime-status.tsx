'use client'


import { Badge } from '@primeshot/common/web/ui/badge'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { useRealtimeAnalytics } from '@/contexts/RealtimeAnalyticsContext'

interface RealtimeStatusProps {
  className?: string
}

export function RealtimeStatus({ className }: RealtimeStatusProps) {
  // Use the global realtime context for status monitoring
  const { isConnected, connectionError } = useRealtimeAnalytics()

  if (isConnected) {
    return (
      <Badge variant="outline" className={`text-green-600 border-green-200 bg-green-50 ${className}`}>
        <Wifi className="h-3 w-3 mr-1" />
        Live Updates Active
      </Badge>
    )
  }

  if (connectionError) {
    return (
      <Badge variant="outline" className={`text-red-600 border-red-200 bg-red-50 ${className}`}>
        <AlertCircle className="h-3 w-3 mr-1" />
        Connection Error
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={`text-gray-600 border-gray-200 bg-gray-50 ${className}`}>
      <WifiOff className="h-3 w-3 mr-1" />
      Connecting...
    </Badge>
  )
} 