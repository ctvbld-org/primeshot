import { createMultiEnvClient, type Environment } from '@/lib/supabase/multi-env'
import type {
  SyncableTable,
  SyncRequest,
  SyncResult,
  SyncProgress,
  TableChange,
  SyncDirection
} from './types'

/**
 * Helper function to sync style tables while preserving IDs to avoid foreign key violations
 * Style tables use 'value' as natural key but we need to preserve 'id' for foreign key integrity
 */
async function syncStyleTableRecord(
  sourceRecord: any,
  targetRecord: any | null,
  table: SyncableTable,
  targetClient: any,
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  const isStyleTable = ['style_scenes', 'style_wardrobes', 'style_colors'].includes(table)
  
  if (!isStyleTable) {
    throw new Error('syncStyleTableRecord should only be used for style tables')
  }

  if (operation === 'delete') {
    // For deletes, use the existing ID to avoid foreign key issues
    const deleteKey = targetRecord?.id || sourceRecord?.id
    if (!deleteKey) {
      throw new Error(`Cannot delete ${table} record: no ID found`)
    }
    
    console.log(`Deleting ${table} record with ID: ${deleteKey}`)
    const { error } = await targetClient
      .from(table)
      .delete()
      .eq('id', deleteKey)
    
    if (error) {
      // Check if it's a foreign key constraint error
      if (error.message.includes('foreign key constraint')) {
        throw new Error(`Cannot delete ${table} record: it is referenced by other records. Please delete dependent records first.`)
      }
      throw new Error(`Failed to delete ${table} record: ${error.message}`)
    }
    return
  }

  // Validate required fields for create/update operations
  if (!sourceRecord) {
    throw new Error(`Source record is required for ${operation} operation`)
  }

  const { created_at, updated_at, ...recordData } = sourceRecord
  
  // Validate that required fields exist
  if (!recordData.value) {
    throw new Error(`${table} record must have a 'value' field`)
  }
  
  if (operation === 'create') {
    console.log(`Creating ${table} record with value: ${recordData.value}`)
    
    // Check if a record with this value already exists
    const { data: existingRecords, error: checkError } = await targetClient
      .from(table)
      .select('id, value')
      .eq('value', recordData.value)
    
    if (checkError) {
      throw new Error(`Failed to check existing ${table} records: ${checkError.message}`)
    }
    
    if (existingRecords && existingRecords.length > 0) {
      // Record exists, treat as update to preserve ID
      const existingId = existingRecords[0].id
      console.log(`Record with value '${recordData.value}' already exists, updating existing record with ID: ${existingId}`)
      
      const { error } = await targetClient
        .from(table)
        .update(recordData)
        .eq('id', existingId)
      
      if (error) {
        throw new Error(`Failed to update existing ${table} record: ${error.message}`)
      }
    } else {
      // Truly new record, can insert normally
      const { error } = await targetClient
        .from(table)
        .insert(recordData)
      
      if (error) {
        // Check for unique constraint violations
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          throw new Error(`${table} record with value '${recordData.value}' already exists`)
        }
        throw new Error(`Failed to insert new ${table} record: ${error.message}`)
      }
    }
  } else if (operation === 'update') {
    // Update existing record by ID to preserve foreign key relationships
    if (!targetRecord?.id) {
      throw new Error(`Cannot update ${table} record: target record has no ID`)
    }
    
    console.log(`Updating ${table} record with ID: ${targetRecord.id}, value: ${recordData.value}`)
    
    const { error } = await targetClient
      .from(table)
      .update(recordData)
      .eq('id', targetRecord.id)
    
    if (error) {
      // Check for unique constraint violations
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        throw new Error(`${table} record with value '${recordData.value}' already exists`)
      }
      throw new Error(`Failed to update ${table} record: ${error.message}`)
    }
  }
}

/**
 * Validates that a sync operation won't cause foreign key constraint violations
 */
