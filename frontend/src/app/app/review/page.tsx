'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { useUserProgress } from '@/hooks/use-user-progress'
import type { Image as DbImage } from '@/lib/types'

// --- Zod Schema for Validation ---
const demographicsSchema = z.object({
  ethnicity: z.string().min(1, 'Ethnicity is required'),
  eyeColor: z.string().min(1, 'Eye color is required'),
  hairColor: z.string().min(1, 'Hair color is required'),
  hairLength: z.string().min(1, 'Hair length is required'),
  bodyType: z.string().min(1, 'Body type is required'),
})

type DemographicsFormData = z.infer<typeof demographicsSchema>

// --- Dropdown Options (Define actual options needed) ---
const ethnicityOptions = ['Asian', 'Black/African Descent', 'Hispanic/Latino', 'Middle Eastern', 'Native American', 'Pacific Islander', 'White/Caucasian', 'Mixed', 'Prefer not to say']
const eyeColorOptions = ['Brown', 'Blue', 'Green', 'Hazel', 'Grey', 'Amber', 'Other']
const hairColorOptions = ['Black', 'Brown', 'Blonde', 'Red', 'Grey', 'White', 'Dyed/Other']
const hairLengthOptions = ['Bald/Shaved', 'Short', 'Medium', 'Long', 'Other']
const bodyTypeOptions = ['Slim', 'Average', 'Athletic', 'Heavy-set', 'Prefer not to say']

export default function ReviewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [uploadedImages, setUploadedImages] = useState<DbImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<DemographicsFormData>({
    resolver: zodResolver(demographicsSchema),
    defaultValues: {
      ethnicity: '',
      eyeColor: '',
      hairColor: '',
      hairLength: '',
      bodyType: '',
    },
  })

  const { updateProgress } = useUserProgress()

  // --- Fetch Uploaded Images ---
  useEffect(() => {
    async function fetchImages() {
      if (!user) return
      setIsLoading(true)
      try {
        // Use the new API endpoint that provides presigned URLs
        const response = await fetch('/api/images');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setUploadedImages(data || [])
      } catch (error) {
        console.error('Error fetching images:', error)
        toast({
          title: 'Error loading images',
          description: 'Could not fetch your uploaded photos.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchImages()
  }, [user, toast])

  // --- Handle Form Submission ---
  const onSubmit = async (data: DemographicsFormData) => {
    if (!user) return
    setIsSubmitting(true)
    const supabase = createClient()

    try {
      // 1. Save User Progress (using hook)
      await updateProgress('payment', { demographics: data })
      console.log("User progress updated to payment stage.")

      // 2. Upsert Demographics Data (maybe redundant if stored in stage_data? Decide strategy)
      // For now, let's keep it separate in auth metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { demographics: data }
      })
      if (updateError) throw updateError
      console.log("User auth metadata updated with demographics.")

      toast({
        title: 'Information Saved',
        description: 'Your demographic information has been saved.',
      })
      
      // 3. Navigate to the next step
      router.push('/app/payment')

    } catch (error: any) {
      console.error('Error submitting demographics:', error)
      toast({
        title: 'Submission Failed',
        description: error.message || 'Could not save your information.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Your Uploads</h1>
        <p className="text-muted-foreground">
          Please review your uploaded photos and provide some details to help us generate the best headshots.
        </p>
      </div>

      {/* --- Uploaded Images Section --- */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Photos</CardTitle>
          <CardDescription>Here are the photos you uploaded.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading images...</p>
          ) : uploadedImages.length === 0 ? (
            <p>You haven't uploaded any photos yet.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {uploadedImages.map((image) => (
                <div key={image.id} className="aspect-square relative overflow-hidden rounded-md border">
                  <Image 
                    src={image.url} 
                    alt={image.file_name || 'Uploaded image'} 
                    fill 
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12.5vw"
                    className="object-cover"
                    priority={uploadedImages.indexOf(image) < 8} // Prioritize loading first few images
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Demographics Questionnaire Section --- */}
      <Card>
        <CardHeader>
          <CardTitle>About You</CardTitle>
          <CardDescription>This information helps tailor the headshot generation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Ethnicity */}
            <div>
              <Label htmlFor="ethnicity">Ethnicity</Label>
              <Controller
                name="ethnicity"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="ethnicity">
                      <SelectValue placeholder="Select your ethnicity" />
                    </SelectTrigger>
                    <SelectContent>
                      {ethnicityOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.ethnicity && <p className="text-sm text-destructive mt-1">{errors.ethnicity.message}</p>}
            </div>

            {/* Eye Color */}
            <div>
              <Label htmlFor="eyeColor">Eye Color</Label>
              <Controller
                name="eyeColor"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="eyeColor">
                      <SelectValue placeholder="Select your eye color" />
                    </SelectTrigger>
                    <SelectContent>
                      {eyeColorOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.eyeColor && <p className="text-sm text-destructive mt-1">{errors.eyeColor.message}</p>}
            </div>

            {/* Hair Color */}
             <div>
              <Label htmlFor="hairColor">Hair Color</Label>
              <Controller
                name="hairColor"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="hairColor">
                      <SelectValue placeholder="Select your hair color" />
                    </SelectTrigger>
                    <SelectContent>
                      {hairColorOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.hairColor && <p className="text-sm text-destructive mt-1">{errors.hairColor.message}</p>}
            </div>

            {/* Hair Length */}
            <div>
              <Label htmlFor="hairLength">Hair Length</Label>
              <Controller
                name="hairLength"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="hairLength">
                      <SelectValue placeholder="Select your hair length" />
                    </SelectTrigger>
                    <SelectContent>
                      {hairLengthOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.hairLength && <p className="text-sm text-destructive mt-1">{errors.hairLength.message}</p>}
            </div>
            
            {/* Body Type */}
            <div>
              <Label htmlFor="bodyType">Body Type</Label>
              <Controller
                name="bodyType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="bodyType">
                      <SelectValue placeholder="Select your body type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.bodyType && <p className="text-sm text-destructive mt-1">{errors.bodyType.message}</p>}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save and Continue'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 