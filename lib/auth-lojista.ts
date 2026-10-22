import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantBrand } from '@/lib/tenants'
import { cookies } from 'next/headers'

export interface StoreUser {
  id: string
  email: string
  username?: string | null
  password_hash: string
  name?: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at?: string | null
}

export interface StoreUserMembership {
  id: string
  user_id: string
  tenant_id: string
  is_default?: boolean
  created_at: string
}

export interface UserStoreOption {
  tenant_id: string
  name: string
  logo_url?: string | null
}

export interface CentralLoginResult {
  success: boolean
  error?: string
  isSuperAdmin?: boolean
  user?: {
    id: string
    email: string
    name?: string | null
  }
  stores?: UserStoreOption[]
  redirectTo?: string
}

// ============================================================
// HASHING SEGURO (BCRYPT)
// ============================================================
export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plain, salt)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// ============================================================
// FALLBACK STATE (PERSISTÊNCIA RESILIENTE)
// ============================================================
const SYSTEM_STATE_SLUG = '__erp_system_state__'

function isMissingTableError(error: any): boolean {
  if (!error) return false
  const code = String(error.code || '')
  const msg = String(error.message || '')
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('Could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  )
}

async function getFallbackState(): Promise<any> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('stores').select('slogan').eq('slug', SYSTEM_STATE_SLUG).maybeSingle()
  if (data?.slogan) {
    try {
      return JSON.parse(data.slogan)
    } catch {}
  }
  return { store_users: [], store_user_memberships: [] }
}

async function saveFallbackState(state: any): Promise<void> {
  const supabase = createAdminClient()
  const serialized = JSON.stringify(state)
  const { data: existing } = await supabase.from('stores').select('id').eq('slug', SYSTEM_STATE_SLUG).maybeSingle()
  if (existing?.id) {
    await supabase.from('stores').update({ slogan: serialized }).eq('id', existing.id)
  } else {
    await supabase.from('stores').insert({
      name: 'ERP System State',
      slug: SYSTEM_STATE_SLUG,
      slogan: serialized,
    })
  }
}

// ============================================================
// RESOLUÇÃO DE DADOS DE LOJA / TENANT
// ============================================================
async function resolveStoreInfo(tenant_id: string): Promise<UserStoreOption> {
  const brand = getTenantBrand(tenant_id)
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('stores')
      .select('name, logo_url')
      .eq('slug', tenant_id)
      .maybeSingle()

    return {
      tenant_id,
      name: data?.name || brand.name,
      logo_url: data?.logo_url || brand.logo.header,
    }
  } catch {
    return {
      tenant_id,
      name: brand.name,
      logo_url: brand.logo.header,
    }
  }
}

