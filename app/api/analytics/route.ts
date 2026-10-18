import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, resolveStoreId } from '@/lib/supabase/admin'
import { classifyTrafficSource } from '@/lib/traffic-classifier'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUuid(val?: string | null): val is string {
  return !!val && UUID_REGEX.test(val)
}

function extractSlugFromReferer(referer?: string | null): string | null {
  if (!referer) return null
  try {
    const url = new URL(referer)
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length > 0 && parts[0] !== 'api' && parts[0] !== 'admin') {
      return parts[0]
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Distribui percentuais garantindo soma exata de 100% (método dos maiores restos).
 */
function calculateExactPercentages(
  items: Array<{ name: string; count: number }>
): Array<{ name: string; count: number; value: number }> {
  const total = items.reduce((acc, it) => acc + it.count, 0)
  if (total === 0) {
    return items.map((it) => ({ ...it, value: 0 }))
  }

  const rawValues = items.map((it) => {
    const exact = (it.count * 100) / total
    const floor = Math.floor(exact)
    const remainder = exact - floor
    return { ...it, floor, remainder }
  })

  const sumFloors = rawValues.reduce((acc, it) => acc + it.floor, 0)
  let diff = 100 - sumFloors

  // Ordena por maior resto para distribuir a diferença
  const sortedByRemainder = [...rawValues].sort((a, b) => b.remainder - a.remainder)
  const bonusSet = new Set<string>()

  for (let i = 0; i < diff && i < sortedByRemainder.length; i++) {
    bonusSet.add(sortedByRemainder[i].name)
  }

  return rawValues.map((it) => ({
    name: it.name,
    count: it.count,
    value: it.floor + (bonusSet.has(it.name) ? 1 : 0),
  }))
}

export async function POST(req: NextRequest) {
  try {
    // 1. Ignora acessos de administradores logados
    const adminAuthCookie = req.cookies.get('admin_auth')
    if (adminAuthCookie?.value === 'true') {
      return NextResponse.json({ success: true, ignored: 'admin_session' }, { status: 200 })
    }

    const ua = req.headers.get('user-agent') || ''
    const referer = req.headers.get('referer') || ''

    // 2. Classificação / Detecção de bots
    const serverClassification = classifyTrafficSource({
      url: referer || undefined,
      referrer: referer || undefined,
      userAgent: ua,
      ownHost: req.nextUrl?.host || undefined,
    })

    if (serverClassification.isBot) {
      return NextResponse.json({ success: true, ignored: 'bot_traffic' }, { status: 200 })
    }

    const supabase = createAdminClient()
    const body = await req.json()
    const {
      store_id,
      slug,
      vehicle_id,
      event_type,
      source,
      session_id,
      source_detail,
      referrer_host,
      utm_source,
      utm_medium,
      utm_campaign,
    } = body

    if (!event_type) {
      return NextResponse.json({ error: 'event_type é obrigatório' }, { status: 400 })
    }

    let finalStoreId = isValidUuid(store_id) ? store_id : null
    if (!finalStoreId) {
      const targetSlug = slug || extractSlugFromReferer(referer) || 'loja-exemplo'
      finalStoreId = await resolveStoreId(supabase, targetSlug)
    }

    const validVehicleId = isValidUuid(vehicle_id) ? vehicle_id : null

    // Origem: prioriza cliente ou fallback do classificador do servidor
    const finalSource =
      source && source !== 'direct' && source !== 'Direto / não identificado'
        ? source
        : serverClassification.source

    const finalSourceDetail = source_detail || serverClassification.sourceDetail
    const finalReferrerHost = referrer_host || serverClassification.referrerHost

    const { error } = await supabase.from('analytics_events').insert([
      {
        store_id: finalStoreId,
        vehicle_id: validVehicleId,
        event_type,
        source: finalSource,
        session_id: session_id || null,
        source_detail: finalSourceDetail || null,
        referrer_host: finalReferrerHost || null,
        utm_source: utm_source || serverClassification.utmSource || null,
        utm_medium: utm_medium || serverClassification.utmMedium || null,
        utm_campaign: utm_campaign || serverClassification.utmCampaign || null,
      },
    ])

    if (error) {
      console.error('Supabase error inserting analytics event:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, source: finalSource }, { status: 201 })
  } catch (err: any) {
    console.error('Error in POST /api/analytics:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}

function formatChannelDisplayName(raw: string): string {
  const s = String(raw || '').trim().toLowerCase()
  if (s === 'direct' || s === 'direto' || s === 'direto / não identificado') return 'Acesso Direto'
  if (s === 'google' || s === 'google (orgânico)') return 'Google Busca'
  if (s === 'google ads' || s === 'gads') return 'Google Ads'
  if (s === 'instagram' || s === 'ig') return 'Instagram'
  if (s === 'instagram (app)') return 'Instagram (app)'
  if (s === 'instagram ads') return 'Instagram Ads'
  if (s === 'facebook' || s === 'fb') return 'Facebook'
  if (s === 'facebook (app)') return 'Facebook (app)'
  if (s === 'facebook ads') return 'Facebook Ads'
  if (s === 'meta (facebook/instagram)') return 'Meta (Face/Insta)'
  if (s === 'whatsapp' || s === 'wa') return 'WhatsApp'
  if (s === 'olx') return 'OLX'
  if (s === 'webmotors') return 'Webmotors'
  if (s === 'icarros') return 'iCarros'
  if (s === 'linktree') return 'Linktree'
  if (s === 'tiktok') return 'TikTok'
  if (s === 'tiktok ads') return 'TikTok Ads'
  if (s === 'bing') return 'Bing'
  if (s === 'bing ads') return 'Bing Ads'
  if (s === 'outros sites' || s === 'outros canais') return 'Outros sites'
  if (s.startsWith('ref:')) return `Site: ${s.replace('ref:', '')}`
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const store_id = searchParams.get('store_id')
    const slug = searchParams.get('slug')

    if (!store_id && !slug) {
      return NextResponse.json({ error: 'store_id ou slug é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()

    let finalStoreId = isValidUuid(store_id) ? store_id : null
    if (!finalStoreId) {
      finalStoreId = await resolveStoreId(supabase, slug || 'loja-exemplo')
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('event_type, source, vehicle_id, created_at')
      .eq('store_id', finalStoreId)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          {
            totalViews: 0,
            whatsappClicks: 0,
            shares: 0,
            sources: {},
            trafficSourcesList: [],
            topVehicles: [],
          },
          { status: 200 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let totalViews = 0
    let whatsappClicks = 0
    let shares = 0

    // Contagem por canal real de tráfego com nomes amigáveis em pt-BR
    const rawSourcesCount: Record<string, number> = {}
    const vehicleStats: Record<string, { views: number; clicks: number }> = {}

    events?.forEach((ev) => {
      const channel = formatChannelDisplayName(ev.source || 'direct')

      if (ev.event_type === 'page_view') {
        totalViews++
        rawSourcesCount[channel] = (rawSourcesCount[channel] || 0) + 1
      } else if (ev.event_type === 'whatsapp_click') {
        whatsappClicks++
      } else if (ev.event_type === 'share') {
        shares++
      }

      if (ev.vehicle_id) {
        if (!vehicleStats[ev.vehicle_id]) vehicleStats[ev.vehicle_id] = { views: 0, clicks: 0 }
        if (ev.event_type === 'page_view') vehicleStats[ev.vehicle_id].views++
        if (ev.event_type === 'whatsapp_click') vehicleStats[ev.vehicle_id].clicks++
      }
    })

    // Ordena canais por volume decrescente
    const sortedChannels = Object.entries(rawSourcesCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Agrupa em Top 5/6 + "Outros" se houver mais que 6 canais
    let displayList: Array<{ name: string; count: number }> = []
    if (sortedChannels.length <= 6) {
      displayList = sortedChannels
    } else {
      const top5 = sortedChannels.slice(0, 5)
      const rest = sortedChannels.slice(5)
      const othersCount = rest.reduce((acc, it) => acc + it.count, 0)
      displayList = [...top5, { name: 'Outros canais', count: othersCount }]
    }

    // Calcula porcentagens exatas somando 100%
    const trafficWithPercentages = calculateExactPercentages(displayList)

    // Paleta de gradiente de roxos/marcas para as barras
    const colorPalette = [
      'bg-brand',
      'bg-[var(--chart-2,#7B3FD1)]',
      'bg-[var(--chart-3,#34D399)]',
      'bg-[var(--chart-4,#3B82F6)]',
      'bg-[var(--chart-5,#F59E0B)]',
      'bg-zinc-400',
    ]

    const trafficSourcesList = trafficWithPercentages.map((item, idx) => ({
      key: `source_${idx}`,
      name: item.name,
      count: item.count,
      value: item.value,
      color: colorPalette[idx % colorPalette.length],
    }))

    const topVehiclesIds = Object.keys(vehicleStats)
      .sort((a, b) => vehicleStats[b].views - vehicleStats[a].views)
      .slice(0, 3)

    const topVehicles = topVehiclesIds.map((id) => ({
      id,
      views: vehicleStats[id].views,
      clicks: vehicleStats[id].clicks,
    }))

    const conversionRate =
      totalViews > 0 ? ((whatsappClicks / totalViews) * 100).toFixed(1) : '0.0'

    return NextResponse.json(
      {
        totalViews,
        whatsappClicks,
        shares,
        conversionRate,
        sources: rawSourcesCount,
        trafficSourcesList,
        topVehicles,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Error in GET /api/analytics:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
