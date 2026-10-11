import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase com SERVICE ROLE KEY.
 * - Ignora RLS (o admin usa login por cookie, não Supabase Auth).
 * - NUNCA importar em componentes client. Apenas em API routes / server.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return !!url && !url.includes('placeholder')
}

export function createAdminClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Verifica se a requisição vem de um admin logado (cookie definido no login). */
export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get('admin_auth')?.value === 'true'
}

const DEFAULT_STORE = {
  name: 'Milhaticar',
  slogan: 'Certeza de bons negócios',
  whatsapp: '5511994942661',
  address: 'Av. Gov. Adhemar de Barros, 2618 – Braz Cubas – Mogi das Cruzes/SP',
  logo_url: '/logo-milhaticar.png',
}

/**
 * Retorna o UUID da loja a partir do slug da URL.
 * Se a loja ainda não existir no banco, cria automaticamente.
 */
export async function resolveStoreId(supabase: SupabaseClient, slug: string): Promise<string> {
  if (!slug) throw new Error('slug da loja é obrigatório')

  const { data: existing, error: findError } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (findError) throw new Error(`Erro ao buscar loja: ${findError.message}`)
  if (existing?.id) return existing.id

  const { data: created, error: createError } = await supabase
    .from('stores')
    .insert([{ slug, ...DEFAULT_STORE }])
    .select('id')
    .single()

  if (createError) {
    throw new Error(
      `Loja "${slug}" não existe e não pôde ser criada: ${createError.message}. ` +
        'Rode a migration supabase/migrations/005_admin_service_role.sql no SQL Editor.'
    )
  }
  return created.id
}
