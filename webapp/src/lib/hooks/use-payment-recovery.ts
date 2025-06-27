import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { getStripe, createCheckoutSession } from '@/lib/stripe'

interface PaymentRecoveryState {
  orderId: string | null
  hasInterruptedPayment: boolean
  isLoading: boolean
  resumePayment: () => Promise<void>
  dismissRecovery: () => void
}

// Define types for payment-related stage data
interface PaymentStageData {
  orderId?: string
  attemptCount?: number
  lastAttemptAt?: string
  declined_recovery?: boolean
  declined_order_id?: string
  declined_at?: string
}

// Define progress stage data structure
interface StageData {
  [key: string]: unknown
  payment?: PaymentStageData
}

export function usePaymentRecovery(): PaymentRecoveryState {
  const { user } = useAuth()
  const { toast } = useToast()
  const { progress } = useUserProgress()
  const [isLoading, setIsLoading] = useState(true)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [hasInterruptedPayment, setHasInterruptedPayment] = useState(false)
  
  // Check for interrupted payments on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }
    
    // Check if we already have payment data in user progress
    const stageData = progress?.stage_data as StageData | undefined
    if (stageData?.payment?.orderId) {
      setOrderId(stageData.payment.orderId)
      checkInterruptedPayment(stageData.payment.orderId)
      return
    }
    
    async function checkInterruptedPayment(knownOrderId?: string) {
      try {
        const supabase = createClient()
        
        // If we don't have a known order ID, find the most recent pending_payment order
        if (!knownOrderId && user) {
          const { data: orders, error } = await supabase
            .from('orders')
            .select('id, status, payment_status, payment_intent_id')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .eq('status', 'pending_payment')
            .limit(1)
            
          if (error) throw error
          
          if (orders && orders.length > 0) {
            const latestOrder = orders[0]
            setOrderId(latestOrder.id)
            
            // Check if the payment intent exists and is in a recoverable state
            if (latestOrder.payment_intent_id) {
              setHasInterruptedPayment(true)
              console.log(`Found interrupted payment for order: ${latestOrder.id}`)
            }
          }
        } else if (knownOrderId) {
          // Use the known order ID from progress data
          const { data: order, error } = await supabase
            .from('orders')
            .select('id, status, payment_status, payment_intent_id')
            .eq('id', knownOrderId)
            .single()
            
          if (error) throw error
          
          if (order && order.status === 'pending_payment' && order.payment_intent_id) {
            setOrderId(order.id)
            setHasInterruptedPayment(true)
            console.log(`Found interrupted payment for order: ${order.id}`)
          }
        }
      } catch (error) {
        console.error('Error checking for interrupted payments:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkInterruptedPayment()
  }, [user, progress, toast])
  
  // Resume the interrupted payment flow by creating a new checkout session
  const resumePayment = async () => {
    if (!orderId) return
    
    try {
      setIsLoading(true)
      
      // Get the order details to get the amount
      const supabase = createClient()
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()
        
      if (error || !order) throw new Error('Could not fetch order details')
      
      // Create a new checkout session for the interrupted order
      const checkoutInfo = await createCheckoutSession({
        orderId,
        amount: order.amount,
        metadata: order.metadata
      })
      
      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (!stripe) throw new Error('Stripe not initialized')
      
      await stripe.redirectToCheckout({
        sessionId: checkoutInfo.sessionId
      })
    } catch (error) {
      console.error('Error resuming payment:', error)
      toast({
        title: 'Error',
        description: 'Could not resume payment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Dismiss the recovery dialog and mark as handled
  const dismissRecovery = async () => {
    if (!user || !orderId) return
    
    setHasInterruptedPayment(false)
    
    try {
      // Mark in user_progress that user declined to resume this payment
      const supabase = createClient()
      const stageData = progress?.stage_data as StageData | undefined || {}
      
      await supabase
        .from('user_progress')
        .update({
          stage_data: {
            ...stageData,
            payment: {
              ...(stageData.payment || {}),
              declined_recovery: true,
              declined_order_id: orderId,
              declined_at: new Date().toISOString()
            }
          }
        })
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Error updating payment recovery status:', error)
    }
  }
  
  return {
    orderId,
    hasInterruptedPayment,
    isLoading,
    resumePayment,
    dismissRecovery
  }
} 