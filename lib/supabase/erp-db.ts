import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export type PlanoTipo = 'basico' | 'medio' | 'premium' | 'trial'
export type ClientePlano = PlanoTipo
export type ClienteStatus = 'ativo' | 'inativo' | 'trial'
export type FaturaStatus = 'pago' | 'atrasado' | 'pendente' | 'trial'
export type LogTipo = 'login' | 'cadastro' | 'edicao' | 'exclusao' | 'erro' | 'sistema'
export type LogCriticidade = 'normal' | 'critico'
export type MelhoriaTipo = 'urgente' | 'feature' | 'bug' | 'analise'
export type ErpCliente = ClienteRow
export type ErpFatura = FaturaRow
export type ErpLogAuditoria = LogAuditoriaRow
export type ErpMelhoria = MelhoriaRow

export interface ClienteRow {
  id: string
  nome_loja: string
  email: string
  cnpj: string | null
  plano: PlanoTipo
  status: ClienteStatus
  uso_banco_mb: number
  data_vencimento: string
  created_at: string
}

export interface FaturaRow {
  id: string
  cliente_id: string
  valor: number
  status: FaturaStatus
  vencimento: string
  pago_em: string | null
  created_at: string
  clientes?: {
    nome_loja: string
    email: string
    plano: PlanoTipo
    status: ClienteStatus
  } | null
}

export interface LogAuditoriaRow {
  id: string
  tipo: LogTipo
  criticidade: LogCriticidade
  descricao: string
  ator: string | null
  ip: string | null
  created_at: string
}

export interface ConfiguracoesRow {
  id: number
  nome_plataforma: string
  email_suporte: string | null
  whatsapp_suporte: string
  dias_trial: number
  limite_carros_starter: number
  limite_carros_premium: number
  limite_carros_enterprise: number
  emails_cobranca_ativo: boolean
}

export interface MelhoriaRow {
  id: string
  tipo: MelhoriaTipo
  titulo: string
  descricao: string | null
  created_at: string
}

export const PLAN_VALUES: Record<PlanoTipo, number> = {
  basico: 49,
  medio: 99,
  premium: 199,
  trial: 0,
}

const DEFAULT_CONFIG: ConfiguracoesRow = {
  id: 1,
  nome_plataforma: 'VendaZap',
  email_suporte: 'suporte@vendazap.com',
  whatsapp_suporte: '5511993270543',
  dias_trial: 7,
  limite_carros_starter: 20,
  limite_carros_premium: 40,
  limite_carros_enterprise: 100,
  emails_cobranca_ativo: true,
}

interface FallbackState {
  clientes: ClienteRow[]
  faturas: FaturaRow[]
  logs_auditoria: LogAuditoriaRow[]
  configuracoes: ConfiguracoesRow
  melhorias: MelhoriaRow[]
  notifiedInvoiceIds?: string[]
}

const SYSTEM_STATE_SLUG = '__erp_system_state__'

function isMissingTableError(error: any): boolean {
  if (!error) return false
  const code = String(error.code || '')
  const msg = String(error.message || '')
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('Could not find the table') ||
    msg.includes('relation') && msg.includes('does not exist')
  )
}

async function getFallbackState(): Promise<FallbackState> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('stores')
    .select('slogan')
    .eq('slug', SYSTEM_STATE_SLUG)
    .maybeSingle()

  if (data?.slogan) {
    try {
      const parsed = JSON.parse(data.slogan) as FallbackState
      return {
        clientes: parsed.clientes || [],
        faturas: parsed.faturas || [],
        logs_auditoria: parsed.logs_auditoria || [],
        configuracoes: { ...DEFAULT_CONFIG, ...(parsed.configuracoes || {}) },
        melhorias: parsed.melhorias || [],
        notifiedInvoiceIds: parsed.notifiedInvoiceIds || [],
      }
    } catch {
      // ignore parse error
    }
  }

  return {
    clientes: [],
    faturas: [],
    logs_auditoria: [],
    configuracoes: { ...DEFAULT_CONFIG },
    melhorias: [],
    notifiedInvoiceIds: [],
  }
}

