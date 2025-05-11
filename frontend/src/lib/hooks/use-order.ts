import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useBanner } from '@/components/ui/use-banner'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import type { Order, Style } from '@/lib/types'
import { UPLOAD_STATUS } from '@/lib/constants/upload'
import bannerStyles from '@/components/ui/top-banner.module.css'
import { paymentEvents, PAYMENT_EVENTS } from '@/lib/events/payment'

interface UseOrderOptions {
  loadStyles?: boolean
  sessionId?: string | null
}

export function useOrder({ loadStyles = false, sessionId = null }: UseOrderOptions = {}) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { showBanner, hideBanner } = useBanner()
  const { t } = useTranslation(['upload', 'payment'])

  const [order, setOrder] = useState<Order | null>(null)
  const [styles, setStyles] = useState<Style[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [verificationState, setVerificationState] = useState({
    isVerifying: false,
    isVerified: false
  })
  const [showingPaymentBanner, setShowingPaymentBanner] = useState(false)

  // Effect to handle document-wide click for banner dismissal
  useEffect(() => {
    if (!showingPaymentBanner) return

    const handleClick = () => {
      hideBanner()
      setShowingPaymentBanner(false)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showingPaymentBanner, hideBanner])

  // Payment verification effect
  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId) {
        setVerificationState(prev => ({ ...prev, isVerified: true }))
        return
      }

      if (verificationState.isVerifying || verificationState.isVerified) {
        return
      }

      if (!user) {
        console.error('No user found during payment verification')
        return
      }

      setVerificationState(prev => ({ ...prev, isVerifying: true }))

      try {
        const supabase = createClient()
        const { data: orders, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .eq('checkout_session_id', sessionId)
          .limit(1)

        if (orderError) throw orderError

        if (!orders || orders.length === 0) {
          throw new Error(t('errors.orderNotFound', { ns: 'payment' }))
        }

        const order = orders[0]

        if (order.status !== 'paid' || order.payment_status !== 'succeeded') {
          const { data: updateData, error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'paid',
              payment_status: 'succeeded',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)
            .select()
            .single()

          if (updateError || !updateData || updateData.status !== 'paid') {
            console.error('Failed to update order:', { updateError, updateData })
            throw new Error(t('errors.verificationFailed', { ns: 'payment' }))
          }
          
          // Emit payment success event when order status changes to paid
          paymentEvents.emit(PAYMENT_EVENTS.PAYMENT_SUCCESS)
        }

        setOrder(order)
        setVerificationState(prev => ({ 
          ...prev, 
          isVerified: true,
          isVerifying: false 
        }))

        // Clean up URL parameters
        if (sessionId) {
          const url = new URL(window.location.href)
          url.searchParams.delete('session_id')
          url.searchParams.delete('order_id')
          router.replace(url.pathname + url.search)
        }

        showBanner({
          title: t('success.title', { ns: 'payment' }),
          description: t('success.description', { ns: 'payment' }),
          variant: 'success',
          duration: Infinity,
          className: bannerStyles.paymentSuccessBanner
        })
        setShowingPaymentBanner(true)

      } catch (err) {
        console.error('Error verifying payment:', err)
        const errorMessage = err instanceof Error ? err.message : t('errors.verificationFailed', { ns: 'payment' })
        setError(new Error(errorMessage))
        setVerificationState(prev => ({ ...prev, isVerifying: false }))
        router.push(`/app/payment/error?error=${encodeURIComponent(errorMessage)}${sessionId ? `&session_id=${sessionId}` : ''}`)
      }
    }

    verifyPayment()
  }, [sessionId, user, verificationState.isVerifying, verificationState.isVerified, router, t, toast, showBanner])

  // Load order data effect
  useEffect(() => {
    async function loadOrderData() {
      if (!user) return
      if (!verificationState.isVerified) return

      const supabase = createClient()
      setIsLoading(true)
      setError(null)

      try {
        // If we already have an order from verification, skip loading
        if (!order) {
          // Get the most recent paid order
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select()
            .eq('user_id', user.id)
            .eq('status', UPLOAD_STATUS.PAID)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (orderError) throw orderError

          if (!orderData) {
            toast({
              title: t('errors.noActiveOrder', { ns: 'upload' }),
              description: t('errors.paymentRequired', { ns: 'upload' }),
              variant: 'destructive'
            })
            router.push('/app/shoot')
            return
          }

          setOrder(orderData)
        }

        // Load styles if requested
        if (loadStyles && order) {
          const { data: stylesData, error: stylesError } = await supabase
            .from('styles')
            .select()
            .eq('order_id', order.id)
            .order('created_at', { ascending: true })

          if (stylesError) throw stylesError
          setStyles(stylesData || [])
        }

      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        setError(err)
        console.error('Error loading order data:', error)
        toast({
          title: t('status.error', { ns: 'upload' }),
          description: t('errors.loadOrderData', { ns: 'upload' }),
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOrderData()
  }, [user, router, toast, t, verificationState.isVerified, order, loadStyles])

  return {
    order,
    styles,
    isLoading: isLoading || verificationState.isVerifying,
    error,
    isVerifying: verificationState.isVerifying,
    isVerified: verificationState.isVerified
  }
} 