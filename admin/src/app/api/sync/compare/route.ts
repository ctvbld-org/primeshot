import { NextRequest, NextResponse } from 'next/server'
import { getCurrentEnvironment, getAvailableTargets, type Environment } from '@/lib/supabase/multi-env'
import { detectChanges } from '@/lib/sync/detector'
import type { SyncDirection } from '@/lib/sync/types'

export async function POST(request: NextRequest) {
  try {
    const { target, direction = 'deploy' } = await request.json()

    if (!target) {
      return NextResponse.json(
        { error: 'Target environment is required' },
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

    // For pull operations, reverse source and target for comparison
    const comparisonSource = direction === 'pull' ? target : source
    const comparisonTarget = direction === 'pull' ? source : target

    const comparison = await detectChanges(comparisonSource as Environment, comparisonTarget as Environment)

    return NextResponse.json(comparison)
  } catch (error) {
    console.error('Error comparing databases:', error)
    return NextResponse.json(
      { error: 'Failed to compare databases' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const current = getCurrentEnvironment()
    const availableTargets = getAvailableTargets()
    
    return NextResponse.json({
      current,
      availableTargets,
    })
  } catch (error) {
    console.error('Error getting environment info:', error)
    return NextResponse.json(
      { error: 'Failed to get environment info' },
      { status: 500 }
    )
  }
} 