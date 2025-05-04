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
import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { ArrowRightIcon } from 'lucide-react'
import { Image as ImageType } from '@/lib/types'
import { useTranslation } from 'react-i18next'

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

console.log(ethnicityOptions);
console.log(eyeColorOptions);
console.log(hairColorOptions);
console.log(hairLengthOptions);
console.log(bodyTypeOptions);

type ImageRecord = ImageType

export default function ReviewPage() {
  const { t } = useTranslation('review')
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

      try {
        const supabase = createClient()
        
        // Get the most recent paid order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select()
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (orderError) throw orderError

        if (!orderData) {
          toast({
            title: t('errors.noActiveOrder', { ns: 'upload' }),
            description: t('errors.paymentRequired', { ns: 'upload' }),
            variant: 'destructive'
          })
          router.push('/app/shoot')
          return
        }

        const currentOrderId = orderData.id
        setDraftOrderId(currentOrderId)
        console.log("Paid Order ID:", currentOrderId)

        const response = await fetch(`/api/user-images?orderId=${currentOrderId}`)
        
        if (!response.ok) {
           const errorData = await response.json()
           throw new Error(errorData.error || `API error! Status: ${response.status}`)
        }
        
        const imagesWithUrls = await response.json()
        
        if (!Array.isArray(imagesWithUrls)) {
            throw new Error("Invalid image data received from API.")
        }
        
        setUploadedImages(imagesWithUrls as ImageRecord[])
        console.log("Images received from /api/user-images:", imagesWithUrls)

      } catch (error) {
        console.error("Error fetching review data:", error)
        toast({
          title: t('submit.toast.error.title'),
          description: error instanceof Error ? error.message : t('submit.toast.error.description'),
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast, t, router])

  const onSubmit = async (data: DemographicsFormData) => {
    if (!user) {
      toast({ 
        title: t('submit.toast.error.title'), 
        description: t('submit.toast.error.userNotLoggedIn'), 
        variant: 'destructive' 
      });
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
        title: t('submit.toast.success.title'),
        description: t('submit.toast.success.description'),
      });
        
      router.push('/app/albums'); 

    } catch (error: unknown) {
      console.error('Error submitting demographics:', error);
      toast({
        title: t('submit.toast.error.title'),
        description: error instanceof Error ? error.message : t('submit.toast.error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSelectField = (
    fieldName: keyof DemographicsFormData,
    options: { [key: string]: string }
  ) => (
    <div>
      <Label htmlFor={fieldName}>{t(`aboutYou.fields.${fieldName}.label`)}</Label>
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger id={fieldName}>
              <SelectValue placeholder={t(`aboutYou.fields.${fieldName}.placeholder`)} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(options).map(([key, value]) => (
                <SelectItem key={key} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors[fieldName] && (
        <p className="text-sm text-destructive mt-1">
          {t(`aboutYou.fields.${fieldName}.error`)}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('uploadedPhotos.title')}</CardTitle>
          <CardDescription>{t('uploadedPhotos.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>{t('uploadedPhotos.loading')}</p>
          ) : uploadedImages.length === 0 ? (
            <p>{t('uploadedPhotos.noPhotos')}</p>
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
          <CardTitle>{t('aboutYou.title')}</CardTitle>
          <CardDescription>{t('aboutYou.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {renderSelectField('ethnicity', t('aboutYou.fields.ethnicity.options', { returnObjects: true }))}
            {renderSelectField('eyeColor', t('aboutYou.fields.eyeColor.options', { returnObjects: true }))}
            {renderSelectField('hairColor', t('aboutYou.fields.hairColor.options', { returnObjects: true }))}
            {renderSelectField('hairLength', t('aboutYou.fields.hairLength.options', { returnObjects: true }))}
            {renderSelectField('bodyType', t('aboutYou.fields.bodyType.options', { returnObjects: true }))}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting || isLoading || uploadedImages.length === 0}>
                {isSubmitting ? t('submit.button.saving') : t('submit.button.default')}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 