async function saveFallbackState(state: FallbackState): Promise<void> {
  const supabase = createAdminClient()
  const payload = JSON.stringify(state)
  const { data: existing } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', SYSTEM_STATE_SLUG)
    .maybeSingle()

  if (existing?.id) {
    await supabase
      .from('stores')
      .update({ slogan: payload })
      .eq('id', existing.id)
  } else {
    await supabase.from('stores').insert([
      {
        slug: SYSTEM_STATE_SLUG,
        name: 'ERP System State',
        whatsapp: '5511993270543',
        slogan: payload,
      },
    ])
  }
}

function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0]
}

// ============================================================
// LOGS DE AUDITORIA
// ============================================================

export async function insertAuditLog(params: {
  tipo: LogTipo
  criticidade?: LogCriticidade
  descricao: string
  ator?: string | null
  ip?: string | null
}): Promise<LogAuditoriaRow> {
  const supabase = createAdminClient()
  const entry = {
    tipo: params.tipo,
    criticidade: params.criticidade || 'normal',
    descricao: params.descricao,
    ator: params.ator || 'Super Admin',
    ip: params.ip || '127.0.0.1',
  }

  const { data, error } = await supabase
    .from('logs_auditoria')
    .insert([entry])
    .select()
    .single()

  if (!error && data) {
    return data as LogAuditoriaRow
  }

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    const newRow: LogAuditoriaRow = {
      id: crypto.randomUUID(),
      ...entry,
      created_at: new Date().toISOString(),
    }
    state.logs_auditoria = [newRow, ...state.logs_auditoria]
    await saveFallbackState(state)
    return newRow
  }

  throw new Error(error?.message || 'Erro ao inserir log de auditoria')
}

export async function listAuditLogs(filters?: {
  tipo?: string
  q?: string
  limit?: number
}): Promise<{
  logs: LogAuditoriaRow[]
  counts: { total: number; login: number; erro: number; critico: number }
}> {
  const supabase = createAdminClient()

  let query = supabase
    .from('logs_auditoria')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.tipo && filters.tipo !== 'todos') {
    query = query.eq('tipo', filters.tipo)
  }
  if (filters?.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`
    query = query.or(`descricao.ilike.${term},ator.ilike.${term}`)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (!error && data) {
    // Also fetch counts across all logs
    const { data: allLogs } = await supabase
      .from('logs_auditoria')
      .select('tipo, criticidade')

    const list = allLogs || []
    return {
      logs: data as LogAuditoriaRow[],
      counts: {
        total: list.length,
        login: list.filter((l) => l.tipo === 'login').length,
        erro: list.filter((l) => l.tipo === 'erro').length,
        critico: list.filter((l) => l.criticidade === 'critico').length,
      },
    }
  }

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    const all = [...state.logs_auditoria].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    let filtered = all
    if (filters?.tipo && filters.tipo !== 'todos') {
      filtered = filtered.filter((l) => l.tipo === filters.tipo)
    }
    if (filters?.q && filters.q.trim()) {
      const q = filters.q.trim().toLowerCase()
      filtered = filtered.filter(
        (l) =>
          l.descricao.toLowerCase().includes(q) ||
          (l.ator || '').toLowerCase().includes(q)
      )
    }
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return {
      logs: filtered,
      counts: {
        total: all.length,
        login: all.filter((l) => l.tipo === 'login').length,
        erro: all.filter((l) => l.tipo === 'erro').length,
        critico: all.filter((l) => l.criticidade === 'critico').length,
      },
    }
  }

  throw new Error(error?.message || 'Erro ao buscar logs de auditoria')
}

// ============================================================
// CLIENTES
// ============================================================

export async function listClientes(filters?: {
  q?: string
  status?: string
  plano?: string
}): Promise<ClienteRow[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'todos') {
    query = query.eq('status', filters.status)
  }
  if (filters?.plano && filters.plano !== 'todos') {
    query = query.eq('plano', filters.plano)
  }
  if (filters?.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`
    query = query.or(`nome_loja.ilike.${term},email.ilike.${term},cnpj.ilike.${term}`)
  }

  const { data, error } = await query

  if (!error && data) {
    return data as ClienteRow[]
  }

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    let list = [...state.clientes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    if (filters?.status && filters.status !== 'todos') {
      list = list.filter((c) => c.status === filters.status)
    }
    if (filters?.plano && filters.plano !== 'todos') {
      list = list.filter((c) => c.plano === filters.plano)
    }
    if (filters?.q && filters.q.trim()) {
      const q = filters.q.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.nome_loja.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.cnpj || '').toLowerCase().includes(q)
      )
    }
    return list
  }

  throw new Error(error?.message || 'Erro ao listar clientes')
}

