'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Composition } from '@/lib/types'
import { CompositionCard } from '@/components/composition/composition-card'
import { NewCompositionCard } from '@/components/composition/new-composition-card'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function CompositionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [compositions, setCompositions] = useState<Composition[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function loadCompositions() {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('compositions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompositions(data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load compositions',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteComposition(compositionId: string) {
    if (!user) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('compositions')
        .delete()
        .eq('id', compositionId)
        .eq('user_id', user.id)

      if (error) throw error

      // Refresh the compositions list
      loadCompositions()
      
      toast({
        title: 'Success',
        description: 'Composition deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete composition',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = () => {
    // Refresh the compositions list
    loadCompositions()
  }

  useEffect(() => {
    loadCompositions()
  }, [user, toast])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your Compositions</h2>
        <p className="text-muted-foreground">
          View and manage your draft compositions.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading compositions...</div>
      ) : compositions.length === 0 ? (
        <div className="grid place-items-center">
          <div className="max-w-sm w-full">
            <NewCompositionCard onClick={() => router.push('/app/composition')} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <NewCompositionCard onClick={() => router.push('/app/composition')} />
          {compositions.map((composition) => (
            <CompositionCard
              key={composition.id}
              composition={composition}
              onClick={() => router.push(`/app/composition/${composition.id}`)}
              onDelete={() => deleteComposition(composition.id)}
            />
          ))}
        </div>
      )}

      <div className="flex justify-end pt-6">
        <Button 
          size="lg"
          className="w-full sm:w-auto"
          disabled={compositions.length === 0}
          onClick={() => {
            if (compositions.length > 0) {
              router.push('/app/upload')
            }
          }}
        >
          Next
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
} 