'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@primeshot/common/web/ui/table'
import { Button } from '@primeshot/common/web/ui/button'
import { Input } from '@primeshot/common/web/ui/input'

import { Plus, Search, Languages, Trash2 } from 'lucide-react'
import { Checkbox } from '@primeshot/common/web/ui/checkbox'

interface DataTableProps<TData, TValue> {
  title?: string
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  onAdd?: () => void
  addButtonLabel?: string
  // Bulk translation props
  enableBulkTranslation?: boolean
  onBulkTranslate?: (selectedRows: TData[], onSuccess?: () => void) => void
  bulkTranslateLabel?: string
  isBulkTranslating?: boolean
  // Bulk delete props
  enableBulkDelete?: boolean
  onBulkDelete?: (selectedRows: TData[], onSuccess?: () => void) => void
  bulkDeleteLabel?: string
  isBulkDeleting?: boolean
}

export function DataTable<TData, TValue>({
  title,
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  onAdd,
  addButtonLabel = 'Add New',
  enableBulkTranslation = false,
  onBulkTranslate,
  bulkTranslateLabel = 'Bulk Translate',
  isBulkTranslating = false,
  enableBulkDelete = false,
  onBulkDelete,
  bulkDeleteLabel = 'Bulk Delete',
  isBulkDeleting = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Add checkbox column when bulk actions are enabled
  const columnsWithSelection = React.useMemo(() => {
    if (!enableBulkTranslation && !enableBulkDelete) return columns

    const selectColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectColumn, ...columns]
  }, [columns, enableBulkTranslation, enableBulkDelete])

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
  const hasSelectedRows = selectedRows.length > 0

  const handleBulkTranslate = () => {
    if (onBulkTranslate && hasSelectedRows && !isBulkTranslating && !isBulkDeleting) {
      onBulkTranslate(selectedRows, () => {
        // Clear selection after successful operation
        setRowSelection({})
      })
    }
  }

  const handleBulkDelete = () => {
    if (onBulkDelete && hasSelectedRows && !isBulkDeleting && !isBulkTranslating) {
      onBulkDelete(selectedRows, () => {
        // Clear selection after successful operation
        setRowSelection({})
      })
    }
  }

  const isAnyBulkOperationInProgress = isBulkTranslating || isBulkDeleting

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {title && (
            <h2 className="text-lg font-semibold">{title}</h2>
          )}
          {(enableBulkTranslation || enableBulkDelete) && hasSelectedRows && (
            <div className="text-sm text-muted-foreground">
              {selectedRows.length} selected
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {searchKey && (
            <div className="relative max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
                  onChange={(event) =>
                    table.getColumn(searchKey)?.setFilterValue(event.target.value)
                  }
                  className="pl-8"
                />
            </div>
          )}
          
          {enableBulkDelete && hasSelectedRows && (
            <Button 
              onClick={handleBulkDelete} 
              size="sm" 
              variant="destructive"
              className="gap-2"
              disabled={isAnyBulkOperationInProgress}
            >
              <Trash2 className={`h-4 w-4 ${isBulkDeleting ? 'animate-spin' : ''}`} />
              {isBulkDeleting ? 'Deleting...' : `${bulkDeleteLabel} (${selectedRows.length})`}
            </Button>
          )}
          
          {enableBulkTranslation && hasSelectedRows && (
            <Button 
              onClick={handleBulkTranslate} 
              size="sm" 
              variant="outline"
              className="gap-2"
              disabled={isAnyBulkOperationInProgress}
            >
              <Languages className={`h-4 w-4 ${isBulkTranslating ? 'animate-spin' : ''}`} />
              {isBulkTranslating ? 'Translating...' : `${bulkTranslateLabel} (${selectedRows.length})`}
            </Button>
          )}
          
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {addButtonLabel}
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnsWithSelection.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}