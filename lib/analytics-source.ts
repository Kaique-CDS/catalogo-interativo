const SESSION_SOURCE_KEY = 'vz_traffic_source'

export type TrafficSource = 'instagram' | 'google' | 'facebook' | 'direct'

/**
 * Detecta de forma precisa a origem do tráfego no iOS, Android e Desktop:
 * 1. Parâmetros de URL (?ref=, ?utm_source=, ?source=, ?origem=, ?igshid=, ?gclid=, ?fbclid=)
 * 2. User-Agent de navegadores internos (In-App Browser do Instagram, Facebook e Google App no iOS/Android)
 * 3. document.referrer (google.com, google.com.br, l.instagram.com, m.facebook.com, etc.)
 * 4. Persiste na sessionStorage para manter a atribuição durante toda a navegação do cliente.
 */
export function getTrafficSource(): TrafficSource {
  if (typeof window === 'undefined') return 'direct'

  try {
    const params = new URLSearchParams(window.location.search)
    const rawParam = (
      params.get('ref') ||
      params.get('utm_source') ||
      params.get('source') ||
      params.get('origem') ||
      ''
    )
      .toLowerCase()
      .trim()

    // 1. Parâmetros explícitos de URL
    if (
      rawParam.includes('insta') ||
      rawParam === 'ig' ||
      params.has('igshid') ||
      params.has('igsh')
    ) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'instagram')
      return 'instagram'
    }

    if (
      rawParam.includes('google') ||
      rawParam === 'gads' ||
      rawParam === 'adwords' ||
      params.has('gclid') ||
      params.has('gad_source')
    ) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'google')
      return 'google'
    }

    if (
      rawParam.includes('face') ||
      rawParam === 'fb' ||
      rawParam === 'meta'
    ) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'facebook')
      return 'facebook'
    }

    if (rawParam === 'direct' || rawParam === 'direto') {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'direct')
      return 'direct'
    }

    // 2. User-Agent dos In-App Browsers (iOS e Android)
    const ua = (navigator.userAgent || '').toLowerCase()
    if (ua.includes('instagram')) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'instagram')
      return 'instagram'
    }
    if (
      ua.includes('fban') ||
      ua.includes('fbav') ||
      ua.includes('fb_iab') ||
      ua.includes('fbios') ||
      ua.includes('fb4a')
    ) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'facebook')
      return 'facebook'
    }
    if (ua.includes('gsa/') || ua.includes('googleapp')) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'google')
      return 'google'
    }

    // 3. Document Referrer
    const referrer = (document.referrer || '').toLowerCase()
    if (referrer.includes('instagram.com') || referrer.includes('ig.me')) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'instagram')
      return 'instagram'
    }
    if (
      referrer.includes('google.') ||
      referrer.includes('googlequicksearchbox') ||
      referrer.includes('googleapis.com')
    ) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'google')
      return 'google'
    }
    if (
      referrer.includes('facebook.com') ||
      referrer.includes('fb.com') ||
      referrer.includes('messenger.com')
    ) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'facebook')
      return 'facebook'
    }

    // fbclid sem User-Agent do Instagram cai para Facebook
    if (params.has('fbclid')) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'facebook')
      return 'facebook'
    }

    // 4. Verifica se já havia uma origem salva nesta sessão
    const saved = sessionStorage.getItem(SESSION_SOURCE_KEY) as TrafficSource | null
    if (saved && ['instagram', 'google', 'facebook', 'direct'].includes(saved)) {
      return saved
    }

    sessionStorage.setItem(SESSION_SOURCE_KEY, 'direct')
    return 'direct'
  } catch {
    return 'direct'
  }
}
