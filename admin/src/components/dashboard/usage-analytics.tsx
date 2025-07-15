'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { format, subDays } from 'date-fns'

interface UsageData {
  date: string
  generations: number
  trainings: number
}

async function fetchUsageData(): Promise<UsageData[]> {
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
}

export function UsageAnalytics() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['usage-analytics'],
    queryFn: fetchUsageData,
    refetchInterval: 60000, // Refresh every minute
  })

  if (isLoading || !chartData) {
    return null
  }

  const totalGenerations = chartData.reduce((sum, day) => sum + day.generations, 0)
  const totalTrainings = chartData.reduce((sum, day) => sum + day.trainings, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Trends</CardTitle>
        <CardDescription>
          {totalGenerations} generations • {totalTrainings} trainings (last 30 days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="generations" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              name="Generations"
            />
            <Line 
              type="monotone" 
              dataKey="trainings" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={false}
              name="Trainings"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}