'use client'

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Button } from '@primeshot/common/web/ui/button'
import { ChartConfig, ChartContainer } from '@primeshot/common/web/ui/chart'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Users, TrendingUp, Download, Mail, Wifi, WifiOff } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useChartDimensions } from '@/hooks/useResizeObserver'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@primeshot/common/web/ui/table'

interface WaitlistStats {
  total: number
  todayCount: number
  weekCount: number
  monthCount: number
  recentSignups: Array<{
    id: number
    email: string
    created_at: string
  }>
  chartData: Array<{
    date: string
    count: number
  }>
}

const chartConfig = {
  count: {
    label: "Signups",
    color: "#2ADED8", // bright teal
  },
} satisfies ChartConfig

async function fetchWaitlistStats(): Promise<WaitlistStats> {
  const supabase = createClient()
  
  // Get total count
  const { count: total } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
  
  // Get today's signups
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { count: todayCount } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())
  
  // Get this week's signups
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  const { count: weekCount } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())
  
  // Get this month's signups
  const monthAgo = new Date()
  monthAgo.setMonth(monthAgo.getMonth() - 1)
  
  const { count: monthCount } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthAgo.toISOString())
  
  // Get recent signups
  const { data: recentSignups } = await supabase
    .from('waitlist')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  
  // Get chart data for last 30 days
  const { data: waitlistData } = await supabase
    .from('waitlist')
    .select('created_at')
    .gte('created_at', monthAgo.toISOString())
    .order('created_at')
  
  // Process data for chart
  const chartData: Array<{ date: string; count: number }> = []
  const dateMap = new Map<string, number>()
  
  // Initialize all dates with 0
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dateMap.set(dateStr, 0)
  }
  
  // Count signups per day
  waitlistData?.forEach((entry) => {
    const dateStr = new Date(entry.created_at).toISOString().split('T')[0]
    const current = dateMap.get(dateStr) || 0
    dateMap.set(dateStr, current + 1)
  })
  
  // Convert to array
  dateMap.forEach((count, date) => {
    chartData.push({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    })
  })
  
  return {
    total: total || 0,
    todayCount: todayCount || 0,
    weekCount: weekCount || 0,
    monthCount: monthCount || 0,
    recentSignups: recentSignups || [],
    chartData,
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <p className="text-sm text-muted-foreground">
          Signups: {payload[0]?.value || 0}
        </p>
      </div>
    )
  }
  return null
}

export function WaitlistWidget() {
  const { containerHeight } = useChartDimensions(200);
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['waitlist-stats'],
    queryFn: fetchWaitlistStats,
    refetchInterval: 30000, // Refresh every 30 seconds as fallback
  })

  // Handle realtime updates for waitlist-related tables
  const handleRealtimeUpdate = useCallback((table: string, eventType: string, record: any) => {
    console.log(`Waitlist data may have changed due to ${eventType} on ${table}:`, record);
    
    // Refetch waitlist data when waitlist-affecting changes occur
    if (table === 'waitlist') {
      refetch();
    }
  }, [refetch]);

  // Subscribe to realtime updates
  const { isConnected, connectionError } = useRealtimeSubscription({
    tables: ['waitlist'],
    onDataChange: handleRealtimeUpdate,
    enabled: true
  });

  const handleExport = async () => {
    const supabase = createClient()
    const { data: waitlistData } = await supabase
      .from('waitlist')
      .select('email, created_at')
      .order('created_at', { ascending: false })
    
    if (!waitlistData) return
    
    // Convert to CSV
    const csv = [
      'Email,Signup Date',
      ...waitlistData.map(row => 
        `${row.email},"${new Date(row.created_at).toLocaleString()}"`
      )
    ].join('\n')
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Waitlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const growthRate = data.total > 0 && data.monthCount > 0 
    ? ((data.monthCount / (data.total - data.monthCount)) * 100).toFixed(1)
    : '0'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-medium">Waitlist</CardTitle>
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
              Track signups and manage your waiting list {isConnected && '• Live updates'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Signups</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-2xl font-bold">{data.total.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Today</p>
              <p className="text-2xl font-bold">{data.todayCount}</p>
              {data.todayCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">{data.weekCount}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-2xl font-bold">{growthRate}%</p>
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>

          {/* Chart */}
          <div>
            <h4 className="text-sm font-medium mb-4">Signups Over Time</h4>
            <ChartContainer
              config={chartConfig}
              className="w-full"
              style={{ height: containerHeight }}
            >
              <ResponsiveContainer width="100%" height={containerHeight} key={containerHeight}>
                <AreaChart data={data.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWaitlist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2ADED8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2ADED8" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(255, 255, 255, 0.1)"
                    opacity={0.3}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    hide={true}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2ADED8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWaitlist)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}