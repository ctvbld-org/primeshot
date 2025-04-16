import { Card, CardContent } from '@/components/ui/card'
import { PlusIcon } from '@heroicons/react/24/outline'

interface NewStyleCardProps {
  onClick?: () => void
}

export function NewStyleCard({ onClick }: NewStyleCardProps) {
  return (
    <Card 
      className="flex items-center justify-center h-full min-h-[240px] hover:bg-accent/50 transition-colors cursor-pointer border-dashed"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <PlusIcon className="h-6 w-6" />
        </div>
        <p className="mt-2 font-medium">New Style</p>
      </CardContent>
    </Card>
  )
} 