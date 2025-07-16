'use client'

import { Badge } from '@primeshot/common/web/ui/badge'
import { Progress } from '@primeshot/common/web/ui/progress'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { ScrollArea } from '@primeshot/common/web/ui/scroll-area'
import type { SyncResult, SyncProgress as SyncProgressType } from '@/lib/sync/types'

interface SyncProgressProps {
  result: SyncResult
}

export function SyncProgress({ result }: SyncProgressProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const calculateProgress = (item: SyncProgressType) => {
    return item.total > 0 ? Math.round((item.processed / item.total) * 100) : 0
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sync Progress</h3>
        <Badge variant={result.success ? "default" : "destructive"}>
          {result.success ? 'Success' : 'Completed with errors'}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 border rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{result.tablesProcessed}</div>
          <div className="text-sm text-muted-foreground">Tables Processed</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-2xl font-bold text-green-600">{result.recordsProcessed}</div>
          <div className="text-sm text-muted-foreground">Records Synced</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
          <div className="text-sm text-muted-foreground">Errors</div>
        </div>
      </div>

      {result.progress.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Table Progress</h4>
          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {result.progress.map((item: SyncProgressType) => {
                const progress = calculateProgress(item)
                
                return (
                  <div key={item.table} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span className="font-medium">{item.table}</span>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(item.status)}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item.processed}/{item.total}
                      </span>
                    </div>
                    
                    <Progress value={progress} className="h-2" />
                    
                    {item.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        {item.error}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-red-600">Errors</h4>
          <ScrollArea className="max-h-32">
            <div className="space-y-2">
              {result.errors.map((error, index) => (
                <div 
                  key={index} 
                  className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200"
                >
                  {error}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
} 