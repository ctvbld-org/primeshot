import { useEffect, useRef, useCallback } from 'react';
import { useRealtimeAnalytics } from '@/contexts/RealtimeAnalyticsContext';

interface UseRealtimeSubscriptionConfig {
  tables: string[];
  onDataChange?: (table: string, eventType: 'INSERT' | 'UPDATE' | 'DELETE', record: any) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription({
  tables,
  onDataChange,
  enabled = true
}: UseRealtimeSubscriptionConfig) {
  const { isConnected, connectionError, subscribe, unsubscribe, reconnect } = useRealtimeAnalytics();
  const subscriptionIdRef = useRef<string | null>(null);
  const onDataChangeRef = useRef(onDataChange);
  const tablesRef = useRef(tables);

  // Keep the callback and tables reference up to date
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
    tablesRef.current = tables;
  }, [onDataChange, tables]);

  // Stable callback that filters by the tables this component cares about
  const stableCallback = useCallback((table: string, eventType: string, record: any) => {
    // Only call the callback if this table is in our filter list
    if (tablesRef.current.includes(table)) {
      onDataChangeRef.current?.(table, eventType as 'INSERT' | 'UPDATE' | 'DELETE', record);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Unsubscribe if disabled
      if (subscriptionIdRef.current) {
        unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
      return;
    }

    // Subscribe to realtime updates (the provider handles all tables)
    subscriptionIdRef.current = subscribe(stableCallback);

    // Cleanup function
    return () => {
      if (subscriptionIdRef.current) {
        unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [enabled, subscribe, unsubscribe, stableCallback]);

  return {
    isConnected,
    connectionError,
    reconnect
  };
} 