'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { AppData } from '@/lib/types'
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testConnection,
  fetchCloudData,
  saveCloudData,
  type CloudRow
} from '@/lib/supabase'

const LAST_SYNC_KEY = 'finance-tracker-last-sync'
const LOCAL_BACKUP_KEY = 'finance-tracker-backup-before-pull'

export function useSupabaseSync() {
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pushDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const saved = getSupabaseConfig()
    if (saved?.enabled) {
      setIsConnected(true)
    }
    const savedSync = localStorage.getItem(LAST_SYNC_KEY)
    if (savedSync) setLastSyncAt(savedSync)
  }, [])

  const updateLastSync = useCallback(() => {
    const now = new Date().toISOString()
    setLastSyncAt(now)
    localStorage.setItem(LAST_SYNC_KEY, now)
  }, [])

  const connect = useCallback(async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
    setError(null)
    setIsSyncing(true)

    const result = await testConnection(url, anonKey)
    if (!result.success) {
      setIsSyncing(false)
      setError(result.message)
      return result
    }

    saveSupabaseConfig({ url, anonKey, enabled: true })
    setIsConnected(true)
    setIsSyncing(false)
    return result
  }, [])

  const disconnect = useCallback(() => {
    clearSupabaseConfig()
    setIsConnected(false)
    setLastSyncAt(null)
    setError(null)
    localStorage.removeItem(LAST_SYNC_KEY)
    localStorage.removeItem(LOCAL_BACKUP_KEY)
  }, [])

  // Push local data to cloud (local is always saved first)
  const pushToCloud = useCallback(async (data: AppData): Promise<boolean> => {
    if (!isConnected) return false
    setError(null)

    const result = await saveCloudData(data)
    if (result.success) {
      updateLastSync()
    } else {
      setError(result.error)
    }
    return result.success
  }, [isConnected, updateLastSync])

  // Pull from cloud with safety: backup local first, check timestamps
  const pullFromCloud = useCallback(async (localData: AppData): Promise<{
    cloudData: AppData | null
    hadConflict: boolean
    cloudDevice: string | null
    cloudUpdatedAt: string | null
  }> => {
    if (!isConnected) return { cloudData: null, hadConflict: false, cloudDevice: null, cloudUpdatedAt: null }
    setError(null)

    const result = await fetchCloudData()
    if (result.error) {
      setError(result.error)
      return { cloudData: null, hadConflict: false, cloudDevice: null, cloudUpdatedAt: null }
    }

    if (!result.row) {
      // No cloud data yet — nothing to pull
      return { cloudData: null, hadConflict: false, cloudDevice: null, cloudUpdatedAt: null }
    }

    const cloudRow: CloudRow = result.row

    // Always backup local data before any potential overwrite
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(localData))

    // Check if there are significant differences
    const localCount = (localData.expenses?.length || 0) + (localData.incomes?.length || 0) + (localData.loans?.length || 0)
    const cloudCount = (cloudRow.data.expenses?.length || 0) + (cloudRow.data.incomes?.length || 0) + (cloudRow.data.loans?.length || 0)
    const hadConflict = Math.abs(localCount - cloudCount) > 5

    updateLastSync()
    return {
      cloudData: cloudRow.data,
      hadConflict,
      cloudDevice: cloudRow.device,
      cloudUpdatedAt: cloudRow.updated_at
    }
  }, [isConnected, updateLastSync])

  // Debounced push — local is already saved, this pushes to cloud in background
  const debouncedPush = useCallback((data: AppData) => {
    if (!isConnected) return
    if (pushDebounceRef.current) clearTimeout(pushDebounceRef.current)
    pushDebounceRef.current = setTimeout(async () => {
      const result = await saveCloudData(data)
      if (result.success) {
        updateLastSync()
      } else {
        setError(result.error)
      }
    }, 1500)
  }, [isConnected, updateLastSync])

  // Explicit full sync: push local to cloud
  const syncNow = useCallback(async (localData: AppData): Promise<{ success: boolean; message: string }> => {
    if (!isConnected) return { success: false, message: 'Non connecte a Supabase' }
    setIsSyncing(true)
    setError(null)

    try {
      const result = await saveCloudData(localData)
      if (result.success) {
        updateLastSync()
        setIsSyncing(false)
        return { success: true, message: 'Donnees envoyees vers le cloud!' }
      }
      setError(result.error)
      setIsSyncing(false)
      return { success: false, message: result.error || 'Erreur de synchronisation' }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(msg)
      setIsSyncing(false)
      return { success: false, message: msg }
    }
  }, [isConnected, updateLastSync])

  // Restore local backup if user regrets a pull
  const restoreBackup = useCallback((): AppData | null => {
    const backup = localStorage.getItem(LOCAL_BACKUP_KEY)
    if (!backup) return null
    try {
      return JSON.parse(backup) as AppData
    } catch {
      return null
    }
  }, [])

  return {
    isConnected,
    isSyncing,
    lastSyncAt,
    error,
    connect,
    disconnect,
    pushToCloud,
    pullFromCloud,
    debouncedPush,
    syncNow,
    restoreBackup,
  }
}
