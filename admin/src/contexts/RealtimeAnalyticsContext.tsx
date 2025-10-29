'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeAnalyticsContextType {
  isConnected: boolean;
  connectionError: string | null;
  subscribe: (callback: (table: string, eventType: string, record: any) => void) => string;
  unsubscribe: (subscriptionId: string) => void;
  reconnect: () => void;
}

const RealtimeAnalyticsContext = createContext<RealtimeAnalyticsContextType | null>(null);

interface RealtimeAnalyticsProviderProps {
  children: ReactNode;
}

interface Subscription {
  id: string;
  callback: (table: string, eventType: string, record: any) => void;
}

// All analytics tables we want to monitor
const ANALYTICS_TABLES = [
  'user_subscriptions',
  'credit_pack_purchases', 
  'user_credits',
  'subscriptions',
  'users',
  'inference_jobs',
  'training_jobs',
  'waitlist'
];

// Reconnect backoff configuration
const INITIAL_BACKOFF_MS = 3000;
const MAX_BACKOFF_MS = 60000;

// Global state to prevent multiple providers
let globalChannel: RealtimeChannel | null = null;
let globalProviderCount = 0;

export function RealtimeAnalyticsProvider({ children }: RealtimeAnalyticsProviderProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);
  const providerIdRef = useRef(Math.random().toString(36).substring(2, 11));
  const backoffRef = useRef<number>(INITIAL_BACKOFF_MS);
  const connectionErrorRef = useRef<string | null>(null);

  // Keep a ref in sync for places where we can't depend on state in callbacks
  useEffect(() => {
    connectionErrorRef.current = connectionError;
  }, [connectionError]);

  // Initialize the realtime channel with all tables
  const initializeChannel = () => {
    if (isInitializingRef.current) {
      console.log(`[Provider ${providerIdRef.current}] Channel initialization already in progress, skipping...`);
      return;
    }

    // Check if there's already a global channel
    if (globalChannel && globalChannel.state === 'joined') {
      console.log(`[Provider ${providerIdRef.current}] Using existing global channel`);
      channelRef.current = globalChannel;
      setIsConnected(true);
      setConnectionError(null);
      return;
    }

    isInitializingRef.current = true;
    const supabase = supabaseRef.current;
    
    // Clean up existing channel if any
    if (channelRef.current && channelRef.current !== globalChannel) {
      console.log(`[Provider ${providerIdRef.current}] Cleaning up existing channel...`);
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    console.log(`[Provider ${providerIdRef.current}] Creating new realtime channel...`);
    
    // Create a single channel for all analytics
    const channel = supabase.channel('dashboard-analytics', {
      config: {
        broadcast: { self: false },
        presence: { key: 'admin-dashboard' }
      }
    });

    // Subscribe to all analytics tables at once
    ANALYTICS_TABLES.forEach(table => {
      console.log(`[Provider ${providerIdRef.current}] Setting up subscription for table: ${table}`);
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`Realtime update on ${table}:`, payload);
          
          // Notify all subscribers across all provider instances
          subscriptionsRef.current.forEach(subscription => {
            subscription.callback(table, payload.eventType as any, payload.new || payload.old);
          });
        }
      );
    });

    // Handle connection status
    channel
      .on('system', {}, (payload) => {
        console.log(`[Provider ${providerIdRef.current}] Realtime system event:`, payload);
        if (payload.status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionError(null);
          isInitializingRef.current = false;
          backoffRef.current = INITIAL_BACKOFF_MS;
          // Clear any reconnection timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        }
      })
      .subscribe((status) => {
        console.log(`[Provider ${providerIdRef.current}] Realtime subscription status:`, status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionError(null);
          isInitializingRef.current = false;
          backoffRef.current = INITIAL_BACKOFF_MS;
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionError('Failed to connect to realtime');
          isInitializingRef.current = false;
          scheduleReconnect();
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setConnectionError('Connection timed out');
          isInitializingRef.current = false;
          scheduleReconnect();
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          isInitializingRef.current = false;
          // Only reconnect if we didn't intentionally close
          if (!connectionErrorRef.current) {
            scheduleReconnect();
          }
        }
      });

    channelRef.current = channel;
    globalChannel = channel;
  };

  // Schedule automatic reconnection
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    // Avoid scheduling if already connected or initializing
    if (isInitializingRef.current) {
      return;
    }
    if (globalChannel && globalChannel.state === 'joined') {
      return;
    }

    const delay = backoffRef.current;
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`[Provider ${providerIdRef.current}] Attempting to reconnect realtime...`);
      initializeChannel();
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
    }, delay);
  };

  // Subscribe to realtime updates (simplified - no table filtering needed)
  const subscribe = useCallback((callback: (table: string, eventType: string, record: any) => void): string => {
    const subscriptionId = Math.random().toString(36).substring(2, 11);
    
    subscriptionsRef.current.set(subscriptionId, {
      id: subscriptionId,
      callback
    });

    console.log(`[Provider ${providerIdRef.current}] Added subscription ${subscriptionId}, total: ${subscriptionsRef.current.size}`);
    
    return subscriptionId;
  }, []);

  // Unsubscribe from realtime updates
  const unsubscribe = useCallback((subscriptionId: string) => {
    subscriptionsRef.current.delete(subscriptionId);
    console.log(`[Provider ${providerIdRef.current}] Removed subscription ${subscriptionId}, total: ${subscriptionsRef.current.size}`);
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    setConnectionError(null);
    backoffRef.current = INITIAL_BACKOFF_MS;
    initializeChannel();
  }, []);

  // Initialize on mount
  useEffect(() => {
    globalProviderCount++;
    console.log(`[Provider ${providerIdRef.current}] Initializing realtime analytics provider... (global count: ${globalProviderCount})`);
    
    // Only initialize if this is the first provider or no global channel exists
    if (globalProviderCount === 1 || !globalChannel) {
      initializeChannel();
    } else {
      // Use existing global channel
      console.log(`[Provider ${providerIdRef.current}] Using existing global channel`);
      channelRef.current = globalChannel;
      if (globalChannel && globalChannel.state === 'joined') {
        setIsConnected(true);
        setConnectionError(null);
      }
    }

    return () => {
      globalProviderCount--;
      console.log(`[Provider ${providerIdRef.current}] Cleaning up realtime analytics provider... (global count: ${globalProviderCount})`);
      
      // Only cleanup the global channel if this is the last provider
      if (globalProviderCount === 0) {
        console.log(`[Provider ${providerIdRef.current}] Last provider, cleaning up global channel`);
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
          globalChannel = null;
        }
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const value: RealtimeAnalyticsContextType = useMemo(() => ({
    isConnected,
    connectionError,
    subscribe,
    unsubscribe,
    reconnect
  }), [isConnected, connectionError, subscribe, unsubscribe, reconnect]);

  return (
    <RealtimeAnalyticsContext.Provider value={value}>
      {children}
    </RealtimeAnalyticsContext.Provider>
  );
}

export function useRealtimeAnalytics() {
  const context = useContext(RealtimeAnalyticsContext);
  if (!context) {
    throw new Error('useRealtimeAnalytics must be used within a RealtimeAnalyticsProvider');
  }
  return context;
} 