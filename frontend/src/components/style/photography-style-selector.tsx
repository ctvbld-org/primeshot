import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStyleStore } from '@/store/style'
import { StylePhotographyStyle } from '@/lib/types'
import Image from 'next/image'

const photographyStyleOptions: {
  value: StylePhotographyStyle
  label: string
  description: string
  image: string
}[] = [
  {
    value: 'studio',
    label: 'Studio Professional',
    description: 'Classic studio lighting with perfect exposure',
    image: '/images/styles/studio.jpg'
  },
  {
    value: 'natural',
    label: 'Natural Light',
    description: 'Soft, natural lighting for a modern look',
    image: '/images/styles/natural.jpg'
  },
  {
    value: 'dramatic',
    label: 'Dramatic Portrait',
    description: 'High contrast lighting for a bold statement',
    image: '/images/styles/dramatic.jpg'
  }
]

interface PhotographyStyleSelectorProps {
  onChange?: (style: StylePhotographyStyle) => void;
}

export function PhotographyStyleSelector({ onChange }: PhotographyStyleSelectorProps) {
  const { settings, setPhotographyStyle } = useStyleStore()

  const handleChange = (value: string) => {
    const selectedStyle = value as StylePhotographyStyle;
    setPhotographyStyle(selectedStyle);
    if (onChange) {
      onChange(selectedStyle);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Photography Style</h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred photography style to determine the overall look
        </p>
      </div>
      <Select
        value={settings.photographyStyle}
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a photography style" />
        </SelectTrigger>
        <SelectContent>
          {photographyStyleOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="flex items-center gap-4 p-4"
            >
              <div className="relative h-16 w-24 overflow-hidden rounded-md">
                <Image
                  src={option.image}
                  alt={option.label}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 