import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FileWithScore, Image } from '@/lib/types'

export const useCharacterImages = (characterId?: string) => {
  const [images, setImages] = useState<FileWithScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const fetchImages = useCallback(async () => {
    // Create client within the callback to avoid changing dependencies
    const supabase = createClient()
    if (!characterId) {
      setImages([])
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('uploaded_images')
        .select('*')
        .eq('character_id', characterId)

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
  }, [characterId])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  // Add removeImage function to handle local state update
  const removeImage = useCallback((imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }, [])

  // Memoize the images array to prevent unnecessary re-renders
  const memoizedImages = useMemo(() => images, [images])

  return { 
    images: memoizedImages, 
    isLoading, 
    error,
    removeImage,
    refetch: fetchImages
  }
}