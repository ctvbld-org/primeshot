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
import optionsConfig from '@/lib/config/options.json'

// Map category IDs to icon variants
const categoryIconMap: Record<keyof typeof optionsConfig, React.ComponentProps<typeof Icon>['variant']> = {
  background: 'background',
  clothing: 'clothing',
  clothingColor: 'clothingColor'
};

// Map category IDs to components
const categoryComponentMap: Record<string, React.ComponentType<{ photographyStyle: StylePhotographyStyle; isCard?: boolean }>> = {
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
    id: string;
    name: string;
  };
  settings: {
    background?: string;
    clothing?: string;
    clothingColor?: string;
  };
  isSaving: boolean;
  activeTab: string;
  visitedTabs: Set<string>;
  isCard?: boolean;
  onClose: () => void;
  onTabChange: (value: string) => void;
  onAddToShoot: (style: any) => Promise<void>;
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

export function StyleTabsOptions({
  style,
  settings,
  isSaving,
  activeTab,
  visitedTabs,
  isCard,
  onClose,
  onTabChange,
  onAddToShoot
}: StyleTabsOptionsProps) {
  // Handle footer button clicks
  const handleFooterButtonClick = (categoryId: string) => {
    onTabChange(categoryId);
  };

  return (
    <div className={`${styles['tabs-container']} ${isCard ? styles['card-styling'] : ''}`}>
      {!isCard && (
        <button
          onClick={onClose}
        className="absolute top-8 right-8 z-50 w-10 h-10 rounded-full bg-[#00000015] flex items-center justify-center hover:bg-accent/15 cursor-pointer transition-all text-black"
      >
          <Icon variant="cross" size={16} />
        </button>
      )}

      <Tabs 
        value={activeTab}
        onValueChange={onTabChange}
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
              <h4 className="w-full text-sm font-medium text-[#00000040] mb-4 p-4">Customise</h4>
              {Object.entries(optionsConfig).map(([categoryId, category]) => (
                <TabsTrigger 
                  key={categoryId}
                  value={categoryId} 
                  className={styles['tab-trigger']}
                >
                  <Icon variant={categoryIconMap[categoryId as keyof typeof optionsConfig]} size={20} />
                  <h5 className={styles['tab-label']}>{category.label}</h5>
                  <span className={styles['tab-category-count']}>{category.options.length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </motion.div>

          {Object.entries(optionsConfig).map(([categoryId, category]) => {
            const Component = categoryComponentMap[categoryId as keyof typeof optionsConfig];
            return (
              <TabsContent key={categoryId} value={categoryId} className={styles['tab-content']}>
                <motion.div variants={childAnimation}>
                  <div className={styles['tab-header']}>
                    <div className={`${isCard ? 'flex items-center gap-4 mb-4' : ''}`}>
                      {isCard && (
                        <Button
                          onClick={onClose}
                          variant="ghost"
                          className="w-10 h-10 rounded-full bg-[#00000015] flex flex-0 items-center justify-center hover:bg-accent/15 cursor-pointer transition-all text-black"
                        >
                          <Icon variant="arrowLeft" size={16} />
                        </Button>
                      )}
                      <h3 className={styles['tab-title']}>{category.label}</h3>
                    </div>
                    <p className={styles['tab-description']}>{category.description}</p>
                  </div>
                  {activeTab === categoryId && (
                    <Component photographyStyle={style.id as StylePhotographyStyle} isCard={isCard} />
                  )}
                </motion.div>
              </TabsContent>
            );
          })}
        </motion.div>
      </Tabs>

      {/* Footer with selected options and add button */}
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
          {Object.entries(optionsConfig).map(([categoryId, category]) => {
            const isActive = activeTab === categoryId;
            const selectedOption = (() => {
              switch (categoryId) {
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
            const selectedOptionData = category.options.find(opt => opt.id === selectedOption) as CategoryOption | undefined;
            
            return (
              <button 
                key={categoryId}
                onClick={() => handleFooterButtonClick(categoryId)}
                data-state={isActive ? 'active' : 'inactive'}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className={styles['footer-icon-button']}>
                  {selectedOptionData && visitedTabs.has(categoryId) ? (
                    categoryId === 'clothingColor' ? (
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
                        <Icon 
                          variant="check" 
                          size={16} 
                          className={`${styles['footer-option-check']} ${styles['footer-option-color-check']}`}
                        />
                      </>
                    ) : isImageOption(selectedOptionData) ? (
                      <>
                        <Image
                          src={getOptionsImage(selectedOptionData.imageUrl)}
                          alt={selectedOptionData.label}
                          fill
                          className={`${styles['footer-option-image']} ${styles['footer-option-swatch']}`}
                        />
                        <Icon 
                          variant="check" 
                          size={16} 
                          className={styles['footer-option-check']} 
                        />
                      </>
                    ) : (
                      <Icon 
                        variant={categoryIconMap[categoryId as keyof typeof optionsConfig]} 
                        size={30} 
                        className={`${styles['footer-option-icon']} ${styles['footer-option-swatch']}`}
                      />
                    )
                  ) : (
                    <Icon 
                      variant={categoryIconMap[categoryId as keyof typeof optionsConfig]} 
                      size={30} 
                      className={`${styles['footer-option-icon']} ${styles['footer-option-swatch']}`}
                    />
                  )}
                </div>
                <div className={styles['footer-option-icon-label-container']}>
                  <span className="text-[#00000060] font-light">{category.label}</span>
                  <span className="text-[#000000]">
                    {selectedOptionData && visitedTabs.has(categoryId) 
                      ? selectedOptionData.label 
                      : "Not selected"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <Button 
          onClick={() => {
            // Find first unselected option
            const unselectedOption = Object.entries(optionsConfig).find(([categoryId]) => {
              const selectedOption = (() => {
                switch (categoryId) {
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
              return !selectedOption || !visitedTabs.has(categoryId);
            });

            if (unselectedOption) {
              // Navigate to first unselected option
              onTabChange(unselectedOption[0]);
            } else {
              // All options selected, add to shoot
              onAddToShoot(style);
            }
          }}
          variant={Object.entries(optionsConfig).some(([categoryId]) => {
            const selectedOption = (() => {
              switch (categoryId) {
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
            return !selectedOption || !visitedTabs.has(categoryId);
          }) ? 'secondary' : 'primary'}
          loading={isSaving}
        >
          {isSaving ? 'Adding to Shoot...' : (
            Object.entries(optionsConfig).some(([categoryId]) => {
              const selectedOption = (() => {
                switch (categoryId) {
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
              return !selectedOption || !visitedTabs.has(categoryId);
            }) ? 'Next' : 'Add to Shoot'
          )}
        </Button>
      </motion.div>
    </div>
  );
} 