'use client'

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@primeshot/common/web/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Wifi, WifiOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useChartDimensions } from '@/hooks/useResizeObserver'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

interface SubscriptionData {
  name: string
  value: number
  revenue: number
  fill: string
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
      fill: getColorForPlan(name)
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
  
  const { data: chartData, isLoading, refetch } = useQuery({
    queryKey: ['subscription-analytics'],
    queryFn: fetchSubscriptionData,
    refetchInterval: 60000, // Refresh every minute as fallback
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
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-sm" 
                style={{ backgroundColor: item.fill }}
              />
              <div className="flex-1 text-sm">
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