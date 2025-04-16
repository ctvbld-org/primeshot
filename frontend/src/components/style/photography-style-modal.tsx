import React, { forwardRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Image from 'next/image'
import { StylePhotographyStyle } from '@/lib/types'
// Import the JSON configuration
import stylesConfig from '@/lib/config/styles.json' assert { type: "json" };

// Type for the style configuration (optional but good practice)
interface StyleConfig {
  id: string;
  name: string;
  description: string;
  previewImages: string[];
  availableBackgrounds: string[];
  availableOutfits: string[];
  availableOutfitColors: string[];
}

// Use the imported JSON data
const photographyStyleOptions: StyleConfig[] = stylesConfig;

interface PhotographyStyleModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectStyle: (style: StylePhotographyStyle) => void
}

export function PhotographyStyleModal({ isOpen, onClose, onSelectStyle }: PhotographyStyleModalProps) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photographyStyleOptions.map((option) => (
              <Card key={option.id} className="flex flex-col bg-card border shadow-sm overflow-hidden">
                <CardHeader className="p-0 relative">
                  <Carousel className="w-full" opts={{ loop: true }}>
                    <CarouselContent>
                      {option.previewImages.map((imgSrc, index) => (
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
                    {option.previewImages.length > 1 && (
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
                  <Button className="w-full" onClick={() => onSelectStyle(option.id as StylePhotographyStyle)}>
                    Select Style
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollableContent>
      </DialogContent>
    </Dialog>
  )
} 