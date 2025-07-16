import { NextRequest, NextResponse } from 'next/server'
import { getCurrentEnvironment, getAvailableTargets, type Environment } from '@/lib/supabase/multi-env'
import { executSync } from '@/lib/sync/engine'
import type { SyncRequest } from '@/lib/sync/types'

export async function POST(request: NextRequest) {
  try {
    const body: Omit<SyncRequest, 'source'> = await request.json()
    const { target, selectedChanges } = body
    
    if (!target || !selectedChanges) {
      return NextResponse.json(
        { error: 'Target environment and selected changes are required' },
        { status: 400 }
      )
    }
    
    const source = getCurrentEnvironment()
    const availableTargets = getAvailableTargets()
    
    if (!availableTargets.includes(target as Environment)) {
      return NextResponse.json(
        { error: `Invalid target environment. Available targets: ${availableTargets.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validate that we have at least some changes to sync
    const totalChanges = Object.values(selectedChanges).reduce((sum, changes) => sum + changes.length, 0)
    if (totalChanges === 0) {
      return NextResponse.json(
        { error: 'No changes selected for synchronization' },
        { status: 400 }
      )
    }
    
    const syncRequest: SyncRequest = {
      source,
      target: target as Environment,
      selectedChanges
    }
    
    const result = await executSync(syncRequest)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error executing sync:', error)
    return NextResponse.json(
      { error: 'Failed to execute synchronization' },
      { status: 500 }
    )
  }
} 