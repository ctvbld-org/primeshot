'use client'

import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Avatar } from '@primeshot/common/web/ui/avatar'
import { Badge } from '@primeshot/common/web/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Medal, Award, Wifi, WifiOff } from 'lucide-react'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { UserDetailsDialog } from './UserDetailsDialog'

interface TopUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  generation_count: number
  training_count: number
  subscription_plan: string | null
}

async function fetchTopUsers(): Promise<TopUser[]> {
  const supabase = createClient()
  
  // Get top users by generation count
  const { data: topGenerators, error } = await supabase
    .rpc('get_top_users_by_generations', { limit_count: 10 })
  
  if (error) {
    // If the RPC doesn't exist, fall back to manual query
    const { data: users } = await supabase
      .from('users')
      .select(`
        *,
        inference_jobs!inference_jobs_user_id_fkey(id),
        training_jobs!training_jobs_user_id_fkey(id),
        user_subscriptions!user_subscriptions_user_id_fkey(plan_name, status)
      `)
      .limit(50)
    
    if (!users) return []
    
    // Process and sort users
    const processedUsers = users.map(user => {
      const activeSubscription = user.user_subscriptions?.find((sub: any) => sub.status === 'active')
      
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        generation_count: user.inference_jobs?.length || 0,
        training_count: user.training_jobs?.length || 0,
        subscription_plan: activeSubscription?.plan_name || null
      }
    })
    
    return processedUsers
      .sort((a, b) => b.generation_count - a.generation_count)
      .slice(0, 10)
  }
  
  return topGenerators || []
}

function getPositionIcon(position: number) {
  switch (position) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />
    case 3:
      return <Award className="h-5 w-5 text-orange-600" />
    default:
      return <span className="text-sm font-medium text-muted-foreground">{position}</span>
  }
}

function getPlanBadgeVariant(plan: string | null): "default" | "secondary" | "outline" {
  if (!plan) return "outline"
  if (plan.includes('pro') || plan.includes('tier_3')) return "default"
  if (plan.includes('standard') || plan.includes('tier_2')) return "secondary"
  return "outline"
}

export function TopUsersLeaderboard() {
  const [selectedUser, setSelectedUser] = useState<TopUser | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['top-users'],
    queryFn: fetchTopUsers,
    refetchInterval: 60000, // Refresh every minute as fallback
  })

  const handleUserClick = (user: TopUser) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  // Handle realtime updates for user-related tables
  const handleRealtimeUpdate = useCallback((table: string, eventType: string, record: any) => {
    console.log(`Top users data may have changed due to ${eventType} on ${table}:`, record);
    
    // Refetch top users data when user/job-affecting changes occur
    if (['users', 'inference_jobs', 'training_jobs', 'user_subscriptions'].includes(table)) {
      refetch();
    }
  }, [refetch]);

  // Subscribe to realtime updates
  const { isConnected, connectionError } = useRealtimeSubscription({
    tables: ['users', 'inference_jobs', 'training_jobs', 'user_subscriptions'],
    onDataChange: handleRealtimeUpdate,
    enabled: true
  });

  if (isLoading || !users) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Top Users</CardTitle>
          <CardDescription className="text-xs mt-1 text-[#666666]">
            Most active users by image generations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-medium">Top Users</CardTitle>
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
          Most active users by image generations {isConnected && '• Live updates'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user, index) => {
            const position = index + 1
            const initials = user.full_name
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase() || user.email[0].toUpperCase()
            
            return (
              <div 
                key={user.id} 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                onClick={() => handleUserClick(user)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleUserClick(user)
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 flex justify-center">
                    {getPositionIcon(position)}
                  </div>
                  <Avatar
                    src={user.avatar_url}
                    fallback={
                      <span className="text-sm font-medium">
                        {initials}
                      </span>
                    }
                    className="h-10 w-10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.generation_count} generations • {user.training_count} trainings
                    </p>
                  </div>
                </div>
                {user.subscription_plan && (
                  <Badge variant={getPlanBadgeVariant(user.subscription_plan)}>
                    {user.subscription_plan.replace('_', ' ').toUpperCase()}
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
      
      <UserDetailsDialog
        user={selectedUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  )
}