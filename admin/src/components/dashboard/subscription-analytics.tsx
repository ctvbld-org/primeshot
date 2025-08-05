'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { createClient } from '@/lib/supabase/client'

interface SubscriptionData {
  name: string
  value: number
  revenue: number
  color: string
}

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
      color: getColorForPlan(name)
    }
  })
  
  return chartData.sort((a, b) => b.value - a.value)
}

function getColorForPlan(planName: string): string {
  const colors: Record<string, string> = {
    'basic': '#60a5fa',    // blue-400
    'standard': '#34d399', // emerald-400
    'pro': '#a78bfa',      // violet-400
    'tier_1': '#60a5fa',
    'tier_2': '#34d399',
    'tier_3': '#a78bfa',
  }
  return colors[planName] || '#9ca3af' // gray-400 as fallback
}

export function SubscriptionAnalytics() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['subscription-analytics'],
    queryFn: fetchSubscriptionData,
    refetchInterval: 60000, // Refresh every minute
  })

  if (isLoading || !chartData) {
    return null
  }

  const totalSubscribers = chartData.reduce((sum, item) => sum + item.value, 0)
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover p-2 rounded-md border shadow-sm">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">Subscribers: {data.value}</p>
          <p className="text-sm">Revenue: ${data.revenue.toLocaleString()}/mo</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Distribution</CardTitle>
        <CardDescription>
          {totalSubscribers} active subscribers • ${totalRevenue.toLocaleString()}/mo revenue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}