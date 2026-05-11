'use client'

import { useConnectivity } from '@/lib/connectivity'
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react'
import { useState, useEffect } from 'react'

/**
 * Floating connectivity status indicator.
 * Shows online/offline/syncing state and pending mutation count.
 */
export default function ConnectivityIndicator() {
  const { status, pendingCount } = useConnectivity()
  const [visible, setVisible] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Always show briefly when status changes
    setVisible(true)
    setShowBanner(status === 'offline' || status === 'syncing' || pendingCount > 0)

    if (status === 'online' && pendingCount === 0) {
      // Auto-hide after 3 seconds when online with no pending
      const timer = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [status, pendingCount])

  if (!visible && !showBanner) return null

  const config = {
    online: {
      icon: <Wifi size={14} />,
      label: 'Online',
      bg: 'rgba(34, 197, 94, 0.15)',
      border: 'rgba(34, 197, 94, 0.3)',
      color: '#4ade80',
    },
    offline: {
      icon: <WifiOff size={14} />,
      label: 'Modo Offline',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.3)',
      color: '#f87171',
    },
    syncing: {
      icon: <RefreshCw size={14} className="spin-animation" />,
      label: 'Sincronizando...',
      bg: 'rgba(59, 130, 246, 0.15)',
      border: 'rgba(59, 130, 246, 0.3)',
      color: '#60a5fa',
    },
  }

  const { icon, label, bg, border, color } = config[status]

  return (
    <>
      <style>{`
        .spin-animation { animation: spin-sync 1s linear infinite; }
        @keyframes spin-sync { to { transform: rotate(360deg); } }
        .connectivity-indicator {
          animation: slideDown 0.3s ease forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Floating indicator */}
      <div
        className="connectivity-indicator"
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 12,
          color,
          fontSize: 13,
          fontWeight: 500,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {icon}
        <span>{label}</span>
        {pendingCount > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 20,
            background: 'rgba(234, 179, 8, 0.2)',
            color: '#facc15',
            fontSize: 11,
            fontWeight: 600,
          }}>
            <CloudOff size={11} />
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </>
  )
}
