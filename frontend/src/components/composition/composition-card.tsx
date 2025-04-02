import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Composition } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface CompositionCardProps {
  composition: Composition
  onClick: () => void
}

export function CompositionCard({ composition, onClick }: CompositionCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle>{composition.name}</CardTitle>
        <CardDescription>
          Created {formatDistanceToNow(new Date(composition.created_at))} ago
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Photography Style:</span>{' '}
            {composition.settings.photographyStyle}
          </div>
          <div>
            <span className="font-medium">Outfit:</span>{' '}
            {composition.settings.outfit}
          </div>
          <div>
            <span className="font-medium">Background:</span>{' '}
            {composition.settings.background}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 