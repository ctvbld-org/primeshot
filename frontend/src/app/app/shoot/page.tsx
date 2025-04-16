'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Style, StyleStatus } from '@/lib/types'
import { StyleCard } from '@/components/style/style-card'
import { NewStyleCard } from '@/components/style/new-style-card'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { useUserProgress } from '@/hooks/use-user-progress'
import { PhotographyStyleModal } from '@/components/style/photography-style-modal'
import { getStyles, deleteStyle, calculateHeadshots } from '@/lib/api/styles'
import { formatPrice, getTierDisplayText } from '@/lib/pricing'

export default function StylesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [styles, setStyles] = useState<Style[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { updateProgress, canModifyStyles, progress } = useUserProgress()
  const [showStyleModal, setShowStyleModal] = useState(false)
  
  // Headshot calculation state
  const [headshotInfo, setHeadshotInfo] = useState<{
    styleCount: number,
    totalHeadshots: number,
    headshotsPerStyle: number,
    tier: string,
    price: number
  }>({
    styleCount: 0,
    totalHeadshots: 0,
    headshotsPerStyle: 0,
    tier: 'none',
    price: 0
  })

  // Check if user has already progressed beyond styles stage - REMOVED strict redirect
  useEffect(() => {
    const checkUserProgress = async () => {
      // No redirection logic here anymore, validation happens in the hook
      // We keep this effect minimal or remove if not needed for other purposes
      if (!user) return;
      console.log('Checking user progress on shoot page...', progress?.current_stage)
    };
    
    checkUserProgress();
  }, [user, progress?.current_stage]);

  // Function to load styles
  const loadStyles = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch draft styles for this user
      const draftStyles = await getStyles(user.id, { status: 'draft' });
      setStyles(draftStyles);
      
      // Calculate headshots for draft styles
      if (user) {
        try {
          const headshots = await calculateHeadshots(user.id);
          setHeadshotInfo(headshots);
        } catch (error) {
          console.error('Error calculating headshots:', error);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load styles',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Load styles on mount
  useEffect(() => {
    if (user) {
      loadStyles();
    }
  }, [user, loadStyles]);

  // Function to handle style deletion
  async function handleDeleteStyle(styleId: string) {
    if (!user) return;

    try {
      await deleteStyle(styleId, user.id);
      
      // Refresh the styles list
      loadStyles();
      
      toast({
        title: 'Success',
        description: 'Style deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete style',
        variant: 'destructive'
      });
    }
  }

  const handleSelectStyle = (style: string) => {
    // Navigate directly
    router.push(`/app/style/new?style=${encodeURIComponent(style)}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your Shoot</h2>
        <p className="text-muted-foreground">
          {progress?.current_stage === 'payment' ? 
            'You can modify your styles before completing payment.' : 
            'View and manage your shoot styles.'}
        </p>
      </div>
      
      {/* Payment Return Banner - shown when user returns from payment to modify styles */}
      {progress?.current_stage === 'payment' && (
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-medium">Modifying your shoot styles</h3>
                <p className="text-sm text-muted-foreground">
                  Make any changes needed to your styles. When you're done, return to checkout to complete your payment.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/app/payment')} 
                className="whitespace-nowrap"
              >
                Return to Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Pricing and headshot information card */}
      {headshotInfo.styleCount > 0 && (
        <Card className="bg-accent/20">
          <CardHeader>
            <CardTitle>Your Shoot Package</CardTitle>
            <CardDescription>Based on your current style count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <h4 className="text-sm font-medium">Styles</h4>
                <p className="text-2xl font-bold">{headshotInfo.styleCount}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Pricing Tier</h4>
                <p className="text-2xl font-bold">{getTierDisplayText(headshotInfo.tier as any)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Total Shoots</h4>
                <p className="text-2xl font-bold">{headshotInfo.totalHeadshots}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Price</h4>
                <p className="text-2xl font-bold">{formatPrice(headshotInfo.price)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isLoading ? (
        <div className="text-center py-8">Loading styles...</div>
      ) : styles.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No styles yet</h3>
          <p className="text-muted-foreground mb-6">Start by creating a new style.</p>
          <div className="grid place-items-center">
            <div className="max-w-sm w-full">
              <NewStyleCard onClick={() => setShowStyleModal(true)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <NewStyleCard onClick={() => setShowStyleModal(true)} />
          
          {styles.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              onClick={() => router.push(`/app/style/${style.id}`)}
              onDelete={() => handleDeleteStyle(style.id)}
              headshotsPerStyle={headshotInfo.headshotsPerStyle}
            />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end pt-6">
        <Button 
          size="lg"
          className="w-full sm:w-auto"
          disabled={headshotInfo.styleCount === 0 || isLoading}
          onClick={async () => {
            if (headshotInfo.styleCount > 0) {
              try {
                await updateProgress('payment')
                router.push('/app/payment')
              } catch (error) {
                console.error('Error saving progress before navigating to payment:', error)
                toast({ title: 'Error', description: 'Could not save progress. Please try again.', variant: 'destructive' })
              }
            }
          }}
        >
          Next: Payment
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <PhotographyStyleModal
        isOpen={showStyleModal}
        onClose={() => setShowStyleModal(false)}
        onSelectStyle={handleSelectStyle}
      />
    </div>
  )
} 