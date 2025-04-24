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
import { useState } from 'react'
import { StyleTabsOptions } from './style-tabs-options'

interface StyleCardProps {
  savedStyle: Style
  onClick?: () => void
  headshotsPerStyle?: number
  className?: string
}

export function StyleCard({ 
  savedStyle, 
  onClick, 
  headshotsPerStyle = 20,
  className
}: StyleCardProps) {
  const { gender } = useUserGender();
  const { data: styleConfigs } = useStyleConfigs();
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState('background');
  const [visitedTabs] = useState(new Set(['background']));
  const [isSaving, setIsSaving] = useState(false);
  
  // Find the corresponding style configuration
  const styleConfig = styleConfigs?.find(
    config => config.id === savedStyle.settings.photographyStyle
  );

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

  const handleAddToShoot = async (style: Style) => {
    setIsSaving(true);
    // Add your shoot logic here
    setIsSaving(false);
    setIsFlipped(false);
    if (onClick) onClick();
  };

  return (
    <FlipCard
      className={cn(
        "group relative",
        className
      )}
      isFlipped={isFlipped}
      frontContent={
        <div className="flex flex-col overflow-hidden transition-all duration-500 select-none h-full bg-[#F0F9F7] rounded-[36px]">
          <div className="absolute top-4 right-4 z-10">
            <button
              className="flex items-center justify-center cursor-pointer h-12 w-12 rounded-full text-white bg-[#FFFFFF25] hover:bg-[#FF000080] transition-all duration-300 backdrop-blur-sm"
              >
                <Icon variant="bin" size={22} />
              </button>
            </div>
          <StyleDetails
            style={mergedStyle}
            index={0}
            onCustomize={() => setIsFlipped(true)}
            setIsNavigating={() => {}}
            headshotsPerStyle={headshotsPerStyle}
            isCard
          />
        </div>
      }
      backContent={
        <StyleTabsOptions
          style={styleConfig}
          settings={savedStyle.settings}
          isSaving={isSaving}
          activeTab={activeTab}
          visitedTabs={visitedTabs}
          onClose={() => setIsFlipped(false)}
          onTabChange={setActiveTab}
          onAddToShoot={handleAddToShoot}
          isCard
        />
      }
    />
  );
} 