async function validateSyncOperation(
  table: SyncableTable,
  operation: 'create' | 'update' | 'delete',
  recordData: any,
  targetClient: any
): Promise<{ valid: boolean; warnings: string[] }> {
  const warnings: string[] = []
  
  // For style_wardrobes deletions, check if there are dependent inference_jobs
  if (table === 'style_wardrobes' && operation === 'delete' && recordData?.id) {
    const { data: dependentJobs, error } = await targetClient
      .from('inference_jobs')
      .select('id')
      .eq('wardrobe_id', recordData.id)
      .limit(1)
    
    if (error) {
      warnings.push(`Could not check for dependent inference_jobs: ${error.message}`)
    } else if (dependentJobs && dependentJobs.length > 0) {
      warnings.push(`Warning: This wardrobe is referenced by ${dependentJobs.length} inference job(s). Deletion may fail due to foreign key constraints.`)
    }
  }
  
  // Similar checks for other style tables
  if (table === 'style_scenes' && operation === 'delete' && recordData?.id) {
    const { data: dependentJobs, error } = await targetClient
      .from('inference_jobs')
      .select('id')
      .eq('scene_id', recordData.id)
      .limit(1)
    
    if (error) {
      warnings.push(`Could not check for dependent inference_jobs: ${error.message}`)
    } else if (dependentJobs && dependentJobs.length > 0) {
      warnings.push(`Warning: This scene is referenced by ${dependentJobs.length} inference job(s). Deletion may fail due to foreign key constraints.`)
    }
  }
  
  if (table === 'style_colors' && operation === 'delete' && recordData?.id) {
    const { data: dependentJobs, error } = await targetClient
      .from('inference_jobs')
      .select('id')
      .eq('color_id', recordData.id)
      .limit(1)
    
    if (error) {
      warnings.push(`Could not check for dependent inference_jobs: ${error.message}`)
    } else if (dependentJobs && dependentJobs.length > 0) {
      warnings.push(`Warning: This color is referenced by ${dependentJobs.length} inference job(s). Deletion may fail due to foreign key constraints.`)
    }
  }
  
  return { valid: true, warnings }
}

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
          
          const isStyleTable = ['style_scenes', 'style_wardrobes', 'style_colors'].includes(table)
          
          if (sourceRecord && !targetRecord) {
            // CREATE operation
            console.log(`Creating record ${changeId} in ${table}`)
            
            if (isStyleTable) {
              await syncStyleTableRecord(sourceRecord, null, table as SyncableTable, targetClient, 'create')
            } else {
              const { created_at, updated_at, ...recordData } = sourceRecord
              const onConflict = table === 'inference_settings' ? 'key' : 'id'

              const { error: upsertError } = await targetClient
                .from(table as SyncableTable)
                .upsert(recordData as any, { onConflict })

              if (upsertError) {
                throw new Error(`Failed to create record ${changeId}: ${upsertError.message}`)
              }
            }

          } else if (sourceRecord && targetRecord) {
            // UPDATE operation
            console.log(`Updating record ${changeId} in ${table}`)
            
            if (isStyleTable) {
              await syncStyleTableRecord(sourceRecord, targetRecord, table as SyncableTable, targetClient, 'update')
            } else {
              const { created_at, updated_at, ...recordData } = sourceRecord
              const onConflict = table === 'inference_settings' ? 'key' : 'id'

              const { error: upsertError } = await targetClient
                .from(table as SyncableTable)
                .upsert(recordData as any, { onConflict })

              if (upsertError) {
                throw new Error(`Failed to update record ${changeId}: ${upsertError.message}`)
              }
            }

          } else if (!sourceRecord && targetRecord) {
            // DELETE operation
            console.log(`Deleting record ${changeId} from ${table}`)
            
            if (isStyleTable) {
              await syncStyleTableRecord(null, targetRecord, table as SyncableTable, targetClient, 'delete')
            } else {
              const deleteKey = table === 'inference_settings' ? 'key' : 'id'
              const { error: deleteError } = await targetClient
                .from(table as SyncableTable)
                .delete()
                .eq(deleteKey, changeId as any)
              
              if (deleteError) {
                throw new Error(`Failed to delete record ${changeId}: ${deleteError.message}`)
              }
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
    const isStyleTable = ['style_scenes', 'style_wardrobes', 'style_colors'].includes(table)
    
    for (const change of changes) {
      switch (change.type) {
        case 'created':
          if (isStyleTable) {
            await syncStyleTableRecord(change.data, null, table, targetClient, 'create')
          } else {
            const { created_at, updated_at, ...recordData } = change.data
            const onConflict = table === 'inference_settings' ? 'key' : 'id'
            
            const { error } = await targetClient
              .from(table)
              .upsert(recordData as any, { onConflict })
            
            if (error) {
              throw new Error(`Failed to sync created record: ${error.message}`)
            }
          }
          break
          
        case 'updated':
          if (isStyleTable) {
            // For updates, we need the target record to preserve ID
            // Fetch it first if not provided in change.targetData
            let targetRecord = change.targetData
            if (!targetRecord) {
              const { data, error } = await targetClient
                .from(table)
                .select('*')
                .eq('value', change.data.value)
                .single()
              
              if (error) {
                throw new Error(`Failed to fetch target record for update: ${error.message}`)
              }
              targetRecord = data
            }
            
            await syncStyleTableRecord(change.data, targetRecord, table, targetClient, 'update')
          } else {
            const { created_at, updated_at, ...recordData } = change.data
            const onConflict = table === 'inference_settings' ? 'key' : 'id'
            
            const { error } = await targetClient
              .from(table)
              .upsert(recordData as any, { onConflict })
            
            if (error) {
              throw new Error(`Failed to sync updated record: ${error.message}`)
            }
          }
          break
          
        case 'deleted':
          if (isStyleTable) {
            await syncStyleTableRecord(null, change.data, table, targetClient, 'delete')
          } else {
            const deleteKey = table === 'inference_settings' ? 'key' : 'id'
            const { error: deleteError } = await targetClient
              .from(table)
              .delete()
              .eq(deleteKey, change.id)
            
            if (deleteError) {
              throw new Error(`Failed to delete record: ${deleteError.message}`)
            }
          }
          break
      }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
} 