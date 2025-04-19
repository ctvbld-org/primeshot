'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ImageIcon } from 'lucide-react'
import { formatPrice } from '@/lib/pricing'
import { OrderStatus, Style } from '@/lib/types'

interface OrderWithStyles {
  id: string
  status: OrderStatus
  created_at: string
  amount: number
  shoot_number?: number
  styles: Style[]
  [key: string]: any
}

interface ShootCardProps {
  order: OrderWithStyles
  onRefresh?: () => void
}

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

export function ShootCard({ order, onRefresh }: ShootCardProps) {
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
  const shootNumber = order.shoot_number 
    ? `Shoot ${order.shoot_number.toString().padStart(3, '0')}` 
    : 'Shoot TBD'
  
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