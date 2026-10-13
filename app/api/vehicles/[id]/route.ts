import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteVehicleWithPhotos } from '@/lib/vehicle-service'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const body = await req.json()

    const {
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

    const updatePayload: Record<string, any> = {}
    if (title !== undefined) updatePayload.title = title
    if (brand !== undefined) updatePayload.brand = brand
    if (model !== undefined) updatePayload.model = model
    if (year !== undefined) updatePayload.year = parseInt(String(year), 10)
    if (mileage !== undefined) updatePayload.mileage = parseInt(String(mileage || 0), 10)
    if (price !== undefined) updatePayload.price = parseFloat(String(price || 0))
    if (fuel !== undefined) updatePayload.fuel = fuel
    if (transmission !== undefined) updatePayload.transmission = transmission
    if (color !== undefined) updatePayload.color = color
    if (plate_end !== undefined) updatePayload.plate_end = plate_end
    if (features !== undefined) updatePayload.features = features
    if (badge !== undefined) updatePayload.badge = badge
    if (description !== undefined) updatePayload.description = description
    if (is_active !== undefined) updatePayload.is_active = is_active
    if (sku !== undefined) updatePayload.sku = sku

    if (images !== undefined || fotos_urls !== undefined) {
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
      updatePayload.images = orderedImages
    }

    const extendedPayload: Record<string, any> = { ...updatePayload }
    if (updatePayload.images !== undefined || fotos !== undefined) {
      const orderedImages: string[] = updatePayload.images || []
      extendedPayload.fotos_urls = orderedImages
      extendedPayload.foto_capa_url = orderedImages[0] || null
      extendedPayload.fotos = Array.isArray(fotos) && fotos.length > 0
        ? fotos.map((f: any, idx: number) => ({
            url: typeof f === 'string' ? f : f?.url,
            public_id: typeof f === 'object' && f?.public_id ? String(f.public_id) : null,
            is_capa: typeof f === 'object' && typeof f?.is_capa === 'boolean' ? f.is_capa : idx === 0,
          }))
        : orderedImages.map((url, idx) => ({ url, public_id: null, is_capa: idx === 0 }))
    }

    let { data, error } = await supabase
      .from('vehicles')
      .update(extendedPayload)
      .eq('id', id)
      .select()
      .single()

    if (error && (error.message?.includes('column') || error.code === 'PGRST204' || error.code === '42703')) {
      const retry = await supabase
        .from('vehicles')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error('Supabase error updating vehicle:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error('Error in PUT /api/vehicles/[id]:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return deleteVehicleWithPhotos(id, req)
}
