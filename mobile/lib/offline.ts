import AsyncStorage from '@react-native-async-storage/async-storage'
import uuid from 'react-native-uuid'

const QUEUE_KEY = '@offline_queue'

export interface OfflineEvent {
  id: string
  type: 'journey_start' | 'journey_finish' | 'service_start' | 'service_finish' | 'photo'
  payload: Record<string, unknown>
  timestamp: string
  synced: boolean
}

export async function addToQueue(type: OfflineEvent['type'], payload: Record<string, unknown>): Promise<OfflineEvent> {
  const event: OfflineEvent = {
    id: uuid.v4() as string,
    type,
    payload,
    timestamp: new Date().toISOString(),
    synced: false,
  }

  const existing = await getQueue()
  existing.push(event)
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existing))
  return event
}

export async function getQueue(): Promise<OfflineEvent[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function getPendingCount(): Promise<number> {
  const queue = await getQueue()
  return queue.filter(e => !e.synced).length
}

export async function markSynced(eventId: string): Promise<void> {
  const queue = await getQueue()
  const updated = queue.map(e => e.id === eventId ? { ...e, synced: true } : e)
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated))
}

export async function clearSynced(): Promise<void> {
  const queue = await getQueue()
  const pending = queue.filter(e => !e.synced)
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pending))
}
