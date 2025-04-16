import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useCompositionStore } from '@/store/composition'
import { CompositionBackground } from '@/lib/types'
import * as React from 'react'
import { cn } from '@/lib/utils'

const backgroundOptions = [
  {
    value: 'plain',
    label: 'Plain Background',
    description: 'Clean and professional solid color background'
  },
  {
    value: 'office',
    label: 'Modern Office',
    description: 'Contemporary office environment'
  },
  {
    value: 'outdoor',
    label: 'Outdoor Natural',
    description: 'Natural outdoor environment'
  },
  {
    value: 'bookshelf',
    label: 'Library Bookshelf',
    description: 'Sophisticated library background'
  },
  {
    value: 'cafe',
    label: 'Coffee Shop',
    description: 'Casual cafe environment'
  },
  {
    value: 'studio',
    label: 'Studio Lighting',
    description: 'Professional studio setup'
  },
  {
    value: 'gradient',
    label: 'Color Gradient',
    description: 'Modern gradient background'
  },
  {
    value: 'cityscape',
    label: 'Urban Cityscape',
    description: 'Modern city skyline view'
  },
  {
    value: 'abstract',
    label: 'Abstract Pattern',
    description: 'Contemporary abstract design'
  },
  {
    value: 'brick',
    label: 'Brick Wall',
    description: 'Industrial brick texture'
  },
  {
    value: 'nature',
    label: 'Nature Scene',
    description: 'Scenic natural landscape'
  },
  {
    value: 'tech',
    label: 'Tech Space',
    description: 'Modern technology environment'
  },
  {
    value: 'custom',
    label: 'Custom Background',
    description: 'Upload your own background'
  }
] as const

const BackgroundSelector = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    value?: string
    onValueChange?: (value: string) => void
  }
>(({ className, value, onValueChange, ...props }, ref) => {
  const { settings, setBackground } = useCompositionStore()

  return (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      <RadioGroup
        value={value}
        onValueChange={(value: string) => {
          onValueChange?.(value as CompositionBackground)
          setBackground(value as CompositionBackground)
        }}
        className="grid grid-cols-2 gap-4"
      >
        {backgroundOptions.map((option) => (
          <div key={option.value}>
            <RadioGroupItem
              value={option.value}
              id={`background-${option.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`background-${option.value}`}
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <div className="mb-2">
                {/* TODO: Add preview images for each background style */}
                <div className="h-24 w-full rounded bg-muted" />
              </div>
              <div className="space-y-1 text-center">
                <p className="font-medium leading-none">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
})

BackgroundSelector.displayName = 'BackgroundSelector'

export { BackgroundSelector } 