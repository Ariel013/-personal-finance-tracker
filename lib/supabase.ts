import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { AppData, SupabaseConfig } from './types'

const SUPABASE_CONFIG_KEY = 'finance-tracker-supabase-config'

let supabaseClient: SupabaseClient | null = null

function getDeviceName(): string {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet/i.test(ua)) return 'tablet'
  return 'desktop'
}

export function getSupabaseConfig(): SupabaseConfig | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(SUPABASE_CONFIG_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SupabaseConfig
  } catch {
    return null
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config))
  supabaseClient = null
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_CONFIG_KEY)
  supabaseClient = null
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig()
  if (!config?.enabled || !config.url || !config.anonKey) return null

  if (!supabaseClient) {
    supabaseClient = createClient(config.url, config.anonKey)
  }
  return supabaseClient
}

export async function testConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, anonKey)
    const { error } = await client.from('app_data').select('id').limit(1)

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return { success: false, message: "La table 'app_data' n'existe pas. Executez le SQL dans votre projet Supabase." }
      }
      return { success: false, message: `Erreur: ${error.message}` }
    }
    return { success: true, message: 'Connexion reussie!' }
  } catch (err) {
    return { success: false, message: `Impossible de se connecter: ${err instanceof Error ? err.message : 'Erreur inconnue'}` }
  }
}

export interface CloudRow {
  data: AppData
  updated_at: string
  device: string
}

export async function fetchCloudData(): Promise<{ row: CloudRow | null; error: string | null }> {
  const client = getSupabaseClient()
  if (!client) return { row: null, error: 'Non connecte' }

  try {
    const { data, error } = await client
      .from('app_data')
      .select('data, updated_at, device')
      .eq('id', 'default')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { row: null, error: null }
      }
      return { row: null, error: error.message }
    }
    return { row: data as CloudRow, error: null }
  } catch (err) {
    return { row: null, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}

export async function saveCloudData(appData: AppData): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient()
  if (!client) return { success: false, error: 'Non connecte' }

  try {
    const { error } = await client
      .from('app_data')
      .upsert({
        id: 'default',
        data: appData,
        updated_at: new Date().toISOString(),
        device: getDeviceName()
      })

    if (error) return { success: false, error: error.message }
    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}
