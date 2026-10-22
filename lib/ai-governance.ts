import fs from 'fs'
import path from 'path'
import { createAdminClient } from '@/lib/supabase/admin'
import { AI_CONFIG } from '@/lib/ai-config'

export { AI_CONFIG }

interface LocalAiState {
  lockUntil: string | null
  lockReason: string | null
  today: string
  dailyCalls: number
  minuteMap: Record<string, number>
}

const LOCAL_AI_FILE = path.join(process.cwd(), '.ai-usage-cache.json')

function getTodayString(): string {
  // Data no fuso de Brasília YYYY-MM-DD
  const now = new Date()
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function getCurrentMinuteString(): string {
  const now = new Date()
  const d = getTodayString()
  const h = String(now.getUTCHours()).padStart(2, '0')
  const m = String(now.getUTCMinutes()).padStart(2, '0')
  return `${d}-${h}:${m}`
}

function readLocalState(): LocalAiState {
  const today = getTodayString()
  const defaultState: LocalAiState = {
    lockUntil: null,
    lockReason: null,
    today,
    dailyCalls: 0,
    minuteMap: {},
  }

  try {
    if (fs.existsSync(LOCAL_AI_FILE)) {
      const raw = fs.readFileSync(LOCAL_AI_FILE, 'utf-8')
      const data = JSON.parse(raw)
      // Se virou o dia, reseta contador diário
      if (data.today !== today) {
        return {
          ...defaultState,
          lockUntil: data.lockUntil && new Date(data.lockUntil).getTime() > Date.now() ? data.lockUntil : null,
          lockReason: data.lockReason,
        }
      }
      return data
    }
  } catch {}

  return defaultState
}

function writeLocalState(state: LocalAiState) {
  try {
    fs.writeFileSync(LOCAL_AI_FILE, JSON.stringify(state, null, 2), 'utf-8')
  } catch {}
}

/**
 * Verifica se a IA está disponível para uso no momento.
 */
export async function checkAiAvailability(tenantSlug?: string): Promise<{
  available: boolean
  message?: string
  dailyCalls: number
  dailyLimit: number
  minuteCalls: number
  minuteLimit: number
  isLocked: boolean
  lockReason?: string | null
}> {
  const state = readLocalState()
  const nowMs = Date.now()

  // 1. Verifica trava global ativa
  if (state.lockUntil) {
    const lockTime = new Date(state.lockUntil).getTime()
    if (lockTime > nowMs) {
      return {
        available: false,
        message: 'Limite gratuito de IA atingido. Volta amanhã.',
        dailyCalls: state.dailyCalls,
        dailyLimit: AI_CONFIG.DAILY_LIMIT,
        minuteCalls: 0,
        minuteLimit: AI_CONFIG.RPM_LIMIT,
        isLocked: true,
        lockReason: state.lockReason,
      }
    } else {
      // Trava expirou, limpa
      state.lockUntil = null
      state.lockReason = null
      writeLocalState(state)
    }
  }

  // 2. Verifica limite diário (margem de 70%)
  if (state.dailyCalls >= AI_CONFIG.DAILY_LIMIT) {
    tripAiGlobalLock('Limite diário de segurança (70% da cota gratuita) atingido.')
    return {
      available: false,
      message: 'Limite gratuito de IA atingido. Volta amanhã.',
      dailyCalls: state.dailyCalls,
      dailyLimit: AI_CONFIG.DAILY_LIMIT,
      minuteCalls: 0,
      minuteLimit: AI_CONFIG.RPM_LIMIT,
      isLocked: true,
      lockReason: 'Limite diário de segurança atingido.',
    }
  }

  // 3. Verifica limite por minuto (margem de 70%)
  const minuteKey = getCurrentMinuteString()
  const currentMinuteCalls = state.minuteMap[minuteKey] || 0
  if (currentMinuteCalls >= AI_CONFIG.RPM_LIMIT) {
    return {
      available: false,
      message: 'Muitas requisições em 1 minuto. Aguarde alguns segundos para gerar novamente.',
      dailyCalls: state.dailyCalls,
      dailyLimit: AI_CONFIG.DAILY_LIMIT,
      minuteCalls: currentMinuteCalls,
      minuteLimit: AI_CONFIG.RPM_LIMIT,
      isLocked: false,
      lockReason: 'Limite temporário por minuto atingido.',
    }
  }

  return {
    available: true,
    dailyCalls: state.dailyCalls,
    dailyLimit: AI_CONFIG.DAILY_LIMIT,
    minuteCalls: currentMinuteCalls,
    minuteLimit: AI_CONFIG.RPM_LIMIT,
    isLocked: false,
  }
}

/**
 * Registra o consumo de uma chamada de IA com estimativa de tokens.
 */
export async function recordAiUsage(tenantSlug: string = 'global', estimatedTokens: number = 80) {
  const state = readLocalState()
  const minuteKey = getCurrentMinuteString()

  state.dailyCalls += 1
  state.minuteMap[minuteKey] = (state.minuteMap[minuteKey] || 0) + 1

  // Limpa minutos antigos do mapa para não acumular memória
  const keys = Object.keys(state.minuteMap)
  if (keys.length > 30) {
    const recent = keys.slice(-10)
    const newMap: Record<string, number> = {}
    for (const k of recent) newMap[k] = state.minuteMap[k]
    state.minuteMap = newMap
  }

  writeLocalState(state)

  // Grava também de forma assíncrona no banco se configurado
  try {
    const supabase = createAdminClient()
    await supabase.from('ai_usage').insert([
      {
        tenant_slug: tenantSlug,
        date: state.today,
        minute: minuteKey,
        calls_count: 1,
        tokens_estimated: estimatedTokens,
      },
    ])
  } catch {
    // Ignora falhas de banco, estado local garante controle absoluto
  }
}

/**
 * Ativa a trava global do sistema (desliga toda a IA até o próximo dia).
 */
export function tripAiGlobalLock(reason: string) {
  const state = readLocalState()
  // Trava até as 03:00 do dia seguinte (virada de dia oficial)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(3, 0, 0, 0)

  state.lockUntil = tomorrow.toISOString()
  state.lockReason = reason
  writeLocalState(state)
  console.warn(`[AI GOVERNANCE] Trava global de IA ativada até ${state.lockUntil}. Motivo: ${reason}`)
}

/**
 * Liberação manual da trava global pelo Super Admin.
 */
export function resetAiGlobalLock() {
  const state = readLocalState()
  state.lockUntil = null
  state.lockReason = null
  state.dailyCalls = 0
  state.minuteMap = {}
  writeLocalState(state)
}

/**
 * Retorna as métricas completas para exibição no painel Super Admin.
 */
export async function getAiGovernanceMetrics() {
  const state = readLocalState()
  const minuteKey = getCurrentMinuteString()
  const currentMinuteCalls = state.minuteMap[minuteKey] || 0
  const isLocked = Boolean(state.lockUntil && new Date(state.lockUntil).getTime() > Date.now())

  return {
    model: AI_CONFIG.DEFAULT_MODEL,
    dailyCalls: state.dailyCalls,
    dailyLimit: AI_CONFIG.DAILY_LIMIT,
    dailyRemaining: Math.max(0, AI_CONFIG.DAILY_LIMIT - state.dailyCalls),
    dailyUsagePercent: Math.min(100, Math.round((state.dailyCalls / AI_CONFIG.DAILY_LIMIT) * 100)),
    rpmCalls: currentMinuteCalls,
    rpmLimit: AI_CONFIG.RPM_LIMIT,
    isLocked,
    lockUntil: state.lockUntil,
    lockReason: state.lockReason,
  }
}
