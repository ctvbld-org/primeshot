'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useStyleSelection } from '@/contexts/style-selection-context'
import { useStyleConfigs, useOption } from '@/hooks/useConfig'
import { useTranslatedOption } from '@/hooks/useTranslatedOption'
import { useValidStyleOptions } from '@/lib/utils/style-validation'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import { getStoredStyleSelections, storeStyleSelections } from '@/lib/utils/style-storage'
import { Popover, PopoverContent, PopoverTrigger } from '@primeshot/common/web/ui/popover'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import styles from './SceneDropdown.module.css'

interface SceneDropdownProps {
  onSelect?: (backgroundId: string) => void
}

export function SceneDropdown({ onSelect }: SceneDropdownProps) {
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null)
  const { selectedStyleId } = useStyleSelection()
  
  const { data: styleConfigs, isLoading: isLoadingStyles } = useStyleConfigs()
  const { data: rawBackgroundOptions, isLoading: isLoadingBackground } = useOption('background')
  const backgroundOptions = useTranslatedOption(rawBackgroundOptions)
  const { data: validOptions } = useValidStyleOptions()

  // Get available backgrounds for current style
  const currentStyleConfig = styleConfigs?.find(style => style.id === selectedStyleId)
  const availableBackgroundIds = currentStyleConfig?.available_backgrounds || []
  
  const filteredBackgroundOptions = useMemo(() => {
    return (backgroundOptions?.options || [])
      .filter(option => availableBackgroundIds.includes(option.id))
      .map(option => ({
        id: option.id,
        label: option.label,
        imageUrl: option.imageUrl ? getOptionsImage(option.imageUrl) : ''
      }))
  }, [backgroundOptions?.options, availableBackgroundIds])

  // Load selection from localStorage when style changes
  useEffect(() => {
    if (!selectedStyleId || filteredBackgroundOptions.length === 0) return

    const stored = getStoredStyleSelections(selectedStyleId)
    if (stored.background && filteredBackgroundOptions.some(opt => opt.id === stored.background)) {
      setSelectedBackground(stored.background)
    } else {
      // Default to first option
      const defaultBackground = filteredBackgroundOptions[0]?.id
      if (defaultBackground) {
        setSelectedBackground(defaultBackground)
        storeStyleSelections(selectedStyleId, { background: defaultBackground })
      }
    }
  }, [selectedStyleId, filteredBackgroundOptions])

  const handleSelect = (backgroundId: string) => {
    setSelectedBackground(backgroundId)
    
    if (selectedStyleId) {
      storeStyleSelections(selectedStyleId, { background: backgroundId })
    }
    
    onSelect?.(backgroundId)
  }

  const selectedOption = filteredBackgroundOptions.find(opt => opt.id === selectedBackground)

  if (isLoadingStyles || isLoadingBackground || !selectedOption) {
    return (
      <div className={styles.loading} />
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={styles.trigger}>
          {/* Thumbnail */}
          <div className={styles.thumbnail}>
            <Image
              src={selectedOption.imageUrl}
              alt={selectedOption.label}
              width={48}
              height={48}
              className={styles.thumbnailImage}
            />
          </div>
          
          {/* Text */}
          <div className={styles.textContainer}>
            <p className={styles.primaryText}>{selectedOption.label}</p>
            <p className={styles.secondaryText}>Scene</p>
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
          <h3 className={styles.dropdownTitle}>Choose your scene</h3>
        </div>
        
        {/* Options list */}
        <div className={styles.optionsContainer}>
          {filteredBackgroundOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`${styles.option} ${selectedBackground === option.id ? styles.optionSelected : ''}`}
            >
              {/* Thumbnail */}
              <div className={styles.thumbnail}>
                <Image
                  src={option.imageUrl}
                  alt={option.label}
                  width={48}
                  height={48}
                  className={styles.thumbnailImage}
                />
              </div>
              
              {/* Label */}
              <span className={styles.optionLabel}>{option.label}</span>
              
              {/* Selected indicator */}
              {selectedBackground === option.id && (
                <div className={styles.selectedIndicator} />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}