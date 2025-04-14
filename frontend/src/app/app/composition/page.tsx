'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { BackgroundSelector } from '@/components/composition/background-selector'
import { OutfitSelector } from '@/components/composition/outfit-selector'
import { PhotographyStyleSelector } from '@/components/composition/photography-style-selector'
import { StylePreview } from '@/components/composition/style-preview'
import { useCompositionStore } from '@/store/composition'
import { saveComposition } from '@/lib/api/compositions'
import { CompositionStatus } from '@/lib/types'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CompositionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { settings, reset } = useCompositionStore()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [openDrawer, setOpenDrawer] = useState<'background' | 'outfit' | null>(null)

  // Check if user has already progressed beyond compositions stage
  useEffect(() => {
    const checkUserProgress = async () => {
      if (!user) return;
      
      try {
        const supabase = createClient();
        const { data: progress, error } = await supabase
          .from('user_progress')
          .select('current_stage')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        // If user has already progressed to upload, payment, or later stage, redirect
        if (progress && 
            ['upload', 'payment', 'review', 'dashboard'].includes(progress.current_stage)) {
          
          // Show toast notification before redirecting
          toast({
            title: 'Access denied',
            description: `You've already progressed to the ${progress.current_stage} stage. You cannot modify compositions now.`,
            variant: 'destructive',
          });
          
          // Short delay to ensure toast is visible before redirect
          setTimeout(() => {
            router.replace(`/app/${progress.current_stage}`);
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking user progress:', error);
      }
    };
    
    checkUserProgress();
  }, [user, router, toast]);

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

  const handleDrawerToggle = (drawer: 'background' | 'outfit') => {
    // If the clicked drawer is already open, do nothing
    if (openDrawer === drawer) return
    // Otherwise, open the clicked drawer
    setOpenDrawer(drawer)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Style Composition</h2>
        <p className="text-muted-foreground">
          Create your perfect headshot style by selecting your preferred options.
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
            <BackgroundSelector />
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
            <OutfitSelector />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
} 