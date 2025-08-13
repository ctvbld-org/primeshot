import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useSubscriptionTiers } from '@/hooks/usePricingConfig'
import { useCreditBalance } from '@/hooks/useCreditBalance'
import { useOpenSubscriptionDialog } from '@/hooks/useOpenSubscriptionDialog'
import { useOpenCreditPackDialog } from '@/hooks/useOpenCreditPackDialog'
import { useCreditGuard } from '@/hooks/useCreditGuard'

type Context = 'character' | 'inference'

export function useActionGate(requiredCredits: number, context: Context = 'inference') {
  const { data: subscription } = useCurrentSubscription()
  const { data: subscriptionTiers } = useSubscriptionTiers()
  const { data: creditBalance } = useCreditBalance()
  const openSubscriptionDialog = useOpenSubscriptionDialog()
  const openCreditPackDialog = useOpenCreditPackDialog()
  const creditGuard = useCreditGuard(requiredCredits)

  const isOnHighestTier = (() => {
    if (!subscription?.plan_name || !subscriptionTiers) return false
    const tier = subscriptionTiers.find(t => t.name === subscription.plan_name)
    // Treat max tier by having the largest max_characters or other indicator
    const max = Math.max(...subscriptionTiers.map(t => t.max_characters || 0))
    return (tier?.max_characters || 0) >= max
  })()

  async function runWithGates<T>(action: () => Promise<T> | T): Promise<T | void> {
    // Wrap creditGuard (which expects void) so we can still resolve T to caller
    return await new Promise<T | void>((resolve) => {
      const guarded = creditGuard(async () => {
        // If credits are insufficient and user is not on highest tier, open upgrade dialog
        if (creditBalance !== undefined && requiredCredits > 0 && creditBalance < requiredCredits) {
          if (!isOnHighestTier) {
            openSubscriptionDialog()
            resolve(undefined)
            return
          }
          openCreditPackDialog(requiredCredits)
          resolve(undefined)
          return
        }
        const result = await action()
        resolve(result)
      })
      const maybe = guarded()
      if (maybe && typeof (maybe as any).then === 'function') {
        ;(maybe as Promise<void>).catch(() => resolve(undefined))
      }
    })
  }

  return { runWithGates }
}


