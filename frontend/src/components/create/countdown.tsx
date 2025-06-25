import { useEffect, useState, useCallback } from 'react';

interface CountdownProps {
  seconds?: number | null;
  fallback?: string;
}

function formatTime(seconds: number) {
  if (seconds < 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export const Countdown: React.FC<CountdownProps> = ({ seconds, fallback = 'Calculating...' }) => {
  const [remaining, setRemaining] = useState<number | null>(seconds ?? null);

  // Reset when prop changes
  useEffect(() => {
    setRemaining(seconds ?? null);
  }, [seconds]);

  // Tick every second
  useEffect(() => {
    if (remaining === null || remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining(prev => (prev !== null ? Math.max(0, prev - 1) : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  if (remaining === null) return <span>{fallback}</span>;
  if (remaining === 0) return <span>Finishing up...</span>;
  return <span>{formatTime(remaining)}</span>;
}; 