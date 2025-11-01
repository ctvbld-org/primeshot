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

    // Use upsert on natural key 'value' and DO NOT send 'id' to avoid changing target IDs
    const upsertData = { ...recordData } as any
    delete upsertData.id

    const { error } = await targetClient
      .from(table)
      .upsert(upsertData, { onConflict: 'value' })

    if (error) {
      throw new Error(`Failed to upsert ${table} record: ${error.message}`)
    }
  } else if (operation === 'update') {
    // Update existing record by ID to preserve foreign key relationships
    if (!targetRecord?.id) {
      throw new Error(`Cannot update ${table} record: target record has no ID`)
    }
    
    console.log(`Updating ${table} record with ID: ${targetRecord.id}, value: ${recordData.value}`)
    console.log(`Target record current data:`, JSON.stringify(targetRecord, null, 2))
    console.log(`Source record data to apply:`, JSON.stringify(recordData, null, 2))
    
    // Preserve the target ID in the update data to ensure no ID change
    const updateData = { ...recordData, id: targetRecord.id }
    
    const { error } = await targetClient
      .from(table)
      .update(updateData)
      .eq('id', targetRecord.id)
    
    if (error) {
      console.error(`Update failed for ${table} record ID ${targetRecord.id}:`, error)
      
      // Check for foreign key constraint violations
      if (error.message.includes('foreign key constraint')) {
        throw new Error(`Cannot update ${table} record: it would violate foreign key constraints. This suggests there are dependent records that reference this ${table} record.`)
      }
      
      // Check for unique constraint violations
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        throw new Error(`${table} record with value '${recordData.value}' already exists`)
      }
      
      throw new Error(`Failed to update ${table} record: ${error.message}`)
    }
    
    console.log(`Successfully updated ${table} record ID: ${targetRecord.id}`)
  }
}

/**
 * Sanitizes explore_images record by removing foreign key references that don't exist in target environment
 * This allows explore images to be deployed independently without requiring all related data
 */
async function sanitizeExploreImageRecord(
  recordData: any,
  targetClient: any
): Promise<{ sanitizedData: any; warnings: string[] }> {
  const warnings: string[] = []
  const sanitizedData = { ...recordData }
  
  // Check foreign keys: generated_image_id and category_id
  const foreignKeyChecks = [
    { field: 'generated_image_id', table: 'generated_images', label: 'Generated Image' },
    { field: 'category_id', table: 'explore_categories', label: 'Category' }
  ]
  
  // Check each foreign key reference
  for (const { field, table, label } of foreignKeyChecks) {
    const foreignKeyValue = sanitizedData[field]
    
    if (foreignKeyValue) {
      // Check if the referenced record exists in target
      const { data, error } = await targetClient
        .from(table)
        .select('id')
        .eq('id', foreignKeyValue)
        .single()
      
      if (error || !data) {
        // Foreign key reference doesn't exist in target - null it out
        sanitizedData[field] = null
        warnings.push(`${label} reference (${foreignKeyValue}) not found in target environment - nulled out`)
        console.log(`Nulling out ${field} for explore_images: reference ${foreignKeyValue} doesn't exist in target`)
      }
    }
  }
  
  return { sanitizedData, warnings }
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
          
          console.log(`Processing ${table} record with changeId: ${changeId}`)
          console.log(`Source record found: ${!!sourceRecord}, Target record found: ${!!targetRecord}`)
          if (sourceRecord) console.log(`Source record ID: ${sourceRecord.id}`)
          if (targetRecord) console.log(`Target record ID: ${targetRecord.id}`)
          
          if (sourceRecord && !targetRecord) {
            // CREATE operation
            console.log(`Creating record ${changeId} in ${table}`)
            
            if (isStyleTable) {
              await syncStyleTableRecord(sourceRecord, null, table as SyncableTable, targetClient, 'create')
            } else {
              const { created_at, updated_at, ...recordData } = sourceRecord
              
              // Special handling for explore_images to sanitize foreign keys
              let finalRecordData = recordData
              if (table === 'explore_images') {
                console.log(`Sanitizing explore_images record before create`)
                const { sanitizedData, warnings } = await sanitizeExploreImageRecord(recordData, targetClient)
                finalRecordData = sanitizedData
                
                // Add warnings to errors array for user visibility
                if (warnings.length > 0) {
                  warnings.forEach(warning => {
                    console.warn(`[explore_images] ${warning}`)
                    errors.push(`[Warning] ${warning}`)
                  })
                }
              }
              
              const onConflict = table === 'inference_settings' ? 'key' : 'id'

              const { error: upsertError } = await targetClient
                .from(table as SyncableTable)
                .upsert(finalRecordData as any, { onConflict })

              if (upsertError) {
                throw new Error(`Failed to create record ${changeId}: ${upsertError.message}`)
              }
            }

          } else if (sourceRecord && targetRecord) {
            // UPDATE operation
            console.log(`Updating record ${changeId} in ${table}`)
            console.log(`Will preserve target ID: ${targetRecord.id} while updating with source data`)
            
            if (isStyleTable) {
              await syncStyleTableRecord(sourceRecord, targetRecord, table as SyncableTable, targetClient, 'update')
            } else {
              const { created_at, updated_at, ...recordData } = sourceRecord
              
              // Special handling for explore_images to sanitize foreign keys
              let finalRecordData = recordData
              if (table === 'explore_images') {
                console.log(`Sanitizing explore_images record before update`)
                const { sanitizedData, warnings } = await sanitizeExploreImageRecord(recordData, targetClient)
                finalRecordData = sanitizedData
                
                // Add warnings to errors array for user visibility
                if (warnings.length > 0) {
                  warnings.forEach(warning => {
                    console.warn(`[explore_images] ${warning}`)
                    errors.push(`[Warning] ${warning}`)
                  })
                }
              }
              
              const onConflict = table === 'inference_settings' ? 'key' : 'id'

              const { error: upsertError } = await targetClient
                .from(table as SyncableTable)
                .upsert(finalRecordData as any, { onConflict })

              if (upsertError) {
                throw new Error(`Failed to update record ${changeId}: ${upsertError.message}`)
              }
            }

          } else if (!sourceRecord && targetRecord) {
            // DELETE operation
            console.log(`Deleting record ${changeId} from ${table}`)
            console.log(`Target record to delete has ID: ${targetRecord.id}`)
            
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
            
            // Special handling for explore_images to sanitize foreign keys
            let finalRecordData = recordData
            if (table === 'explore_images') {
              console.log(`Sanitizing explore_images record before create`)
              const { sanitizedData, warnings } = await sanitizeExploreImageRecord(recordData, targetClient)
              finalRecordData = sanitizedData
              
              if (warnings.length > 0) {
                warnings.forEach(warning => console.warn(`[explore_images] ${warning}`))
              }
            }
            
            const onConflict = table === 'inference_settings' ? 'key' : 'id'
            
            const { error } = await targetClient
              .from(table)
              .upsert(finalRecordData as any, { onConflict })
            
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
            
            // Special handling for explore_images to sanitize foreign keys
            let finalRecordData = recordData
            if (table === 'explore_images') {
              console.log(`Sanitizing explore_images record before update`)
              const { sanitizedData, warnings } = await sanitizeExploreImageRecord(recordData, targetClient)
              finalRecordData = sanitizedData
              
              if (warnings.length > 0) {
                warnings.forEach(warning => console.warn(`[explore_images] ${warning}`))
              }
            }
            
            const onConflict = table === 'inference_settings' ? 'key' : 'id'
            
            const { error } = await targetClient
              .from(table)
              .upsert(finalRecordData as any, { onConflict })
            
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