export async function createCliente(
  input: {
    nome_loja: string
    email: string
    cnpj?: string | null
    plano: PlanoTipo
    status?: ClienteStatus
    uso_banco_mb?: number
    data_vencimento: string
  },
  ip?: string | null
): Promise<ClienteRow> {
  const supabase = createAdminClient()
  const status: ClienteStatus = input.status || (input.plano === 'trial' ? 'trial' : 'ativo')
  const valorFatura = PLAN_VALUES[input.plano] ?? 49
  const statusFatura: FaturaStatus = input.plano === 'trial' ? 'trial' : 'pendente'

  const { data: created, error } = await supabase
    .from('clientes')
    .insert([
      {
        nome_loja: input.nome_loja,
        email: input.email,
        cnpj: input.cnpj || null,
        plano: input.plano,
        status,
        uso_banco_mb: input.uso_banco_mb ?? 0,
        data_vencimento: input.data_vencimento,
      },
    ])
    .select()
    .single()

  if (!error && created) {
    // Cria automaticamente a primeira fatura em faturas
    await supabase.from('faturas').insert([
      {
        cliente_id: created.id,
        valor: valorFatura,
        status: statusFatura,
        vencimento: input.data_vencimento,
      },
    ])

    await insertAuditLog({
      tipo: 'cadastro',
      descricao: `Novo cliente "${input.nome_loja}" cadastrado no plano ${input.plano.toUpperCase()}.`,
      ator: 'gabriel',
      ip,
    })

    return created as ClienteRow
  }

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    const now = new Date().toISOString()
    const newClient: ClienteRow = {
      id: crypto.randomUUID(),
      nome_loja: input.nome_loja,
      email: input.email,
      cnpj: input.cnpj || null,
      plano: input.plano,
      status,
      uso_banco_mb: input.uso_banco_mb ?? 0,
      data_vencimento: input.data_vencimento,
      created_at: now,
    }
    const newFatura: FaturaRow = {
      id: crypto.randomUUID(),
      cliente_id: newClient.id,
      valor: valorFatura,
      status: statusFatura,
      vencimento: input.data_vencimento,
      pago_em: null,
      created_at: now,
    }
    const newLog: LogAuditoriaRow = {
      id: crypto.randomUUID(),
      tipo: 'cadastro',
      criticidade: 'normal',
      descricao: `Novo cliente "${input.nome_loja}" cadastrado no plano ${input.plano.toUpperCase()}.`,
      ator: 'gabriel',
      ip: ip || '127.0.0.1',
      created_at: now,
    }
    state.clientes = [newClient, ...state.clientes]
    state.faturas = [newFatura, ...state.faturas]
    state.logs_auditoria = [newLog, ...state.logs_auditoria]
    await saveFallbackState(state)
    return newClient
  }

  throw new Error(error?.message || 'Erro ao criar cliente')
}

