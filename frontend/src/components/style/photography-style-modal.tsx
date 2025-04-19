import React, { forwardRef, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Image from 'next/image'
import { StylePhotographyStyle, Gender } from '@/lib/types'
// Import the JSON configuration
import stylesConfig from '@/lib/config/styles.json' assert { type: "json" };
import { getStyleImages } from '@/lib/utils/get-styles-images'
import { useUserGender } from '@/lib/hooks/use-user-gender'
import { useGenderFilter } from '@/lib/hooks/use-gender-filter'
import { z } from 'zod'

// Create a Zod enum from the Gender type
const GenderEnum = z.enum(['male', 'female'] as const) satisfies z.ZodType<Gender>;

// Define the validation schema
const StyleConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  previewImages: z.array(z.string()),
  availableGenders: z.array(GenderEnum).optional(),
  availableBackgrounds: z.array(z.string()),
  availableOutfits: z.array(z.string()),
  availableOutfitColors: z.array(z.string())
});

const StyleConfigsSchema = z.array(StyleConfigSchema);

// Validate at runtime with error handling
const photographyStyleOptions = (() => {
  try {
    return StyleConfigsSchema.parse(stylesConfig);
  } catch (error) {
    console.error('Invalid style configuration:', error);
    // Return empty array as fallback to prevent app crash
    return [];
  }
})();

interface PhotographyStyleModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectStyle: (style: StylePhotographyStyle) => void
}

export function PhotographyStyleModal({ isOpen, onClose, onSelectStyle }: PhotographyStyleModalProps) {
  // Get user gender from hook
  const { gender, isLoading: isGenderLoading } = useUserGender();
  
  // Filter styles based on user gender (convert null to undefined)
  const filteredStyles = useGenderFilter(photographyStyleOptions, gender || undefined);
  
  // Memoize the calculation of gender-specific images for all filtered styles
  const stylesWithImages = useMemo(() => {
    return filteredStyles.map(style => ({
      ...style,
      genderSpecificImages: getStyleImages(style.previewImages, gender || undefined)
    }));
  }, [filteredStyles, gender]); // Re-calculate only when filteredStyles or gender changes
  
  // Define the scrollable content as a component that forwards refs
  const ScrollableContent = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
    <div ref={ref} className="flex-grow overflow-y-auto p-6">
      {children}
    </div>
  ));
  ScrollableContent.displayName = 'ScrollableContent'; // Good practice for dev tools

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="h-screen w-screen min-w-screen max-w-none rounded-none p-0 flex flex-col border-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-2xl">Choose Photography Style</DialogTitle>
          <DialogDescription>
            Select the overall look and feel for your headshots.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollableContent>
          {stylesWithImages.length === 0 && !isGenderLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-muted-foreground text-center">
                No styles available for your gender preference.
              </p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Please update your gender preference or contact support.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stylesWithImages.map((option) => {
              // Access the pre-calculated images
              const genderSpecificImages = option.genderSpecificImages;
              
              return (
                <Card key={option.id} className="flex flex-col bg-card border shadow-sm overflow-hidden">
                  <CardHeader className="p-0 relative">
                    <Carousel className="w-full" opts={{ loop: true }}>
                      <CarouselContent>
                        {genderSpecificImages.map((imgSrc, index) => (
                          <CarouselItem key={index}>
                            <div className="relative aspect-square w-full">
                              <Image
                                src={imgSrc} 
                                alt={`${option.name} Example ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover"
                                priority={index === 0}
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {genderSpecificImages.length > 1 && (
                        <>
                          <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/70 hover:bg-background/90" />
                          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/70 hover:bg-background/90" />
                        </>
                      )}
                    </Carousel>
                  </CardHeader>
                  <CardContent className="flex-grow p-4">
                    <h3 className="text-lg font-semibold mb-1">{option.name}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 border-t mt-auto">
                    <Button 
                      className="w-full" 
                      onClick={() => onSelectStyle(option.id as StylePhotographyStyle)}
                    >
                      Select Style
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </ScrollableContent>
      </DialogContent>
    </Dialog>
  )
} 