'use client'

import { useSyncManager } from '@/lib/sync-manager'

/**
 * Invisible component that mounts the sync manager hook.
 * Must be rendered inside ConnectivityProvider.
 */
export default function SyncManagerProvider() {
  useSyncManager()
  return null
}
