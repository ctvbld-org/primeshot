'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Button } from '@primeshot/common/web/ui/button'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Users, TrendingUp, Download, Mail } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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

export function WaitlistWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['waitlist-stats'],
    queryFn: fetchWaitlistStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

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
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-40 bg-gray-200 rounded" />
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
          <div>
            <CardTitle>Waitlist</CardTitle>
            <CardDescription>
              Track signups and manage your waiting list
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
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
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.chartData}>
                <defs>
                  <linearGradient id="colorWaitlist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorWaitlist)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Signups */}
          <div>
            <h4 className="text-sm font-medium mb-4">Recent Signups</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Signed Up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentSignups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No signups yet
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentSignups.map((signup) => (
                    <TableRow key={signup.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {signup.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(signup.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}