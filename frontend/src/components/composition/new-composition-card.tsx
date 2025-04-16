import { Card } from '@/components/ui/card'
import { PlusIcon } from '@heroicons/react/24/outline'

interface NewCompositionCardProps {
  onClick: () => void
}

export function NewCompositionCard({ onClick }: NewCompositionCardProps) {
  return (
    <Card 
      className="hover:bg-accent/50 transition-colors cursor-pointer flex items-center justify-center h-full min-h-[240px] bg-muted/50 shadow-none border-2 border-dashed border-muted-foreground/25"
      onClick={onClick}
    >
      <div className="text-center space-y-4">
        <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
          <PlusIcon className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg font-medium text-primary">New Composition</p>
      </div>
    </Card>
  )
} 