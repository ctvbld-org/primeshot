'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { BackgroundSelector } from '@/components/composition/background-selector'
import { OutfitSelector } from '@/components/composition/outfit-selector'
import { PhotographyStyleSelector } from '@/components/composition/photography-style-selector'
import { useCompositionStore } from '@/store/composition'
import { saveComposition } from '@/lib/api/compositions'
import { CompositionStatus } from '@/lib/types'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CompositionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { settings, reset } = useCompositionStore()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save a composition',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSaving(true)

      // Format the name based on selected settings
      const formattedName = `${settings.photographyStyle} ${settings.outfit} ${settings.background}`
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      const composition = {
        user_id: user.id,
        name: formattedName,
        settings,
        status: 'draft' as CompositionStatus
      }

      await saveComposition(composition)
      
      toast({
        title: 'Success',
        description: 'Your composition has been saved as a draft'
      })
      
      reset() // Reset the form after successful save
      router.push('/app/compositions') // Redirect to compositions page
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save composition',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Style Composition</h2>
        <p className="text-muted-foreground">
          Create your perfect headshot style by selecting your preferred options.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Style Selection</CardTitle>
          <CardDescription>
            Choose your preferred style elements to create your unique headshot composition.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PhotographyStyleSelector />
          
          <Tabs defaultValue="background" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="outfit">Outfit</TabsTrigger>
            </TabsList>
            <TabsContent value="background" className="mt-4">
              <BackgroundSelector />
            </TabsContent>
            <TabsContent value="outfit" className="mt-4">
              <OutfitSelector />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Composition'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 