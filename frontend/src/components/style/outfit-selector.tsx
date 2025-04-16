import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useStyleStore } from '@/store/style'
import { StyleOutfit } from '@/lib/types'
import * as React from 'react'
import { cn } from '@/lib/utils'

const outfitOptions = [
  {
    value: 'business',
    label: 'Business Professional',
    description: 'Formal business attire'
  },
  {
    value: 'business-casual',
    label: 'Business Casual',
    description: 'Smart casual office wear'
  },
  {
    value: 'casual',
    label: 'Smart Casual',
    description: 'Polished everyday style'
  },
  {
    value: 'creative',
    label: 'Creative Professional',
    description: 'Modern creative industry style'
  },
  {
    value: 'tech',
    label: 'Tech Professional',
    description: 'Contemporary tech industry look'
  },
  {
    value: 'startup',
    label: 'Startup Casual',
    description: 'Modern startup culture attire'
  }
] as const

const OutfitSelector = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    value?: string
    onValueChange?: (value: string) => void
  }
>(({ className, value, onValueChange, ...props }, ref) => {
  const { settings, setOutfit } = useStyleStore()

  return (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      <RadioGroup
        value={value}
        onValueChange={(value: string) => {
          onValueChange?.(value)
          setOutfit(value as StyleOutfit)
        }}
        className="grid grid-cols-2 gap-4"
      >
        {outfitOptions.map((outfit) => (
          <div key={outfit.value}>
            <RadioGroupItem
              value={outfit.value}
              id={outfit.value}
              className="peer sr-only"
            />
            <Label
              htmlFor={outfit.value}
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <div className="mb-2">
                {/* TODO: Add preview images for each outfit style */}
                <div className="h-24 w-full rounded bg-muted" />
              </div>
              <div className="space-y-1 text-center">
                <p className="font-medium leading-none">{outfit.label}</p>
                <p className="text-sm text-muted-foreground">{outfit.description}</p>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
})

OutfitSelector.displayName = 'OutfitSelector'

export { OutfitSelector } 