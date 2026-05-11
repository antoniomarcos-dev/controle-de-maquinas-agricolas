/**
 * Sync Manager
 * 
 * Processes the offline mutation queue when the device comes
 * back online. Handles retries and conflict resolution.
 */
'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getPendingMutations,
  removePendingMutation,
  incrementRetry,
  clearTableCache,
} from '@/lib/offline-cache'
import { useConnectivity } from '@/lib/connectivity'

const MAX_RETRIES = 5

/**
 * Hook that automatically syncs pending mutations when online.
 * Should be mounted once at the app layout level.
 */
export function useSyncManager() {
  const { status, setStatus, refreshPendingCount } = useConnectivity()
  const syncing = useRef(false)
  const syncAll = useCallback(async () => {
    const supabase = createClient()
    if (syncing.current) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    syncing.current = true
    setStatus('syncing')

    try {
      const mutations = await getPendingMutations()
      
      if (mutations.length === 0) {
        setStatus('online')
        syncing.current = false
        return
      }

      console.log(`[SyncManager] Syncing ${mutations.length} pending mutations...`)
      const tablesChanged = new Set<string>()

      for (const mutation of mutations) {
        if (mutation.retries >= MAX_RETRIES) {
          console.warn(`[SyncManager] Skipping mutation ${mutation.id} — max retries reached`)
          continue
        }

        try {
          let result: { error: { message: string } | null } = { error: null }

          switch (mutation.operation) {
            case 'insert':
              result = await supabase.from(mutation.table).insert(mutation.payload)
              break
            case 'update': {
              const { id: rowId, ...updateData } = mutation.payload
              result = await supabase.from(mutation.table).update(updateData).eq('id', rowId)
              break
            }
            case 'delete':
              result = await supabase.from(mutation.table).delete().eq('id', mutation.payload.id)
              break
            case 'rpc':
              if (mutation.rpcName) {
                result = await supabase.rpc(mutation.rpcName, mutation.payload)
              }
              break
          }

          if (result.error) {
            console.error(`[SyncManager] Error syncing mutation ${mutation.id}:`, result.error.message)
            await incrementRetry(mutation.id)
          } else {
            console.log(`[SyncManager] ✓ Synced: ${mutation.operation} on ${mutation.table}`)
            await removePendingMutation(mutation.id)
            tablesChanged.add(mutation.table)
          }
        } catch (err) {
          console.error(`[SyncManager] Network error on mutation ${mutation.id}:`, err)
          await incrementRetry(mutation.id)
        }
      }

      // Invalidate cache for changed tables so the UI refreshes with server data
      for (const table of tablesChanged) {
        await clearTableCache(table)
      }

      // Notify UI to refresh
      if (tablesChanged.size > 0) {
        window.dispatchEvent(new CustomEvent('ceres:data-synced', {
          detail: { tables: Array.from(tablesChanged) }
        }))
      }

      await refreshPendingCount()
      setStatus('online')
    } catch (err) {
      console.error('[SyncManager] Sync failed:', err)
      setStatus('online')
    } finally {
      syncing.current = false
    }
  }, [setStatus, refreshPendingCount])

  useEffect(() => {
    // Listen for sync requests (triggered when coming back online)
    const handleSyncRequest = () => {
      syncAll()
    }

    window.addEventListener('ceres:sync-requested', handleSyncRequest)

    // Auto-sync on mount
    syncAll()

    // Periodic sync attempt every 30 seconds
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncAll()
      }
    }, 30000)

    return () => {
      window.removeEventListener('ceres:sync-requested', handleSyncRequest)
      clearInterval(interval)
    }
  }, [syncAll])

  return { syncAll }
}
