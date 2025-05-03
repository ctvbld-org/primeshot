import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { 
  getStyles
} from '@/lib/api/styles'
import type { StyleStatus } from '@/lib/types'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const CACHE_KEYS = {
  styles: 'styles',
  headshots: 'headshots'
} as const

export function useStyles(options?: { 
  status?: StyleStatus, 
  orderId?: string,
  limit?: number
}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { status: desiredStatus } = options || {};

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('styles_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'styles'
        },
        async (payload) => { 
          let shouldUpdate = false;
          const eventType = payload.eventType;

          if (eventType === 'INSERT' || eventType === 'UPDATE') {
              const relevantStatus = payload.new?.status as StyleStatus;
              shouldUpdate = !desiredStatus || relevantStatus === desiredStatus;
          } else if (eventType === 'DELETE') {
              shouldUpdate = true;
          }

          if (shouldUpdate) {
              queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.styles] });
              queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.headshots] });
          }
        }
      )
      .subscribe((subscribeStatus, err) => {
        if (subscribeStatus === 'SUBSCRIBED') {
            console.log('Styles subscription active.'); 
        }
        if (subscribeStatus === 'CHANNEL_ERROR') {
            console.error('Styles subscription failed:', err); 
        }
        if (subscribeStatus === 'TIMED_OUT') {
            console.warn('Styles subscription timed out.'); 
        }
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription).then((status) => {
          // Optional: log success/error on removal
          // console.log('Successfully removed channel subscription:', status);
      }).catch(error => {
          console.error('Error removing styles subscription:', error);
      });
    };
  }, [user, desiredStatus, queryClient, supabase]); 

  // Fetch styles
  const { data: styles = [], isLoading, error } = useQuery({
    queryKey: [CACHE_KEYS.styles, options],
    queryFn: () => user ? getStyles(user.id, options) : Promise.resolve([]),
    enabled: !!user
  })

  return {
    styles,
    isLoading,
    error,
  }
} 