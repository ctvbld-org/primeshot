'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Composition } from '@/lib/types'
import { CompositionCard } from '@/components/composition/composition-card'
import { PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

export default function CompositionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [compositions, setCompositions] = useState<Composition[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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

    loadCompositions()
  }, [user, toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Compositions</h2>
          <p className="text-muted-foreground">
            View and manage your draft compositions.
          </p>
        </div>
        <Button onClick={() => router.push('/app/composition')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Composition
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading compositions...</div>
      ) : compositions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No draft compositions found.</p>
          <p className="text-muted-foreground">Create a new composition to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {compositions.map((composition) => (
            <CompositionCard
              key={composition.id}
              composition={composition}
              onClick={() => router.push(`/app/composition/${composition.id}`)}
            />
          ))}
        </div>
      )}

      <div className="flex justify-end pt-6">
        <Button 
          size="lg"
          className="w-full sm:w-auto"
          disabled={compositions.length === 0}
        >
          Next
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
} 