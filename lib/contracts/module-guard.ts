import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'
import type { Store } from '@/lib/supabase/types'
import { getTenantDemoStore } from '@/lib/tenants'

/**
 * Verifica no servidor se o módulo de contratos está habilitado para o tenant.
 * Avalia tanto a coluna `contracts_enabled` quanto `modules.contracts`.
 */
export async function isContractsEnabled(slug: string): Promise<boolean> {
  const normalizedSlug = (slug || '').trim().toLowerCase()
  if (!normalizedSlug) return false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('stores')
        .select('contracts_enabled, modules')
        .eq('slug', normalizedSlug)
        .maybeSingle()

      if (!error && data) {
        if (data.contracts_enabled === true) return true
        if (data.modules && typeof data.modules === 'object' && (data.modules as any).contracts === true) {
          return true
        }
      }
    } catch (err) {
      console.error('Erro ao verificar módulo de contratos no Supabase:', err)
    }
  }

  // Verifica estado no demo store (em memória/local)
  const demoStore = getTenantDemoStore(normalizedSlug)
  if (demoStore.contracts_enabled === true) return true
  if (demoStore.modules && (demoStore.modules as any).contracts === true) return true

  return false
}

/**
 * Obtém os dados de configuração de contratos da loja.
 */
export async function getStoreContractSettings(slug: string): Promise<{
  store: Store
  isModuleEnabled: boolean
}> {
  const normalizedSlug = (slug || '').trim().toLowerCase()
  let store: Store = getTenantDemoStore(normalizedSlug)

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', normalizedSlug)
        .maybeSingle()

      if (data) {
        store = { ...store, ...data }
      }
    } catch (err) {
      console.error('Erro ao buscar loja para contratos:', err)
    }
  }

  const enabled =
    store.contracts_enabled === true ||
    (store.modules && typeof store.modules === 'object' && (store.modules as any).contracts === true)

  return {
    store,
    isModuleEnabled: Boolean(enabled),
  }
}
