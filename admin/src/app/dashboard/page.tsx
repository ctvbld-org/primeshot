import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Skeleton } from '@primeshot/common/web/ui/skeleton'
import { UserAnalytics } from '@/components/dashboard/user-analytics'
import { SubscriptionAnalytics } from '@/components/dashboard/subscription-analytics'
import { UsageAnalytics } from '@/components/dashboard/usage-analytics'
import { TopUsersLeaderboard } from '@/components/dashboard/top-users-leaderboard'
import { WaitlistWidget } from '@/components/dashboard/waitlist-widget'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Primeshot admin dashboard. Monitor user activity, subscriptions, and system usage.
        </p>
      </div>

      {/* User Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<AnalyticsCardSkeleton />}>
          <UserAnalytics />
        </Suspense>
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Subscription Analytics */}
        <Suspense fallback={<ChartCardSkeleton />}>
          <SubscriptionAnalytics />
        </Suspense>

        {/* Usage Analytics */}
        <Suspense fallback={<ChartCardSkeleton />}>
          <UsageAnalytics />
        </Suspense>
      </div>

      {/* Top Users Leaderboard */}
      <Suspense fallback={<LeaderboardSkeleton />}>
        <TopUsersLeaderboard />
      </Suspense>

      {/* Waitlist Widget */}
      <div className="grid gap-4">
        <Suspense fallback={<WaitlistSkeleton />}>
          <WaitlistWidget />
        </Suspense>
      </div>
    </div>
  )
}

function AnalyticsCardSkeleton() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px]" />
            <Skeleton className="h-3 w-[120px] mt-1" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}

function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[150px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}

function LeaderboardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[150px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px] mt-1" />
                </div>
              </div>
              <Skeleton className="h-4 w-[60px]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function WaitlistSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[100px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-[80px] mb-2" />
                <Skeleton className="h-8 w-[60px]" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[150px] w-full" />
        </div>
      </CardContent>
    </Card>
  )
}