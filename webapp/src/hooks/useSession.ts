import { useEffect, useState } from 'react';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return { session, loading };
} 