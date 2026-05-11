/**
 * Connectivity Hook & Context
 * 
 * Provides real-time online/offline status detection with
 * visual indicators for the user.
 */
'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getPendingCount } from './offline-cache'

// ============================================================
// Types
// ============================================================

export type ConnectivityStatus = 'online' | 'offline' | 'syncing'

interface ConnectivityContextType {
  status: ConnectivityStatus
  isOnline: boolean
  pendingCount: number
  setStatus: (status: ConnectivityStatus) => void
  refreshPendingCount: () => Promise<void>
}

// ============================================================
// Context
// ============================================================

const ConnectivityContext = createContext<ConnectivityContextType>({
  status: 'online',
  isOnline: true,
  pendingCount: 0,
  setStatus: () => {},
  refreshPendingCount: async () => {},
})

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectivityStatus>('online')
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount()
    setPendingCount(count)
  }, [])

  useEffect(() => {
    // Set initial status
    if (typeof navigator !== 'undefined') {
      setStatus(navigator.onLine ? 'online' : 'offline')
    }

    const handleOnline = () => {
      setStatus('online')
      // Trigger auto-sync after a short delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ceres:sync-requested'))
      }, 1000)
    }

    const handleOffline = () => {
      setStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Poll pending count periodically
    refreshPendingCount()
    const interval = setInterval(refreshPendingCount, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [refreshPendingCount])

  const isOnline = status === 'online' || status === 'syncing'

  return (
    <ConnectivityContext.Provider value={{ status, isOnline, pendingCount, setStatus, refreshPendingCount }}>
      {children}
    </ConnectivityContext.Provider>
  )
}

export const useConnectivity = () => useContext(ConnectivityContext)
