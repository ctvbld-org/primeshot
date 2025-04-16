'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { useStyleStore } from '@/store/style'
import { createClient } from '@/lib/supabase/client'
import { Style, StyleSettings, StylePhotographyStyle } from '@/lib/types'
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
import { deleteStyle } from '@/lib/api/styles'
import { TrashIcon } from '@heroicons/react/24/outline'

// Import the new selectors
import { BackgroundImageSelector } from '@/components/style/background-image-selector'
import { OutfitImageSelector } from '@/components/style/outfit-image-selector'
import { OutfitColorSelector } from '@/components/style/outfit-color-selector'

// Use Suspense for potential future use with data fetching
function EditStyleContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { settings, setBackground, setOutfit, setOutfitColor, reset } = useStyleStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<StyleSettings | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [styleName, setStyleName] = useState('')
  const [photographyStyle, setPhotographyStyle] = useState<StylePhotographyStyle | null>(null)

  const styleId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Calculate unsaved changes based on store state vs original loaded state
  const hasUnsavedChanges = originalSettings && (
    originalSettings.background !== settings.background ||
    originalSettings.outfit !== settings.outfit ||
    originalSettings.outfitColor !== settings.outfitColor
    // Note: photographyStyle is not editable here, so no need to compare
  )

  useEffect(() => {
    async function loadStyle() {
      if (!user || !styleId) {
        setIsLoading(false);
        toast({ title: 'Error', description: 'Missing user or style ID.', variant: 'destructive' })
        router.replace('/app/shoot');
        return;
      }

      setIsLoading(true);
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('styles')
          .select('*')
          .eq('id', styleId)
          .eq('user_id', user.id)
          .single()

        if (error || !data) {
          throw error || new Error('Style not found or access denied.');
        }

        const loadedStyle = data as Style
        const loadedSettings = loadedStyle.settings as StyleSettings;

        // Set the store state with loaded data
        setBackground(loadedSettings.background)
        setOutfit(loadedSettings.outfit)
        // Handle potentially missing outfitColor from older styles
        setOutfitColor(loadedSettings.outfitColor || '#000000') 
        // Set photography style locally as it's not editable
        setPhotographyStyle(loadedSettings.photographyStyle)
        setStyleName(loadedStyle.name)
        
        // Store the initially loaded settings to compare for unsaved changes
        setOriginalSettings(loadedSettings)

      } catch (error) {
        toast({
          title: 'Error Loading Style',
          description: error instanceof Error ? error.message : 'Could not load the style data.',
          variant: 'destructive'
        })
        router.replace('/app/shoot')
      } finally {
        setIsLoading(false)
      }
    }

    loadStyle()

    // Cleanup function to reset store when navigating away
    return () => {
      reset();
    };
  }, [user, styleId, router, toast, setBackground, setOutfit, setOutfitColor, reset])

  const handleSave = async () => {
    if (!user || !styleId || !settings.background || !settings.outfit || !settings.outfitColor || !photographyStyle) {
       toast({ title: 'Error', description: 'Missing required data to save.', variant: 'destructive' })
       return
    }

    try {
      setIsSaving(true)
      const supabase = createClient()

      // Use the current store settings for the update
      const updatedSettings = {
        ...settings, // Includes background, outfit, outfitColor from store
        photographyStyle: photographyStyle, // Keep original style
      };
      
      // Regenerate name based on potentially updated settings
      const formattedName = `${photographyStyle} ${settings.outfit} (${settings.outfitColor}) ${settings.background}`
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      const { error } = await supabase
        .from('styles')
        .update({ 
          settings: updatedSettings,
          name: formattedName
        })
        .eq('id', styleId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update original settings to reflect the saved state
      setOriginalSettings(updatedSettings)
      setStyleName(formattedName)
      
      toast({
        title: 'Success',
        description: 'Your style has been updated'
      })
      // Optional: navigate back after save, or stay on page
      router.push('/app/shoot') 
    } catch (error) {
      toast({
        title: 'Error Updating Style',
        description: error instanceof Error ? error.message : 'Failed to update style',
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
      router.push('/app/shoot')
    }
  }

  const handleConfirmDiscard = () => {
    // Restore store state to original loaded settings before navigating
    if (originalSettings) {
      setBackground(originalSettings.background);
      setOutfit(originalSettings.outfit);
      setOutfitColor(originalSettings.outfitColor || '#000000');
    }
    setShowDiscardDialog(false)
    router.push('/app/shoot')
  }

  const handleDelete = async () => {
    if (!user || !styleId) return

    try {
      setIsDeleting(true)
      await deleteStyle(styleId, user.id)
      toast({
        title: 'Success',
        description: 'Style deleted successfully'
      })
      reset() // Clear store state after delete
      router.push('/app/shoot')
    } catch (error) {
      toast({
        title: 'Error Deleting Style',
        description: error instanceof Error ? error.message : 'Failed to delete style',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading style...</div>
  }

  if (!originalSettings || !photographyStyle) {
     return <div className="text-center py-8">Failed to load style data.</div>
  }

  // Main component structure aligned with new/page.tsx
  return (
    <>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Style</h2>
          <p className="text-muted-foreground">
            Style: <span className="font-semibold capitalize">{photographyStyle}</span> (Style cannot be changed after creation).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Update Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-medium mb-3">Background</h3>
              <BackgroundImageSelector photographyStyle={photographyStyle} />
            </section>

            <section>
              <h3 className="text-lg font-medium mb-3">Outfit</h3>
              <OutfitImageSelector photographyStyle={photographyStyle} />
            </section>

            <section>
              <h3 className="text-lg font-medium mb-3">Outfit Color</h3>
              <OutfitColorSelector photographyStyle={photographyStyle} />
            </section>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button 
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              className="w-full sm:w-auto order-3 sm:order-1"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Style'}
            </Button>
            <div className="flex gap-4 w-full sm:w-auto order-2">
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
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Unsaved Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them and leave the page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Style?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the style "{styleName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Wrap component in Suspense
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditStyleContent />
    </Suspense>
  )
} 