export async function updateCliente(
  id: string,
  updates: Partial<{
    nome_loja: string
    email: string
    cnpj: string | null
    plano: PlanoTipo
    status: ClienteStatus
    uso_banco_mb: number
    data_vencimento: string
  }>,
  ip?: string | null
): Promise<ClienteRow> {
  const supabase = createAdminClient()

  const { data: before } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const { data: updated, error } = await supabase
    .from('clientes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (!error && updated) {
    const changes: string[] = []
    if (updates.plano && updates.plano !== before?.plano) {
      changes.push(`plano alterado para ${updates.plano.toUpperCase()}`)
    }
    if (updates.status && updates.status !== before?.status) {
      changes.push(`status alterado para ${updates.status.toUpperCase()}`)
    }
    if (updates.nome_loja && updates.nome_loja !== before?.nome_loja) {
      changes.push(`nome alterado para "${updates.nome_loja}"`)
    }
    const desc =
      changes.length > 0
        ? `Cliente "${updated.nome_loja}": ${changes.join(', ')}.`
        : `Dados do cliente "${updated.nome_loja}" atualizados.`

    await insertAuditLog({
      tipo: 'edicao',
      descricao: desc,
      ator: 'gabriel',
      ip,
    })

    return updated as ClienteRow
  }

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    const idx = state.clientes.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Cliente não encontrado')

    const prev = state.clientes[idx]
    const next: ClienteRow = { ...prev, ...updates }
    state.clientes[idx] = next

    const changes: string[] = []
    if (updates.plano && updates.plano !== prev.plano) {
      changes.push(`plano alterado para ${updates.plano.toUpperCase()}`)
    }
    if (updates.status && updates.status !== prev.status) {
      changes.push(`status alterado para ${updates.status.toUpperCase()}`)
    }
    const desc =
      changes.length > 0
        ? `Cliente "${next.nome_loja}": ${changes.join(', ')}.`
        : `Dados do cliente "${next.nome_loja}" atualizados.`

    state.logs_auditoria = [
      {
        id: crypto.randomUUID(),
        tipo: 'edicao',
        criticidade: 'normal',
        descricao: desc,
        ator: 'gabriel',
        ip: ip || '127.0.0.1',
        created_at: new Date().toISOString(),
      },
      ...state.logs_auditoria,
    ]
    await saveFallbackState(state)
    return next
  }

  throw new Error(error?.message || 'Erro ao atualizar cliente')
}

export async function deleteCliente(id: string, ip?: string | null): Promise<void> {
  const supabase = createAdminClient()

  const { data: target } = await supabase
    .from('clientes')
    .select('nome_loja')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('clientes').delete().eq('id', id)

  if (!error) {
    await insertAuditLog({
      tipo: 'exclusao',
      descricao: `Cliente "${target?.nome_loja || id}" e suas faturas foram excluídos.`,
      ator: 'gabriel',
      ip,
    })
    return
  }

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    const client = state.clientes.find((c) => c.id === id)
    state.clientes = state.clientes.filter((c) => c.id !== id)
    state.faturas = state.faturas.filter((f) => f.cliente_id !== id)
    state.logs_auditoria = [
      {
        id: crypto.randomUUID(),
        tipo: 'exclusao',
        criticidade: 'normal',
        descricao: `Cliente "${client?.nome_loja || id}" e suas faturas foram excluídos.`,
        ator: 'gabriel',
        ip: ip || '127.0.0.1',
        created_at: new Date().toISOString(),
      },
      ...state.logs_auditoria,
    ]
    await saveFallbackState(state)
    return
  }

  throw new Error(error?.message || 'Erro ao excluir cliente')
}

// ============================================================
// FATURAS & COBRANÇA AUTOMÁTICA
// ============================================================

