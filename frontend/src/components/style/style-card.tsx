import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Style } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { TrashIcon, CameraIcon } from '@heroicons/react/24/outline'

interface StyleCardProps {
  style: Style
  onClick?: () => void
  onDelete?: () => void
  headshotsPerStyle?: number
}

export function StyleCard({ 
  style, 
  onClick, 
  onDelete,
  headshotsPerStyle 
}: StyleCardProps) {
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
                <AlertDialogTitle>Delete Style</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this style? This action cannot be undone.
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
        <CardTitle>{style.name}</CardTitle>
        <CardDescription>
          Created {formatDistanceToNow(new Date(style.created_at))} ago
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Photography Style:</span>{' '}
            {style.settings.photographyStyle}
          </div>
          <div>
            <span className="font-medium">Outfit:</span>{' '}
            {style.settings.outfit}
          </div>
          <div>
            <span className="font-medium">Background:</span>{' '}
            {style.settings.background}
          </div>
        </div>
      </CardContent>
      {headshotsPerStyle ? (
        <CardFooter className="pt-0">
          <div className="flex items-center text-sm text-muted-foreground">
            <CameraIcon className="h-4 w-4 mr-1" />
            <span>{headshotsPerStyle} headshots</span>
          </div>
        </CardFooter>
      ) : null}
    </Card>
  )
} 