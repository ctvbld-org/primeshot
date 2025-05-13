import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FileWithScore, Image } from '@/lib/types'

export const useOrderImages = (orderId?: string) => {
  const [images, setImages] = useState<FileWithScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchImages = async () => {
      if (!orderId) {
        setImages([])
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .eq('order_id', orderId)

        if (error) throw error

        // Convert the database images to FileWithScore format
        const convertedImages: FileWithScore[] = (data as Image[]).map(img => ({
          id: img.id,
          name: img.file_name,
          url: img.url,
          isExisting: true,
          size: img.file_size,
          score: img.quality_score
        }))

        setImages(convertedImages)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch images'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchImages()
  }, [orderId, supabase])

  return { images, isLoading, error }
} 