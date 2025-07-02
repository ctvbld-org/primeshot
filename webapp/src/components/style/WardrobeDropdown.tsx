'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useStyleSelection } from '@/contexts/style-selection-context'
import { useStyleConfigs, useOption } from '@/hooks/useConfig'
import { useTranslatedOption } from '@/hooks/useTranslatedOption'
import { useValidStyleOptions } from '@/lib/utils/style-validation'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import { getStoredStyleSelections, storeStyleSelections, getStoredClothingColor, storeClothingColor } from '@/lib/utils/style-storage'
import Image from 'next/image'
import { ChevronDown, ArrowLeft } from 'lucide-react'
import styles from './WardrobeDropdown.module.css'

interface WardrobeDropdownProps {
  onSelect?: (clothingId: string, colorId: string) => void
}

interface ClothingOption {
  id: string
  label: string
  imageUrl: string
}

interface ColorOption {
  id: string
  label: string
}

export function WardrobeDropdown({ onSelect }: WardrobeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'clothing' | 'color'>('clothing')
  const [selectedClothing, setSelectedClothing] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [tempClothingSelection, setTempClothingSelection] = useState<string | null>(null)
  const [tempColorSelection, setTempColorSelection] = useState<string | null>(null)
  const { selectedStyleId } = useStyleSelection()
  
  const { data: styleConfigs, isLoading: isLoadingStyles } = useStyleConfigs()
  const { data: rawClothingOptions, isLoading: isLoadingClothing } = useOption('clothing')
  const { data: rawColorOptions, isLoading: isLoadingColors } = useOption('clothingColor')
  const clothingOptions = useTranslatedOption(rawClothingOptions)
  const colorOptions = useTranslatedOption(rawColorOptions)
  const { data: validOptions } = useValidStyleOptions()

  // Get available options for current style
  const currentStyleConfig = styleConfigs?.find(style => style.id === selectedStyleId)
  const availableClothingIds = currentStyleConfig?.available_clothing || []
  const availableColorIds = currentStyleConfig?.available_clothing_colors || []
  
  const filteredClothingOptions: ClothingOption[] = useMemo(() => {
    return (clothingOptions?.options || [])
      .filter(option => availableClothingIds.includes(option.id))
      .map(option => ({
        id: option.id,
        label: option.label,
        imageUrl: option.imageUrl ? getOptionsImage(option.imageUrl) : ''
      }))
  }, [clothingOptions?.options, availableClothingIds])

  const filteredColorOptions: ColorOption[] = useMemo(() => {
    return (colorOptions?.options || [])
      .filter(option => availableColorIds.includes(option.id))
  }, [colorOptions?.options, availableColorIds])

  // Helper functions for selection management
  const loadStoredClothingSelection = useCallback(() => {
    if (!selectedStyleId) return null
    const stored = getStoredStyleSelections(selectedStyleId)
    return stored.clothing && filteredClothingOptions.some(opt => opt.id === stored.clothing) 
      ? stored.clothing 
      : null
  }, [selectedStyleId, filteredClothingOptions])

  const loadStoredColorSelection = useCallback((clothingId: string) => {
    const storedColor = getStoredClothingColor(clothingId)
    return storedColor && filteredColorOptions.some(opt => opt.id === storedColor)
      ? storedColor
      : null
  }, [filteredColorOptions])

  const getDefaultClothing = useCallback(() => {
    return filteredClothingOptions[0]?.id || null
  }, [filteredClothingOptions])

  const getDefaultColor = useCallback(() => {
    return filteredColorOptions[0]?.id || null
  }, [filteredColorOptions])

  const initializationKey = useRef<string>('')

  // Single initialization effect to prevent cascading updates
  useEffect(() => {
    if (!selectedStyleId || filteredClothingOptions.length === 0 || filteredColorOptions.length === 0) return

    // Create a key to track if we need to reinitialize
    const currentKey = `${selectedStyleId}-${filteredClothingOptions.length}-${filteredColorOptions.length}`
    if (initializationKey.current === currentKey) return
    
    initializationKey.current = currentKey

    // Load stored clothing
    const storedClothing = loadStoredClothingSelection()
    const finalClothing = storedClothing || getDefaultClothing()
    
    if (finalClothing) {
      // Load stored color for the clothing
      const storedColor = loadStoredColorSelection(finalClothing)
      const finalColor = storedColor || getDefaultColor()
      
      // Update state in a single batch
      setSelectedClothing(finalClothing)
      if (finalColor) {
        setSelectedColor(finalColor)
      }
      
      // Store to localStorage
      if (selectedStyleId && finalColor) {
        storeStyleSelections(selectedStyleId, { 
          clothing: finalClothing,
          clothingColor: finalColor 
        })
        storeClothingColor(finalClothing, finalColor)
      }
    }
  }, [selectedStyleId, filteredClothingOptions, filteredColorOptions, loadStoredClothingSelection, getDefaultClothing, loadStoredColorSelection, getDefaultColor])

  // Separate effect for syncing changes to storage (only for user interactions)
  useEffect(() => {
    // Only sync if we have a valid initialization key (prevents initial sync)
    if (selectedClothing && selectedColor && selectedStyleId && initializationKey.current) {
      storeStyleSelections(selectedStyleId, { 
        clothing: selectedClothing,
        clothingColor: selectedColor 
      })
      storeClothingColor(selectedClothing, selectedColor)
    }
  }, [selectedStyleId, selectedClothing, selectedColor])

  const handleClothingSelect = (clothingId: string) => {
    setCurrentView('color')
    setTempClothingSelection(clothingId)
    
    // Load stored color for this clothing or default to first
    const storedColor = getStoredClothingColor(clothingId)
    if (storedColor && filteredColorOptions.some(opt => opt.id === storedColor)) {
      setTempColorSelection(storedColor)
    } else {
      const defaultColor = filteredColorOptions[0]?.id
      if (defaultColor) {
        setTempColorSelection(defaultColor)
      }
    }
  }

  const handleColorSelect = (colorId: string) => {
    setTempColorSelection(colorId)
  }

  const handleConfirm = () => {
    if (tempClothingSelection && tempColorSelection) {
      // Commit temporary selections to actual state
      setSelectedClothing(tempClothingSelection)
      setSelectedColor(tempColorSelection)
      setIsOpen(false)
      setCurrentView('clothing')
      
      // Store selections
      if (selectedStyleId) {
        storeStyleSelections(selectedStyleId, { 
          clothing: tempClothingSelection,
          clothingColor: tempColorSelection 
        })
        storeClothingColor(tempClothingSelection, tempColorSelection)
      }
      
      onSelect?.(tempClothingSelection, tempColorSelection)
      
      // Clear temporary selections
      setTempClothingSelection(null)
      setTempColorSelection(null)
    }
  }

  const handleBack = () => {
    setCurrentView('clothing')
    setTempClothingSelection(null)
    setTempColorSelection(null)
  }

  const selectedClothingOption = filteredClothingOptions.find(opt => opt.id === selectedClothing)
  const selectedColorOption = filteredColorOptions.find(opt => opt.id === selectedColor)

  if (isLoadingStyles || isLoadingClothing || isLoadingColors || !selectedClothingOption || !selectedColorOption) {
    return (
      <div className={styles.loading} />
    )
  }

  return (
    <div className={styles.container}>
      {/* Dropdown trigger */}
      <button
        onClick={() => {
          if (!isOpen) {
            // Initialize temp selections with current selections when opening
            setTempClothingSelection(selectedClothing)
            setTempColorSelection(selectedColor)
          }
          setIsOpen(!isOpen)
        }}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
      >
        {/* Thumbnail with color overlay */}
        <div className={styles.thumbnail}>
          <Image
            src={selectedClothingOption.imageUrl}
            alt={selectedClothingOption.label}
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
          <p className={styles.primaryText}>{selectedClothingOption.label}</p>
          <p className={styles.secondaryText}>Wardrobe</p>
        </div>
        
        {/* Arrow */}
        <ChevronDown className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownInner}>
            {/* Sliding container */}
            <div 
              className={styles.slidingContainer}
              style={{ transform: `translateX(${currentView === 'color' ? '-100%' : '0'})` }}
            >
              {/* Clothing selection view */}
              <div className={styles.clothingView}>
                {/* Header */}
                <div className={styles.dropdownHeader}>
                  <h3 className={styles.dropdownTitle}>Choose your clothes</h3>
                </div>
                
                {/* Clothing options */}
                <div className={styles.clothingOptionsContainer}>
                  {filteredClothingOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleClothingSelect(option.id)}
                      className={`${styles.clothingOption} ${(tempClothingSelection || selectedClothing) === option.id ? styles.clothingOptionSelected : ''}`}
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
                      <span className={styles.clothingOptionLabel}>{option.label}</span>
                      
                      {/* Selected indicator */}
                      {(tempClothingSelection || selectedClothing) === option.id && (
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
                    className={styles.backButton}
                  >
                    <ArrowLeft className={styles.backIcon} />
                  </button>
                  <h3 className={styles.dropdownTitle}>Choose color</h3>
                </div>
                
                {/* Background clothing image */}
                <div className={styles.colorSelectionArea}>
                  {(() => {
                    const displayClothingId = tempClothingSelection || selectedClothing
                    const displayClothingOption = filteredClothingOptions.find(opt => opt.id === displayClothingId)
                    return displayClothingOption && (
                      <div className={styles.backgroundImage}>
                        <Image
                          src={displayClothingOption.imageUrl}
                          alt={displayClothingOption.label}
                          fill
                          className={styles.backgroundImageInner}
                        />
                      </div>
                    )
                  })()}
                  
                  {/* Color options */}
                  <div className={styles.colorGrid}>
                    {filteredColorOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleColorSelect(option.id)}
                        className={`${styles.colorSwatch} ${tempColorSelection === option.id ? styles.colorSwatchSelected : ''}`}
                        style={{ 
                          backgroundColor: option.id === '#FFFFFF' 
                            ? '#FFFFFF' 
                            : option.id,
                          backgroundImage: option.id === '#FFFFFF' 
                            ? 'linear-gradient(153deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.00) 83.33%), linear-gradient(0deg, #FFF 0%, #FFF 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.10) 100%)'
                            : undefined
                        }}
                        title={option.label}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Footer with confirm button */}
                <div className={styles.footer}>
                  <button
                    onClick={handleConfirm}
                    disabled={!tempClothingSelection || !tempColorSelection}
                    className={styles.confirmButton}
                  >
                    Confirm Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => {
            setIsOpen(false)
            setCurrentView('clothing')
            setTempClothingSelection(null)
            setTempColorSelection(null)
          }}
        />
      )}
    </div>
  )
}