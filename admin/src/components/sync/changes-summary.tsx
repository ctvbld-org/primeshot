'use client'

import { useState } from 'react'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Button } from '@primeshot/common/web/ui/button'
import { Checkbox } from '@primeshot/common/web/ui/checkbox'
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, ArrowRight } from 'lucide-react'
import type { SyncComparison, TableChanges, TableChange, ChangeType, FieldDiff } from '@/lib/sync/types'

interface ChangesSummaryProps {
  comparison: SyncComparison
  selectedChanges: { [table: string]: (string | number)[] }
  onSelectionChange: (table: string, selectedIds: (string | number)[]) => void
}

const changeTypeConfig: Record<ChangeType, { icon: React.ReactNode; color: string; label: string }> = {
  created: { icon: <Plus className="h-3 w-3" />, color: 'bg-green-500', label: 'Created' },
  updated: { icon: <Edit className="h-3 w-3" />, color: 'bg-blue-500', label: 'Updated' },
  deleted: { icon: <Trash2 className="h-3 w-3" />, color: 'bg-red-500', label: 'Deleted' },
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function ChangeRow({ change, isSelected, onToggle }: {
  change: TableChange
  isSelected: boolean
  onToggle: () => void
}) {
  const [showDiffs, setShowDiffs] = useState(false)
  const config = changeTypeConfig[change.type]
  
  return (
    <div className="border-b border-muted/30 last:border-b-0">
      <div className="flex items-center space-x-3 py-2 px-3 hover:bg-muted/50 rounded-sm">
        <Checkbox checked={isSelected} onCheckedChange={onToggle} />
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {config.icon}
          <span className="text-sm truncate">{change.displayName}</span>
          {change.type === 'updated' && change.diffs && change.diffs.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {change.diffs.length} field{change.diffs.length !== 1 ? 's' : ''} changed
            </Badge>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {config.label}
        </Badge>
        {change.type === 'updated' && change.diffs && change.diffs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto"
            onClick={() => setShowDiffs(!showDiffs)}
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${showDiffs ? 'rotate-180' : ''}`} />
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          {new Date(change.lastModified).toLocaleDateString()}
        </span>
      </div>
      
      {/* Show diffs for updates */}
      {showDiffs && change.type === 'updated' && change.diffs && (
        <div className="px-6 pb-2 space-y-1">
          {change.diffs.map((diff, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <span className="font-medium text-muted-foreground min-w-20">{diff.displayName}:</span>
              <span className="text-red-600 line-through">{formatValue(diff.oldValue)}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-green-600">{formatValue(diff.newValue)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TableSection({ tableChanges, selectedIds, onSelectionChange }: {
  tableChanges: TableChanges
  selectedIds: (string | number)[]
  onSelectionChange: (selectedIds: (string | number)[]) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  if (tableChanges.totalChanges === 0) {
    return null
  }

  const allIds = tableChanges.changes.map(change => change.id)
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id))
  const isPartiallySelected = selectedIds.some(id => allIds.includes(id))

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(allIds)
    }
  }

  const handleToggleChange = (changeId: string | number) => {
    if (selectedIds.includes(changeId)) {
      onSelectionChange(selectedIds.filter(id => id !== changeId))
    } else {
      onSelectionChange([...selectedIds, changeId])
    }
  }

  const changesByType = tableChanges.changes.reduce((acc, change) => {
    acc[change.type] = (acc[change.type] || 0) + 1
    return acc
  }, {} as Record<ChangeType, number>)

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-muted/30 border-b">
        <div className="flex items-center space-x-3">          
          <Checkbox 
            checked={isAllSelected}
            ref={(el) => {
              if (el) {
                const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement
                if (input) input.indeterminate = isPartiallySelected && !isAllSelected
              }
            }}
            onCheckedChange={handleSelectAll}
          />
          
          <h4 className="font-medium">{tableChanges.tableName}</h4>
          
          <Badge variant="secondary">
            {tableChanges.totalChanges} changes
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          {Object.entries(changesByType).map(([type, count]) => {
            const config = changeTypeConfig[type as ChangeType]
            return (
              <div key={type} className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                <span className="text-xs text-muted-foreground">{count}</span>
              </div>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="max-h-60 overflow-y-auto">
          {tableChanges.changes.map((change) => (
            <ChangeRow
              key={`${change.id}-${change.type}`}
              change={change}
              isSelected={selectedIds.includes(change.id)}
              onToggle={() => handleToggleChange(change.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ChangesSummary({ comparison, selectedChanges, onSelectionChange }: ChangesSummaryProps) {
  const tablesWithChanges = comparison.tables.filter(table => table.totalChanges > 0)
  
  if (tablesWithChanges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No changes detected between environments
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Select the changes you want to deploy to {comparison.target}
        </div>
        <div className="text-xs text-muted-foreground">
          Last compared: {new Date(comparison.comparedAt).toLocaleString()}
        </div>
      </div>
      
      {tablesWithChanges.map((tableChanges) => (
        <TableSection
          key={tableChanges.table}
          tableChanges={tableChanges}
          selectedIds={selectedChanges[tableChanges.table] || []}
          onSelectionChange={(selectedIds) => onSelectionChange(tableChanges.table, selectedIds)}
        />
      ))}
    </div>
  )
} 