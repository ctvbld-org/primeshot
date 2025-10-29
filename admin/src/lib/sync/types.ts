import type { Environment } from '@/lib/supabase/multi-env'

export type SyncableTable = 
  | 'styles'
  | 'style_scenes'
  | 'style_wardrobes'
  | 'style_colors'
  | 'subscriptions'
  | 'credit_packs'
  | 'credit_costs'
  | 'inference_settings'

export type ChangeType = 'created' | 'updated' | 'deleted'

export type SyncDirection = 'deploy' | 'pull'

export interface FieldDiff {
  field: string
  oldValue: any
  newValue: any
  displayName: string
}

export interface TableChange {
  id: string | number
  type: ChangeType
  data: Record<string, any>
  displayName: string
  lastModified: string
  // For updates, include what actually changed
  diffs?: FieldDiff[]
  // For reference, include the target data for comparison
  targetData?: Record<string, any>
}

export interface TableChanges {
  table: SyncableTable
  tableName: string
  changes: TableChange[]
  totalChanges: number
  error?: string
}

export interface SyncComparison {
  source: Environment
  target: Environment
  tables: TableChanges[]
  totalChanges: number
  comparedAt: string
}

export interface SyncRequest {
  source: Environment
  target: Environment
  direction: SyncDirection
  selectedChanges: {
    [table: string]: (string | number)[] // IDs of selected changes
  }
}

export interface SyncProgress {
  table: SyncableTable
  processed: number
  total: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

export interface SyncResult {
  success: boolean
  tablesProcessed: number
  recordsProcessed: number
  errors: string[]
  progress: SyncProgress[]
}

export const SYNCABLE_TABLES: Record<SyncableTable, string> = {
  styles: 'Photography Styles',
  style_scenes: 'Scene Options',
  style_wardrobes: 'Wardrobe Options',
  style_colors: 'Color Options',
  subscriptions: 'Subscription Tiers',
  credit_packs: 'Credit Packs',
  credit_costs: 'Credit Costs',
  inference_settings: 'Inference Settings',
} 