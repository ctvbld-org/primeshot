import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { getOrCreateDraftOrder } from '@/lib/api/orders'
import { createClient } from '@/lib/supabase/client'
import type { HeadshotInfo, StyleSettings } from '@/lib/types'

interface UsePaymentFlowOptions {
  styles: { settings: StyleSettings }[]
  headshotInfo: HeadshotInfo
}

export function usePaymentFlow({ styles, headshotInfo }: UsePaymentFlowOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { updateProgress } = useUserProgress()
  const supabase = createClient()

  // Step 1: Verify user is logged in
  const verifyUser = () => {
    if (!user) {
      throw new Error('User not logged in.')
    }
    return user
  }

  // Step 2: Get or create draft order
  const getDraftOrder = async (userId: string) => {
    const order = await getOrCreateDraftOrder(userId)
    if (!order) {
      throw new Error('Could not retrieve draft order.')
    }
    return order
  }

  // Step 3: Prepare order metadata
  const prepareMetadata = () => {
    const finalStyleSettings = styles.map(style => style.settings)
    return {
      finalStyles: finalStyleSettings,
      tier: headshotInfo.tier,
      styleCount: headshotInfo.styleCount,
      totalHeadshots: headshotInfo.totalHeadshots,
    }
  }

  // Step 4: Update order with metadata
  const updateOrderMetadata = async (orderId: string, metadata: any) => {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ metadata })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order metadata:', updateError)
      throw new Error('Failed to save style details to order.')
    }

    console.log('Order metadata updated successfully for order:', orderId)
  }

  // Main function that orchestrates the flow
  const proceedToPayment = async () => {
    if (headshotInfo.styleCount === 0) {
      return
    }

    setIsLoading(true)
    try {
      // Execute each step
      const verifiedUser = verifyUser()
      const order = await getDraftOrder(verifiedUser.id)
      const metadata = prepareMetadata()
      await updateOrderMetadata(order.id, metadata)
      await updateProgress('payment')
      
      // Navigate to payment page
      router.push('/app/payment')
    } catch (error) {
      console.error('Error proceeding to payment:', error)
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Could not proceed to payment. Please try again.', 
        variant: 'destructive' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    proceedToPayment
  }
} 