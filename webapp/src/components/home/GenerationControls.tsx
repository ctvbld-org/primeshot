'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { useCreditGuard } from '@/hooks/useCreditGuard'
import { BATCH_PRICING, CREDIT_COSTS, ResolutionType } from '@/lib/constants/pricing'
import type { GenerationIntent } from '@/hooks/useGenerationIntent'
import { getApiUrl } from '@/lib/api/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@primeshot/common/web/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@primeshot/common/web/ui/popover'
import { ChevronDown, Settings } from 'lucide-react'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import styles from './GenerationControls.module.css'

// Storage keys for persisting settings
const STORAGE_KEYS = {
  BATCH_SIZE: 'generation-controls-batch-size',
  RESOLUTION: 'generation-controls-resolution',
  ASPECT_RATIO: 'generation-controls-aspect-ratio',
  QUALITY: 'generation-controls-quality'
}

// Helper functions for localStorage
const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

const loadFromStorage = (key: string, defaultValue: any): any => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.warn('Failed to load from localStorage:', error)
    return defaultValue
  }
}

export function GenerationControls() {
  // Local UI state - initialize from localStorage
  const [batchSize, setBatchSize] = useState<number>(() => loadFromStorage(STORAGE_KEYS.BATCH_SIZE, 10))
  const [resolution, setResolution] = useState<ResolutionType>(() => loadFromStorage(STORAGE_KEYS.RESOLUTION, '1K'))
  const [aspectRatio, setAspectRatio] = useState<string>(() => loadFromStorage(STORAGE_KEYS.ASPECT_RATIO, '4:5'))
  const [quality, setQuality] = useState<string>(() => loadFromStorage(STORAGE_KEYS.QUALITY, 'Basic'))

  // Subscription hooks
  const { data: subscription } = useCurrentSubscription()
  const { hasActiveSubscription } = useSubscriptionStatus()

  // Define quality options and their requirements
  const qualityOptions = [
    { value: 'Basic 1K', label: 'Basic 1K', resolution: '1K' as ResolutionType },
    { value: 'Standard 2K', label: 'Standard 2K', resolution: '2K' as ResolutionType },
    { value: 'High 4K', label: 'High 4K', resolution: '4K' as ResolutionType }
  ]

  // Determine available quality options based on subscription
  const getAvailableQualityOptions = useCallback(() => {
    if (!hasActiveSubscription) {
      // No active subscription - allow all options
      return qualityOptions.map(option => ({ ...option, disabled: false }))
    }

    const maxResolution = subscription?.max_resolution || '1K'
    
    return qualityOptions.map(option => {
      let disabled = false
      
      // Check if this option is disabled based on subscription tier
      if (maxResolution === '1K' && (option.resolution === '2K' || option.resolution === '4K')) {
        disabled = true
      } else if (maxResolution === '2K' && option.resolution === '4K') {
        disabled = true
      }
      
      return { ...option, disabled }
    })
  }, [hasActiveSubscription, subscription?.max_resolution])

  const availableQualityOptions = getAvailableQualityOptions()

  // Validate loaded settings on mount
  useEffect(() => {
    // Validate batch size - ensure it's one of the allowed options
    const allowedBatchSizes = [5, 10, 15, 20]
    if (!allowedBatchSizes.includes(batchSize)) {
      setBatchSize(10) // Reset to default
    }

    // Validate aspect ratio - ensure it's one of the allowed options
    const allowedAspectRatios = ['4:5', '16:9', '1:1', '3:4']
    if (!allowedAspectRatios.includes(aspectRatio)) {
      setAspectRatio('4:5') // Reset to default
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - values are checked from localStorage

  // Auto-adjust selected quality if it becomes unavailable
  useEffect(() => {
    const currentSelection = `${quality} ${resolution}`
    const currentOption = availableQualityOptions.find(opt => opt.value === currentSelection)
    
    if (currentOption?.disabled) {
      // Current selection is disabled, select the first available option
      const firstAvailable = availableQualityOptions.find(opt => !opt.disabled)
      if (firstAvailable) {
        const [newQuality, newResolution] = firstAvailable.value.split(' ')
        setQuality(newQuality)
        setResolution(newResolution as ResolutionType)
      }
    }
  }, [availableQualityOptions, quality, resolution])

  // Save settings to localStorage when they change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.BATCH_SIZE, batchSize)
  }, [batchSize])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RESOLUTION, resolution)
  }, [resolution])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ASPECT_RATIO, aspectRatio)
  }, [aspectRatio])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.QUALITY, quality)
  }, [quality])

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
                  {availableQualityOptions.map(option => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      disabled={option.disabled}
                      className={option.disabled ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        {option.disabled && (
                          <span className="text-xs text-gray-400 ml-2">
                            {hasActiveSubscription ? "Pro plan" : ""}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
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