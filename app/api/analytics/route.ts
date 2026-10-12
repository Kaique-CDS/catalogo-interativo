import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, resolveStoreId } from '@/lib/supabase/admin'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUuid(val?: string | null): val is string {
  return !!val && UUID_REGEX.test(val)
}

function normalizeSource(
  raw?: string | null,
  req?: NextRequest
): 'instagram' | 'google' | 'facebook' | 'direct' {
  if (raw) {
    const s = raw.toLowerCase().trim()
    if (s.includes('insta') || s === 'ig') return 'instagram'
    if (s.includes('goog') || s === 'gads' || s === 'adwords') return 'google'
    if (s.includes('face') || s === 'fb' || s === 'meta' || s.includes('messenger')) return 'facebook'
    if (s === 'direct' || s === 'direto') {
      // Fall through to inspect headers in case client sent 'direct' as fallback
    }
  }

  if (req) {
    const referer = (req.headers.get('referer') || '').toLowerCase()
    const ua = (req.headers.get('user-agent') || '').toLowerCase()

    if (referer) {
      try {
        const refUrl = new URL(referer)
        const p = refUrl.searchParams
        const paramSource = (
          p.get('ref') ||
          p.get('utm_source') ||
          p.get('source') ||
          p.get('origem') ||
          ''
        ).toLowerCase()

        if (paramSource.includes('insta') || paramSource === 'ig' || p.has('igshid') || p.has('igsh')) {
          return 'instagram'
        }
        if (paramSource.includes('goog') || paramSource === 'gads' || p.has('gclid') || p.has('gad_source')) {
          return 'google'
        }
        if (paramSource.includes('face') || paramSource === 'fb' || paramSource === 'meta') {
          return 'facebook'
        }
      } catch {
        // Ignore URL parse error
      }
    }

    if (ua.includes('instagram')) return 'instagram'
    if (ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab') || ua.includes('fbios') || ua.includes('fb4a')) {
      return 'facebook'
    }
    if (ua.includes('gsa/') || ua.includes('googleapp')) return 'google'

    if (referer.includes('instagram.com') || referer.includes('ig.me')) return 'instagram'
    if (referer.includes('google.') || referer.includes('googlequicksearchbox')) return 'google'
    if (referer.includes('facebook.com') || referer.includes('fb.com') || referer.includes('messenger.com')) {
      return 'facebook'
    }
    if (referer.includes('fbclid=')) return 'facebook'
  }

  return 'direct'
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

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()
    const { store_id, slug, vehicle_id, event_type, source } = body

    if (!event_type) {
      return NextResponse.json({ error: 'event_type e obrigatorio' }, { status: 400 })
    }

    let finalStoreId = isValidUuid(store_id) ? store_id : null
    if (!finalStoreId) {
      const targetSlug = slug || extractSlugFromReferer(req.headers.get('referer')) || 'loja-exemplo'
      finalStoreId = await resolveStoreId(supabase, targetSlug)
    }

    const validVehicleId = isValidUuid(vehicle_id) ? vehicle_id : null
    const finalSource = normalizeSource(source, req)

    const { error } = await supabase
      .from('analytics_events')
      .insert([
        {
          store_id: finalStoreId,
          vehicle_id: validVehicleId,
          event_type,
          source: finalSource,
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const store_id = searchParams.get('store_id')
    const slug = searchParams.get('slug')

    if (!store_id && !slug) {
      return NextResponse.json({ error: 'store_id ou slug e obrigatorio' }, { status: 400 })
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
            sources: { instagram: 0, google: 0, facebook: 0, direct: 0 },
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
    const sourcesCount: Record<string, number> = { instagram: 0, google: 0, facebook: 0, direct: 0 }
    const storeViewsSources: Record<string, number> = { instagram: 0, google: 0, facebook: 0, direct: 0 }
    let hasStoreLevelViews = false
    const vehicleStats: Record<string, { views: number; clicks: number }> = {}

    events?.forEach((ev) => {
      const normSource = normalizeSource(ev.source)

      if (ev.event_type === 'page_view') {
        totalViews++
        sourcesCount[normSource] = (sourcesCount[normSource] || 0) + 1

        // Visita principal da vitrine (vehicle_id === null) ou qualquer evento vindo de rede social/busca
        if (!ev.vehicle_id || normSource !== 'direct') {
          hasStoreLevelViews = true
          storeViewsSources[normSource] = (storeViewsSources[normSource] || 0) + 1
        }
      } else if (ev.event_type === 'whatsapp_click') {
        whatsappClicks++
        if (normSource !== 'direct') {
          hasStoreLevelViews = true
          storeViewsSources[normSource] = (storeViewsSources[normSource] || 0) + 1
        }
      } else if (ev.event_type === 'share') {
        shares++
      }

      if (ev.vehicle_id) {
        if (!vehicleStats[ev.vehicle_id]) vehicleStats[ev.vehicle_id] = { views: 0, clicks: 0 }
        if (ev.event_type === 'page_view') vehicleStats[ev.vehicle_id].views++
        if (ev.event_type === 'whatsapp_click') vehicleStats[ev.vehicle_id].clicks++
      }
    })

    const topVehiclesIds = Object.keys(vehicleStats)
      .sort((a, b) => vehicleStats[b].views - vehicleStats[a].views)
      .slice(0, 3)

    const topVehicles = topVehiclesIds.map((id) => ({
      id,
      views: vehicleStats[id].views,
      clicks: vehicleStats[id].clicks,
    }))

    return NextResponse.json(
      {
        totalViews,
        whatsappClicks,
        shares,
        sources: hasStoreLevelViews ? storeViewsSources : sourcesCount,
        topVehicles,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Error in GET /api/analytics:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
