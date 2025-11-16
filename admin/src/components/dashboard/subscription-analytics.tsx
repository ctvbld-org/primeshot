'use client'

import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@primeshot/common/web/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Wifi, WifiOff, ArrowLeft } from 'lucide-react'
import { Button } from '@primeshot/common/web/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useChartDimensions } from '@/hooks/useResizeObserver'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { format } from 'date-fns'

interface SubscriptionData {
  name: string
  value: number
  revenue: number
  fill: string
  planKey: string // Add original plan key for filtering
}

interface SubscriberUser {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

const chartConfig = {
  value: {
    label: "Subscribers",
  },
  basic: {
    label: "Basic",
    color: "#E5FBFA",
  },
  standard: {
    label: "Standard", 
    color: "#99EFEC",
  },
  pro: {
    label: "Pro",
    color: "#2ADED8",
  },
  tier_1: {
    label: "Tier 1",
    color: "hsl(var(--chart-1))",
  },
  tier_2: {
    label: "Tier 2", 
    color: "hsl(var(--chart-2))",
  },
  tier_3: {
    label: "Tier 3",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

async function fetchSubscriptionData(): Promise<SubscriptionData[]> {
  const supabase = createClient()
  
  // Get active subscriptions grouped by plan
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('plan_name')
    .eq('status', 'active')
  
  if (error) throw error
  
  // Get subscription pricing info
  const { data: pricingData } = await supabase
    .from('subscriptions')
    .select('name, monthly_price')
  
  const planPricing = pricingData?.reduce((acc, plan) => {
    acc[plan.name] = plan.monthly_price
    return acc
  }, {} as Record<string, number>) || {}
  
  // Count subscriptions by plan
  const planCounts = subscriptions?.reduce((acc, sub) => {
    const planName = sub.plan_name || 'Unknown'
    acc[planName] = (acc[planName] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  // Format data for the chart
  const chartData: SubscriptionData[] = Object.entries(planCounts).map(([name, count]) => {
    const displayName = name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    const price = planPricing[name] || 0
    
    return {
      name: displayName,
      value: count,
      revenue: count * price,
      fill: getColorForPlan(name),
      planKey: name // Store original plan name for filtering
    }
  })
  
  return chartData.sort((a, b) => b.value - a.value)
}

function getColorForPlan(planName: string): string {
  const colors: Record<string, string> = {
    'basic': '#E5FBFA',
    'standard': '#99EFEC', 
    'pro': '#2ADED8',
    'tier_1': 'hsl(var(--chart-1))',
    'tier_2': 'hsl(var(--chart-2))',
    'tier_3': 'hsl(var(--chart-3))',
  }
  return colors[planName] || 'hsl(var(--chart-4))'
}

async function fetchPlanUsers(planKey: string): Promise<SubscriberUser[]> {
  const supabase = createClient()
  
  // Get users with active subscriptions for this plan
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('user_id, created_at, users(id, email, full_name)')
    .eq('status', 'active')
    .eq('plan_name', planKey)
  
  if (error) throw error
  
  // Format the data
  const users: SubscriberUser[] = (subscriptions || [])
    .filter(sub => sub.users) // Filter out any null users
    .map(sub => ({
      id: (sub.users as any).id,
      email: (sub.users as any).email,
      full_name: (sub.users as any).full_name,
      created_at: sub.created_at
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  return users
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">Subscribers: {data.value}</p>
        <p className="text-sm text-muted-foreground">Revenue: ${data.revenue.toLocaleString()}/mo</p>
      </div>
    )
  }
  return null
}

export function SubscriptionAnalytics() {
  const { containerHeight } = useChartDimensions(300);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; planKey: string } | null>(null)
  
  const { data: chartData, isLoading, refetch } = useQuery({
    queryKey: ['subscription-analytics'],
    queryFn: fetchSubscriptionData,
    refetchInterval: 60000, // Refresh every minute as fallback
  })

  // Fetch users for selected plan
  const { data: planUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['plan-users', selectedPlan?.planKey],
    queryFn: () => selectedPlan ? fetchPlanUsers(selectedPlan.planKey) : Promise.resolve([]),
    enabled: !!selectedPlan,
  })

  // Handle realtime updates for subscription-related tables
  const handleRealtimeUpdate = useCallback((table: string, eventType: string, record: any) => {
    console.log(`Subscription data may have changed due to ${eventType} on ${table}:`, record);
    
    // Refetch subscription data when subscription-affecting changes occur
    if (['user_subscriptions', 'subscriptions'].includes(table)) {
      refetch();
    }
  }, [refetch]);

  // Subscribe to realtime updates
  const { isConnected, connectionError } = useRealtimeSubscription({
    tables: ['user_subscriptions', 'subscriptions'],
    onDataChange: handleRealtimeUpdate,
    enabled: true
  });

  if (isLoading || !chartData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Subscription Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalSubscribers = chartData.reduce((sum, item) => sum + item.value, 0)
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0)

  // Handle plan selection
  const handlePlanClick = (planData: SubscriptionData) => {
    setSelectedPlan({ name: planData.name, planKey: planData.planKey })
  }

  const handleBackClick = () => {
    setSelectedPlan(null)
  }

  // User list view
  if (selectedPlan) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <CardTitle className="text-base font-medium">{selectedPlan.name} Subscribers</CardTitle>
              <CardDescription className="text-xs mt-1 text-[#666666]">
                {planUsers?.length || 0} active subscribers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : planUsers && planUsers.length > 0 ? (
            <div className="space-y-2">
              {planUsers.map((user) => {
                const fullName = user.full_name || 'N/A'
                
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-[#FFFFFF05] hover:bg-[#FFFFFF08] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="text-xs text-muted-foreground ml-4">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No subscribers found for this plan
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Chart view (default)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-medium">Subscription Distribution</CardTitle>
          {isConnected ? (
            <div title="Live updates enabled">
              <Wifi className="h-4 w-4 text-green-500" />
            </div>
          ) : connectionError ? (
            <div title={`Connection error: ${connectionError}`}>
              <WifiOff className="h-4 w-4 text-red-500" />
            </div>
          ) : (
            <div title="Connecting to live updates...">
              <WifiOff className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
        <CardDescription className="text-xs mt-1 text-[#666666]">
          {totalSubscribers} active subscribers • ${totalRevenue.toLocaleString()}/mo revenue {isConnected && '• Live updates'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square"
          style={{ maxHeight: containerHeight }}
        >
          <ResponsiveContainer width="100%" height={containerHeight} key={containerHeight}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    onClick={() => handlePlanClick(entry)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {chartData.map((item) => (
            <div 
              key={item.name} 
              className="flex items-center gap-2 cursor-pointer hover:bg-[#FFFFFF05] p-2 rounded-lg transition-colors"
              onClick={() => handlePlanClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePlanClick(item)
                }
              }}
            >
              <div 
                className="h-3 w-3 rounded-sm flex-shrink-0" 
                style={{ backgroundColor: item.fill }}
              />
              <div className="flex-1 text-sm min-w-0">
                <div className="font-medium">{item.name}</div>
                <div className="text-muted-foreground">
                  {item.value} subscribers • ${item.revenue.toLocaleString()}/mo
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}