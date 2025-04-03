import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useCompositionStore } from '@/store/composition'
import { CompositionOutfit } from '@/lib/types'

const outfitOptions: { value: CompositionOutfit; label: string; description: string }[] = [
  {
    value: 'professional',
    label: 'Business Professional',
    description: 'Formal business attire suitable for corporate environments'
  },
  {
    value: 'casual',
    label: 'Business Casual',
    description: 'Smart casual attire for modern workplaces'
  },
  {
    value: 'creative',
    label: 'Creative Professional',
    description: 'Stylish and expressive while maintaining professionalism'
  }
]

export function OutfitSelector() {
  const { settings, setOutfit } = useCompositionStore()

  return (
    <RadioGroup
      value={settings.outfit}
      onValueChange={(value: string) => setOutfit(value as CompositionOutfit)}
      className="grid grid-cols-2 gap-4"
    >
      {outfitOptions.map((option) => (
        <div key={option.value}>
          <RadioGroupItem
            value={option.value}
            id={`outfit-${option.value}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`outfit-${option.value}`}
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
          >
            <div className="mb-2">
              {/* TODO: Add preview images for each outfit style */}
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
  )
} 