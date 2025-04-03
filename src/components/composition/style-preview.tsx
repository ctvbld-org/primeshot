import Image from 'next/image'
import { useCompositionStore } from '@/store/composition'
import { Card, CardContent } from '@/components/ui/card'

export function StylePreview() {
  const { settings } = useCompositionStore()

  // Map settings to preview images
  const getPreviewImage = () => {
    const style = settings.photographyStyle
    const outfit = settings.outfit
    const background = settings.background

    // This would be replaced with actual preview images based on the combination
    return `/images/previews/${style}-${outfit}-${background}.jpg`
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[3/4] w-full">
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            {/* Placeholder until we have actual preview images */}
            <div className="text-center space-y-2 p-4">
              <p className="font-medium">Preview</p>
              <p className="text-sm text-muted-foreground">
                {settings.photographyStyle} style with {settings.outfit} outfit
                <br />
                on {settings.background} background
              </p>
            </div>
          </div>
          {/* Uncomment when we have actual preview images */}
          {/* <Image
            src={getPreviewImage()}
            alt="Style Preview"
            fill
            className="object-cover"
            priority
          /> */}
        </div>
      </CardContent>
    </Card>
  )
} 