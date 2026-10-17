/**
 * Classificador de tráfego multicanal para catálogos interativos.
 * Determina com precisão a origem das visitas considerando:
 * 1. Parâmetros de campanha na URL (utm_source, src, source, ref, etc.)
 * 2. Click IDs de redes de anúncios (gclid, fbclid, ttclid, msclkid)
 * 3. Domínio HTTP Referer
 * 4. User-Agent (In-App Browsers de redes sociais)
 * 5. Detecção de robôs / indexadores de busca
 */

export interface TrafficClassifierInput {
  url?: string | URL | null
  landingParams?: Record<string, string | null> | URLSearchParams | null
  referrer?: string | null
  userAgent?: string | null
  ownHost?: string | null
}

export interface TrafficClassificationResult {
  source: string
  sourceDetail: string
  referrerHost: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  isBot: boolean
  isInternal: boolean
}

const BOT_REGEX =
  /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|facebookexternalhit|ia_archiver|Bytespider|Pinterestbot|SemrushBot|AhrefsBot|MJ12bot|Twitterbot|LinkedInBot|Applebot/i

/**
 * Normaliza um domínio para comparação (remove porta e www).
 */
function cleanHost(host: string): string {
  return host.toLowerCase().trim().replace(/:\d+$/, '').replace(/^www\./, '')
}

/**
 * Capitaliza de forma limpa nomes de canais desconhecidos (ex.: "youtube" -> "YouTube", "newsletter" -> "Newsletter").
 */
