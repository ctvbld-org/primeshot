'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';

interface RealtimeState {
  isConnected: boolean;
  connectionQuality: 'good' | 'poor' | 'disconnected';
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  subscriptions: Map<string, any>;
}

interface RealtimeContextType {
  state: RealtimeState;
  subscribe: (channel: string, callback: (payload: any) => void) => () => void;
  unsubscribe: (channel: string) => void;
  forceReconnect: () => void;
  getConnectionStatus: () => 'connected' | 'disconnected' | 'reconnecting';
}

const initialState: RealtimeState = {
  isConnected: false,
  connectionQuality: 'disconnected',
  lastHeartbeat: null,
  reconnectAttempts: 0,
  subscriptions: new Map()
};

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<RealtimeState>(initialState);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const { user } = useAuth();
  const supabase = createClient();

  // Monitor connection status
  useEffect(() => {
    if (!user) return;

    const checkConnection = () => {
      const now = new Date();
      const timeSinceLastHeartbeat = state.lastHeartbeat 
        ? now.getTime() - state.lastHeartbeat.getTime() 
        : Infinity;

      // Update connection quality based on heartbeat timing
      if (timeSinceLastHeartbeat < 10000) { // 10 seconds
        setState(prev => ({ 
          ...prev, 
          connectionQuality: 'good',
          isConnected: true 
        }));
      } else if (timeSinceLastHeartbeat < 30000) { // 30 seconds
        setState(prev => ({ 
          ...prev, 
          connectionQuality: 'poor',
          isConnected: true 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          connectionQuality: 'disconnected',
          isConnected: false 
        }));
      }
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [state.lastHeartbeat, user]);

  // Heartbeat channel for connection monitoring
  useEffect(() => {
    if (!user) return;

    const heartbeatChannel = supabase
      .channel('heartbeat')
      .on('presence', { event: 'sync' }, () => {
        setState(prev => ({ 
          ...prev, 
          lastHeartbeat: new Date(),
          isConnected: true,
          reconnectAttempts: 0
        }));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setState(prev => ({ 
            ...prev, 
            isConnected: true,
            lastHeartbeat: new Date() 
          }));
        } else if (status === 'CHANNEL_ERROR') {
          setState(prev => ({ 
            ...prev, 
            isConnected: false,
            reconnectAttempts: prev.reconnectAttempts + 1
          }));
        }
      });

    return () => {
      heartbeatChannel.unsubscribe();
    };
  }, [user, supabase]);

  const subscribe = (channelName: string, callback: (payload: any) => void) => {
    if (!user) return () => {};

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public' }, callback)
      .subscribe();

    setState(prev => {
      const newSubscriptions = new Map(prev.subscriptions);
      newSubscriptions.set(channelName, channel);
      return { ...prev, subscriptions: newSubscriptions };
    });

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      setState(prev => {
        const newSubscriptions = new Map(prev.subscriptions);
        newSubscriptions.delete(channelName);
        return { ...prev, subscriptions: newSubscriptions };
      });
    };
  };

  const unsubscribe = (channelName: string) => {
    const channel = state.subscriptions.get(channelName);
    if (channel) {
      channel.unsubscribe();
      setState(prev => {
        const newSubscriptions = new Map(prev.subscriptions);
        newSubscriptions.delete(channelName);
        return { ...prev, subscriptions: newSubscriptions };
      });
    }
  };

  const forceReconnect = async () => {
    setIsReconnecting(true);
    
    // Unsubscribe from all channels
    state.subscriptions.forEach((channel) => {
      channel.unsubscribe();
    });
    
    setState(prev => ({ 
      ...prev, 
      subscriptions: new Map(),
      reconnectAttempts: prev.reconnectAttempts + 1
    }));

    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsReconnecting(false);
  };

  const getConnectionStatus = () => {
    if (isReconnecting) return 'reconnecting';
    return state.isConnected ? 'connected' : 'disconnected';
  };

  const value: RealtimeContextType = {
    state,
    subscribe,
    unsubscribe,
    forceReconnect,
    getConnectionStatus
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

// Helper hook for training job subscriptions
export function useTrainingJobSubscription(
  jobId: string, 
  callback: (payload: any) => void
) {
  const { subscribe } = useRealtime();
  
  useEffect(() => {
    if (!jobId) return;
    
    const unsubscribe = subscribe(`training-job-${jobId}`, callback);
    return unsubscribe;
  }, [jobId, callback, subscribe]);
} 