import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useCompositionStore } from '@/store/composition'
import { CompositionBackground } from '@/lib/types'

const backgroundOptions: { value: CompositionBackground; label: string; description: string }[] = [
  {
    value: 'plain',
    label: 'Plain Background',
    description: 'Clean and professional look with a solid color background'
  },
  {
    value: 'office',
    label: 'Office Setting',
    description: 'Professional office environment with modern decor'
  },
  {
    value: 'outdoor',
    label: 'Outdoor',
    description: 'Natural lighting with a soft, blurred outdoor setting'
  },
  {
    value: 'custom',
    label: 'Custom Background',
    description: 'Upload your own background image'
  }
]

export function BackgroundSelector() {
  const { settings, setBackground } = useCompositionStore()

  return (
    <RadioGroup
      value={settings.background}
      onValueChange={(value: string) => setBackground(value as CompositionBackground)}
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
  )
} 