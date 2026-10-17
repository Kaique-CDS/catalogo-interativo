import { classifyTrafficSource, type TrafficClassificationResult } from './traffic-classifier'

const SESSION_SOURCE_KEY = 'vz_traffic_source'
const SESSION_ID_KEY = 'vz_session_id'
const SESSION_DETAIL_KEY = 'vz_traffic_detail'

export type TrafficSource = string

export interface ClientTrafficInfo {
  source: string
  sessionId: string
  sourceDetail: string | null
  referrerHost: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
}

/**
 * Obtém ou inicializa o ID único da sessão atual do visitante no sessionStorage.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server_session'
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY)
    if (!sid) {
      sid =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `vz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      sessionStorage.setItem(SESSION_ID_KEY, sid)
    }
    return sid
  } catch {
    return `vz_fallback_${Date.now()}`
  }
}

/**
 * Retorna as informações completas de atribuição de tráfego do cliente,
 * respeitando a persistência de sessão (a primeira origem prevalece).
 */
export function getClientTrafficInfo(): ClientTrafficInfo {
  if (typeof window === 'undefined') {
    return {
      source: 'Direto / não identificado',
      sessionId: 'server_session',
      sourceDetail: null,
      referrerHost: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    }
  }

  try {
    const sessionId = getOrCreateSessionId()
    const classified = classifyTrafficSource({
      url: window.location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent || null,
      ownHost: window.location.host || null,
    })

    const storedSource = sessionStorage.getItem(SESSION_SOURCE_KEY)
    const storedDetail = sessionStorage.getItem(SESSION_DETAIL_KEY)

    // Se é navegação interna ou direto mas já tínhamos uma origem nesta sessão, preserva a primeira
    if (storedSource && (classified.isInternal || classified.source === 'Direto / não identificado')) {
      return {
        source: storedSource,
        sessionId,
        sourceDetail: storedDetail || classified.sourceDetail,
        referrerHost: classified.referrerHost,
        utmSource: classified.utmSource,
        utmMedium: classified.utmMedium,
        utmCampaign: classified.utmCampaign,
      }
    }

    // Caso contrário, atualiza a origem na sessão
    sessionStorage.setItem(SESSION_SOURCE_KEY, classified.source)
    if (classified.sourceDetail) {
      sessionStorage.setItem(SESSION_DETAIL_KEY, classified.sourceDetail)
    }

    return {
      source: classified.source,
      sessionId,
      sourceDetail: classified.sourceDetail,
      referrerHost: classified.referrerHost,
      utmSource: classified.utmSource,
      utmMedium: classified.utmMedium,
      utmCampaign: classified.utmCampaign,
    }
  } catch {
    return {
      source: 'Direto / não identificado',
      sessionId: getOrCreateSessionId(),
      sourceDetail: null,
      referrerHost: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    }
  }
}

/**
 * Função mantida para retrocompatibilidade com componentes existentes.
 */
export function getTrafficSource(): string {
  return getClientTrafficInfo().source
}
