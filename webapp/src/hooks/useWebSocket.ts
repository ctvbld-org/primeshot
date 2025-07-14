import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
  /** Maximum reconnection attempts before giving up. */
  maxReconnectAttempts?: number;
}

interface UseWebSocketResult {
  /** `true` when the socket is currently open. */
  isConnected: boolean;
  /** `true` while an (initial or reconnection) handshake is in progress. */
  isConnecting: boolean;
  /** Last error description, `null` when no error. */
  error: string | null;
  /** Latest received message event. */
  lastMessage: MessageEvent<string> | null;
  /** Send data if socket is open. */
  send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  /** Manually trigger a reconnect (resets attempt counter). */
  reconnect: () => void;
}

/**
 * Small, generic WebSocket hook.
 * Handles connection / reconnection with exponential back-off and exposes the
 * latest message event. No domain logic – meant to be composed by higher-level
 * hooks.
 */
export function useWebSocket(
  url: string | null,
  { maxReconnectAttempts = 3 }: UseWebSocketOptions = {}
): UseWebSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageEvent<string> | null>(null);

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const connect = useCallback(() => {
    if (!url) return;

    // Prevent multiple simultaneous connections
    if (wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (ev) => {
      setLastMessage(ev);
    };

    ws.onclose = (ev) => {
      setIsConnected(false);
      setIsConnecting(false);
      wsRef.current = null;

      // Normal closures (1000: normal, 1001: going away) -> don't reconnect
      const normalClose = ev.code === 1000 || ev.code === 1001;
      if (normalClose) return;

      // Exceeded attempt budget?
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setError('Maximum reconnect attempts reached');
        return;
      }

      // Exponential back-off: 1s, 2s, 4s ... capped to 10s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
      reconnectAttempts.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = (ev) => {
      // In most browsers `ev` is Event, not ErrorEvent – keep message generic
      setError('WebSocket error');
    };
     
  }, [url, maxReconnectAttempts]);

  // Initial connect & cleanup
  useEffect(() => {
    connect();
    return () => {
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback<UseWebSocketResult['send']>((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const reconnect = useCallback(() => {
    clearReconnectTimeout();
    reconnectAttempts.current = 0;
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual reconnect');
      wsRef.current = null;
    }
    connect();
  }, [connect]);

  return { isConnected, isConnecting, error, lastMessage, send, reconnect };
} 