import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import type { Order, Style } from '@/lib/types'
import { UPLOAD_STATUS } from '@/lib/constants/upload'

export function useOrder() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation('upload')

  const [order, setOrder] = useState<Order | null>(null)
  const [styles, setStyles] = useState<Style[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadOrderData() {
      if (!user) return

      const supabase = createClient()
      setIsLoading(true)
      setError(null)

      try {
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
            title: t('errors.noActiveOrder'),
            description: t('errors.paymentRequired'),
            variant: 'destructive'
          })
          router.push('/app/shoot')
          return
        }

        setOrder(orderData)

        // Get styles for this order
        const { data: stylesData, error: stylesError } = await supabase
          .from('styles')
          .select()
          .eq('order_id', orderData.id)
          .order('created_at', { ascending: true })

        if (stylesError) throw stylesError
        setStyles(stylesData || [])

      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        setError(err)
        console.error('Error loading order data:', error)
        toast({
          title: t('status.error'),
          description: t('errors.loadOrderData'),
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOrderData()
  }, [user, router, toast, t])

  return {
    order,
    styles,
    isLoading,
    error
  }
} 