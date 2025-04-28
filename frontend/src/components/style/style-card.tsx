import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icons/icon'
import { Style } from '@/lib/types'
import { cn } from '@/lib/utils'
import { StyleDetails } from './style-details'
import { getStyleImages } from '@/lib/utils/get-styles-images'
import { useUserGender } from '@/lib/hooks/use-user-gender'
import { useStyleConfigs } from '@/hooks/useConfig'
import { FlipCard } from './flip-card'
import { useState, useCallback, useRef } from 'react'
import { StyleTabsOptions, StyleTabsOptionsRef } from './style-tabs-options'
import styles from './style-card.module.css'
import { motion, AnimatePresence } from 'framer-motion'

interface StyleCardProps {
  savedStyle: Style
  onClick?: () => void
  headshotsPerStyle?: number
  className?: string
  onDelete?: (styleId: string) => Promise<void>
  onEdit?: () => void
  onCloseEdit?: () => void
}

export function StyleCard({ 
  savedStyle, 
  onClick, 
  headshotsPerStyle = 20,
  className,
  onDelete,
  onEdit,
  onCloseEdit
}: StyleCardProps) {
  // All hooks declarations first
  const { gender } = useUserGender();
  const { data: styleConfigs } = useStyleConfigs();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOverlayActive, setIsDeleteOverlayActive] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const styleTabsRef = useRef<StyleTabsOptionsRef>(null);
  
  // Handle flip - apply settings when card starts flipping to back
  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      // Card is flipping to back (about to show backContent)
      // Apply the prop settings immediately
      console.log("Card is flipping to back, applying settings");
      styleTabsRef.current?.applyPropSettings();
      onEdit?.();
    } else {
      onCloseEdit?.();
    }
    setIsFlipped(!isFlipped);
  }, [isFlipped, onEdit, onCloseEdit]);
  
  // Handle add to shoot
  const handleAddToShoot = useCallback(async (style: Style) => {
    setIsSaving(true);
    // Add your shoot logic here
    setIsSaving(false);
    setIsFlipped(false);
    if (onClick) onClick();
  }, [onClick]);

  // Handle delete button click
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteOverlayActive(true);
  }, []);

  // Handle keep button click
  const handleKeepClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteOverlayActive(false);
  }, []);

  // Handle remove button click
  const handleRemoveClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    // Wait for animation to complete before actually deleting
    setTimeout(async () => {
      if (onDelete) {
        await onDelete(savedStyle.id);
      }
      setIsDeleteOverlayActive(false);
    }, 500); // Match this with animation duration
  }, [onDelete, savedStyle.id]);
  
  // Find the corresponding style configuration
  const styleConfig = styleConfigs?.find(
    config => config.id === savedStyle.settings.photographyStyle
  );

  // Conditional rendering after all hooks
  if (!styleConfig) {
    return null; // Or some fallback UI
  }

  // Merge saved style with style configuration
  const mergedStyle = {
    ...savedStyle,
    tagline: styleConfig.tagline || undefined,
    description: styleConfig.description || '',
    genderSpecificImages: getStyleImages(styleConfig.preview_images || [], gender || undefined)
  };

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -600 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <FlipCard
        className={cn(
          styles.card,
          className
        )}
        isFlipped={isFlipped}
        frontContent={
          <div className={styles.frontContent}>
            <div className={styles.deleteButton}>
              <button className={styles.deleteButtonInner} onClick={handleDeleteClick}>
                <Icon variant="bin" size={22} />
              </button>
            </div>
            <StyleDetails
              style={mergedStyle}
              index={0}
              onCustomize={handleFlip}
              setIsNavigating={() => {}}
              headshotsPerStyle={headshotsPerStyle}
              isCard
            />
            <div className={cn(styles.deleteOverlay, isDeleteOverlayActive && styles.active)}>
              <div className={styles.deleteOverlayInner}>
                <span className={styles.deleteIcon}>
                  <Icon variant="bin" size={32} />
                </span>
                <p className={styles.deleteText}>
                  Are you sure you want to remove this style from your shoot?
                </p>
                <div className={styles.deleteActions}>
                  <Button variant="ghost" size="md" className={styles.keepButton} onClick={handleKeepClick}>
                    Keep it
                  </Button>
                  <Button variant="destructive" size="md" className={styles.removeButton} onClick={handleRemoveClick}>
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
        }
        backContent={
          <StyleTabsOptions
            ref={styleTabsRef}
            style={{
              ...styleConfig,
              styleId: savedStyle.id
            }}
            settings={savedStyle.settings}
            isSaving={isSaving}
            onClose={() => {
              setIsFlipped(false);
              onCloseEdit?.();
            }}
            onAddToShoot={handleAddToShoot}
            onUpdate={(updatedStyle) => {
              // Update the local savedStyle with new settings
              savedStyle.settings = updatedStyle.settings;
              setIsFlipped(false);
              onCloseEdit?.();
            }}
            isCard
          />
        }
      />
    </motion.div>
  );
} 