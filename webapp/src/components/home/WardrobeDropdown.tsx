'use client'

import React, { useState, useEffect } from 'react'
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
  
  const filteredClothingOptions: ClothingOption[] = (clothingOptions?.options || [])
    .filter(option => availableClothingIds.includes(option.id))
    .map(option => ({
      id: option.id,
      label: option.label,
      imageUrl: option.imageUrl ? getOptionsImage(option.imageUrl) : ''
    }))

  const filteredColorOptions: ColorOption[] = (colorOptions?.options || [])
    .filter(option => availableColorIds.includes(option.id))

  // Load selections when style changes
  useEffect(() => {
    if (!selectedStyleId || filteredClothingOptions.length === 0) return

    const stored = getStoredStyleSelections(selectedStyleId)
    
    // Set clothing
    if (stored.clothing && filteredClothingOptions.some(opt => opt.id === stored.clothing)) {
      setSelectedClothing(stored.clothing)
      
      // Load color for this clothing
      const storedColor = getStoredClothingColor(stored.clothing)
      if (storedColor && filteredColorOptions.some(opt => opt.id === storedColor)) {
        setSelectedColor(storedColor)
      } else {
        // Default to first color
        const defaultColor = filteredColorOptions[0]?.id
        if (defaultColor) {
          setSelectedColor(defaultColor)
          storeClothingColor(stored.clothing, defaultColor)
        }
      }
    } else {
      // Default to first clothing and its color
      const defaultClothing = filteredClothingOptions[0]?.id
      if (defaultClothing) {
        setSelectedClothing(defaultClothing)
        
        const storedColor = getStoredClothingColor(defaultClothing)
        if (storedColor && filteredColorOptions.some(opt => opt.id === storedColor)) {
          setSelectedColor(storedColor)
        } else {
          const defaultColor = filteredColorOptions[0]?.id
          if (defaultColor) {
            setSelectedColor(defaultColor)
            storeClothingColor(defaultClothing, defaultColor)
          }
        }
        
        storeStyleSelections(selectedStyleId, { clothing: defaultClothing })
      }
    }
  }, [selectedStyleId, filteredClothingOptions, filteredColorOptions])

  const handleClothingSelect = (clothingId: string) => {
    setCurrentView('color')
    setSelectedClothing(clothingId)
    
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
    if (selectedClothing && tempColorSelection) {
      setSelectedColor(tempColorSelection)
      setIsOpen(false)
      setCurrentView('clothing')
      
      // Store selections
      if (selectedStyleId) {
        storeStyleSelections(selectedStyleId, { 
          clothing: selectedClothing,
          clothingColor: tempColorSelection 
        })
        storeClothingColor(selectedClothing, tempColorSelection)
      }
      
      onSelect?.(selectedClothing, tempColorSelection)
    }
  }

  const handleBack = () => {
    setCurrentView('clothing')
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
        onClick={() => setIsOpen(!isOpen)}
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
                      className={`${styles.clothingOption} ${selectedClothing === option.id ? styles.clothingOptionSelected : ''}`}
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
                      {selectedClothing === option.id && (
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
                  {selectedClothingOption && (
                    <div className={styles.backgroundImage}>
                      <Image
                        src={selectedClothingOption.imageUrl}
                        alt={selectedClothingOption.label}
                        fill
                        className={styles.backgroundImageInner}
                      />
                    </div>
                  )}
                  
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
                    disabled={!tempColorSelection}
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
            setTempColorSelection(null)
          }}
        />
      )}
    </div>
  )
}