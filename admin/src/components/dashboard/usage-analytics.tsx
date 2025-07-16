'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@primeshot/common/web/ui/card'
import { ChartConfig, ChartContainer } from '@primeshot/common/web/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@primeshot/common/web/ui/select'
import { createClient } from '@/lib/supabase/client'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { TrendingUp, Activity, Wifi, WifiOff } from 'lucide-react'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

type TimePeriod = 'daily' | 'weekly'

interface UsageData {
  date: string
  generations: number
  trainings: number
}

const chartConfig = {
  generations: {
    label: "Generations",
    color: "#2ADED8",
  },
  trainings: {
    label: "Trainings", 
    color: "#99EFEC",
  },
} satisfies ChartConfig

async function fetchUsageData(period: TimePeriod): Promise<UsageData[]> {
  const supabase = createClient()
  
  // Get data for the last 30 days
  const startDate = subDays(new Date(), 30)
  
  // Fetch inference jobs (generations)
  const { data: inferences } = await supabase
    .from('inference_jobs')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed')
  
  // Fetch training jobs
  const { data: trainings } = await supabase
    .from('training_jobs')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed')
  
  if (period === 'daily') {
    // Process data by day
    const dailyData: Record<string, UsageData> = {}
    
    // Initialize all days with zero counts
    for (let i = 0; i <= 30; i++) {
      const date = format(subDays(new Date(), 30 - i), 'yyyy-MM-dd')
      dailyData[date] = {
        date: format(subDays(new Date(), 30 - i), 'MMM dd'),
        generations: 0,
        trainings: 0,
      }
    }
    
    // Count generations by day
    inferences?.forEach(job => {
      const date = format(new Date(job.created_at), 'yyyy-MM-dd')
      if (dailyData[date]) {
        dailyData[date].generations++
      }
    })
    
    // Count trainings by day
    trainings?.forEach(job => {
      const date = format(new Date(job.created_at), 'yyyy-MM-dd')
      if (dailyData[date]) {
        dailyData[date].trainings++
      }
    })
    
    return Object.values(dailyData)
  } else {
    // Process data by week
    const weeklyData: Record<string, UsageData> = {}
    
    // Initialize weeks with zero counts
    for (let i = 0; i < 5; i++) { // Last 5 weeks
      const weekStart = startOfWeek(subDays(new Date(), i * 7))
      const weekKey = format(weekStart, 'yyyy-MM-dd')
      weeklyData[weekKey] = {
        date: format(weekStart, 'MMM dd'),
        generations: 0,
        trainings: 0,
      }
    }
    
    // Count generations by week
    inferences?.forEach(job => {
      const jobDate = new Date(job.created_at)
      const weekStart = startOfWeek(jobDate)
      const weekKey = format(weekStart, 'yyyy-MM-dd')
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].generations++
      }
    })
    
    // Count trainings by week
    trainings?.forEach(job => {
      const jobDate = new Date(job.created_at)
      const weekStart = startOfWeek(jobDate)
      const weekKey = format(weekStart, 'yyyy-MM-dd')
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].trainings++
      }
    })
    
    return Object.values(weeklyData).reverse() // Show oldest to newest
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-300">
              {entry.dataKey}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function UsageAnalytics() {
  const [period, setPeriod] = useState<TimePeriod>('weekly')
  const { data: chartData, isLoading, refetch } = useQuery({
    queryKey: ['usage-analytics', period],
    queryFn: () => fetchUsageData(period),
    refetchInterval: 60000, // Refresh every minute as fallback
  })

  // Handle realtime updates for usage-related tables
  const handleRealtimeUpdate = useCallback((table: string, eventType: string, record: any) => {
    console.log(`Usage data may have changed due to ${eventType} on ${table}:`, record);
    
    // Refetch usage data when job-affecting changes occur
    if (['inference_jobs', 'training_jobs'].includes(table)) {
      refetch();
    }
  }, [refetch]);

  // Subscribe to realtime updates
  const { isConnected, connectionError } = useRealtimeSubscription({
    tables: ['inference_jobs', 'training_jobs'],
    onDataChange: handleRealtimeUpdate,
    enabled: true
  });

  if (isLoading || !chartData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Usage Trends</CardTitle>
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
            <Select value={period} onValueChange={(value: TimePeriod) => setPeriod(value)}>
              <SelectTrigger className="w-28 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-28">
                <SelectItem value="daily" className="py-3 px-4">Daily</SelectItem>
                <SelectItem value="weekly" className="py-3 px-4">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalGenerations = chartData.reduce((sum, day) => sum + day.generations, 0)
  const totalTrainings = chartData.reduce((sum, day) => sum + day.trainings, 0)

  // Calculate growth trend (compare last 15 days vs previous 15 days)
  const midPoint = Math.floor(chartData.length / 2)
  const recentTotal = chartData.slice(midPoint).reduce((sum, day) => sum + day.generations + day.trainings, 0)
  const previousTotal = chartData.slice(0, midPoint).reduce((sum, day) => sum + day.generations + day.trainings, 0)
  const growthRate = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal * 100).toFixed(1) : '0'

  return (
    <Card>
      <CardHeader>
        <div className="flex w-full items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Usage Trends</CardTitle>
            <CardDescription className="text-xs mt-1 text-[#666666]">
              {totalGenerations} generations • {totalTrainings} trainings ({period === 'daily' ? 'last 30 days' : 'last 5 weeks'})
            </CardDescription>
          </div>
          <Select value={period} onValueChange={(value: TimePeriod) => setPeriod(value)}>
            <SelectTrigger className="w-28 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-28">
              <SelectItem value="daily" className="py-3 px-4">Daily</SelectItem>
              <SelectItem value="weekly" className="py-3 px-4">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                tickFormatter={(value) => value.slice(0, 5)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="generations" 
                fill="#2ADED8" 
                radius={[4, 4, 0, 0]}
                name="Generations"
              />
              <Bar 
                dataKey="trainings" 
                fill="#99EFEC" 
                radius={[4, 4, 0, 0]}
                name="Trainings"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none text-xs text-[#666666] font-medium">
          {recentTotal >= previousTotal ? (
            <>
              Trending up by {growthRate}% this period <TrendingUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Activity decreased by {Math.abs(Number(growthRate))}% this period <Activity className="h-4 w-4" />
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none text-xs">
          Showing total usage for the {period === 'daily' ? 'last 30 days' : 'last 5 weeks'}
        </div>
      </CardFooter>
    </Card>
  )
}