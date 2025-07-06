'use client'

import { useState, useEffect } from 'react'
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
import { formatDistanceToNow, format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface CreditTransaction {
  id: string
  credits: number
  transaction_type: 'earned' | 'spent' | 'expired'
  source_type: 'subscription' | 'credit_pack' | 'refund' | 'admin'
  description: string
  created_at: string
  expires_at?: string
}

interface SubscriptionInfo {
  plan_name: string
  status: string
  current_period_end: string
  credits_included: number
  credits_used_this_period: number
  max_resolution: string
  lora_training_included: number
  lora_training_used: number
}

interface CreditDashboardProps {
  className?: string
}

export function CreditDashboard({ className }: CreditDashboardProps) {
  const [creditBalance, setCreditBalance] = useState<number>(0)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCreditData()
  }, [])

  const fetchCreditData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch credit balance
      const balanceResponse = await fetch('/api/credits/balance')
      if (balanceResponse.ok) {
        const { balance } = await balanceResponse.json()
        setCreditBalance(balance)
      }

      // Fetch subscription info
      const subscriptionResponse = await fetch('/api/subscription/current')
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json()
        setSubscription(subscriptionData)
      }

      // Fetch recent transactions
      const transactionsResponse = await fetch('/api/credits/transactions?limit=10')
      if (transactionsResponse.ok) {
        const { transactions } = await transactionsResponse.json()
        setTransactions(transactions)
      }

    } catch (error) {
      console.error('Failed to fetch credit data:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const getLoRAUsagePercentage = () => {
    if (!subscription) return 0
    return (subscription.lora_training_used / subscription.lora_training_included) * 100
  }

  const daysUntilReset = subscription 
    ? Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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
    <div className={`space-y-6 ${className}`}>
      {/* Credit Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Credit Balance
          </CardTitle>
          <CardDescription>
            Your current available credits for image generation and LoRA training
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{creditBalance.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">credits available</div>
            </div>
            <Button 
              onClick={() => router.push('/pricing')}
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
                <div className="font-semibold capitalize">{subscription.plan_name.replace('_', ' ')}</div>
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

            {/* LoRA Training Usage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>LoRA Training Used</span>
                <span>{subscription.lora_training_used} / {subscription.lora_training_included}</span>
              </div>
              <Progress value={getLoRAUsagePercentage()} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
              <div>
                <span className="text-muted-foreground">Max Resolution:</span>
                <span className="font-medium ml-2">{subscription.max_resolution}</span>
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