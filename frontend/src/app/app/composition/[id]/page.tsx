'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { BackgroundSelector } from '@/components/composition/background-selector'
import { OutfitSelector } from '@/components/composition/outfit-selector'
import { PhotographyStyleSelector } from '@/components/composition/photography-style-selector'
import { useCompositionStore } from '@/store/composition'
import { createClient } from '@/lib/supabase/client'
import { Composition, CompositionSettings } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CompositionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { settings, setBackground, setOutfit, setPhotographyStyle } = useCompositionStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<CompositionSettings | null>(null)

  const hasUnsavedChanges = originalSettings && (
    originalSettings.background !== settings.background ||
    originalSettings.outfit !== settings.outfit ||
    originalSettings.photographyStyle !== settings.photographyStyle
  )

  useEffect(() => {
    async function loadComposition() {
      if (!user || !params.id) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('compositions')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        if (!data) {
          toast({
            title: 'Error',
            description: 'Composition not found',
            variant: 'destructive'
          })
          router.push('/app/compositions')
          return
        }

        const composition = data as Composition
        setBackground(composition.settings.background)
        setOutfit(composition.settings.outfit)
        setPhotographyStyle(composition.settings.photographyStyle)
        setOriginalSettings(composition.settings)
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load composition',
          variant: 'destructive'
        })
        router.push('/app/compositions')
      } finally {
        setIsLoading(false)
      }
    }

    loadComposition()
  }, [user, params.id, router, toast, setBackground, setOutfit, setPhotographyStyle])

  const handleSave = async () => {
    if (!user || !params.id) return

    try {
      setIsSaving(true)
      const supabase = createClient()

      // Format the name based on selected settings
      const formattedName = `${settings.photographyStyle} ${settings.outfit} ${settings.background}`
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      const { error } = await supabase
        .from('compositions')
        .update({ 
          settings,
          name: formattedName
        })
        .eq('id', params.id)
        .eq('user_id', user.id)

      if (error) throw error

      setOriginalSettings(settings)
      toast({
        title: 'Success',
        description: 'Your composition has been updated'
      })
      router.push('/app/compositions')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update composition',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowDiscardDialog(true)
    } else {
      router.push('/app/compositions')
    }
  }

  const handleConfirmDiscard = () => {
    setShowDiscardDialog(false)
    router.push('/app/compositions')
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading composition...</div>
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Style Composition</h2>
          <p className="text-muted-foreground">
            View or update your headshot style composition.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Style Selection</CardTitle>
            <CardDescription>
              Your selected style elements for this composition.
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
          <CardFooter className="flex gap-4">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 