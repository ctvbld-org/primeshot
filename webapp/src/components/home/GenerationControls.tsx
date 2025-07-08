'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { useCreditGuard } from '@/hooks/useCreditGuard'
import { BATCH_PRICING, CREDIT_COSTS, ResolutionType } from '@/lib/constants/pricing'
import type { GenerationIntent } from '@/hooks/useGenerationIntent'
import { getApiUrl } from '@/lib/api/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@primeshot/common/web/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@primeshot/common/web/ui/popover'
import { ChevronDown, Settings } from 'lucide-react'
import styles from './GenerationControls.module.css'

export function GenerationControls() {
  // Local UI state
  const [batchSize, setBatchSize] = useState<number>(10)
  const [resolution, setResolution] = useState<ResolutionType>('1K')
  const [aspectRatio, setAspectRatio] = useState<string>('4:5')
  const [quality, setQuality] = useState<string>('Basic')


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
      await fetch(getApiUrl('/api/inference/mock'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize, resolution })
      })
      console.log('Inference requested', { batchSize, resolution })
    } catch (err) {
      console.error('Mock inference failed', err)
    }
  }

  // Listen for generation intent events
  useEffect(() => {
    const handleGenerationIntent = (event: CustomEvent<GenerationIntent>) => {
      console.log('Received generation intent event:', event.detail)
      // Execute the generation with the saved intent parameters
      handleGenerate()
    }

    window.addEventListener('execute-generation-intent', handleGenerationIntent as EventListener)

    return () => {
      window.removeEventListener('execute-generation-intent', handleGenerationIntent as EventListener)
    }
  }, [handleGenerate])

  return (
    <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-2 md:space-y-0 w-full md:w-auto">
      {/* Configuration Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button className={styles.trigger}>
            {/* Settings Icon */}
            <div className={styles.thumbnail}>
              <Settings className={`${styles.settingsIcon} w-6 h-6`} />
            </div>
            
            {/* Text */}
            <div className={styles.textContainer}>
              <p className={styles.primaryText}>Settings</p>
            </div>
            
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 bg-[#083533] border-[rgba(229,251,250,0.2)] text-white p-0" 
          align="start"
          side="bottom"
          sideOffset={8}
        >
          {/* Header */}
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>Generation Settings</h3>
          </div>
          
          {/* Settings */}
          <div className={styles.optionsContainer}>
            {/* Number of Takes */}
            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>Number of Takes</label>
              <Select value={batchSize.toString()} onValueChange={value => setBatchSize(Number(value))}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="item-aligned" className="bg-gray-800 border-gray-700">
                  {[5, 10, 15, 20].map(size => (
                    <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>Aspect Ratio</label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="item-aligned" className="bg-gray-800 border-gray-700">
                  <SelectItem value="4:5">4:5</SelectItem>
                  <SelectItem value="16:9">16:9</SelectItem>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="3:4">3:4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quality */}
            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>Quality</label>
              <Select 
                value={`${quality} ${resolution}`} 
                onValueChange={value => {
                  const [newQuality, newResolution] = value.split(' ')
                  setQuality(newQuality)
                  setResolution(newResolution as ResolutionType)
                }}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="item-aligned" className="bg-gray-800 border-gray-700">
                  <SelectItem value="Basic 1K">Basic 1K</SelectItem>
                  <SelectItem value="Standard 2K">Standard 2K</SelectItem>
                  <SelectItem value="High 4K">High 4K</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <button
        onClick={guard(handleGenerate)}
        className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-4 py-2 rounded-md text-sm"
      >
        Generate ({requiredCredits} cr)
      </button>
    </div>
  )
} 