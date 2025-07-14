'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useStyleSelection } from '@/contexts/style-selection-context'
import { useStyles, useScenes } from '@/hooks/useConfig'
import { useValidStyleOptions } from '@/lib/utils/style-validation'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import { getStoredStyleSelections, storeStyleSelections } from '@/lib/utils/style-storage'
import { Popover, PopoverContent, PopoverTrigger } from '@primeshot/common/web/ui/popover'
import { Icon } from '@primeshot/common/web/Icon'
import Image from 'next/image'
import styles from './SceneDropdown.module.css'

interface SceneDropdownProps {
  onSelect?: (sceneId: string) => void
}

export function SceneDropdown({ onSelect }: SceneDropdownProps) {
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const { selectedStyleId } = useStyleSelection()
  
  const { data: styleConfigs, isLoading: isLoadingStyles } = useStyles()
  const { data: sceneOptions, isLoading: isLoadingScenes } = useScenes()
  const { data: validOptions } = useValidStyleOptions()

  // Get available scenes for current style
  const currentStyleConfig = styleConfigs?.find(style => style.id === selectedStyleId)
  const availableSceneIds = currentStyleConfig?.available_scenes || []
  
  const filteredSceneOptions = useMemo(() => {
    return (sceneOptions || [])
      .filter(scene => availableSceneIds.includes(scene.value))
      .map(scene => ({
        id: scene.value,
        label: scene.label,
        image: scene.image ? getOptionsImage(scene.image) : ''
      }))
  }, [sceneOptions, availableSceneIds])

  // Load selection from localStorage when style changes (no more auto-defaults)
  useEffect(() => {
    if (!selectedStyleId || filteredSceneOptions.length === 0) return

    const stored = getStoredStyleSelections(selectedStyleId)
    if (stored.scene && filteredSceneOptions.some(opt => opt.id === stored.scene)) {
      setSelectedScene(stored.scene)
    } else {
      // No stored selection and no auto-default
      setSelectedScene(null)
    }
  }, [selectedStyleId, filteredSceneOptions])

  const handleSelect = (sceneId: string) => {
    setSelectedScene(sceneId)
    
    if (selectedStyleId) {
      storeStyleSelections(selectedStyleId, { scene: sceneId })
    }
    
    onSelect?.(sceneId)
  }

  const selectedOption = filteredSceneOptions.find(opt => opt.id === selectedScene)

  if (isLoadingStyles || isLoadingScenes) {
    return (
      <div className={styles.loading} />
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={styles.trigger}>
          {selectedOption ? (
            <>
              {/* Thumbnail */}
              <div className={styles.thumbnail}>
                <Image
                  src={selectedOption.image}
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
            </>
          ) : (
            <>
              {/* Empty state with icon */}
              <div className={styles.thumbnail}>
                <Icon variant="scene" size={48} className="text-gray-400" />
              </div>
              
              {/* Text */}
              <div className={styles.textContainer}>
                <p className={styles.primaryText}>Select Scene</p>
                <p className={styles.secondaryText}>Scene</p>
              </div>
            </>
          )}
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
          {filteredSceneOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`${styles.option} ${selectedScene === option.id ? styles.optionSelected : ''}`}
            >
              {/* Thumbnail */}
              <div className={styles.thumbnail}>
                <Image
                  src={option.image}
                  alt={option.label}
                  width={48}
                  height={48}
                  className={styles.thumbnailImage}
                />
              </div>
              
              {/* Label */}
              <span className={styles.optionLabel}>{option.label}</span>
              
              {/* Selected indicator */}
              {selectedScene === option.id && (
                <div className={styles.selectedIndicator} />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}