'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { BackgroundSelector } from '@/components/style/background-selector'
import { OutfitSelector } from '@/components/style/outfit-selector'
import { PhotographyStyleSelector } from '@/components/style/photography-style-selector'
import { StylePreview } from '@/components/style/style-preview'
import { useStyleStore } from '@/store/style'
import { saveStyle } from '@/lib/api/styles'
import { getOrCreateDraftOrder } from '@/lib/api/orders'
import { ensureUserProgress } from '@/lib/api/progress'
import { StyleStatus } from '@/lib/types'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserProgress } from '@/hooks/use-user-progress'

export default function StylePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { settings, reset } = useStyleStore()
  const { toast } = useToast()
  const { progress, isLoading: isProgressLoading } = useUserProgress()
  const [isSaving, setIsSaving] = useState(false)
  const [openDrawer, setOpenDrawer] = useState<'background' | 'outfit' | null>(null)

  // Check if user has already progressed beyond styles stage
  useEffect(() => {
    if (isProgressLoading || !progress || !user) return;
    
    // Check if user has already progressed to upload, payment, or later stage
    if (['upload', 'payment', 'review', 'dashboard'].includes(progress.current_stage)) {
      // Show toast notification before redirecting
      toast({
        title: 'Access denied',
        description: `You've already progressed to the ${progress.current_stage} stage. You cannot modify styles now.`,
        variant: 'destructive',
      });
      
      // Short delay to ensure toast is visible before redirect
      setTimeout(() => {
        router.replace(`/app/${progress.current_stage}`);
      }, 1500);
    }
  }, [progress, isProgressLoading, user, router, toast]);

  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save a style',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSaving(true)

      // Use helper to get/create order
      const order = await getOrCreateDraftOrder(user.id)
      const orderId = order.id

      // Format the name based on selected settings
      const formattedName = `${settings.photographyStyle} ${settings.outfit} ${settings.background}`
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      const style = {
        user_id: user.id,
        order_id: orderId,
        name: formattedName,
        settings: {
          photographyStyle: settings.photographyStyle,
          outfit: settings.outfit,
          background: settings.background,
          style: settings.outfit,
          lighting: settings.photographyStyle
        },
        status: 'draft' as StyleStatus
      }

      await saveStyle(style)
      
      // Use helper to ensure user progress exists
      await ensureUserProgress(user.id)
      
      toast({
        title: 'Success',
        description: 'Your style has been saved as a draft'
      })
      
      reset() // Reset the form after successful save
      router.push('/app/shoot') // Redirect to shoot page
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save style',
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
        <h2 className="text-2xl font-bold tracking-tight">Choose your style</h2>
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
                {isSaving ? 'Saving...' : 'Save Style'}
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
  )
} 