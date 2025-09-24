import { createMultiEnvClient, type Environment } from '@/lib/supabase/multi-env'
import type {
  SyncableTable,
  SyncRequest,
  SyncResult,
  SyncProgress,
  TableChange,
  SyncDirection
} from './types'

export async function executSync(request: SyncRequest): Promise<SyncResult> {
  console.log('executSync called with request:', request)

  const { source, target, direction, selectedChanges } = request

  // For pull operations, reverse the source and target
  const actualSource = direction === 'pull' ? target : source
  const actualTarget = direction === 'pull' ? source : target

  console.log(`Syncing ${direction} from ${actualSource} to ${actualTarget}`)

  const sourceClient = createMultiEnvClient(actualSource)
  const targetClient = createMultiEnvClient(actualTarget)
  
  const progress: SyncProgress[] = []
  const errors: string[] = []
  let recordsProcessed = 0
  
  console.log('Selected changes:', selectedChanges)
  
  // Initialize progress for all tables
  for (const [table, changeIds] of Object.entries(selectedChanges)) {
    if (changeIds.length > 0) {
      console.log(`Initializing progress for table ${table} with ${changeIds.length} changes`)
      progress.push({
        table: table as SyncableTable,
        processed: 0,
        total: changeIds.length,
        status: 'pending'
      })
    }
  }
  
  // Process each table
  for (const [table, changeIds] of Object.entries(selectedChanges)) {
    if (changeIds.length === 0) continue
    
    console.log(`Processing table ${table} with ${changeIds.length} changes`)
    const tableProgress = progress.find(p => p.table === table)!
    tableProgress.status = 'processing'
    
    try {
      // We need to determine the operation type for each change ID
      // Re-run the comparison to get the actual change types
      console.log(`Re-detecting changes for table ${table} to determine operation types`)
      const [sourceData, targetData] = await Promise.all([
        sourceClient.from(table as SyncableTable).select('*'),
        targetClient.from(table as SyncableTable).select('*')
      ])
      
      if (sourceData.error) {
        throw new Error(`Failed to fetch source data for ${table}: ${sourceData.error.message}`)
      }
      if (targetData.error) {
        throw new Error(`Failed to fetch target data for ${table}: ${targetData.error.message}`)
      }
      
      // Use correct primary key for each table type
      const pk: 'id' | 'key' | 'value' = ['style_scenes', 'style_wardrobes', 'style_colors'].includes(table)
        ? 'value'
        : (table === 'inference_settings' ? 'key' : 'id')
      const sourceMap = new Map((sourceData.data as any[] || []).map((r: any) => [r[pk], r]))
      const targetMap = new Map((targetData.data as any[] || []).map((r: any) => [r[pk], r]))
      
      // Process each selected change ID
      for (const changeId of changeIds) {
        try {
          const sourceRecord = sourceMap.get(changeId)
          const targetRecord = targetMap.get(changeId)
          
          if (sourceRecord && !targetRecord) {
            // CREATE operation via upsert to respect natural unique keys
            console.log(`Creating record ${changeId} in ${table}`)
            const { created_at, updated_at, ...recordData } = sourceRecord
            const onConflict = ['style_scenes', 'style_wardrobes', 'style_colors'].includes(table) ? 'value' : (table === 'inference_settings' ? 'key' : 'id')

            const { error: upsertError } = await targetClient
              .from(table as SyncableTable)
              .upsert(recordData as any, { onConflict })

            if (upsertError) {
              throw new Error(`Failed to create record ${changeId}: ${upsertError.message}`)
            }

          } else if (sourceRecord && targetRecord) {
            // UPDATE operation via upsert to simplify and avoid key mismatches
            console.log(`Updating record ${changeId} in ${table}`)
            const { created_at, updated_at, ...recordData } = sourceRecord
            const onConflict = ['style_scenes', 'style_wardrobes', 'style_colors'].includes(table) ? 'value' : (table === 'inference_settings' ? 'key' : 'id')

            const { error: upsertError } = await targetClient
              .from(table as SyncableTable)
              .upsert(recordData as any, { onConflict })

            if (upsertError) {
              throw new Error(`Failed to update record ${changeId}: ${upsertError.message}`)
            }

          } else if (!sourceRecord && targetRecord) {
            // DELETE operation
            console.log(`Deleting record ${changeId} from ${table}`)
            
            const { error: deleteError } = await targetClient
              .from(table as SyncableTable)
              .delete()
              .eq(['style_scenes', 'style_wardrobes', 'style_colors'].includes(table)
                ? 'value'
                : (table === 'inference_settings' ? 'key' : 'id'), changeId as any)
            
            if (deleteError) {
              throw new Error(`Failed to delete record ${changeId}: ${deleteError.message}`)
            }
            
          } else {
            console.warn(`No operation needed for record ${changeId} in ${table} (not found in either database)`)
          }
          
          tableProgress.processed++
          recordsProcessed++
          console.log(`Successfully processed record ${changeId}`)
          
        } catch (recordError) {
          const errorMsg = `Error processing record ${changeId} in table ${table}: ${recordError}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }
      
      console.log(`Completed processing table ${table}`)
      tableProgress.status = 'completed'
    } catch (tableError) {
      const errorMsg = `Error syncing table ${table}: ${tableError}`
      errors.push(errorMsg)
      tableProgress.status = 'error'
      tableProgress.error = errorMsg
      console.error(errorMsg)
    }
  }
  
  const result = {
    success: errors.length === 0,
    tablesProcessed: progress.filter(p => p.status === 'completed').length,
    recordsProcessed,
    errors,
    progress
  }
  
  console.log('Sync execution completed:', result)
  return result
}

export async function syncSingleTable(
  source: Environment,
  target: Environment,
  table: SyncableTable,
  changes: TableChange[],
  direction: SyncDirection = 'deploy'
): Promise<{ success: boolean; error?: string }> {
  try {
    const sourceClient = createMultiEnvClient(source)
    const targetClient = createMultiEnvClient(target)
    
    for (const change of changes) {
      switch (change.type) {
        case 'created':
        case 'updated':
          // Remove database-specific fields
          const { created_at, updated_at, ...recordData } = change.data
          
          const { error } = await targetClient
            .from(table)
            .upsert(
              recordData as any,
              {
                onConflict: ['style_scenes', 'style_wardrobes', 'style_colors'].includes(table) ? 'value' : 'id'
              }
            )
          
          if (error) {
            throw new Error(`Failed to sync ${change.type} record: ${error.message}`)
          }
          break
          
        case 'deleted':
          const { error: deleteError } = await targetClient
            .from(table)
            .delete()
            .eq('id', change.id)
          
          if (deleteError) {
            throw new Error(`Failed to delete record: ${deleteError.message}`)
          }
          break
      }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
} 