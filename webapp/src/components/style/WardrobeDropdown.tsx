'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef, type FC, type KeyboardEvent } from 'react'
import { useStyleSelection } from '@/contexts/style-selection-context'
import { useStyles, useWardrobes, useColors } from '@/hooks/useConfig'
import { useValidStyleOptions } from '@/lib/utils/style-validation'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import { getStoredStyleSelections, storeStyleSelections } from '@/lib/utils/style-storage'
import { Popover, PopoverContent, PopoverTrigger } from '@primeshot/common/web/ui/popover'
import { Icon } from '@primeshot/common/web/Icon'
import Image from 'next/image'
import { ChevronDown, ArrowLeft } from 'lucide-react'
import styles from './WardrobeDropdown.module.css'

interface WardrobeDropdownProps {
  onSelect?: (wardrobeId: string, colorId: string) => void
}

interface WardrobeOption {
  id: string
  label: string
  image: string
}

interface ColorOption {
  id: string
  label: string
  color: string
}

export const WardrobeDropdown: FC<WardrobeDropdownProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'wardrobe' | 'color'>('wardrobe')
  const [selectedWardrobe, setSelectedWardrobe] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [tempWardrobeSelection, setTempWardrobeSelection] = useState<string | null>(null)
  const [tempColorSelection, setTempColorSelection] = useState<string | null>(null)
  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number>(-1)
  const { selectedStyleId } = useStyleSelection()
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { data: styleConfigs, isLoading: isLoadingStyles } = useStyles()
  const { data: wardrobeOptions, isLoading: isLoadingWardrobes } = useWardrobes()
  const { data: colorOptions, isLoading: isLoadingColors } = useColors()
  const { data: validOptions } = useValidStyleOptions()

  // Get available options for current style
  const currentStyleConfig = styleConfigs?.find(style => style.id === selectedStyleId)
  const availableWardrobeIds = currentStyleConfig?.available_wardrobes || []
  const availableColorIds = currentStyleConfig?.available_colors || []
  
  const filteredWardrobeOptions: WardrobeOption[] = useMemo(() => {
    return (wardrobeOptions || [])
      .filter(wardrobe => availableWardrobeIds.includes(wardrobe.value))
      .map(wardrobe => ({
        id: wardrobe.value,
        label: wardrobe.label,
        image: wardrobe.image ? getOptionsImage(wardrobe.image) : ''
      }))
  }, [wardrobeOptions, availableWardrobeIds])

  const filteredColorOptions: ColorOption[] = useMemo(() => {
    return (colorOptions || [])
      .filter(color => availableColorIds.includes(color.value))
      .map(color => ({
        id: color.value,
        label: color.label,
        color: color.color || '#FFFFFF'
      }))
  }, [colorOptions, availableColorIds])

  // Helper functions for selection management
  const loadStoredWardrobeSelection = useCallback(() => {
    if (!selectedStyleId) return null
    const stored = getStoredStyleSelections(selectedStyleId)
    return stored.wardrobe && filteredWardrobeOptions.some(opt => opt.id === stored.wardrobe) 
      ? stored.wardrobe 
      : null
  }, [selectedStyleId, filteredWardrobeOptions])

  const loadStoredColorSelection = useCallback(() => {
    if (!selectedStyleId) return null
    const stored = getStoredStyleSelections(selectedStyleId)
    return stored.color && filteredColorOptions.some(opt => opt.id === stored.color)
      ? stored.color
      : null
  }, [selectedStyleId, filteredColorOptions])

  const initializationKey = useRef<string>('')

  // Load stored selections when style changes (no more auto-defaults)
  useEffect(() => {
    if (!selectedStyleId || filteredWardrobeOptions.length === 0 || filteredColorOptions.length === 0) return

    // Create a key to track if we need to reinitialize
    const currentKey = `${selectedStyleId}-${filteredWardrobeOptions.length}-${filteredColorOptions.length}`
    if (initializationKey.current === currentKey) return
    
    initializationKey.current = currentKey

    // Only load stored selections, no defaults
    const storedWardrobe = loadStoredWardrobeSelection()
    const storedColor = loadStoredColorSelection()
    
    setSelectedWardrobe(storedWardrobe)
    setSelectedColor(storedColor)
  }, [selectedStyleId, filteredWardrobeOptions, filteredColorOptions])

  const handleWardrobeSelect = (wardrobeId: string) => {
    setCurrentView('color')
    setTempWardrobeSelection(wardrobeId)
    
    // Load stored color for this style or default to first
    const storedColor = loadStoredColorSelection()
    if (storedColor) {
      setTempColorSelection(storedColor)
    } else {
      const defaultColor = filteredColorOptions[0]?.id
      if (defaultColor) {
        setTempColorSelection(defaultColor)
      }
    }
  }

  const handleColorSelect = (colorId: string) => {
    if (tempWardrobeSelection) {
      // Directly commit the selections
      setSelectedWardrobe(tempWardrobeSelection)
      setSelectedColor(colorId)
      
      // Store selections
      if (selectedStyleId) {
        storeStyleSelections(selectedStyleId, { 
          wardrobe: tempWardrobeSelection,
          color: colorId 
        })
      }
      
      onSelect?.(tempWardrobeSelection, colorId)
      
      // Clear temporary selections
      setTempWardrobeSelection(null)
      setTempColorSelection(null)
      
      // Close the popover
      setIsOpen(false)
    }
  }

  const handleConfirm = () => {
    if (tempWardrobeSelection && tempColorSelection) {
      // Commit temporary selections to actual state
      setSelectedWardrobe(tempWardrobeSelection)
      setSelectedColor(tempColorSelection)
      
      // Store selections
      if (selectedStyleId) {
        storeStyleSelections(selectedStyleId, { 
          wardrobe: tempWardrobeSelection,
          color: tempColorSelection 
        })
      }
      
      onSelect?.(tempWardrobeSelection, tempColorSelection)
      
      // Clear temporary selections
      setTempWardrobeSelection(null)
      setTempColorSelection(null)
      
      // Close the popover
      setIsOpen(false)
    }
  }

  const handleBack = () => {
    setCurrentView('wardrobe')
    setTempWardrobeSelection(null)
    setTempColorSelection(null)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    
    // Reset view to wardrobe when opening
    if (open) {
      setCurrentView('wardrobe')
      // Initialize temp selections with current selections when opening
      setTempWardrobeSelection(selectedWardrobe)
      setTempColorSelection(selectedColor)
    } else {
      // Clear temporary selections when closing
      setTempWardrobeSelection(null)
      setTempColorSelection(null)
    }
  }

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setCurrentView('wardrobe')
        setTempWardrobeSelection(null)
        setTempColorSelection(null)
        setFocusedOptionIndex(-1)
        break
      
      case 'ArrowDown':
        event.preventDefault()
        if (currentView === 'wardrobe') {
          const nextIndex = Math.min(focusedOptionIndex + 1, filteredWardrobeOptions.length - 1)
          setFocusedOptionIndex(nextIndex)
        }
        break
      
      case 'ArrowUp':
        event.preventDefault()
        if (currentView === 'wardrobe') {
          const prevIndex = Math.max(focusedOptionIndex - 1, 0)
          setFocusedOptionIndex(prevIndex)
        }
        break
      
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (currentView === 'wardrobe' && focusedOptionIndex >= 0) {
          const selectedOption = filteredWardrobeOptions[focusedOptionIndex]
          if (selectedOption) {
            handleWardrobeSelect(selectedOption.id)
            setFocusedOptionIndex(-1)
          }
        }
        break
    }
  }, [currentView, focusedOptionIndex, filteredWardrobeOptions])

  // Reset focused index when view changes
  useEffect(() => {
    setFocusedOptionIndex(-1)
  }, [currentView])

  // Focus management when dropdown opens
  useEffect(() => {
    if (currentView === 'wardrobe') {
      // Focus the first wardrobe option when dropdown opens
      setFocusedOptionIndex(0)
    }
  }, [currentView])

  const selectedWardrobeOption = filteredWardrobeOptions.find(opt => opt.id === selectedWardrobe)
  const selectedColorOption = filteredColorOptions.find(opt => opt.id === selectedColor)

  if (isLoadingStyles || isLoadingWardrobes || isLoadingColors) {
    return (
      <div className={styles.loading} />
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-label="Select wardrobe item"
          className={styles.trigger}
        >
          {selectedWardrobeOption && selectedColorOption ? (
            <>
              {/* Thumbnail with color overlay */}
              <div className={styles.thumbnail}>
                <Image
                  src={selectedWardrobeOption.image}
                  alt={selectedWardrobeOption.label}
                  width={48}
                  height={48}
                  className={styles.thumbnailImage}
                />
                {/* Color indicator */}
                <div 
                  className={styles.colorIndicator}
                  style={{ backgroundColor: selectedColor || '#FFFFFF' }}
                />
              </div>
              
              {/* Text */}
              <div className={styles.textContainer}>
                <p className={styles.primaryText}>{selectedWardrobeOption.label}</p>
                <p className={styles.secondaryText}>Wardrobe</p>
              </div>
            </>
          ) : (
            <>
              {/* Empty state with icon */}
              <div className={styles.thumbnail}>
                <Icon variant="wardrobe" size={48} className="text-gray-400" />
              </div>
              
              {/* Text */}
              <div className={styles.textContainer}>
                <p className={styles.primaryText}>Select Wardrobe</p>
                <p className={styles.secondaryText}>Wardrobe</p>
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
        <div 
          ref={dropdownRef}
          role="listbox"
          aria-label="Wardrobe options"
        >
          <div className={styles.dropdownInner}>
            {/* Sliding container */}
            <div 
              className={styles.slidingContainer}
              style={{ transform: `translateX(${currentView === 'color' ? '-100%' : '0'})` }}
            >
              {/* Wardrobe selection view */}
              <div className={styles.clothingView}>
                {/* Header */}
                <div className={styles.dropdownHeader}>
                  <h3 className={styles.dropdownTitle}>Choose your clothes</h3>
                </div>
                
                {/* Wardrobe options */}
                <div className={styles.clothingOptionsContainer}>
                  {filteredWardrobeOptions.map((option, index) => (
                    <button
                      key={option.id}
                      onClick={() => handleWardrobeSelect(option.id)}
                      onKeyDown={handleKeyDown}
                      role="option"
                      aria-selected={(tempWardrobeSelection || selectedWardrobe) === option.id}
                      aria-label={`Select ${option.label}`}
                      tabIndex={focusedOptionIndex === index ? 0 : -1}
                      className={`${styles.clothingOption} ${(tempWardrobeSelection || selectedWardrobe) === option.id ? styles.clothingOptionSelected : ''} ${focusedOptionIndex === index ? styles.clothingOptionFocused : ''}`}
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
                      <span className={styles.clothingOptionLabel}>{option.label}</span>
                      
                      {/* Selected indicator */}
                      {(tempWardrobeSelection || selectedWardrobe) === option.id && (
                        <div className={styles.selectedIndicator} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selection view */}
              <div className={styles.colorView}>
                {/* Header with back button */}
                <div className={styles.colorHeader}>
                  <button 
                    onClick={handleBack}
                    aria-label="Go back to wardrobe selection"
                    className={styles.backButton}
                  >
                    <ArrowLeft className={styles.backIcon} />
                  </button>
                  <h3 className={styles.dropdownTitle}>Choose color</h3>
                </div>
                
                {/* Background wardrobe image */}
                <div className={styles.colorSelectionArea}>
                  {(() => {
                    const displayWardrobeId = tempWardrobeSelection || selectedWardrobe
                    const displayWardrobeOption = filteredWardrobeOptions.find(opt => opt.id === displayWardrobeId)
                    return displayWardrobeOption && (
                      <div className={styles.backgroundImage}>
                        <Image
                          src={displayWardrobeOption.image}
                          alt={displayWardrobeOption.label}
                          fill
                          className={styles.backgroundImageInner}
                        />
                      </div>
                    )
                  })()}
                  
                  {/* Color options */}
                  <div 
                    role="radiogroup"
                    aria-label="Color options"
                    className={styles.colorGrid}
                  >
                    {filteredColorOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleColorSelect(option.id)}
                        role="radio"
                        aria-checked={tempColorSelection === option.id}
                        aria-label={`Select color ${option.label}`}
                        className={`${styles.colorSwatch} ${tempColorSelection === option.id ? styles.colorSwatchSelected : ''}`}
                        style={{ 
                          backgroundColor: option.color === '#FFFFFF' 
                            ? '#FFFFFF' 
                            : option.color,
                          backgroundImage: option.color === '#FFFFFF' 
                            ? 'linear-gradient(153deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.00) 83.33%), linear-gradient(0deg, #FFF 0%, #FFF 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.10) 100%)'
                            : undefined
                        }}
                        title={option.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}