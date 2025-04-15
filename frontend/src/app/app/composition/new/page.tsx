'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useCompositionStore } from '@/store/composition'
import { saveComposition } from '@/lib/api/compositions'
import { getOrCreateDraftOrder } from '@/lib/api/orders'
import { ensureUserProgress } from '@/lib/api/progress'
import { 
  CompositionStatus, 
  CompositionPhotographyStyle, 
  CompositionBackground,
  CompositionOutfit,
  CompositionOutfitColor 
} from '@/lib/types'

// Import the actual selector components
import { BackgroundImageSelector } from '@/components/composition/background-image-selector'
import { OutfitImageSelector } from '@/components/composition/outfit-image-selector'
import { OutfitColorSelector } from '@/components/composition/outfit-color-selector'

// Import configs needed for setting defaults
import stylesConfig from '@/lib/config/styles.json' assert { type: "json" };

function NewCompositionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  // Get all setters needed
  const { settings, setBackground, setOutfit, setOutfitColor, reset } = useCompositionStore()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  
  // Read style directly from params. Suspense handles the initial null state.
  const photographyStyle = searchParams.get('style') as CompositionPhotographyStyle | null;
  // Start as false, only set to true once validation passes
  const [isStyleValidated, setIsStyleValidated] = useState(false); 

  // --- Validation Effect --- 
  // Runs ONLY when photographyStyle from searchParams changes.
  useEffect(() => {
    console.log("Validation Effect Triggered. Style Param:", photographyStyle);

    // Wait if the parameter isn't available yet
    if (photographyStyle === null) {
      console.log("Style param is null, waiting...");
      setIsStyleValidated(false); 
      return; 
    }

    // --- Updated Validation Logic --- 
    // Check if the received style exists as an ID in our config
    const isValid = stylesConfig.some(style => style.id === photographyStyle);
    // --- End Updated Validation Logic --- 
    
    if (isValid) {
      console.log("Style is valid (found in styles.json):", photographyStyle);
      setIsStyleValidated(true); // Mark as valid
    } else {
      // Style has a value, but it doesn't match any ID in styles.json
      console.error("Invalid style value detected (not in styles.json):", photographyStyle);
      toast({
        title: 'Invalid Style',
        description: 'The selected photography style is not recognized.',
        variant: 'destructive'
      })
      router.replace('/app/compositions');
      setIsStyleValidated(false); // Mark as invalid
    }
  }, [photographyStyle, router, toast]); 

  // --- Default Setting Effect --- 
  // Runs only AFTER style is validated
  useEffect(() => {
    if (isStyleValidated && photographyStyle) {
      console.log("Setting defaults for style:", photographyStyle);
      // Find the config for the validated style
      const styleConfig = stylesConfig.find(s => s.id === photographyStyle);
      if (!styleConfig) {
        console.error("Config not found for validated style:", photographyStyle);
        return; // Should not happen if validation passed
      }

      // Set defaults based on the *first available* option for this style
      const defaultBg = styleConfig.availableBackgrounds?.[0] as CompositionBackground | undefined;
      const defaultOutfit = styleConfig.availableOutfits?.[0] as CompositionOutfit | undefined;
      const defaultColor = styleConfig.availableOutfitColors?.[0] as CompositionOutfitColor | undefined;

      console.log("Defaults:", { defaultBg, defaultOutfit, defaultColor });

      // Reset store to ensure clean slate before setting defaults for this style
      // Only reset the selectable fields, keep photographyStyle implicit via param
      reset(); // Reset the entire store first
      
      // Now set the defaults based on the validated style
      if (defaultBg) setBackground(defaultBg);
      if (defaultOutfit) setOutfit(defaultOutfit);
      if (defaultColor) setOutfitColor(defaultColor);

    } else {
      console.log("Skipping default setting, style not validated yet or invalid.");
    }
    // Depend on validation status and the style itself
  }, [isStyleValidated, photographyStyle, setBackground, setOutfit, setOutfitColor, reset]);

  const handleSave = async () => {
    // Use the validated photographyStyle directly
    if (!user || !photographyStyle || !isStyleValidated || !settings.background || !settings.outfit || !settings.outfitColor) {
      toast({
        title: 'Incomplete Selection',
        description: 'Could not save. Ensure user is logged in and all options are selected.',
        variant: 'destructive'
      })
      console.error("Save validation failed:", { user, photographyStyle, isStyleValidated, settings });
      return
    }

    try {
      setIsSaving(true)
      const order = await getOrCreateDraftOrder(user.id)
      const orderId = order.id

      const formattedName = `${photographyStyle} ${settings.outfit} (${settings.outfitColor}) ${settings.background}`
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      // Ensure settings passed match the validated style
      const compositionData = {
        user_id: user.id,
        order_id: orderId,
        name: formattedName,
        settings: {
          photographyStyle: photographyStyle, // Use the validated style
          outfit: settings.outfit,
          background: settings.background,
          outfitColor: settings.outfitColor,
          // Keep compatibility fields if needed, using validated style
          style: settings.outfit,
          lighting: photographyStyle 
        },
        status: 'draft' as CompositionStatus
      }

      console.log("Saving composition data:", compositionData);
      await saveComposition(compositionData)
      await ensureUserProgress(user.id) 
      
      toast({
        title: 'Success',
        description: 'Your composition has been saved as a draft'
      })
      
      // Reset happens automatically on navigation due to cleanup in edit page,
      // but explicit reset before push ensures state is clean if user navigates back quickly.
      reset(); 
      router.push('/app/compositions')
    } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to save composition';
      toast({
        title: 'Error Saving Composition',
        description: message,
        variant: 'destructive'
      })
      console.error("Save Error:", error);
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = useCallback(() => {
    reset(); // Reset store state on cancel
    router.push('/app/compositions')
  }, [router, reset]);


  // --- Render Logic ---
  // Show loading state until validation explicitly passes
  if (!isStyleValidated) {
    console.log("Rendering loading state (isStyleValidated=false)");
    // The validation useEffect handles redirection if the style is invalid
    return <div>Validating style...</div> 
  }
  
  // It's now safe to assume photographyStyle is a valid string
  console.log("Rendering content for validated style:", photographyStyle);
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create New Composition</h2>
        <p className="text-muted-foreground">
          Selected Style: <span className="font-semibold capitalize">{photographyStyle!}</span>. Now choose your options.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Composition Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-lg font-medium mb-3">Background</h3>
            <BackgroundImageSelector photographyStyle={photographyStyle!} />
          </section>

          <section>
            <h3 className="text-lg font-medium mb-3">Outfit</h3>
            <OutfitImageSelector photographyStyle={photographyStyle!} />
          </section>

          <section>
            <h3 className="text-lg font-medium mb-3">Outfit Color</h3>
            <OutfitColorSelector photographyStyle={photographyStyle!} />
          </section>

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button 
            variant="outline"
            className="w-full sm:w-auto order-2 sm:order-1"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            className="w-full sm:w-auto order-1 sm:order-2"
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

// Keep the Suspense wrapper around the content
export default function NewCompositionPage() {
  return (
    <Suspense fallback={<div>Loading style selection...</div>}>
      <NewCompositionContent />
    </Suspense>
  )
} 