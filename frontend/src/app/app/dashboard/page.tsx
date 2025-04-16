'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/pricing'
import { CameraIcon, ImageIcon, Loader2Icon } from 'lucide-react'
import type { Order, Style } from '@/lib/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<(Order & { styles: Style[] })[]>([])
  
  // Helper function to get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  useEffect(() => {
    async function loadData() {
      if (!user) return
      
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Get all paid/completed orders with their styles
        const { data, error } = await supabase
          .from('orders')
          .select('*, styles(*)')
          .eq('user_id', user.id)
          .in('status', ['paid', 'processing', 'completed'])
          .order('shoot_number', { ascending: false })
        
        if (error) throw error
        
        setOrders(data || [])
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load your shoots. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [user, toast])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
          <p className="text-muted-foreground">
            View and manage your headshot shoots.
          </p>
        </div>
        
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <CameraIcon className="h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold">No shoots yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't completed any shoots yet. Start by creating a style and completing the payment process.
              </p>
              <Button 
                onClick={() => router.push('/app/shoot')}
                className="mt-4"
              >
                Create Your First Shoot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
        <p className="text-muted-foreground">
          View and manage your headshot shoots.
        </p>
      </div>
      
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Shoots</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {orders.map(order => (
            <ShootCard key={order.id} order={order} getStatusClass={getStatusClass} />
          ))}
        </TabsContent>
        
        <TabsContent value="processing" className="space-y-4">
          {orders.filter(order => order.status === 'processing' || order.status === 'paid')
            .map(order => (
              <ShootCard key={order.id} order={order} getStatusClass={getStatusClass} />
            ))}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {orders.filter(order => order.status === 'completed')
            .map(order => (
              <ShootCard key={order.id} order={order} getStatusClass={getStatusClass} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ShootCard({ 
  order, 
  getStatusClass 
}: { 
  order: Order & { styles: Style[] }, 
  getStatusClass: (status: string) => string 
}) {
  const router = useRouter()
  
  // Format shoot date
  const shootDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  })
  
  // Get style count
  const styleCount = order.styles?.length || 0
  
  // Format shoot number
  const shootNumber = `Shoot ${order.shoot_number.toString().padStart(3, '0')}`
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <CardTitle className="text-xl font-bold">{shootNumber}</CardTitle>
            <CardDescription>{shootDate}</CardDescription>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium mt-2 sm:mt-0 ${getStatusClass(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium mb-2">Styles</h3>
            <ul className="space-y-1 text-sm">
              {order.styles?.map(style => (
                <li key={style.id} className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
                  {style.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Style Count</span>
              <span className="text-sm">{styleCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="text-sm">{formatPrice(order.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Order ID</span>
              <span className="text-sm text-muted-foreground">{order.id.substring(0, 8)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-end pt-4 pb-4">
        <Button 
          variant="outline" 
          className="sm:mr-2"
          onClick={() => router.push(`/app/shoot/${order.id}`)}
        >
          View Details
        </Button>
        {order.status === 'completed' && (
          <Button onClick={() => router.push(`/app/results/${order.id}`)}>
            View Results <ImageIcon className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 