function formatCustomChannel(val: string): string {
  const lower = val.toLowerCase().trim()
  const customMap: Record<string, string> = {
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    x: 'X (Twitter)',
    bing: 'Bing',
    email: 'E-mail',
    newsletter: 'E-mail',
    whatsapp: 'WhatsApp',
    wa: 'WhatsApp',
    olx: 'OLX',
    webmotors: 'Webmotors',
    icarros: 'iCarros',
  }
  if (customMap[lower]) return customMap[lower]
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/**
 * Função pura de classificação de origem de tráfego.
 */
export function classifyTrafficSource(input: TrafficClassifierInput): TrafficClassificationResult {
  const { url, landingParams, referrer, userAgent, ownHost } = input

  // Extrai parâmetros da URL
  let searchParams: URLSearchParams
  if (landingParams instanceof URLSearchParams) {
    searchParams = landingParams
  } else if (landingParams && typeof landingParams === 'object') {
    searchParams = new URLSearchParams()
    for (const [k, v] of Object.entries(landingParams)) {
      if (v) searchParams.set(k, v)
    }
  } else if (url) {
    try {
      const parsedUrl = typeof url === 'string' ? new URL(url, 'https://catalogo.local') : url
      searchParams = parsedUrl.searchParams
    } catch {
      searchParams = new URLSearchParams()
    }
  } else {
    searchParams = new URLSearchParams()
  }

  const ua = (userAgent || '').trim()
  const isBot = Boolean(ua && BOT_REGEX.test(ua))

  // Extrai host do referrer se houver
  let referrerHost: string | null = null
  let isInternal = false
  if (referrer) {
    try {
      const refUrl = new URL(referrer)
      const cleanedRefHost = cleanHost(refUrl.hostname)
      referrerHost = cleanedRefHost

      if (ownHost) {
        const cleanedOwnHost = cleanHost(ownHost)
        if (cleanedRefHost === cleanedOwnHost || cleanedRefHost.endsWith('.' + cleanedOwnHost)) {
          isInternal = true
        }
      }
    } catch {
      referrerHost = null
    }
  }

  const utmSource = searchParams.get('utm_source') || null
  const utmMedium = searchParams.get('utm_medium') || null
  const utmCampaign = searchParams.get('utm_campaign') || null

  // 1. PARÂMETROS EXPLÍCITOS NA URL
  const explicitSource =
    searchParams.get('utm_source') ||
    searchParams.get('src') ||
    searchParams.get('source') ||
    searchParams.get('origem') ||
    searchParams.get('ref')

  if (explicitSource) {
    const raw = explicitSource.toLowerCase().trim()

    if (raw === 'ig' || raw === 'instagram' || raw.includes('insta')) {
      return {
        source: 'Instagram',
        sourceDetail: `utm_source=${explicitSource}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }

    if (raw === 'fb' || raw === 'facebook' || raw === 'meta') {
      return {
        source: 'Facebook',
        sourceDetail: `utm_source=${explicitSource}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }

    if (raw === 'google' || raw === 'adwords' || raw === 'gads') {
      return {
        source: 'Google',
        sourceDetail: `utm_source=${explicitSource}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }

    if (raw === 'tiktok' || raw === 'tt') {
      return {
        source: 'TikTok',
        sourceDetail: `utm_source=${explicitSource}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }

    if (raw === 'wa' || raw === 'whatsapp') {
      return {
        source: 'WhatsApp',
        sourceDetail: `utm_source=${explicitSource}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }

    if (raw === 'olx') {
      return {
        source: 'OLX',
        sourceDetail: `utm_source=${explicitSource}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }

    if (raw === 'webmotors') {
      return {
        source: 'Webmotors',
        sourceDetail: `utm_source=${explicitSource}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }

    if (raw === 'icarros') {
      return {
        source: 'iCarros',
        sourceDetail: `utm_source=${explicitSource}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }

    if (raw === 'email' || raw === 'newsletter') {
      return {
        source: 'E-mail',
        sourceDetail: `utm_source=${explicitSource}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }

    // Outros valores customizados
    const channelName = formatCustomChannel(explicitSource)
    return {
      source: channelName,
      sourceDetail: `utm_source=${explicitSource}`,
      referrerHost,
      utmSource,
      utmMedium,
      utmCampaign,
      isBot,
      isInternal,
    }
  }

  // 2. PARÂMETROS DE CLIQUE DE ANÚNCIOS (Click IDs)
  if (searchParams.has('gclid') || searchParams.has('gad_source')) {
    return {
      source: 'Google Ads',
      sourceDetail: 'gclid',
      referrerHost,
      utmSource,
      utmMedium,
      utmCampaign,
      isBot,
      isInternal,
    }
  }

  if (searchParams.has('fbclid')) {
    const uaLower = ua.toLowerCase()
    const isInsta =
      uaLower.includes('instagram') || (referrerHost && referrerHost.includes('instagram.'))
    const isFb =
      uaLower.includes('fban') ||
      uaLower.includes('fbav') ||
      (referrerHost && (referrerHost.includes('facebook.') || referrerHost.includes('fb.com')))

    let source = 'Meta (Facebook/Instagram)'
    if (isInsta && !isFb) source = 'Instagram Ads'
    else if (isFb && !isInsta) source = 'Facebook Ads'

    return {
      source,
      sourceDetail: 'fbclid',
      referrerHost,
      utmSource,
      utmMedium,
      utmCampaign,
      isBot,
      isInternal,
    }
  }

  if (searchParams.has('ttclid')) {
    return {
      source: 'TikTok Ads',
      sourceDetail: 'ttclid',
      referrerHost,
      utmSource,
      utmMedium,
      utmCampaign,
      isBot,
      isInternal,
    }
  }

  if (searchParams.has('msclkid')) {
    return {
      source: 'Bing Ads',
      sourceDetail: 'msclkid',
      referrerHost,
      utmSource,
      utmMedium,
      utmCampaign,
      isBot,
      isInternal,
    }
  }

  // 3. REFERRER (quando sem parâmetros de campanha e não é navegação interna)
  if (referrerHost && !isInternal) {
    if (referrerHost.includes('instagram.') || referrerHost === 'ig.me') {
      return {
        source: 'Instagram',
        sourceDetail: `ref:${referrerHost}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal: false,
      }
    }

    if (
      referrerHost.includes('facebook.') ||
      referrerHost === 'fb.com' ||
      referrerHost.includes('messenger.com')
    ) {
      return {
        source: 'Facebook',
        sourceDetail: `ref:${referrerHost}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal: false,
      }
    }

    if (referrerHost.includes('google.') || referrerHost.includes('googlequicksearchbox')) {
      return {
        source: 'Google (orgânico)',
        sourceDetail: `ref:${referrerHost}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal: false,
      }
    }

    if (referrerHost.includes('linktr.ee')) {
      return {
        source: 'Linktree',
        sourceDetail: `ref:${referrerHost}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal: false,
      }
    }

    if (
      referrerHost.includes('wa.me') ||
      referrerHost.includes('whatsapp.com') ||
      referrerHost.includes('api.whatsapp')
    ) {
      return {
        source: 'WhatsApp',
        sourceDetail: `ref:${referrerHost}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal: false,
      }
    }

    if (referrerHost.includes('olx.com.br')) {
      return {
        source: 'OLX',
        sourceDetail: `ref:${referrerHost}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal: false,
      }
    }

    if (referrerHost.includes('webmotors.com.br')) {
      return {
        source: 'Webmotors',
        sourceDetail: `ref:${referrerHost}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal: false,
      }
    }

    if (referrerHost.includes('icarros.com.br')) {
      return {
        source: 'iCarros',
        sourceDetail: `ref:${referrerHost}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal: false,
      }
    }

    if (referrerHost.includes('bing.com')) {
      return {
        source: 'Bing',
        sourceDetail: `ref:${referrerHost}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal: false,
      }
    }

    if (
      referrerHost === 't.co' ||
      referrerHost.includes('twitter.com') ||
      referrerHost.includes('x.com')
    ) {
      return {
        source: 'X (Twitter)',
        sourceDetail: `ref:${referrerHost}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal: false,
      }
    }

    if (referrerHost.includes('youtube.com') || referrerHost.includes('youtu.be')) {
      return {
        source: 'YouTube',
        sourceDetail: `ref:${referrerHost}`,
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal: false,
      }
    }
  }

  // 4. IN-APP BROWSER NO USER-AGENT
  if (ua) {
    const uaLower = ua.toLowerCase()
    if (uaLower.includes('instagram')) {
      return {
        source: 'Instagram (app)',
        sourceDetail: 'ua:instagram',
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }
    if (
      uaLower.includes('fban') ||
      uaLower.includes('fbav') ||
      uaLower.includes('fb_iab') ||
      uaLower.includes('fbios') ||
      uaLower.includes('fb4a')
    ) {
      return {
        source: 'Facebook (app)',
        sourceDetail: 'ua:facebook',
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }
    if (uaLower.includes('whatsapp')) {
      return {
        source: 'WhatsApp',
        sourceDetail: 'ua:whatsapp',
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }
    if (uaLower.includes('tiktok') || uaLower.includes('bytedance')) {
      return {
        source: 'TikTok (app)',
        sourceDetail: 'ua:tiktok',
        referrerHost,
        utmSource,
        utmMedium,
        utmCampaign,
        isBot,
        isInternal,
      }
    }
  }

  // 5. SE TEM REFERRER EXTERNO DESCONHECIDO -> "Outros sites"
  if (referrerHost && !isInternal) {
    return {
      source: 'Outros sites',
      sourceDetail: `ref:${referrerHost}`,
      referrerHost,
      utmSource,
      utmMedium,
      utmCampaign,
      isBot,
      isInternal: false,
    }
  }

  // 6. SE REFERER VAZIO OU IGUAL AO PRÓPRIO SITE E SEM PARÂMETROS -> "Direto / não identificado"
  return {
    source: 'Direto / não identificado',
    sourceDetail: isInternal ? 'internal_navigation' : 'direct',
    referrerHost,
    utmSource,
    utmMedium,
    utmCampaign,
    isBot,
    isInternal,
  }
}
