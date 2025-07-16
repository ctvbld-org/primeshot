import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Skeleton } from '@primeshot/common/web/ui/skeleton'
import { UserAnalytics } from '@/components/dashboard/user-analytics'
import { SubscriptionAnalytics } from '@/components/dashboard/subscription-analytics'
import { UsageAnalytics } from '@/components/dashboard/usage-analytics'
import { TopUsersLeaderboard } from '@/components/dashboard/top-users-leaderboard'
import { WaitlistWidget } from '@/components/dashboard/waitlist-widget'
import RevenueAnalytics from '@/components/dashboard/revenue-analytics'
import { RealtimeStatus } from '@/components/dashboard/realtime-status'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Realtime Status Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your application's key metrics and performance
          </p>
        </div>
        <RealtimeStatus />
      </div>

      <div className="grid flex-1 scroll-mt-20 items-stretch gap-10 md:grid-cols-2 md:gap-6 lg:grid-cols-4 xl:gap-10">
        {/* User Analytics */}
        <div className="themes-wrapper group relative grid gap-4 md:grid-cols-2 lg:grid-cols-4 overflow-hidden transition-all duration-200 ease-in-out hover:z-30 md:col-span-2 lg:col-span-4">
          <Suspense fallback={<AnalyticsCardSkeleton />}>
            <UserAnalytics />
          </Suspense>
        </div>

        {/* Main Charts Row */}
        <div className="themes-wrapper group relative grid gap-4 md:grid-cols-3 lg:grid-cols-6 overflow-hidden transition-all duration-200 ease-in-out hover:z-30 md:col-span-2 lg:col-span-4">
          <div className="grid md:col-span-1 lg:col-span-2">         
            {/* Subscription Analytics */}
            <Suspense fallback={<ChartCardSkeleton />}>
              <SubscriptionAnalytics />
            </Suspense>
          </div>

          <div className="grid md:col-span-2 lg:col-span-4"> 
            {/* Revenue Analytics */}
            <Suspense fallback={<ChartCardSkeleton />}>
              <RevenueAnalytics />
            </Suspense>
          </div>
        </div>

        <div className="themes-wrapper group relative grid gap-4 md:grid-cols-2 lg:grid-cols-2 overflow-hidden transition-all duration-200 ease-in-out hover:z-30 md:col-span-2 lg:col-span-4">
          {/* Top Users Leaderboard */}
          <Suspense fallback={<LeaderboardSkeleton />}>
            <TopUsersLeaderboard />
          </Suspense>

          {/* Usage Analytics */}
          <Suspense fallback={<ChartCardSkeleton />}>
            <UsageAnalytics />
          </Suspense>
        </div>



        <div className="themes-wrapper group relative grid gap-4 md:grid-cols-1 lg:grid-cols-1 overflow-hidden transition-all duration-200 ease-in-out hover:z-30 md:col-span-2 lg:col-span-4">
          {/* Waitlist Widget */}
          <Suspense fallback={<WaitlistSkeleton />}>
            <WaitlistWidget />
          </Suspense>
        </div>
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