export async function syncAndListFaturas(filters?: {
  status?: string
  q?: string
}): Promise<FaturaRow[]> {
  const supabase = createAdminClient()
  const today = getTodayIsoDate()

  // 1. Marca automaticamente como 'atrasado' faturas pendentes com vencimento < hoje
  const { error: overdueErr } = await supabase
    .from('faturas')
    .update({ status: 'atrasado' })
    .eq('status', 'pendente')
    .lt('vencimento', today)

  if (!overdueErr) {
    const { data, error } = await supabase
      .from('faturas')
      .select('*, clientes(nome_loja, email, plano, status)')
      .order('vencimento', { ascending: false })

    if (!error && data) {
      let list = data as FaturaRow[]
      if (filters?.status && filters.status !== 'todos') {
        list = list.filter((f) => f.status === filters.status)
      }
      if (filters?.q && filters.q.trim()) {
        const q = filters.q.trim().toLowerCase()
        list = list.filter((f) =>
          (f.clientes?.nome_loja || '').toLowerCase().includes(q)
        )
      }

      // Verifica envio de e-mail de cobrança para faturas vencendo em até 3 dias
      await checkAndSendBillingEmails(list)
      return list
    }
  }

  if (isMissingTableError(overdueErr)) {
    const state = await getFallbackState()
    let changed = false
    state.faturas = state.faturas.map((f) => {
      if (f.status === 'pendente' && f.vencimento < today) {
        changed = true
        return { ...f, status: 'atrasado' }
      }
      return f
    })
    if (changed) {
      await saveFallbackState(state)
    }

    const joined: FaturaRow[] = state.faturas
      .map((f) => {
        const cli = state.clientes.find((c) => c.id === f.cliente_id)
        return {
          ...f,
          clientes: cli
            ? {
                nome_loja: cli.nome_loja,
                email: cli.email,
                plano: cli.plano,
                status: cli.status,
              }
            : null,
        }
      })
      .sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime())

    let list = joined
    if (filters?.status && filters.status !== 'todos') {
      list = list.filter((f) => f.status === filters.status)
    }
    if (filters?.q && filters.q.trim()) {
      const q = filters.q.trim().toLowerCase()
      list = list.filter((f) =>
        (f.clientes?.nome_loja || '').toLowerCase().includes(q)
      )
    }

    await checkAndSendBillingEmails(joined)
    return list
  }

  throw new Error(overdueErr?.message || 'Erro ao buscar faturas')
}

export async function updateFaturaStatus(
  id: string,
  status: FaturaStatus,
  ip?: string | null
): Promise<FaturaRow> {
  const supabase = createAdminClient()
  const pago_em = status === 'pago' ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('faturas')
    .update({ status, pago_em })
    .eq('id', id)
    .select('*, clientes(nome_loja, email, plano, status)')
    .single()

  if (!error && data) {
    await insertAuditLog({
      tipo: 'edicao',
      descricao: `Fatura de "${(data as any).clientes?.nome_loja || id}" marcada como ${status.toUpperCase()}.`,
      ator: 'gabriel',
      ip,
    })
    return data as FaturaRow
  }

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    const idx = state.faturas.findIndex((f) => f.id === id)
    if (idx === -1) throw new Error('Fatura não encontrada')
    state.faturas[idx] = { ...state.faturas[idx], status, pago_em }
    const cli = state.clientes.find((c) => c.id === state.faturas[idx].cliente_id)
    state.logs_auditoria = [
      {
        id: crypto.randomUUID(),
        tipo: 'edicao',
        criticidade: 'normal',
        descricao: `Fatura de "${cli?.nome_loja || id}" marcada como ${status.toUpperCase()}.`,
        ator: 'gabriel',
        ip: ip || '127.0.0.1',
        created_at: new Date().toISOString(),
      },
      ...state.logs_auditoria,
    ]
    await saveFallbackState(state)
    return {
      ...state.faturas[idx],
      clientes: cli
        ? {
            nome_loja: cli.nome_loja,
            email: cli.email,
            plano: cli.plano,
            status: cli.status,
          }
        : null,
    }
  }

  throw new Error(error?.message || 'Erro ao atualizar fatura')
}

