'use client'

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateDraftOrder } from '@/lib/api/orders'
import { createPresignedGetUrl } from '@/lib/s3'
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
import type { Database } from '@/types/supabase'
import { ArrowRightIcon } from 'lucide-react'
import { Image as ImageType } from '@/lib/types'

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

type ImageRecord = ImageType

export default function ReviewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { updateProgress } = useUserProgress()
  const [uploadedImages, setUploadedImages] = useState<ImageRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null)

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

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      setIsLoading(true);
      try {
        const order = await getOrCreateDraftOrder(user.id);
        if (!order) {
          throw new Error("Could not find or create a draft order.");
        }
        const currentOrderId = order.id;
        setDraftOrderId(currentOrderId);
        console.log("Draft Order ID:", currentOrderId);

        const response = await fetch(`/api/user-images?orderId=${currentOrderId}`);
        
        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.error || `API error! Status: ${response.status}`);
        }
        
        const imagesWithUrls = await response.json();
        
        if (!Array.isArray(imagesWithUrls)) {
            throw new Error("Invalid image data received from API.");
        }
        
        setUploadedImages(imagesWithUrls as ImageRecord[]); 
        console.log("Images received from /api/user-images:", imagesWithUrls);

      } catch (error) {
        console.error("Error fetching review data:", error);
        toast({
          title: 'Error Loading Review Data',
          description: error instanceof Error ? error.message : 'Could not load review data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user, toast]);

  const onSubmit = async (data: DemographicsFormData) => {
    if (!user) {
      toast({ title: 'Error', description: 'User not logged in.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const supabase = createClient();

    try {
      if (draftOrderId) {
          const { data: existingOrderData, error: fetchError } = await supabase
            .from('orders')
            .select('metadata')
            .eq('id', draftOrderId)
            .single();
          if (fetchError) throw new Error(`Failed to fetch existing order metadata: ${fetchError.message}`);
          const existingMetadata = existingOrderData?.metadata || {};

          const { error: updateError } = await supabase
            .from('orders')
            .update({ metadata: { ...existingMetadata, demographics: data } })
            .eq('id', draftOrderId);
          if (updateError) throw updateError;
          console.log("Order metadata updated with demographics.");
      } else {
          console.warn("Draft Order ID not available, attempting to save to user metadata.");
          const { error: updateUserError } = await supabase.auth.updateUser({
            data: { demographics: data } 
          });
          if (updateUserError) throw updateUserError;
          console.log("User auth metadata updated with demographics.");
      }

      await updateProgress('review');
      console.log("User progress updated to review stage complete.");

      toast({
        title: 'Information Saved',
        description: 'Your demographic information has been saved.',
      });
        
      router.push('/app/dashboard'); 

    } catch (error: any) {
      console.error('Error submitting demographics:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Could not save your information.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Your Uploads</h1>
        <p className="text-muted-foreground">
          Please review your uploaded photos and provide some details to help us generate the best headshots.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Photos</CardTitle>
          <CardDescription>Here are the photos you uploaded for this order.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading images...</p>
          ) : uploadedImages.length === 0 ? (
            <p>No photos found for this order. Please go back and upload images.</p>
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
                    priority={uploadedImages.indexOf(image) < 8}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About You</CardTitle>
          <CardDescription>This information helps tailor the headshot generation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <Button type="submit" disabled={isSubmitting || isLoading || uploadedImages.length === 0}>
                {isSubmitting ? 'Saving...' : 'Save and Continue to Dashboard'}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 