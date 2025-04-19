'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Loader2Icon } from 'lucide-react'
import { OrderStatus, Style } from '@/lib/types'
import { ShootCard } from '@/components/shoot/shoot-card'
import { EmptyState } from '@/components/ui/empty-state'
import { useCachedQuery, generateCacheKey } from '@/lib/hooks/use-cached-query'

// Extended type for Order with styles array
interface OrderWithStyles {
  id: string
  status: OrderStatus
  created_at: string
  amount: number
  shoot_number?: number
  styles: Style[]
  [key: string]: any
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Use the cached query hook instead of direct data fetching
  const {
    data: orders,
    isLoading,
    error,
    refetch
  } = useCachedQuery<OrderWithStyles[]>(
    // Query function
    async (supabase) => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, styles(*)')
        .eq('user_id', user?.id || '')
        .in('status', ['paid', 'processing', 'completed'])
        .order('shoot_number', { ascending: false })
        
      return { 
        data: data as OrderWithStyles[] || null, 
        error: error as Error | null 
      }
    },
    // Dependencies
    [user?.id],
    // Cache key
    generateCacheKey('orders', { userId: user?.id, type: 'withStyles' }),
    // Cache config - keep valid for 5 minutes
    { ttl: 5 * 60 * 1000 }
  )
  
  // Group orders by status
  const groupedOrders = () => {
    if (!orders || orders.length === 0) return {}
    
    const grouped: Record<string, OrderWithStyles[]> = {
      completed: [],
      processing: [],
      paid: []
    }
    
    orders.forEach(order => {
      if (order.status in grouped) {
        grouped[order.status].push(order)
      }
    })
    
    return grouped
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="space-y-4 py-8">
        <h3 className="text-lg font-medium">Error loading your shoots</h3>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        title="No shoots found"
        description="You don't have any shoots yet. Create your first shoot to get started."
        action={
          <Button onClick={() => router.push('/app/shoot')}>Create Shoot</Button>
        }
      />
    )
  }

  const grouped = groupedOrders()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">View and manage your shoots.</p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Shoots</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {orders.map(order => (
            <ShootCard 
              key={order.id} 
              order={order} 
              onRefresh={refetch} 
            />
          ))}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {grouped.completed && grouped.completed.length > 0 ? (
            grouped.completed.map(order => (
              <ShootCard 
                key={order.id} 
                order={order}
                onRefresh={refetch}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p>No completed shoots found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="processing" className="space-y-4">
          {grouped.processing && grouped.processing.length > 0 ? (
            grouped.processing.map(order => (
              <ShootCard 
                key={order.id} 
                order={order}
                onRefresh={refetch} 
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p>No processing shoots found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 