async function checkAndSendBillingEmails(faturas: FaturaRow[]): Promise<void> {
  try {
    const config = await getConfiguracoes()
    if (!config.emails_cobranca_ativo) return

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const dueSoon = faturas.filter(
      (f) =>
        f.status === 'pendente' &&
        f.vencimento >= todayStr &&
        f.vencimento <= threeDaysFromNow &&
        f.clientes?.email
    )

    if (dueSoon.length === 0) return

    const state = await getFallbackState()
    const notified = new Set(state.notifiedInvoiceIds || [])
    const resend = new Resend(apiKey)
    let stateUpdated = false

    for (const fatura of dueSoon) {
      if (notified.has(fatura.id)) continue

      const { error } = await resend.emails.send({
        from: `${config.nome_plataforma || 'VendaZap'} <onboarding@resend.dev>`,
        to: [fatura.clientes!.email],
        subject: `[${config.nome_plataforma}] Lembrete de vencimento da sua assinatura`,
        html: `<p>Olá, <strong>${fatura.clientes!.nome_loja}</strong>!</p>
               <p>Sua fatura no valor de <strong>R$ ${Number(fatura.valor).toLocaleString('pt-BR')}</strong> vence em <strong>${new Date(fatura.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>.</p>
               <p>Dúvidas? Fale conosco pelo WhatsApp: ${config.whatsapp_suporte}.</p>`,
      })

      if (!error) {
        notified.add(fatura.id)
        stateUpdated = true
      }
    }

    if (stateUpdated) {
      state.notifiedInvoiceIds = Array.from(notified)
      await saveFallbackState(state)
    }
  } catch (err) {
    console.error('Erro ao checar envio de e-mails de cobrança:', err)
  }
}

// ============================================================
// CONFIGURAÇÕES (sempre id = 1)
// ============================================================

export async function getConfiguracoes(): Promise<ConfiguracoesRow> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('configuracoes')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (!error && data) {
    return { ...DEFAULT_CONFIG, ...(data as ConfiguracoesRow) }
  }

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    return state.configuracoes
  }

  return DEFAULT_CONFIG
}

export async function saveConfiguracoes(
  updates: Partial<Omit<ConfiguracoesRow, 'id'>>,
  ip?: string | null
): Promise<ConfiguracoesRow> {
  const supabase = createAdminClient()
  const payload = { id: 1, ...updates }

  const { data, error } = await supabase
    .from('configuracoes')
    .upsert([payload], { onConflict: 'id' })
    .select()
    .single()

  if (!error && data) {
    await insertAuditLog({
      tipo: 'sistema',
      descricao: 'Configurações globais da plataforma atualizadas.',
      ator: 'gabriel',
      ip,
    })
    return data as ConfiguracoesRow
  }

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    state.configuracoes = { ...state.configuracoes, ...updates, id: 1 }
    state.logs_auditoria = [
      {
        id: crypto.randomUUID(),
        tipo: 'sistema',
        criticidade: 'normal',
        descricao: 'Configurações globais da plataforma atualizadas.',
        ator: 'gabriel',
        ip: ip || '127.0.0.1',
        created_at: new Date().toISOString(),
      },
      ...state.logs_auditoria,
    ]
    await saveFallbackState(state)
    return state.configuracoes
  }

  throw new Error(error?.message || 'Erro ao salvar configurações')
}

// ============================================================
// MELHORIAS
// ============================================================

export async function listMelhorias(): Promise<MelhoriaRow[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('melhorias')
    .select('*')
    .order('created_at', { ascending: false })

  if (!error && data) {
    return data as MelhoriaRow[]
  }

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    return [...state.melhorias].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  throw new Error(error?.message || 'Erro ao listar melhorias')
}

export async function createMelhoria(input: {
  tipo: MelhoriaTipo
  titulo: string
  descricao?: string | null
}): Promise<MelhoriaRow> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('melhorias')
    .insert([
      {
        tipo: input.tipo,
        titulo: input.titulo,
        descricao: input.descricao || null,
      },
    ])
    .select()
    .single()

  if (!error && data) {
    return data as MelhoriaRow
  }

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    const newRow: MelhoriaRow = {
      id: crypto.randomUUID(),
      tipo: input.tipo,
      titulo: input.titulo,
      descricao: input.descricao || null,
      created_at: new Date().toISOString(),
    }
    state.melhorias = [newRow, ...state.melhorias]
    await saveFallbackState(state)
    return newRow
  }

  throw new Error(error?.message || 'Erro ao criar melhoria')
}

export async function deleteMelhoria(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('melhorias').delete().eq('id', id)

  if (!error) return

  if (isMissingTableError(error)) {
    const state = await getFallbackState()
    state.melhorias = state.melhorias.filter((m) => m.id !== id)
    await saveFallbackState(state)
    return
  }

  throw new Error(error?.message || 'Erro ao excluir melhoria')
}
