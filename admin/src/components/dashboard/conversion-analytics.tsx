'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { ChartContainer } from '@primeshot/common/web/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Line, ComposedChart } from 'recharts'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@primeshot/common/web/ui/select'
import { TrendingUp, TrendingDown, Users, UserCheck, UserX, Wifi, WifiOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, subDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns'
import { useChartDimensions } from '@/hooks/useResizeObserver'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

type TimePeriod = 'daily' | 'weekly' | 'monthly'

interface ConversionData {
  period: string
  signups: number
  subscriptions: number
  basic: number
  standard: number
  pro: number
  cancellations: number
}

interface ConversionStats {
  totalSignups: number
  totalSubscriptions: number
  totalCancellations: number
  conversionRate: number
  basicCount: number
  standardCount: number
  proCount: number
}

async function fetchConversionData(period: TimePeriod): Promise<{ data: ConversionData[], stats: ConversionStats }> {
  const supabase = createClient()
  
  // Calculate date ranges based on period
  const now = new Date()
  let periods: { start: Date; end: Date; label: string }[] = []
  
  if (period === 'daily') {
    // Last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i)
      date.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      periods.push({
        start: date,
        end: endDate,
        label: format(date, 'MMM dd')
      })
    }
  } else if (period === 'weekly') {
    // Last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(now, i * 7))
      const weekEnd = endOfWeek(weekStart)
      periods.push({
        start: weekStart,
        end: weekEnd,
        label: format(weekStart, 'MMM dd')
      })
    }
  } else if (period === 'monthly') {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1))
      const monthEnd = endOfMonth(monthStart)
      periods.push({
        start: monthStart,
        end: monthEnd,
        label: format(monthStart, 'MMM yyyy')
      })
    }
  }

  const conversionData: ConversionData[] = []
  
  // Track the LATEST period's data for the summary cards
  let latestPeriodSignups = 0
  let latestPeriodSubscriptions = 0
  let latestPeriodCancellations = 0
  let latestPeriodBasic = 0
  let latestPeriodStandard = 0
  let latestPeriodPro = 0
  // Track latest period's users who subscribed for conversion calculation
  let latestPeriodUserIds = new Set<string>()
  let latestPeriodSubscribedUserIds = new Set<string>()

  // First, get ALL users who signed up in the entire date range
  const firstPeriod = periods[0]
  const lastPeriod = periods[periods.length - 1]
  
  const { data: allNewUsers } = await supabase
    .from('users')
    .select('id, created_at')
    .gte('created_at', firstPeriod.start.toISOString())
    .lte('created_at', lastPeriod.end.toISOString())

  const newUserIds = new Set(allNewUsers?.map(u => u.id) || [])

  // Get all subscriptions for these new users (to calculate true conversion)
  const { data: newUserSubscriptions } = await supabase
    .from('user_subscriptions')
    .select('user_id, plan_name, created_at, status')
    .in('user_id', Array.from(newUserIds))

  // Count how many of the new users actually subscribed
  const usersWhoSubscribed = new Set(
    newUserSubscriptions?.filter(sub => sub.status === 'active')?.map(sub => sub.user_id) || []
  )

  for (const periodInfo of periods) {
    // Get new signups in this period
    const periodNewUsers = allNewUsers?.filter(user => {
      const userDate = new Date(user.created_at)
      return userDate >= periodInfo.start && userDate <= periodInfo.end
    }) || []
    
    // Get new subscriptions in this period (any user, not just new ones)
    const { data: newSubs } = await supabase
      .from('user_subscriptions')
      .select('plan_name, created_at, user_id')
      .gte('created_at', periodInfo.start.toISOString())
      .lte('created_at', periodInfo.end.toISOString())
      .eq('status', 'active')

    // Get cancellations in this period
    const { count: cancellationsCount } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', periodInfo.start.toISOString())
      .lte('updated_at', periodInfo.end.toISOString())
      .in('status', ['cancelled', 'expired', 'inactive'])

    // Count subscriptions by plan (only new subscriptions in this period)
    const basic = newSubs?.filter(sub => sub.plan_name?.toLowerCase().includes('basic') || sub.plan_name?.toLowerCase().includes('tier_1')).length || 0
    const standard = newSubs?.filter(sub => sub.plan_name?.toLowerCase().includes('standard') || sub.plan_name?.toLowerCase().includes('tier_2')).length || 0
    const pro = newSubs?.filter(sub => sub.plan_name?.toLowerCase().includes('pro') || sub.plan_name?.toLowerCase().includes('tier_3')).length || 0

    const periodSignups = periodNewUsers.length
    const periodSubscriptions = newSubs?.length || 0
    const periodCancellations = cancellationsCount || 0

    conversionData.push({
      period: periodInfo.label,
      signups: periodSignups,
      subscriptions: periodSubscriptions,
      basic,
      standard,
      pro,
      cancellations: periodCancellations
    })

    // Store the LATEST (most recent) period's data for summary cards
    latestPeriodSignups = periodSignups
    latestPeriodSubscriptions = periodSubscriptions
    latestPeriodCancellations = periodCancellations
    latestPeriodBasic = basic
    latestPeriodStandard = standard
    latestPeriodPro = pro
    
    // Track users from latest period for conversion calculation
    latestPeriodUserIds = new Set(periodNewUsers.map(u => u.id))
    // Find which of these users subscribed
    latestPeriodSubscribedUserIds = new Set(
      newSubs?.filter(sub => latestPeriodUserIds.has(sub.user_id)).map(sub => sub.user_id) || []
    )
  }

  // Calculate conversion rate for the LATEST period only (to match displayed stats)
  const conversionRate = latestPeriodSignups > 0 
    ? (latestPeriodSubscribedUserIds.size / latestPeriodSignups) * 100 
    : 0

  return {
    data: conversionData,
    stats: {
      totalSignups: latestPeriodSignups,
      totalSubscriptions: latestPeriodSubscriptions,
      totalCancellations: latestPeriodCancellations,
      conversionRate: Math.round(conversionRate * 10) / 10,
      basicCount: latestPeriodBasic,
      standardCount: latestPeriodStandard,
      proCount: latestPeriodPro
    }
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <div className="grid gap-2">
          <div className="font-semibold text-foreground">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function ConversionAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('weekly')
  const { containerHeight } = useChartDimensions(350)
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversion-analytics', selectedPeriod],
    queryFn: () => fetchConversionData(selectedPeriod),
    refetchInterval: 60000, // Refresh every minute as fallback
  })

  // Handle realtime updates for conversion-related tables
  const handleRealtimeUpdate = useCallback((table: string, eventType: string, record: any) => {
    console.log(`Conversion data may have changed due to ${eventType} on ${table}:`, record)
    
    // Refetch conversion data when user or subscription changes occur
    if (['users', 'user_subscriptions'].includes(table)) {
      refetch()
    }
  }, [refetch])

  // Subscribe to realtime updates
  const { isConnected, connectionError } = useRealtimeSubscription({
    tables: ['users', 'user_subscriptions'],
    onDataChange: handleRealtimeUpdate,
    enabled: true
  })

  const chartConfig = {
    signups: {
      label: 'New Signups',
      color: '#E5FBFA', // light teal
    },
    subscriptions: {
      label: 'New Subscriptions',
      color: '#2ADED8', // bright teal
    },
    cancellations: {
      label: 'Cancellations',
      color: '#FF6B6B', // red
    },
  }

  if (isLoading || !data) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-col space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Conversion Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
            </div>
            <div className="h-[350px] bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col space-y-4 pb-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-medium">Conversion Analytics</CardTitle>
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
              Track signup to subscription conversion and plan preferences {isConnected && '• Live updates'}
            </CardDescription>
          </div>
          <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-36 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-36">
              <SelectItem value="daily" className="py-3 px-4">Daily</SelectItem>
              <SelectItem value="weekly" className="py-3 px-4">Weekly</SelectItem>
              <SelectItem value="monthly" className="py-3 px-4">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 w-full">
          <div className="flex flex-col items-center space-y-2 rounded-lg p-4 flex-1 bg-[#FFFFFF05]">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" style={{ color: '#E5FBFA' }} />
              <p className="text-sm font-medium text-muted-foreground">New Signups</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#E5FBFA' }}>
              {data.stats.totalSignups}
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-2 rounded-lg p-4 flex-1 bg-[#FFFFFF05]">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4" style={{ color: '#2ADED8' }} />
              <p className="text-sm font-medium text-muted-foreground">New Subs</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#2ADED8' }}>
              {data.stats.totalSubscriptions}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-2 rounded-lg p-4 flex-1 bg-[#FFFFFF05]">
            <div className="flex items-center space-x-2">
              <UserX className="h-4 w-4 text-red-500" />
              <p className="text-sm font-medium text-muted-foreground">Cancellations</p>
            </div>
            <p className="text-2xl font-bold text-red-500">
              {data.stats.totalCancellations}
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-2 rounded-lg p-4 flex-1 bg-[#FFFFFF05]">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" style={{ color: '#99EFEC' }} />
              <p className="text-sm font-medium text-muted-foreground">Conversion</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#99EFEC' }}>
              {data.stats.conversionRate}%
            </p>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#E5FBFA' }} />
            <span className="text-sm text-muted-foreground">
              Basic: {data.stats.basicCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#99EFEC' }} />
            <span className="text-sm text-muted-foreground">
              Standard: {data.stats.standardCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#2ADED8' }} />
            <span className="text-sm text-muted-foreground">
              Pro: {data.stats.proCount}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <ChartContainer config={chartConfig} className="w-full" style={{ height: containerHeight }}>
          <ResponsiveContainer width="100%" height={containerHeight} key={`${containerHeight}-${selectedPeriod}`}>
            <ComposedChart data={data.data} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="signupsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E5FBFA" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#E5FBFA" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="subscriptionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2ADED8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#2ADED8" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="stroke-muted"
                vertical={false}
              />
              <XAxis 
                dataKey="period" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                minTickGap={5}
              />
              <YAxis 
                hide={true}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Signups area */}
              <Area
                type="monotone"
                dataKey="signups"
                stroke="#E5FBFA"
                fill="url(#signupsGradient)"
                strokeWidth={2}
                name="New Signups"
              />
              
              {/* Subscriptions area */}
              <Area
                type="monotone"
                dataKey="subscriptions"
                stroke="#2ADED8"
                fill="url(#subscriptionsGradient)"
                strokeWidth={2}
                name="New Subscriptions"
              />
              
              {/* Cancellations line */}
              <Line
                type="monotone"
                dataKey="cancellations"
                stroke="#FF6B6B"
                strokeWidth={2}
                dot={{ fill: '#FF6B6B', r: 3 }}
                name="Cancellations"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

