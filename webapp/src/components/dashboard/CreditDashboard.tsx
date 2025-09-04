'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Button } from '@primeshot/common/web/ui/button'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Progress } from '@primeshot/common/web/ui/progress'
import { 
  Coins, 
  TrendingUp, 
  Calendar, 
  Zap, 
  Package,
  Clock,
  AlertTriangle,
  Plus
} from 'lucide-react'
import { formatDistanceToNow, format, differenceInCalendarDays } from 'date-fns'
import { useOpenCreditPackDialog } from '@/hooks/useOpenCreditPackDialog'
import { useCreditBalance } from '@/hooks/useCreditBalance'
import { useCurrentSubscription, type SubscriptionInfo } from '@/hooks/useCurrentSubscription'
import { useCreditTransactions, type CreditTransaction } from '@/hooks/useCreditTransactions'
import { useCharacterCount } from '@/hooks/useCharacterCount'
import { useSubscriptionTiers, getCharacterLimit } from '@/hooks/usePricingConfig'
import { useCharacterTrainingStatus } from '@/hooks/useCharacterTrainingStatus'


interface CreditDashboardProps {
  className?: string
}

export function CreditDashboard({ className }: CreditDashboardProps) {
  const { data: creditBalance = 0, isLoading: balanceLoading } = useCreditBalance()
  const { data: subscription, isLoading: subLoading } = useCurrentSubscription()
  const { data: transactions = [], isLoading: transLoading } = useCreditTransactions(10)
  const { data: characterCount = 0, isLoading: characterCountLoading } = useCharacterCount()
  const { data: subscriptionTiers } = useSubscriptionTiers()
  const openCreditPackDialog = useOpenCreditPackDialog()
  const { statusMessage, usagePercentage: characterUsagePercentage } = useCharacterTrainingStatus()

  const isLoading = balanceLoading || subLoading || transLoading

  // Get max characters allowed for current subscription
  const maxCharacters = subscription?.plan_name && subscriptionTiers 
    ? getCharacterLimit(subscription.plan_name, subscriptionTiers)
    : 1

  const getTransactionIcon = (transaction: CreditTransaction) => {
    switch (transaction.transaction_type) {
      case 'earned':
        return <Plus className="w-4 h-4 text-green-500" />
      case 'spent':
        return <Zap className="w-4 h-4 text-blue-500" />
      case 'expired':
        return <Clock className="w-4 h-4 text-red-500" />
      default:
        return <Coins className="w-4 h-4" />
    }
  }

  const getTransactionColor = (transaction: CreditTransaction) => {
    switch (transaction.transaction_type) {
      case 'earned': return 'text-green-600'
      case 'spent': return 'text-blue-600'
      case 'expired': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  const formatCredits = (credits: number, type: 'earned' | 'spent' | 'expired') => {
    const sign = type === 'earned' ? '+' : '-'
    return `${sign}${credits.toLocaleString()}`
  }

  const getSubscriptionUsagePercentage = () => {
    if (!subscription) return 0
    return (subscription.credits_used_this_period / subscription.credits_included) * 100
  }

  const getCharacterCountUsagePercentage = () => {
    if (maxCharacters === 0) return 0
    return (characterCount / maxCharacters) * 100
  }

  const daysUntilReset = subscription 
    ? differenceInCalendarDays(new Date(subscription.current_period_end), new Date())
    : 0

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Credit Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Credit Balance
          </CardTitle>
          <CardDescription>
            Your current available credits for image generation and Face Model training
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{creditBalance.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">credits available</div>
            </div>
            <Button 
              onClick={() => openCreditPackDialog()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Buy Credits
            </Button>
          </div>

          {creditBalance < 10 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Low credit balance. Consider purchasing more credits or upgrading your subscription.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Status */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Subscription Status
            </CardTitle>
            <CardDescription>
              Your current plan usage and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold capitalize">{subscription.plan_name}</div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div>Resets in {daysUntilReset} days</div>
                <div>{format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}</div>
              </div>
            </div>

            {/* Monthly Credits Usage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Monthly Credits Used</span>
                <span>{subscription.credits_used_this_period} / {subscription.credits_included}</span>
              </div>
              <Progress value={getSubscriptionUsagePercentage()} className="h-2" />
            </div>

            {/* Character Training Usage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Character Training Used</span>
                <span>{statusMessage}</span>
              </div>
              <Progress value={characterUsagePercentage} className="h-2" />
            </div>

            {/* Character Count Usage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Character Slots Used</span>
                <span>{characterCount} / {maxCharacters}</span>
              </div>
              <Progress value={getCharacterCountUsagePercentage()} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
              <div>
                <span className="text-muted-foreground">Max Quality:</span>
                <span className="font-medium ml-2">{subscription.max_quality}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Plan Status:</span>
                <span className="font-medium ml-2 capitalize">{subscription.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your latest credit transactions and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No credit activity yet</p>
              <p className="text-sm">Your transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction)}
                    <div>
                      <div className="font-medium text-sm">{transaction.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                        {transaction.expires_at && (
                          <span className="ml-2">
                            • Expires {format(new Date(transaction.expires_at), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${getTransactionColor(transaction)}`}>
                    {formatCredits(transaction.credits, transaction.transaction_type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 