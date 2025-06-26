import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icons/icon'
import { StylePhotographyStyle, StyleStatus } from '@/lib/types'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import Image from 'next/image'
import styles from './style-tabs-options.module.css'
import { BackgroundImageSelector } from './background-image-selector'
import { ClothingImageSelector } from './clothing-image-selector'
import { ClothingColorSelector } from './clothing-color-selector'
import { useCallback, useEffect, useState, useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useStyleStore } from '@/store/style'
import { useStyleConfigs, useOption, useOptions } from '@/hooks/useConfig'
import { useTranslatedOptions } from '@/hooks/useTranslatedOption'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { updateStyle } from '@/lib/api/styles'
import React, { Suspense } from 'react'
import { useValidStyleOptions } from '@/lib/utils/style-validation'
import { useTranslation } from 'react-i18next'
import { useCarouselContext } from '@/contexts/carousel-context'

// Map category IDs to icon variants
const categoryIconMap: Record<string, React.ComponentProps<typeof Icon>['variant']> = {
  background: 'background',
  clothing: 'clothing',
  clothingColor: 'clothingColor'
};

// Map category IDs to components
const categoryComponentMap: Record<string, React.ComponentType<{ photographyStyle: StylePhotographyStyle; isCard?: boolean; onSelect?: (id: string) => void }>> = {
  background: BackgroundImageSelector,
  clothingColor: ClothingColorSelector,
  clothing: ClothingImageSelector
};

type BaseOption = {
  id: string;
  label: string;
};

type ImageOption = BaseOption & {
  imageUrl: string;
};

type ColorOption = BaseOption;

type CategoryOption = ImageOption | ColorOption;

function isImageOption(option: any): option is ImageOption {
  return option && typeof option === 'object' && 'imageUrl' in option && typeof option.imageUrl === 'string';
}

interface StyleTabsOptionsProps {
  style: {
    id: string;  // photography style name
    name: string;
    styleId: string;  // database row ID
  };
  settings?: {
    background?: string;
    clothing?: string;
    clothingColor?: string;
  };
  isSaving: boolean;
  isCard?: boolean;
  onClose: () => void;
  onAddToShoot: (style: any) => Promise<void>;
  onUpdate?: (style: { settings: { background: string; clothing: string; clothingColor: string; photographyStyle: StylePhotographyStyle } }) => void;
}

// Define a ref type for the component
export interface StyleTabsOptionsRef {
  applyPropSettings: () => void;
}

const contentAnimation = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { 
    duration: 0.5,
    ease: [0.21, 1, 0.32, 1],
    staggerChildren: 0.08 
  }
}

const childAnimation = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.21, 1, 0.32, 1] }
}

