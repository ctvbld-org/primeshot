'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { InferenceSettingsFormDialog } from './inference-settings-form-dialog'
import { Button } from '@primeshot/common/web/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@primeshot/common/web/ui/tooltip'
import { Pencil, Trash } from 'lucide-react'
import { toast } from 'sonner'

interface Row { id?: string; key: string; value: any; updated_at?: string }

export function InferenceSettingsTable() {
  const [selectedRow, setSelectedRow] = useState<Row | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: rows = [], isLoading } = useQuery<Row[]>({
    queryKey: ['inference-settings'],
    queryFn: async () => {
      const res = await fetch('/api/inference/settings')
      if (!res.ok) throw new Error('Failed to fetch inference settings')
      const settings = await res.json()
      // Convert map to rows for the table
      return Object.keys(settings).map((k) => ({ key: k, value: settings[k] }))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(`/api/admin/inference-settings/${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete setting')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inference-settings'] })
      toast.success('Setting deleted')
    },
    onError: (e: any) => toast.error(e.message || 'Delete failed'),
  })

  const columns = [
    { accessorKey: 'key', header: 'Key' },
    {
      accessorKey: 'value',
      header: 'Value (JSON)',
      cell: ({ row }: any) => {
        const v = row.getValue('value')
        const preview = typeof v === 'object' ? JSON.stringify(v).slice(0, 80) + (JSON.stringify(v).length > 80 ? '…' : '') : String(v)
        return <span className="text-sm text-muted-foreground font-mono">{preview}</span>
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => {
        const r: Row = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => { setSelectedRow(r); setIsFormOpen(true) }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="px-3 py-2">
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm('Delete this setting?')) deleteMutation.mutate(r.key)
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="px-3 py-2">
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      },
    },
  ]

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="pt-6">
      <DataTable
        title="Inference Settings"
        columns={columns}
        data={rows}
        onAdd={() => { setSelectedRow(null); setIsFormOpen(true) }}
        addButtonLabel="Add Setting"
      />

      <InferenceSettingsFormDialog
        row={selectedRow}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => { setIsFormOpen(false); setSelectedRow(null); queryClient.invalidateQueries({ queryKey: ['inference-settings'] }) }}
      />
    </div>
  )
}


