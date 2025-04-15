'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { useCompositionStore } from '@/store/composition'
import { createClient } from '@/lib/supabase/client'
import { Composition, CompositionSettings, CompositionPhotographyStyle } from '@/lib/types'
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
import { deleteComposition } from '@/lib/api/compositions'
import { TrashIcon } from '@heroicons/react/24/outline'

// Import the new selectors
import { BackgroundImageSelector } from '@/components/composition/background-image-selector'
import { OutfitImageSelector } from '@/components/composition/outfit-image-selector'
import { OutfitColorSelector } from '@/components/composition/outfit-color-selector'

// Use Suspense for potential future use with data fetching
function EditCompositionContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { settings, setBackground, setOutfit, setOutfitColor, reset } = useCompositionStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<CompositionSettings | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [compositionName, setCompositionName] = useState('')
  const [photographyStyle, setPhotographyStyle] = useState<CompositionPhotographyStyle | null>(null)

  const compositionId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Calculate unsaved changes based on store state vs original loaded state
  const hasUnsavedChanges = originalSettings && (
    originalSettings.background !== settings.background ||
    originalSettings.outfit !== settings.outfit ||
    originalSettings.outfitColor !== settings.outfitColor
    // Note: photographyStyle is not editable here, so no need to compare
  )

  useEffect(() => {
    async function loadComposition() {
      if (!user || !compositionId) {
        setIsLoading(false);
        toast({ title: 'Error', description: 'Missing user or composition ID.', variant: 'destructive' })
        router.replace('/app/compositions');
        return;
      }

      setIsLoading(true);
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('compositions')
          .select('*')
          .eq('id', compositionId)
          .eq('user_id', user.id)
          .single()

        if (error || !data) {
          throw error || new Error('Composition not found or access denied.');
        }

        const loadedComposition = data as Composition
        const loadedSettings = loadedComposition.settings as CompositionSettings;

        // Set the store state with loaded data
        setBackground(loadedSettings.background)
        setOutfit(loadedSettings.outfit)
        // Handle potentially missing outfitColor from older compositions
        setOutfitColor(loadedSettings.outfitColor || '#000000') 
        // Set photography style locally as it's not editable
        setPhotographyStyle(loadedSettings.photographyStyle)
        setCompositionName(loadedComposition.name)
        
        // Store the initially loaded settings to compare for unsaved changes
        setOriginalSettings(loadedSettings)

      } catch (error) {
        toast({
          title: 'Error Loading Composition',
          description: error instanceof Error ? error.message : 'Could not load the composition data.',
          variant: 'destructive'
        })
        router.replace('/app/compositions')
      } finally {
        setIsLoading(false)
      }
    }

    loadComposition()

    // Cleanup function to reset store when navigating away
    return () => {
      reset();
    };
  }, [user, compositionId, router, toast, setBackground, setOutfit, setOutfitColor, reset])

  const handleSave = async () => {
    if (!user || !compositionId || !settings.background || !settings.outfit || !settings.outfitColor || !photographyStyle) {
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
        .from('compositions')
        .update({ 
          settings: updatedSettings,
          name: formattedName
        })
        .eq('id', compositionId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update original settings to reflect the saved state
      setOriginalSettings(updatedSettings)
      setCompositionName(formattedName)
      
      toast({
        title: 'Success',
        description: 'Your composition has been updated'
      })
      // Optional: navigate back after save, or stay on page
      // router.push('/app/compositions') 
    } catch (error) {
      toast({
        title: 'Error Updating Composition',
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
    // Restore store state to original loaded settings before navigating
    if (originalSettings) {
      setBackground(originalSettings.background);
      setOutfit(originalSettings.outfit);
      setOutfitColor(originalSettings.outfitColor || '#000000');
    }
    setShowDiscardDialog(false)
    router.push('/app/compositions')
  }

  const handleDelete = async () => {
    if (!user || !compositionId) return

    try {
      setIsDeleting(true)
      await deleteComposition(compositionId, user.id)
      toast({
        title: 'Success',
        description: 'Composition deleted successfully'
      })
      reset() // Clear store state after delete
      router.push('/app/compositions')
    } catch (error) {
      toast({
        title: 'Error Deleting Composition',
        description: error instanceof Error ? error.message : 'Failed to delete composition',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading composition...</div>
  }

  if (!originalSettings || !photographyStyle) {
     return <div className="text-center py-8">Failed to load composition data.</div>
  }

  // Main component structure aligned with new/page.tsx
  return (
    <>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Composition</h2>
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
              {isDeleting ? 'Deleting...' : 'Delete Composition'}
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
            <AlertDialogTitle>Delete Composition?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the composition "{compositionName}"? This action cannot be undone.
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
export default function EditCompositionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditCompositionContent />
    </Suspense>
  );
} 