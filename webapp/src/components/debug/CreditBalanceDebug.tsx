"use client"

import React, { useState } from 'react'
import { useCreditBalance } from '@/hooks/useCreditBalance'
import { useAuth } from '@/contexts/auth-context'

/**
 * Debug component to test credit balance real-time updates
 * Add this to any page during development to monitor credit balance changes
 */
export function CreditBalanceDebug() {
  const { user } = useAuth()
  const { data: creditBalance, isLoading, isFetching, error } = useCreditBalance()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Track when balance changes
  React.useEffect(() => {
    if (creditBalance !== undefined) {
      setLastUpdate(new Date())
    }
  }, [creditBalance])

  if (!user) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        <strong>Credit Debug:</strong> Not authenticated
      </div>
    )
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      minWidth: '200px'
    }}>
      <div><strong>Credit Balance Debug</strong></div>
      <div>User: {user.email}</div>
      <div>Balance: {creditBalance ?? 'Loading...'}</div>
      <div>Status: {isLoading ? 'Loading' : isFetching ? 'Updating...' : 'Ready'}</div>
      {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
      {lastUpdate && (
        <div>Last Update: {lastUpdate.toLocaleTimeString()}</div>
      )}
      <div style={{ marginTop: '5px', fontSize: '10px', color: '#666' }}>
        Watch console for real-time events
      </div>
    </div>
  )
}

export default CreditBalanceDebug
