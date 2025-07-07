import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/api/client'

interface CheckoutParams {
  priceId: string
  successUrl: string
  cancelUrl: string
}

export function useCreditPackCheckout() {
  return useMutation({
    mutationFn: async (params: CheckoutParams) => {
      const response = await fetch(getApiUrl('api/payment/credit-pack-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: (error) => {
      console.error('Credit pack purchase error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to purchase credit pack')
    }
  })
} 