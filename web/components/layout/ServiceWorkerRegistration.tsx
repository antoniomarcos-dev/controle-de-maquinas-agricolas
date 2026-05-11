'use client'

import { useEffect } from 'react'

/**
 * Registers the custom Service Worker on mount.
 * Only activates in production or when explicitly enabled.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope)

        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Every hour
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err)
      })
  }, [])

  return null
}
