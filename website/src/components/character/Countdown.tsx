// Stub for website
export function Countdown({ seconds, fallback }: { seconds: number, fallback: string }) {
  if (seconds <= 0) return <>{fallback}</>
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return <>{mins}:{secs.toString().padStart(2, '0')}</>
}

