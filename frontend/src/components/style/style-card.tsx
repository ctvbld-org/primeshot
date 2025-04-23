import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icons/icon'
import { Style } from '@/lib/types'
import { cn } from '@/lib/utils'
import { StyleDetails } from './style-details'
import { getStyleImages } from '@/lib/utils/get-styles-images'
import { useUserGender } from '@/lib/hooks/use-user-gender'
import { useStyleConfigs } from '@/hooks/useConfig'

interface StyleCardProps {
  style: Style
  onClick?: () => void
  onClose?: () => void
  headshotsPerStyle?: number
  className?: string
}

export function StyleCard({ 
  style, 
  onClick, 
  onClose,
  headshotsPerStyle = 20,
  className
}: StyleCardProps) {
  const { gender } = useUserGender();
  const { data: styleConfigs } = useStyleConfigs();
  
  // Find the corresponding style configuration
  const styleConfig = styleConfigs?.find(
    config => config.id === style.settings.photographyStyle
  );

  if (!styleConfig) {
    return null; // Or some fallback UI
  }

  // Merge saved style with style configuration
  const mergedStyle = {
    ...style,
    tagline: styleConfig.tagline || undefined,
    description: styleConfig.description || '',
    genderSpecificImages: getStyleImages(styleConfig.preview_images || [], gender || undefined)
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden bg-[#F0F9F7] hover:bg-accent/50 transition-colors cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Close Button */}
      {onClose && (
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            <Icon variant="cross" size={16} />
          </Button>
        </div>
      )}

      <StyleDetails
        style={mergedStyle}
        index={0}
        onCustomize={() => {}}
        setIsNavigating={() => {}}
        headshotsPerStyle={headshotsPerStyle}
        isCard
      />
    </Card>
  )
} 