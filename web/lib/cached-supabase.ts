/**
 * Cached Supabase Client
 * 
 * Drop-in wrapper around Supabase queries that:
 * 1. On READ (select): tries network first, falls back to IndexedDB cache
 * 2. On WRITE (insert/update/delete): tries network first, falls back to offline queue
 * 
 * Each page simply calls `cachedQuery()` or `cachedMutation()` instead of
 * direct supabase calls.
 */

import { createClient } from '@/lib/supabase/client'
import {
  setCacheData,
  getCacheData,
  addPendingMutation,
  clearTableCache,
} from '@/lib/offline-cache'

const supabase = createClient()

// Default max age for cache: 24 hours
const DEFAULT_MAX_AGE = 1000 * 60 * 60 * 24

// ============================================================
// Cached Read (SELECT)
// ============================================================

interface CachedQueryOptions {
  table: string
  select?: string
  filters?: Record<string, unknown>
  order?: { column: string; ascending?: boolean }
  limit?: number
  maxAge?: number
}

/**
 * Execute a Supabase SELECT with automatic cache.
 * - Online: fetches from network + updates cache
 * - Offline: returns cached data
 */
export async function cachedQuery<T = unknown[]>({
  table,
  select = '*',
  filters = {},
  order,
  limit,
  maxAge = DEFAULT_MAX_AGE,
}: CachedQueryOptions): Promise<{ data: T; fromCache: boolean }> {
  const queryDesc = { select, filters, order, limit }

  // Try network first
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      let query = supabase.from(table).select(select, { count: 'exact' })

      // Apply filters
      for (const [key, value] of Object.entries(filters)) {
        if (key.startsWith('eq:')) {
          query = query.eq(key.slice(3), value)
        } else if (key.startsWith('is:')) {
          query = query.is(key.slice(3), value)
        } else if (key.startsWith('gte:')) {
          query = query.gte(key.slice(4), value)
        } else if (key.startsWith('lte:')) {
          query = query.lte(key.slice(4), value)
        } else {
          query = query.eq(key, value)
        }
      }

      if (order) {
        query = query.order(order.column, { ascending: order.ascending ?? true })
      }
      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (!error && data) {
        // Update cache in background
        setCacheData(table, queryDesc, data).catch(() => {})
        return { data: data as T, fromCache: false }
      }
    } catch {
      // Network error — fall through to cache
    }
  }

  // Fallback to cache
  const cached = await getCacheData(table, queryDesc, maxAge)
  if (cached) {
    return { data: cached as T, fromCache: true }
  }

  // No cache available either — return empty
  return { data: [] as unknown as T, fromCache: true }
}

// ============================================================
// Cached Count Query
// ============================================================

interface CachedCountOptions {
  table: string
  filters?: Record<string, unknown>
}

/**
 * Execute a Supabase SELECT with count only.
 */
export async function cachedCount({
  table,
  filters = {},
}: CachedCountOptions): Promise<{ count: number; fromCache: boolean }> {
  const queryDesc = { count: true, filters }

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      let query = supabase.from(table).select('id', { count: 'exact', head: true })

      for (const [key, value] of Object.entries(filters)) {
        if (key.startsWith('eq:')) {
          query = query.eq(key.slice(3), value)
        } else if (key.startsWith('is:')) {
          query = query.is(key.slice(3), value)
        } else {
          query = query.eq(key, value)
        }
      }

      const { count, error } = await query
      
      if (!error && count !== null) {
        setCacheData(table, queryDesc, [{ count }]).catch(() => {})
        return { count, fromCache: false }
      }
    } catch {
      // Fall through to cache
    }
  }

  const cached = await getCacheData(table, queryDesc)
  if (cached && cached.length > 0) {
    return { count: (cached[0] as { count: number }).count, fromCache: true }
  }

  return { count: 0, fromCache: true }
}

// ============================================================
// Cached Mutation (INSERT / UPDATE / DELETE)
// ============================================================

interface MutationOptions {
  table: string
  operation: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
}

/**
 * Execute a mutation with offline fallback.
 * - Online: executes immediately on Supabase
 * - Offline: queues the mutation for later sync
 */
export async function cachedMutation({
  table,
  operation,
  payload,
}: MutationOptions): Promise<{ success: boolean; queued: boolean; error?: string }> {
  // Try online execution first
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      let result: { error: { message: string } | null } = { error: null }

      switch (operation) {
        case 'insert':
          result = await supabase.from(table).insert(payload)
          break
        case 'update': {
          const { id, ...updateData } = payload
          result = await supabase.from(table).update(updateData).eq('id', id)
          break
        }
        case 'delete':
          result = await supabase.from(table).delete().eq('id', payload.id)
          break
      }

      if (result.error) {
        return { success: false, queued: false, error: result.error.message }
      }

      // Invalidate cache for this table
      await clearTableCache(table)
      
      return { success: true, queued: false }
    } catch {
      // Network error — fall through to queue
    }
  }

  // Queue the mutation for later sync
  await addPendingMutation(table, operation, payload)
  
  // Notify connectivity context to update pending count
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ceres:mutation-queued'))
  }

  return { success: true, queued: true }
}

// ============================================================
// Cached RPC
// ============================================================

export async function cachedRPC<T = unknown[]>(
  rpcName: string,
  params: Record<string, unknown>,
  maxAge: number = DEFAULT_MAX_AGE
): Promise<{ data: T; fromCache: boolean }> {
  const queryDesc = { rpc: rpcName, params }

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const { data, error } = await supabase.rpc(rpcName, params)

      if (!error && data) {
        setCacheData(`rpc:${rpcName}`, queryDesc, data as unknown[]).catch(() => {})
        return { data: data as T, fromCache: false }
      }
    } catch {
      // Fall through to cache
    }
  }

  const cached = await getCacheData(`rpc:${rpcName}`, queryDesc, maxAge)
  if (cached) {
    return { data: cached as T, fromCache: true }
  }

  return { data: [] as unknown as T, fromCache: true }
}
