import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Composition } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { TrashIcon } from '@heroicons/react/24/outline'

interface CompositionCardProps {
  composition: Composition
  onClick?: () => void
  onDelete?: () => void
}

export function CompositionCard({ composition, onClick, onDelete }: CompositionCardProps) {
  return (
    <Card 
      className="hover:bg-accent/50 transition-colors cursor-pointer group relative"
      onClick={onClick}
    >
      {onDelete && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Composition</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this composition? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
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