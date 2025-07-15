'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Users, UserPlus, TrendingUp, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface UserStats {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  growthRate: number
}

async function fetchUserStats(): Promise<UserStats> {
  const supabase = createClient()
  
  // Get total users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
  
  // Get users created today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { count: newUsersToday } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())
  
  // Get users created this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  const { count: newUsersThisWeek } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())
  
  // Get users created this month
  const monthAgo = new Date()
  monthAgo.setMonth(monthAgo.getMonth() - 1)
  
  const { count: newUsersThisMonth } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthAgo.toISOString())
  
  // Calculate growth rate (compared to previous month)
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  
  const { count: usersLastMonth } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', twoMonthsAgo.toISOString())
    .lt('created_at', monthAgo.toISOString())
  
  const growthRate = usersLastMonth 
    ? ((newUsersThisMonth! - usersLastMonth) / usersLastMonth) * 100
    : 0
  
  return {
    totalUsers: totalUsers || 0,
    newUsersToday: newUsersToday || 0,
    newUsersThisWeek: newUsersThisWeek || 0,
    newUsersThisMonth: newUsersThisMonth || 0,
    growthRate: Math.round(growthRate * 10) / 10
  }
}

export function UserAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-analytics'],
    queryFn: fetchUserStats,
    refetchInterval: 60000, // Refresh every minute
  })

  if (isLoading || !stats) {
    return null
  }

  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      description: 'All registered users',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'New Today',
      value: stats.newUsersToday.toLocaleString(),
      description: 'Users joined today',
      icon: UserPlus,
      color: 'text-green-600',
    },
    {
      title: 'This Week',
      value: stats.newUsersThisWeek.toLocaleString(),
      description: 'Users joined this week',
      icon: Activity,
      color: 'text-purple-600',
    },
    {
      title: 'Growth Rate',
      value: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate}%`,
      description: 'Monthly growth',
      icon: TrendingUp,
      color: stats.growthRate > 0 ? 'text-green-600' : 'text-red-600',
    },
  ]

  return (
    <>
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  )
}