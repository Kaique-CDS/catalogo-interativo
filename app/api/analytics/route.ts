import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, resolveStoreId } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()
    const { store_id, vehicle_id, event_type, source } = body

    if (!store_id || !event_type) {
      return NextResponse.json({ error: 'store_id e event_type sao obrigatorios' }, { status: 400 })
    }

    const { error } = await supabase
      .from('analytics_events')
      .insert([
        {
          store_id,
          vehicle_id: vehicle_id || null,
          event_type,
          source: source || 'direct',
        }
      ])

    if (error) {
      console.error('Supabase error inserting analytics event:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
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

    let finalStoreId = store_id
    if (!finalStoreId && slug) {
      finalStoreId = await resolveStoreId(supabase, slug)
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
        return NextResponse.json({
          totalViews: 0,
          whatsappClicks: 0,
          shares: 0,
          sources: { instagram: 0, google: 0, facebook: 0, direct: 0 },
          topVehicles: []
        }, { status: 200 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let totalViews = 0
    let whatsappClicks = 0
    let shares = 0
    const sourcesCount: Record<string, number> = { instagram: 0, google: 0, facebook: 0, direct: 0 }
    const vehicleStats: Record<string, { views: number, clicks: number }> = {}

    events?.forEach(ev => {
      if (ev.event_type === 'page_view') {
        totalViews++
        if (ev.source) {
          sourcesCount[ev.source] = (sourcesCount[ev.source] || 0) + 1
        }
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

    const topVehiclesIds = Object.keys(vehicleStats)
      .sort((a, b) => vehicleStats[b].views - vehicleStats[a].views)
      .slice(0, 3)

    const topVehicles = topVehiclesIds.map(id => ({
      id,
      views: vehicleStats[id].views,
      clicks: vehicleStats[id].clicks
    }))

    return NextResponse.json({
      totalViews,
      whatsappClicks,
      shares,
      sources: sourcesCount,
      topVehicles
    }, { status: 200 })

  } catch (err: any) {
    console.error('Error in GET /api/analytics:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
