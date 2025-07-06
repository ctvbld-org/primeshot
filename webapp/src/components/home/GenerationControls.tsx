'use client'

import React, { useCallback, useState } from 'react'
import { useCreditGuard } from '@/hooks/useCreditGuard'
import { BATCH_PRICING, CREDIT_COSTS, ResolutionType } from '@/lib/constants/pricing'

export function GenerationControls() {
  // Local UI state
  const [batchSize, setBatchSize] = useState<number>(5)
  const [resolution, setResolution] = useState<ResolutionType>('1K')

  // Compute required credits dynamically
  const computeRequiredCredits = useCallback(() => {
    const batchEntry = BATCH_PRICING[resolution].find(b => b.size === batchSize)
    if (batchEntry) return batchEntry.credits
    // fallback
    return CREDIT_COSTS.IMAGE_GENERATION[resolution] * batchSize
  }, [batchSize, resolution])

  const requiredCredits = computeRequiredCredits()

  const guard = useCreditGuard(requiredCredits)

  const handleGenerate = async () => {
    // Mock inference API call
    try {
      await fetch('/api/inference/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize, resolution })
      })
      console.log('Inference requested', { batchSize, resolution })
    } catch (err) {
      console.error('Mock inference failed', err)
    }
  }

  return (
    <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-2 md:space-y-0 border border-dashed border-gray-500 p-4 rounded-md w-full md:w-auto">
      {/* Batch size selection */}
      <select
        className="bg-gray-800 text-white p-2 rounded-md text-sm"
        value={batchSize}
        onChange={e => setBatchSize(Number(e.target.value))}
      >
        {[5, 10, 15, 20].map(size => (
          <option key={size} value={size}>{size} takes</option>
        ))}
      </select>

      {/* Resolution selection */}
      <select
        className="bg-gray-800 text-white p-2 rounded-md text-sm"
        value={resolution}
        onChange={e => setResolution(e.target.value as ResolutionType)}
      >
        <option value="1K">1K</option>
        <option value="2K">2K</option>
        <option value="4K">4K</option>
      </select>

      {/* Quality placeholder (unchanged) */}
      <select className="bg-gray-800 text-white p-2 rounded-md text-sm">
        <option>Basic</option>
        <option>Standard</option>
        <option>High</option>
      </select>

      <button
        onClick={guard(handleGenerate)}
        className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-4 py-2 rounded-md text-sm"
      >
        Generate ({requiredCredits} cr)
      </button>
    </div>
  )
} 