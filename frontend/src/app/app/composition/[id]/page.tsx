'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { BackgroundSelector } from '@/components/composition/background-selector'
import { OutfitSelector } from '@/components/composition/outfit-selector'
import { PhotographyStyleSelector } from '@/components/composition/photography-style-selector'
import { useCompositionStore } from '@/store/composition'
import { createClient } from '@/lib/supabase/client'
import { Composition, CompositionSettings } from '@/lib/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [openDrawer, setOpenDrawer] = useState<'background' | 'outfit' | null>(null)

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

  const handleDelete = async () => {
    if (!user || !params.id) return

    try {
      setIsDeleting(true)
      await deleteComposition(Array.isArray(params.id) ? params.id[0] : params.id, user.id)
      toast({
        title: 'Success',
        description: 'Composition deleted successfully'
      })
      router.push('/app/compositions')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete composition',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleDrawerToggle = (drawer: 'background' | 'outfit') => {
    // If the clicked drawer is already open, do nothing
    if (openDrawer === drawer) return
    // Otherwise, open the clicked drawer
    setOpenDrawer(drawer)
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

        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-4">
            <Button 
              variant="outline" 
              size="lg"
              className="w-48"
              onClick={() => handleDrawerToggle('background')}
            >
              Choose Background
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="w-48"
              onClick={() => handleDrawerToggle('outfit')}
            >
              Choose Outfit
            </Button>
          </div>

          <div className="mx-auto max-w-2xl">
            <Card>
              <CardContent className="space-y-6">
                <PhotographyStyleSelector />
                <div className="aspect-[3/4] w-full bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Preview image will be shown here</p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-4">
                <Button 
                  variant="destructive"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
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
        </div>

        <Sheet 
          open={openDrawer === 'background'} 
          modal={false}
          onOpenChange={(open) => !open && setOpenDrawer(null)}
        >
          <SheetContent 
            side="right" 
            className="w-[400px] sm:w-[540px]" 
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <SheetHeader>
              <SheetTitle>Choose Background</SheetTitle>
            </SheetHeader>
            <div className="mt-8 overflow-y-auto pr-6" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
              <div>
                <BackgroundSelector />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet 
          open={openDrawer === 'outfit'} 
          modal={false}
          onOpenChange={(open) => !open && setOpenDrawer(null)}
        >
          <SheetContent 
            side="right" 
            className="w-[400px] sm:w-[540px]" 
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <SheetHeader>
              <SheetTitle>Choose Outfit</SheetTitle>
            </SheetHeader>
            <div className="mt-8 overflow-y-auto pr-6" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
              <div>
                <OutfitSelector />
              </div>
            </div>
          </SheetContent>
        </Sheet>
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Composition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this composition? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
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