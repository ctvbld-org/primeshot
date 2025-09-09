'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@primeshot/common/web/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@primeshot/common/web/ui/select'
import { Button } from '@primeshot/common/web/ui/button'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Loader2, RefreshCw, Upload, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { getEnvironmentLabel, type Environment } from '@/lib/supabase/multi-env'
import { ChangesSummary } from './changes-summary'
import { SyncProgress } from './sync-progress'
import type { SyncComparison, SyncRequest, SyncResult } from '@/lib/sync/types'
import { getApiUrl } from '@/lib/api'

interface SyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SyncDialog({ open, onOpenChange }: SyncDialogProps) {
  const [selectedTarget, setSelectedTarget] = useState<Environment | null>(null)
  const [selectedChanges, setSelectedChanges] = useState<{ [table: string]: (string | number)[] }>({})
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [showProgress, setShowProgress] = useState(false)

  // Fetch environment info
  const { data: envInfo } = useQuery({
    queryKey: ['environment-info'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/sync/compare'))
      if (!response.ok) throw new Error('Failed to fetch environment info')
      return response.json()
    },
    enabled: open,
  })

  // Fetch comparison when target is selected
  const { data: comparison, isLoading: isComparing, refetch: refetchComparison } = useQuery({
    queryKey: ['sync-comparison', selectedTarget],
    queryFn: async (): Promise<SyncComparison> => {
      const response = await fetch(getApiUrl('/api/sync/compare'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: selectedTarget }),
      })
      if (!response.ok) throw new Error('Failed to compare databases')
      return response.json()
    },
    enabled: open && !!selectedTarget,
  })

  // Clear selected changes when target environment changes
  useEffect(() => {
    if (selectedTarget) {
      setSelectedChanges({})
    }
  }, [selectedTarget])

  // Auto-select all changes when comparison data loads
  useEffect(() => {
    if (comparison && comparison.tables) {
      const autoSelected: { [table: string]: (string | number)[] } = {}
      comparison.tables.forEach(table => {
        if (table.totalChanges > 0) {
          autoSelected[table.table] = table.changes.map(change => change.id)
        }
      })
      setSelectedChanges(autoSelected)
    }
  }, [comparison])

  // Execute sync mutation
  const syncMutation = useMutation({
    mutationFn: async (request: Omit<SyncRequest, 'source'>) => {
      console.log('Starting sync with request:', request)
      
      const response = await fetch(getApiUrl('/api/sync/execute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      
      console.log('Sync response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Sync API error:', error)
        throw new Error(error.error || 'Failed to execute sync')
      }
      
      const result = await response.json() as SyncResult
      console.log('Sync result:', result)
      return result
    },
    onSuccess: (result) => {
      console.log('Sync completed successfully:', result)
      setSyncResult(result)
      setIsSyncing(false)
      if (result.success) {
        toast.success(`Successfully synced ${result.recordsProcessed} records across ${result.tablesProcessed} tables`)
      } else {
        toast.error(`Sync completed with ${result.errors.length} errors`)
      }
    },
    onError: (error) => {
      console.error('Sync mutation error:', error)
      setIsSyncing(false)
      setShowProgress(false)
      toast.error(`Sync failed: ${error.message}`)
    },
  })

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedTarget(null)
      setSelectedChanges({})
      setIsSyncing(false)
      setSyncResult(null)
      setShowProgress(false)
    }
  }, [open])

  const handleExecuteSync = () => {
    if (!selectedTarget || !comparison) return

    const totalChanges = Object.values(selectedChanges).reduce((sum, changes) => sum + changes.length, 0)
    if (totalChanges === 0) {
      toast.error('Please select at least one change to sync')
      return
    }

    setIsSyncing(true)
    setShowProgress(true)
    
    syncMutation.mutate({
      target: selectedTarget,
      selectedChanges,
    })
  }

  const handleRefresh = () => {
    refetchComparison()
  }

  if (!envInfo) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent fullscreen={true} className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col z-51">
        <DialogHeader>
          <DialogTitle>Deploy Database Changes</DialogTitle>
        </DialogHeader>

        <DialogBody>
          {/* Environment Selection */}
          <div className="flex items-center space-y-2 mb-4">
            <label className="text-sm font-medium flex-1 m-0">Deploy changes from <strong>{getEnvironmentLabel(envInfo.current)}</strong> to another environment</label>
            <Select value={selectedTarget || ''} onValueChange={(value) => setSelectedTarget(value as Environment)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select target environment" />
              </SelectTrigger>
              <SelectContent>
                {envInfo.availableTargets.map((env: Environment) => (
                  <SelectItem key={env} value={env}>
                    {getEnvironmentLabel(env)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isComparing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Comparing databases...
            </div>
          )}

          {/* Comparison Results */}
          {comparison && !isComparing && !showProgress && (
            <div className="flex-1 overflow-hidden flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">Changes Summary</h3>
                  <Badge variant="secondary">
                    {comparison.totalChanges} changes found
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isComparing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {comparison.totalChanges === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-6 w-6 mr-2" />
                  No changes detected between environments
                </div>
              ) : (
                <ChangesSummary
                  comparison={comparison}
                  selectedChanges={selectedChanges}
                  onSelectionChange={(table, selectedIds) => {
                    setSelectedChanges(prev => ({
                      ...prev,
                      [table]: selectedIds
                    }))
                  }}
                />
              )}
            </div>
          )}

          {/* Sync Progress */}
          {showProgress && !syncResult && isSyncing && (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Syncing to {getEnvironmentLabel(selectedTarget!)}</h3>
                <p className="text-muted-foreground">Please wait while we sync the selected changes...</p>
              </div>
            </div>
          )}

          {showProgress && syncResult && (
            <div className="flex-1 overflow-hidden">
              <SyncProgress result={syncResult} />
            </div>
          )}
        </DialogBody>

        {/* Actions */}
        <DialogFooter>
          <Button variant="tertiary" size="lg" onClick={() => onOpenChange(false)}>
            {showProgress ? 'Close' : 'Cancel'}
          </Button>
          
          {comparison && comparison.totalChanges > 0 && !showProgress && (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleExecuteSync}
              disabled={isSyncing || Object.values(selectedChanges).every(changes => changes.length === 0)}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Deploy Changes
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 