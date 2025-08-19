import { createMultiEnvClient, type Environment } from '@/lib/supabase/multi-env'
import type { 
  SyncableTable, 
  TableChange, 
  TableChanges, 
  SyncComparison, 
  ChangeType,
  FieldDiff
} from './types'
import { SYNCABLE_TABLES } from './types'

interface DatabaseRecord {
  id?: string | number
  key?: string
  created_at?: string | null
  updated_at?: string | null
  [key: string]: any
}

function getDisplayName(table: SyncableTable, record: DatabaseRecord): string {
  switch (table) {
    case 'styles':
      return record.name || `Style ${record.id}`
    case 'style_scenes':
    case 'style_wardrobes':
    case 'style_colors':
      return record.label || `${table.replace('style_', '')} ${record.id}`
    case 'inference_settings':
      return record.key || `Setting ${record.id}`
    case 'subscriptions':
      return record.display_name || record.name || `Subscription ${record.id}`
    case 'credit_packs':
      return record.name || `${record.credits} Credits`
    case 'credit_costs':
      return `${record.type} - ${record.value} credits`
    default:
      return `Record ${record.id}`
  }
}

function getFieldDisplayName(field: string): string {
  const fieldMap: Record<string, string> = {
    name: 'Name',
    label: 'Label',
    display_name: 'Display Name',
    credits: 'Credits',
    type: 'Type',
    value: 'Value',
    price: 'Price',
    description: 'Description',
    updated_at: 'Last Updated',
    created_at: 'Created At',
    enabled: 'Enabled',
    active: 'Active',
    key: 'Key',
  }
  return fieldMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function calculateDiffs(sourceRecord: DatabaseRecord, targetRecord: DatabaseRecord): FieldDiff[] {
  const diffs: FieldDiff[] = []
  const excludeFields = ['created_at', 'updated_at', 'id', 'key']
  
  // Check all fields in source record
  for (const [field, newValue] of Object.entries(sourceRecord)) {
    if (excludeFields.includes(field)) continue
    
    const oldValue = targetRecord[field]
    
    // Deep comparison for objects/arrays, simple comparison for primitives
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      diffs.push({
        field,
        oldValue,
        newValue,
        displayName: getFieldDisplayName(field)
      })
    }
  }
  
  // Check for fields that exist in target but not in source (removed fields)
  for (const [field, oldValue] of Object.entries(targetRecord)) {
    if (excludeFields.includes(field)) continue
    if (!(field in sourceRecord)) {
      diffs.push({
        field,
        oldValue,
        newValue: undefined,
        displayName: getFieldDisplayName(field)
      })
    }
  }
  
  return diffs
}

async function fetchTableData(env: Environment, table: SyncableTable): Promise<DatabaseRecord[]> {
  const client = createMultiEnvClient(env)
  // Prefer updated_at ordering if present; otherwise fall back
  let { data, error } = await client.from(table).select('*').order('updated_at', { ascending: false } as any)
  if (error) {
    const res = await client.from(table).select('*')
    if (res.error) {
      throw new Error(`Failed to fetch ${table} from ${env}: ${res.error.message}`)
    }
    data = res.data
  }
  return (data as DatabaseRecord[]) || []
}

function compareRecords(
  sourceRecords: DatabaseRecord[], 
  targetRecords: DatabaseRecord[], 
  table: SyncableTable
): TableChange[] {
  const changes: TableChange[] = []
  const pk: 'id' | 'key' = table === 'inference_settings' ? 'key' : 'id'
  const targetMap = new Map(targetRecords.map(record => [record[pk] as any, record]))
  const sourceMap = new Map(sourceRecords.map(record => [record[pk] as any, record]))
  
  console.log(`Comparing ${table}: ${sourceRecords.length} source records vs ${targetRecords.length} target records`)
  
  // Check for created and updated records
  for (const sourceRecord of sourceRecords) {
    const sourceKey = (sourceRecord[pk] as any)
    const targetRecord = targetMap.get(sourceKey)
    
    if (!targetRecord) {
      // Record exists in source but not in target - created
      console.log(`${table} ${sourceRecord.id}: CREATED (not in target)`)
      changes.push({
        id: sourceKey ?? (sourceRecord.id as any),
        type: 'created',
        data: sourceRecord,
        displayName: getDisplayName(table, sourceRecord),
        lastModified: sourceRecord.updated_at || sourceRecord.created_at || new Date().toISOString(),
      })
    } else {
      // Record exists in both - check for actual differences
      const diffs = calculateDiffs(sourceRecord, targetRecord)
      
      if (diffs.length > 0) {
        console.log(`${table} ${sourceRecord.id}: UPDATED (${diffs.length} fields changed)`, diffs.map(d => d.field))
        changes.push({
          id: sourceKey ?? (sourceRecord.id as any),
          type: 'updated',
          data: sourceRecord,
          displayName: getDisplayName(table, sourceRecord),
          lastModified: sourceRecord.updated_at || sourceRecord.created_at || new Date().toISOString(),
          diffs,
          targetData: targetRecord,
        })
      } else {
        console.log(`${table} ${sourceRecord.id}: NO CHANGES (identical)`)
      }
    }
  }
  
  // Check for deleted records (exist in target but not in source)
  for (const targetRecord of targetRecords) {
    const targetKey = (targetRecord[pk] as any)
    if (!sourceMap.has(targetKey)) {
      console.log(`${table} ${targetRecord.id}: DELETED (not in source)`)
      changes.push({
        id: targetKey ?? (targetRecord.id as any),
        type: 'deleted',
        data: targetRecord,
        displayName: getDisplayName(table, targetRecord),
        lastModified: targetRecord.updated_at || targetRecord.created_at || new Date().toISOString(),
      })
    }
  }
  
  console.log(`${table} final changes: ${changes.length} total`)
  return changes.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
}

export async function detectChanges(
  source: Environment, 
  target: Environment
): Promise<SyncComparison> {
  const tables: TableChanges[] = []
  let totalChanges = 0
  
  const syncableTables = Object.keys(SYNCABLE_TABLES) as SyncableTable[]
  
  for (const table of syncableTables) {
    try {
      const [sourceData, targetData] = await Promise.all([
        fetchTableData(source, table),
        fetchTableData(target, table),
      ])
      
      const changes = compareRecords(sourceData, targetData, table)
      
      tables.push({
        table,
        tableName: SYNCABLE_TABLES[table],
        changes,
        totalChanges: changes.length,
      })
      
      totalChanges += changes.length
    } catch (error) {
      console.error(`Error comparing table ${table}:`, error)
      // Include error information in the response so users can see what went wrong
      tables.push({
        table,
        tableName: SYNCABLE_TABLES[table],
        changes: [],
        totalChanges: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  return {
    source,
    target,
    tables,
    totalChanges,
    comparedAt: new Date().toISOString(),
  }
} 