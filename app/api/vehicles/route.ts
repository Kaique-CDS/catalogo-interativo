import { parseBrlCurrency, normalizeText, normalizePlate } from '@/lib/normalization'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, resolveStoreId } from '@/lib/supabase/admin'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()

    const {
      id,
      slug,
      store_id,
      title,
      brand,
      model,
      year,
      mileage,
      price,
      fuel,
      transmission,
      color,
      plate_end,
      features,
      badge,
      description,
      images,
      fotos,
      fotos_urls,
      foto_capa_url,
      is_active,
      sku,
    } = body

    if ((!slug && !store_id) || !title || !brand || !model || !year) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes' },
        { status: 400 }
      )
    }

    const finalStoreId = store_id || (await resolveStoreId(supabase, slug))

    // Garante que a foto marcada como capa seja sempre a primeira do array images (images[0])
    const rawUrls: string[] = Array.isArray(fotos_urls) && fotos_urls.length > 0
      ? fotos_urls
      : Array.isArray(images)
      ? images
      : []

    const capaFromFotos = Array.isArray(fotos)
      ? fotos.find((f: any) => f?.is_capa && f?.url)?.url
      : undefined
    const chosenCapa: string | undefined = foto_capa_url || capaFromFotos || rawUrls[0]

    const orderedImages = chosenCapa
      ? [chosenCapa, ...rawUrls.filter((u) => u !== chosenCapa)]
      : rawUrls

    const fotosJson = Array.isArray(fotos) && fotos.length > 0
      ? fotos.map((f: any, idx: number) => ({
          url: typeof f === 'string' ? f : f?.url,
          public_id: typeof f === 'object' && f?.public_id ? String(f.public_id) : null,
          is_capa: typeof f === 'object' && typeof f?.is_capa === 'boolean' ? f.is_capa : idx === 0,
        }))
      : orderedImages.map((url, idx) => ({ url, public_id: null, is_capa: idx === 0 }))

    const baseRow: Record<string, any> = {
      store_id: finalStoreId,
      title: normalizeText(title),
      brand: normalizeText(brand),
      model: normalizeText(model),
      year: parseInt(String(year), 10),
      mileage: parseInt(String(mileage || 0), 10),
      price: parseBrlCurrency(price),
      fuel: fuel ? normalizeText(fuel) : 'Flex',
      transmission: transmission ? normalizeText(transmission) : 'Manual',
      color: color ? normalizeText(color) : '',
      plate_end: plate_end ? normalizePlate(plate_end) : '',
      features: Array.isArray(features) ? features.map(f => normalizeText(String(f))).filter(Boolean) : [],
      badge: badge ? normalizeText(badge) : null,
      description: description ? normalizeText(description) : '',
      images: orderedImages,
      is_active: is_active ?? true,
      sku: sku ? normalizeText(sku) : `MHC-${Math.floor(1000 + Math.random() * 9000)}`,
    }

    if (id && UUID_REGEX.test(String(id))) {
      baseRow.id = String(id)
    }

    // Tenta gravar também nas colunas estendidas (fotos, fotos_urls, foto_capa_url) se existirem no banco
    const extendedRow = {
      ...baseRow,
      fotos: fotosJson,
      fotos_urls: orderedImages,
      foto_capa_url: chosenCapa || null,
    }

    let { data, error } = await supabase
      .from('vehicles')
      .insert([extendedRow])
      .select()
      .single()

    if (error && (error.message?.includes('column') || error.code === 'PGRST204' || error.code === '42703')) {
      const retry = await supabase
        .from('vehicles')
        .insert([baseRow])
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error('Supabase error inserting vehicle:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('Error in POST /api/vehicles:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
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
    const finalStoreId = store_id || (await resolveStoreId(supabase, slug!))

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('store_id', finalStoreId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching vehicles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error('Error in GET /api/vehicles:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
