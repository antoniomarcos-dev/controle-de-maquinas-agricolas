/**
 * Offline Cache Layer using IndexedDB
 * 
 * Provides persistent local storage for Supabase data so the app
 * works entirely offline. Data is organized by table name with
 * timestamps for cache validation.
 */
import { openDB, DBSchema, IDBPDatabase } from 'idb'

// ============================================================
// Schema Definition
// ============================================================

interface CeresDB extends DBSchema {
  /** Cached data from Supabase tables */
  cache: {
    key: string          // Format: "table:queryHash"
    value: {
      key: string
      table: string
      data: unknown[]
      timestamp: number  // Date.now()
      queryHash: string
    }
    indexes: {
      'by-table': string
      'by-timestamp': number
    }
  }

  /** Queue of mutations made while offline */
  pending_mutations: {
    key: string          // UUID
    value: {
      id: string
      table: string
      operation: 'insert' | 'update' | 'delete' | 'rpc'
      payload: Record<string, unknown>
      rpcName?: string
      timestamp: number
      retries: number
    }
    indexes: {
      'by-timestamp': number
    }
  }
}

// ============================================================
// Database Initialization
// ============================================================

const DB_NAME = 'ceres-conecta-cache'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<CeresDB>> | null = null

function getDB(): Promise<IDBPDatabase<CeresDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available in SSR'))
  }

  if (!dbPromise) {
    dbPromise = openDB<CeresDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Cache store
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' })
          cacheStore.createIndex('by-table', 'table')
          cacheStore.createIndex('by-timestamp', 'timestamp')
        }

        // Pending mutations store
        if (!db.objectStoreNames.contains('pending_mutations')) {
          const mutStore = db.createObjectStore('pending_mutations', { keyPath: 'id' })
          mutStore.createIndex('by-timestamp', 'timestamp')
        }
      },
    })
  }

  return dbPromise
}

// ============================================================
// Cache Operations
// ============================================================

/** Generate a deterministic hash for a query */
function hashQuery(table: string, query: Record<string, unknown>): string {
  const sortedQuery = JSON.stringify(query, Object.keys(query).sort())
  return `${table}:${simpleHash(sortedQuery)}`
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // Convert to 32bit int
  }
  return Math.abs(hash).toString(36)
}

/** Cache query results */
export async function setCacheData(
  table: string,
  query: Record<string, unknown>,
  data: unknown[]
): Promise<void> {
  try {
    const db = await getDB()
    const key = hashQuery(table, query)
    await db.put('cache', {
      key,
      table,
      data,
      timestamp: Date.now(),
      queryHash: JSON.stringify(query),
    })
  } catch (err) {
    console.warn('[OfflineCache] Failed to cache data:', err)
  }
}

/** Retrieve cached data */
export async function getCacheData(
  table: string,
  query: Record<string, unknown>,
  maxAge?: number
): Promise<unknown[] | null> {
  try {
    const db = await getDB()
    const key = hashQuery(table, query)
    const entry = await db.get('cache', key)
    
    if (!entry) return null

    // Check if data is too old
    if (maxAge && Date.now() - entry.timestamp > maxAge) {
      return null
    }

    return entry.data
  } catch (err) {
    console.warn('[OfflineCache] Failed to read cache:', err)
    return null
  }
}

/** Clear cache for a specific table */
export async function clearTableCache(table: string): Promise<void> {
  try {
    const db = await getDB()
    const keys = await db.getAllKeysFromIndex('cache', 'by-table', table)
    const tx = db.transaction('cache', 'readwrite')
    await Promise.all(keys.map(key => tx.store.delete(key)))
    await tx.done
  } catch (err) {
    console.warn('[OfflineCache] Failed to clear table cache:', err)
  }
}

/** Clear all cached data */
export async function clearAllCache(): Promise<void> {
  try {
    const db = await getDB()
    await db.clear('cache')
  } catch (err) {
    console.warn('[OfflineCache] Failed to clear all cache:', err)
  }
}

// ============================================================
// Pending Mutations Queue
// ============================================================

/** Add a mutation to the offline queue */
export async function addPendingMutation(
  table: string,
  operation: 'insert' | 'update' | 'delete' | 'rpc',
  payload: Record<string, unknown>,
  rpcName?: string
): Promise<string> {
  const db = await getDB()
  const id = crypto.randomUUID()
  
  await db.put('pending_mutations', {
    id,
    table,
    operation,
    payload,
    rpcName,
    timestamp: Date.now(),
    retries: 0,
  })

  return id
}

/** Get all pending mutations (ordered by timestamp) */
export async function getPendingMutations() {
  try {
    const db = await getDB()
    return await db.getAllFromIndex('pending_mutations', 'by-timestamp')
  } catch (err) {
    console.warn('[OfflineCache] Failed to read pending mutations:', err)
    return []
  }
}

/** Get count of pending mutations */
export async function getPendingCount(): Promise<number> {
  try {
    const db = await getDB()
    return await db.count('pending_mutations')
  } catch (err) {
    return 0
  }
}

/** Remove a mutation from the queue (after successful sync) */
export async function removePendingMutation(id: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('pending_mutations', id)
  } catch (err) {
    console.warn('[OfflineCache] Failed to remove mutation:', err)
  }
}

/** Increment retry count for a failed mutation */
export async function incrementRetry(id: string): Promise<void> {
  try {
    const db = await getDB()
    const mutation = await db.get('pending_mutations', id)
    if (mutation) {
      mutation.retries += 1
      await db.put('pending_mutations', mutation)
    }
  } catch (err) {
    console.warn('[OfflineCache] Failed to increment retry:', err)
  }
}

/** Clear all pending mutations */
export async function clearAllPending(): Promise<void> {
  try {
    const db = await getDB()
    await db.clear('pending_mutations')
  } catch (err) {
    console.warn('[OfflineCache] Failed to clear pending mutations:', err)
  }
}