// ============================================================
// AUTENTICAÇÃO CENTRALIZADA
// ============================================================
export async function authenticateLojista(
  identifierRaw: string,
  passwordRaw: string
): Promise<CentralLoginResult> {
  const identifier = identifierRaw.trim().toLowerCase()
  const password = passwordRaw.trim()

  if (!identifier || !password) {
    return { success: false, error: 'Informe seu usuário ou e-mail e sua senha.' }
  }

  // 0. Super Admin da plataforma
  const superAdminUser = (process.env.ADMIN_USER || 'gabriel').trim().toLowerCase()
  const superAdminPass = (process.env.ADMIN_PASS || 'kaique').trim()

  if (identifier === superAdminUser && password === superAdminPass) {
    return {
      success: true,
      isSuperAdmin: true,
      user: { id: 'super-admin', email: `${superAdminUser}@vendazap.com`, name: 'Super Admin' },
      redirectTo: '/admin',
    }
  }

  const supabase = createAdminClient()

  // 1. Tenta buscar usuário cadastrado no banco
  try {
    const { data: users, error: userError } = await supabase
      .from('store_users')
      .select('*')
      .or(`email.ilike.${identifier},username.ilike.${identifier}`)
      .limit(1)

    if (!userError && users && users.length > 0) {
      const user = users[0] as StoreUser

      if (user.is_active === false) {
        return {
          success: false,
          error: 'Esta conta de lojista está inativa. Entre em contato com o suporte da plataforma.',
        }
      }

      const isMatch = await verifyPassword(password, user.password_hash)
      if (!isMatch) {
        return { success: false, error: 'Usuário ou senha incorretos.' }
      }

      // Atualiza data do último login
      const now = new Date().toISOString()
      await supabase
        .from('store_users')
        .update({ last_login_at: now, updated_at: now })
        .eq('id', user.id)

      // Busca lojas vinculadas
      const { data: memberships } = await supabase
        .from('store_user_memberships')
        .select('*')
        .eq('user_id', user.id)

      const storeOptions: UserStoreOption[] = []
      for (const m of memberships || []) {
        storeOptions.push(await resolveStoreInfo(m.tenant_id))
      }

      if (storeOptions.length === 0) {
        return {
          success: false,
          error: 'Nenhuma loja ativa está vinculada ao seu usuário. Entre em contato com o suporte.',
        }
      }

      if (storeOptions.length === 1) {
        return {
          success: true,
          user: { id: user.id, email: user.email, name: user.name },
          stores: storeOptions,
          redirectTo: `/${storeOptions[0].tenant_id}/admin`,
        }
      }

      return {
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
        stores: storeOptions,
      }
    }
  } catch (err: any) {
    if (!isMissingTableError(err)) {
      console.warn('[AUTH CENTRAL] Erro ao buscar store_users:', err?.message)
    }
  }

  // 2. Se não encontrou no banco, checa fallback local no sistema
  try {
    const state = await getFallbackState()
    const fallbackUser = (state.store_users || []).find(
      (u: any) =>
        (u.email && u.email.toLowerCase() === identifier) ||
        (u.username && u.username.toLowerCase() === identifier)
    )

    if (fallbackUser) {
      if (fallbackUser.is_active === false) {
        return {
          success: false,
          error: 'Esta conta de lojista está inativa. Entre em contato com o suporte da plataforma.',
        }
      }

      const isMatch = await verifyPassword(password, fallbackUser.password_hash)
      if (!isMatch) {
        return { success: false, error: 'Usuário ou senha incorretos.' }
      }

      const memberships = (state.store_user_memberships || []).filter(
        (m: any) => m.user_id === fallbackUser.id
      )
      const storeOptions: UserStoreOption[] = []
      for (const m of memberships) {
        storeOptions.push(await resolveStoreInfo(m.tenant_id))
      }

      if (storeOptions.length === 0) {
        return {
          success: false,
          error: 'Nenhuma loja ativa está vinculada ao seu usuário. Entre em contato com o suporte.',
        }
      }

      if (storeOptions.length === 1) {
        return {
          success: true,
          user: { id: fallbackUser.id, email: fallbackUser.email, name: fallbackUser.name },
          stores: storeOptions,
          redirectTo: `/${storeOptions[0].tenant_id}/admin`,
        }
      }

      return {
        success: true,
        user: { id: fallbackUser.id, email: fallbackUser.email, name: fallbackUser.name },
        stores: storeOptions,
      }
    }
  } catch {}

  // 3. Migração automática no primeiro login das credenciais legadas em variáveis de ambiente
  // A) Tenant: L&L Multimarcas
  const llUser = (process.env.LL_ADMIN_USER || 'admin').trim().toLowerCase()
  const llPass = (process.env.LL_ADMIN_PASS || 'llmultimarcas').trim()
  const llEmail = 'admin@llmultimarcas.com.br'

  if ((identifier === llUser || identifier === llEmail) && password === llPass) {
    const migratedTenant = 'll-multimarcas'
    await migrateLegacyLojistaToBcrypt({
      email: llEmail,
      username: llUser,
      password: llPass,
      name: 'L&L Multimarcas Admin',
      tenant_id: migratedTenant,
    })

    const storeInfo = await resolveStoreInfo(migratedTenant)
    return {
      success: true,
      user: { id: 'migrated-ll', email: llEmail, name: 'L&L Multimarcas Admin' },
      stores: [storeInfo],
      redirectTo: `/${migratedTenant}/admin`,
    }
  }

  // B) Tenant: Milhaticar
  const milhatiUser = (process.env.CAR_ADMIN_USER || 'julia').trim().toLowerCase()
  const milhatiPass = (process.env.CAR_ADMIN_PASS || 'milhati').trim()
  const milhatiEmail = 'julia@milhaticar.com.br'

  if ((identifier === milhatiUser || identifier === milhatiEmail) && password === milhatiPass) {
    const migratedTenant = 'milhaticar'
    await migrateLegacyLojistaToBcrypt({
      email: milhatiEmail,
      username: milhatiUser,
      password: milhatiPass,
      name: 'Milhaticar Admin',
      tenant_id: migratedTenant,
    })

    const storeInfo = await resolveStoreInfo(migratedTenant)
    return {
      success: true,
      user: { id: 'migrated-milhati', email: milhatiEmail, name: 'Milhaticar Admin' },
      stores: [storeInfo],
      redirectTo: `/${migratedTenant}/admin`,
    }
  }

  return { success: false, error: 'Usuário ou senha incorretos. Verifique os dados digitados.' }
}