export const StyleTabsOptions = forwardRef<StyleTabsOptionsRef, StyleTabsOptionsProps>(({
  style,
  settings: propSettings,
  isSaving,
  isCard,
  onClose,
  onAddToShoot,
  onUpdate
}, ref) => {
  const { isChangingSlide } = useCarouselContext();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const { data: rawOptions } = useOptions();
  const translatedOptions = useTranslatedOptions(rawOptions);
  const { data: validOptions, isLoading: isLoadingValidOptions } = useValidStyleOptions();
  const { t } = useTranslation(['styles']);
  
  // Get the categories and their options
  const categories = translatedOptions?.map(opt => ({
    id: opt.category,
    label: opt.label,
    description: opt.description,
    options: opt.options
  })) || [];

  // Connect to store with current style.id
  const store = useStyleStore(style.id as StylePhotographyStyle)
  const settings = store((state) => state.settings)
  const reset = store((state) => state.reset)
  const setBackground = store((state) => state.setBackground)
  const setClothing = store((state) => state.setClothing)
  const setClothingColor = store((state) => state.setClothingColor)
  
  // Flag to track if prop settings have been applied
  const hasAppliedSettings = useRef(false);
  
  // Function to apply prop settings
  const getPropSettings = useCallback(() => {
    if (!validOptions) return;
    if (propSettings) {
      if (propSettings.background) {
        setBackground(propSettings.background, validOptions).catch(console.error);
      }
      if (propSettings.clothing) {
        setClothing(propSettings.clothing, validOptions).catch(console.error);
      }
      if (propSettings.clothingColor) {
        setClothingColor(propSettings.clothingColor, validOptions).catch(console.error);
      }
      hasAppliedSettings.current = true;
    }
  }, [propSettings, setBackground, setClothing, setClothingColor, validOptions]);
  
  // Expose the getPropSettings method via ref
  useImperativeHandle(ref, () => ({
    applyPropSettings: getPropSettings
  }));
  
  // Apply prop settings whenever the component renders in card mode
  // This is important because we need to set the values immediately when
  // the flip animation starts (before the component is fully visible)
  useEffect(() => {
    if (isCard && !hasAppliedSettings.current) {
      getPropSettings();
    }
  }, [isCard, getPropSettings]);
  
  // Fetch available options for the current photography style
  const { data: styleConfigs } = useStyleConfigs();
  
  // Find the current style configuration
  const currentStyleConfig = styleConfigs?.find(config => config.id === style.id);
  
  // Get counts of available options for each category
  const availableCounts = {
    background: currentStyleConfig?.available_backgrounds?.length || 0,
    clothing: currentStyleConfig?.available_clothing?.length || 0,
    clothingColor: currentStyleConfig?.available_clothing_colors?.length || 0
  };
  
  // Track active tab
  const [activeTab, setActiveTab] = useState<string>('background');
  // Track visited tabs
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['background']));
  
  // Update active tab and mark as visited
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setVisitedTabs(prev => new Set(prev).add(tabId));
  };

  // Handle setting specific property based on category
  const handleOptionSelect = useCallback((categoryId: string, optionId: string) => {
    if (!validOptions) return;
    switch (categoryId) {
      case 'background':
        setBackground(optionId, validOptions).catch(console.error);
        break;
      case 'clothing':
        setClothing(optionId, validOptions).catch(console.error);
        break;
      case 'clothingColor':
        setClothingColor(optionId, validOptions).catch(console.error);
        break;
    }
  }, [setBackground, setClothing, setClothingColor, validOptions]);

  // Handle footer button clicks
  const handleFooterButtonClick = useCallback((categoryId: string) => {
    handleTabChange(categoryId);
  }, [handleTabChange]);

  // Handle close with reset
  const handleClose = useCallback(() => {
    // Reset settings to defaults
    if (!isCard) {
      reset();
    } else {
      getPropSettings();
    }
    // Call the provided onClose function
    onClose();
  }, [reset, onClose, isCard, getPropSettings]);

  // Track initial settings for comparison
  const [initialSettings, setInitialSettings] = useState({
    background: settings.background,
    clothing: settings.clothing,
    clothingColor: settings.clothingColor
  });

  // Check if settings have changed
  const hasSettingsChanged = useMemo(() => {
    return initialSettings.background !== settings.background ||
           initialSettings.clothing !== settings.clothing ||
           initialSettings.clothingColor !== settings.clothingColor;
  }, [initialSettings, settings]);

  // Reset initial settings when prop settings change
  useEffect(() => {
    if (propSettings) {
      setInitialSettings({
        background: propSettings.background || '',
        clothing: propSettings.clothing || '',
        clothingColor: propSettings.clothingColor || ''
      });
    }
  }, [propSettings]);

  // Handle style update
  const handleUpdate = async () => {
    if (!user || !style.styleId || !settings.background || !settings.clothing || !settings.clothingColor) {
      toast({ title: t('toast.errorMissingData.title', { ns: 'styles' }), description: t('toast.errorMissingData.description', { ns: 'styles' }), variant: 'destructive' });
      return;
    }

    try {
      setIsUpdating(true);

      const updatedStyle = {
        id: style.styleId,
        user_id: user.id,
        name: style.name,
        settings: {
          background: settings.background,
          clothing: settings.clothing,
          clothingColor: settings.clothingColor,
          photographyStyle: style.id as StylePhotographyStyle
        }
      };

      await updateStyle(updatedStyle);

      toast({
        title: t('toast.successUpdatedStyle.title', { ns: 'styles' }),
        description: t('toast.successUpdatedStyle.description', { ns: 'styles' })
      });
      
      // Call onUpdate with the updated style
      onUpdate?.(updatedStyle);
      onClose();

      // Update initialSettings to reflect the new persisted state
      setInitialSettings({
        background: settings.background,
        clothing: settings.clothing,
        clothingColor: settings.clothingColor
      });
    } catch (error) {
      toast({
        title: t('toast.errorUpdatedStyle.title', { ns: 'styles' }),
        description: error instanceof Error ? error.message : t('toast.errorUpdatedStyle.description', { ns: 'styles' }),
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if a category has been selected and visited
  const isCategoryComplete = useCallback((category: { id: string }) => {
    const selectedOption = (() => {
      switch (category.id) {
        case 'background':
          return settings.background;
        case 'clothing':
          return settings.clothing;
        case 'clothingColor':
          return settings.clothingColor;
        default:
          return undefined;
      }
    })();
    return selectedOption && visitedTabs.has(category.id);
  }, [settings, visitedTabs]);

  // Find first incomplete category
  const findFirstIncompleteCategory = useCallback(() => {
    return categories.find(category => !isCategoryComplete(category));
  }, [categories, isCategoryComplete]);

  // Check if all categories are complete
  const areAllCategoriesComplete = useCallback(() => {
    return !categories.some(category => !isCategoryComplete(category));
  }, [categories, isCategoryComplete]);

  if (isLoadingValidOptions) {
    return <div className="p-4">Loading style options...</div>;
  }

  return (
    <div 
      className={`${styles['tabs-container']} ${isCard ? styles['card-styling'] + ' card-styling' : ''}`}
      data-testid="style-tabs-options"
    >
      {!isCard && (
        <button
          onClick={handleClose}
          className="absolute top-8 right-8 z-50 w-10 h-10 rounded-full bg-[#00000015] flex items-center justify-center hover:bg-accent/15 cursor-pointer transition-all text-black"
        >
          <Icon variant="cross" size={16} />
        </button>
      )}

      <Tabs 
        defaultValue="background"
        value={activeTab}
        onValueChange={handleTabChange}
        orientation="vertical" 
        className="h-full"
      >
        <motion.div
          initial="initial"
          animate="animate"
          variants={contentAnimation}
          className="flex flex-1 flex-row h-full"
        >
          <motion.div variants={childAnimation} className={styles['tabs-sidebar-container']}>
            <TabsList className={styles['tabs-sidebar']}>
              <h4 className="w-full text-sm font-medium text-[#00000040] mb-4 p-4">{t('styleCard.customize', { ns: 'styles' })}</h4>
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id}
                  value={category.id} 
                  className={styles['tab-trigger']}
                >
                  <Icon variant={categoryIconMap[category.id]} size={20} />
                  <h5 className={styles['tab-label']}>{category.label}</h5>
                  <span className={styles['tab-category-count']}>
                    {availableCounts[category.id as keyof typeof availableCounts] || 0}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </motion.div>

          {categories.map((category) => {
            const Component = categoryComponentMap[category.id];
            return (
              <TabsContent key={category.id} value={category.id} className={styles['tab-content']}>
                <motion.div variants={childAnimation} className="flex flex-1 flex-col">
                  <div className={styles['tab-header']}>
                    <div className={`${isCard ? 'flex items-center gap-4 mb-4' : ''}`}>
                      {isCard && (
                        <Button
                          onClick={handleClose}
                          variant="ghost"
                          className={styles.backButton}
                        >
                          <Icon variant="arrowLeft" size={16} />
                        </Button>
                      )}
                      <h3 className={styles['tab-title']}>{category.label}</h3>
                    </div>
                    <p className={styles['tab-description']}>{category.description}</p>
                  </div>
                  {category.id && (
                    <Suspense fallback={<div className="p-4">Loading {category.label} options...</div>}>
                      <Component 
                        photographyStyle={style.id as StylePhotographyStyle} 
                        isCard={isCard} 
                        onSelect={(optionId) => handleOptionSelect(category.id, optionId)} 
                      />
                    </Suspense>
                  )}
                </motion.div>
              </TabsContent>
            );
          })}
        </motion.div>
      </Tabs>
      
      {/* Footer with selected options and button */}
      <motion.div 
        className={styles['footer-container']}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.21, 1, 0.32, 1],
          delay: 0.3 
        }}
      >
        <div className="flex items-center gap-6">
          {categories.map((category) => {
            const isActive = activeTab === category.id;
            const selectedOption = (() => {
              switch (category.id) {
                case 'background':
                  return settings.background;
                case 'clothing':
                  return settings.clothing;
                case 'clothingColor':
                  return settings.clothingColor;
                default:
                  return undefined;
              }
            })();
            const selectedOptionData = category.options.find(opt => opt.id === selectedOption);
        
            return (
              <button 
                key={category.id}
                onClick={() => handleFooterButtonClick(category.id)}
                data-state={isActive ? 'active' : 'inactive'}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className={styles['footer-icon-button']}>
                  {selectedOptionData && (visitedTabs.has(category.id) && !isCard) || (selectedOptionData && isCard) ? (
                    category.id === 'clothingColor' ? (
                      <>
                        <div 
                          className={`${styles['footer-option-color']} ${styles['footer-option-swatch']}`} 
                          style={{ 
                            background: selectedOptionData.id === '#FFFFFF' 
                              ? 'linear-gradient(153deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.00) 83.33%), linear-gradient(0deg, #FFF 0%, #FFF 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.10) 100%)' 
                              : selectedOptionData.id 
                          }}
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30px] h-[30px] rounded-full border-1 border-[#00000030] border-dashed mix-blend-multiply"></div>
                        {!isCard && (
                          <Icon 
                            variant="check" 
                            size={16} 
                            className={`${styles['footer-option-check']} ${styles['footer-option-color-check']}`}
                          />
                        )}
                      </>
                    ) : isImageOption(selectedOptionData) ? (
                      <>
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <Image
                            src={getOptionsImage(selectedOptionData.imageUrl)}
                            alt={selectedOptionData.label}
                            fill
                            sizes="(max-width: 48px) 96px, 48px"
                            className={`${styles['footer-option-image']} ${styles['footer-option-swatch']}`}
                          />
                        </div>
                        {!isCard && (
                          <Icon 
                            variant="check" 
                            size={16} 
                            className={styles['footer-option-check']} 
                          />
                        )}
                      </>
                    ) : (
                      <Icon 
                        variant={categoryIconMap[category.id]} 
                        size={30} 
                        className={`${styles['footer-option-icon']} ${styles['footer-option-swatch']}`}
                      />
                    )
                  ) : (
                    <Icon 
                      variant={categoryIconMap[category.id]} 
                      size={30} 
                      className={`${styles['footer-option-icon']} ${styles['footer-option-swatch']}`}
                    />
                  )}
                </div>
                <div className={styles['footer-option-icon-label-container']}>
                  <span className="text-[#00000060] font-light">{category.label}</span>
                  <span className="text-[#000000]">
                    {selectedOptionData && visitedTabs.has(category.id) 
                      ? selectedOptionData.label 
                      : t('footer.notSelected')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {isCard ? (
          <Button 
            onClick={handleUpdate}
            variant="secondary"
            className={styles.saveButton}
            disabled={isUpdating || !hasSettingsChanged || isChangingSlide}
            loading={isUpdating}
          >
            {t('buttons.confirmChanges', { ns: 'common' })}
          </Button>
        ) : (
          <Button 
            onClick={() => {
              const unselectedOption = findFirstIncompleteCategory();
              if (unselectedOption) {
                handleTabChange(unselectedOption.id);
              } else {
                onAddToShoot(style);
              }
            }}
            variant={areAllCategoriesComplete() ? "secondary" : "tertiary"}
            className={styles.saveButton}
            disabled={isSaving || isChangingSlide}
            loading={isSaving}
          >
            {areAllCategoriesComplete() ? t('buttons.addToShoot', { ns: 'common' }) : t('buttons.next', { ns: 'common' })}
          </Button>
        )}
      </motion.div>
    </div>
  );
}); 