// ============================================================
// MIGRAÇÃO AUTOMÁTICA PARA BCRYPT NO BANCO
// ============================================================
async function migrateLegacyLojistaToBcrypt(input: {
  email: string
  username: string
  password: string
  name: string
  tenant_id: string
}): Promise<void> {
  const passwordHash = await hashPassword(input.password)
  const now = new Date().toISOString()
  const supabase = createAdminClient()

  try {
    const { data: newUser, error: insertUserError } = await supabase
      .from('store_users')
      .upsert(
        {
          email: input.email.toLowerCase(),
          username: input.username.toLowerCase(),
          password_hash: passwordHash,
          name: input.name,
          role: 'admin',
          is_active: true,
          last_login_at: now,
          updated_at: now,
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single()

    if (!insertUserError && newUser) {
      await supabase.from('store_user_memberships').upsert(
        {
          user_id: newUser.id,
          tenant_id: input.tenant_id,
          is_default: true,
        },
        { onConflict: 'user_id,tenant_id' }
      )
      return
    }
  } catch (err: any) {
    if (!isMissingTableError(err)) {
      console.warn('[AUTH CENTRAL] Erro ao gravar store_users no banco remoto:', err?.message)
    }
  }

  // Grava no fallback state se tabelas remotas não existirem
  try {
    const state = await getFallbackState()
    const userId = crypto.randomUUID()
    const newUser: StoreUser = {
      id: userId,
      email: input.email.toLowerCase(),
      username: input.username.toLowerCase(),
      password_hash: passwordHash,
      name: input.name,
      role: 'admin',
      is_active: true,
      created_at: now,
      updated_at: now,
      last_login_at: now,
    }

    const newMembership: StoreUserMembership = {
      id: crypto.randomUUID(),
      user_id: userId,
      tenant_id: input.tenant_id,
      is_default: true,
      created_at: now,
    }

    state.store_users = [newUser, ...(state.store_users || []).filter((u: any) => u.email !== input.email)]
    state.store_user_memberships = [
      newMembership,
      ...(state.store_user_memberships || []).filter((m: any) => !(m.user_id === userId && m.tenant_id === input.tenant_id)),
    ]

    await saveFallbackState(state)
  } catch (err) {
    console.error('[AUTH CENTRAL] Falha ao salvar migração em fallback:', err)
  }
}

// ============================================================
// COOKIE DE SESSÃO COM ISOLAMENTO POR TENANT
// ============================================================
export async function setLojistaSessionCookie(tenant_id: string): Promise<void> {
  const cookieStore = await cookies()
  const normalized = tenant_id.trim().toLowerCase()

  // Seta a autenticação para este tenant específico
  cookieStore.set(`admin_auth_${normalized}`, 'true', {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  })

  // Se for milhaticar, mantém compatibilidade com os slugs de exemplo
  if (normalized === 'milhaticar') {
    cookieStore.set('admin_auth_loja-exemplo', 'true', { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 24 * 7 })
    cookieStore.set('admin_auth', 'true', { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 24 * 7 })
    cookieStore.set('admin_auth_ll-multimarcas', '', { path: '/', maxAge: 0 })
  } else if (normalized === 'll-multimarcas') {
    cookieStore.set('admin_auth_milhaticar', '', { path: '/', maxAge: 0 })
    cookieStore.set('admin_auth_loja-exemplo', '', { path: '/', maxAge: 0 })
    cookieStore.set('admin_auth', '', { path: '/', maxAge: 0 })
  }
}
